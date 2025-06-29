// @ts-check

/**
 * ScopeManager - エントリーポイント
 * 
 * このファイルは、ScopeManagerの主要コンポーネントをインポートし、
 * イベント連携と初期化を行うエントリーポイント機能だけを持ちます。
 * 全ての機能の詳細実装は各コンポーネントに委譲されています。
 */

// 外部モジュールのインポート
import { showError, showSuccess } from './utils/uiHelpers.js';
import stateManager from './core/stateManager.js';
import markdownViewer from './components/markdownViewer/markdownViewer.js';
import projectNavigation from './components/projectNavigation/projectNavigation.js';
import dialogManager from './components/dialogManager/dialogManager.js';
import simpleMarkdownConverter from './utils/simpleMarkdownConverter.js';

// VSCode APIを安全に取得
let vscode;
try {
  // グローバル変数として既に存在するか確認
  if (typeof window.vsCodeApi !== 'undefined') {
    vscode = window.vsCodeApi;
  } else {
    // 新規取得
    vscode = acquireVsCodeApi();
    // グローバル変数として保存して他のスクリプトでも使えるように
    window.vsCodeApi = vscode;
  }
} catch (e) {
  // エラー時のフォールバック
  vscode = {
    postMessage: function(msg) { 
      console.log('ダミーvscode.postMessage:', msg); 
    },
    getState: function() { return {}; },
    setState: function() {}
  };
}

// 自己実行関数でスコープを作成
(function() {
  /**
   * StateManagerからのイベントリスナーを設定
   */
  function setupStateManagerEvents() {
    // マークダウンが更新されたときのイベントを購読
    document.addEventListener('markdown-updated', (event) => {
      // markdownViewerに直接処理を委譲
      markdownViewer.updateContent(event.detail.content);
    });
  }

  
  /**
   * イベントリスナーの設定
   */
  function setupEventListeners() {
    // 実装開始ボタン
    const implementButton = document.getElementById('implement-button');
    if (implementButton) {
      implementButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'startImplementation' });
      });
    }

    // スコープ新規作成ボタン
    const createScopeButton = document.getElementById('create-scope-button');
    if (createScopeButton) {
      createScopeButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'addNewScope' });
      });
    }

    // FABボタンのイベント設定
    const openFilesBtn = document.getElementById('open-files-btn');
    if (openFilesBtn) {
      openFilesBtn.addEventListener('click', () => {
        vscode.postMessage({ command: 'openFileViewer' });
      });
    }

    const openGalleryBtn = document.getElementById('open-gallery-btn');
    if (openGalleryBtn) {
      openGalleryBtn.addEventListener('click', () => {
        vscode.postMessage({ command: 'openMockupGallery' });
      });
    }

    const launchBluelampBtn = document.getElementById('launch-bluelamp-btn');
    if (launchBluelampBtn) {
      launchBluelampBtn.addEventListener('click', () => {
        vscode.postMessage({ command: 'launchBluelamp' });
      });
    }
  }

  // ページ読み込み完了時の処理
  document.addEventListener('DOMContentLoaded', () => {
    // 初期化メッセージの送信
    vscode.postMessage({ command: 'initialize' });

    // シンプルマークダウンコンバーターをグローバル変数として公開
    // これにより、他のコンポーネントから利用可能になる
    window.simpleMarkdownConverter = simpleMarkdownConverter;
    window.markdownViewer = markdownViewer;

    // エラーメッセージ無限ループ防止用のグローバル変数
    window._lastErrorMap = new Map();
    window._processedErrors = new Set();

    // 基本イベントリスナー設定
    setupEventListeners();

    // StateManagerのイベントリスナーを設定
    setupStateManagerEvents();

    // 各コンポーネントの初期化（順序が重要）
    // 1. プロジェクトナビゲーションの初期化
    projectNavigation.initializeNavigation();

    // 2. マークダウン表示の初期化を委譲
    markdownViewer.init();

    // 進捗コンテンツ領域を初期化
    const progressContent = document.querySelector('.markdown-content');
    if (progressContent) progressContent.innerHTML = '';

    // 保存されたプロジェクト状態を復元
    setTimeout(() => stateManager.restoreProjectState(), 100);

    // 進捗ファイルの読み込みをリクエスト
    setTimeout(() => {
      vscode.postMessage({ command: 'loadProgressFile' });
    }, 200);
  });
  
  // メッセージハンドラー
  window.addEventListener('message', event => {
    const message = event.data;

    // シェアリングパネル関連のメッセージは無視（sharingPanel.jsが処理）
    if (['showShareResult', 'updateSharingHistory', 'commandCopied', 'resetDropZone'].includes(message.command)) {
      return;
    }

    // ファイル変更検出時のハンドラー
    if (message.command === 'requirementsFileChanged') {
      if (message.filePath) {
        // ファイル再読み込みコマンドを送信
        vscode.postMessage({
          command: 'getMarkdownContent',
          filePath: message.filePath,
          forRequirements: true,
          forceRefresh: true,
          timestamp: Date.now()
        });

        // 要件定義タブが表示中かチェック
        const activeTabId = stateManager.getState().activeTab;
        if (activeTabId === 'requirements') {
          // コンテンツが来る前に一度マークダウン表示エリアをクリアして更新準備
          const requirementsContainer = document.querySelector('#requirements-tab .markdown-content');
          if (requirementsContainer) {
            requirementsContainer.innerHTML = '<p>ファイルを読み込み中...</p>';
          }
        }

        // すでにコンテンツが提供されている場合は即時更新
        if (message.content) {
          // コンテンツを状態に保存
          stateManager.setState({
            requirementsContent: message.content,
            requirementsLastUpdate: Date.now(),
            requirementsFilePath: message.filePath
          }, false);

          // タブがアクティブならコンテンツを更新
          if (activeTabId === 'requirements') {
            const requirementsContainer = document.querySelector('#requirements-tab .markdown-content');
            if (requirementsContainer && window.markdownViewer) {
              window.markdownViewer.updateContent(message.content, requirementsContainer);
            } else if (window.markdownViewer) {
              window.markdownViewer.updateContent(message.content);
            }
          } else {
            // 次回表示時に更新されるようフラグを設定
            stateManager.setState({
              requirementsNeedsUpdate: true
            }, false);
          }
        }
      }
      return;
    }

    switch (message.command) {
      case 'createNewProject':
        // projectNavigationの機能を呼び出す
        if (projectNavigation) {
          projectNavigation.showNewProjectModal();
        }
        break;
      case 'loadExistingProject':
        // projectNavigationの機能を呼び出す
        if (projectNavigation) {
          projectNavigation.loadExistingProject();
        }
        break;
      case 'updateState':
        // StateManagerに処理を委譲
        stateManager.handleUpdateState(message);
        break;
      case 'showError':
        // 一部のエラーは無視
        if (message.message && (
            message.message.includes('マークダウンビューワーを開けませんでした') || 
            message.message.includes('ファイルを開けませんでした:'))) {
          // 無視対象のエラー
        } else {
          // その他のエラーは表示
          showError(message.message);
        }
        break;
      case 'showSuccess':
        showSuccess(message.message);
        break;
      case 'openFileInTab':
        // ファイルをタブで開く処理
        const filePath = message.filePath;
        const fileName = filePath.split('/').pop();
        const isMarkdown = fileName.endsWith('.md');
        
        // ファイルビューワーを開く
        vscode.postMessage({
          command: 'openFileViewer'
        });
        break;
      case 'openFileContentInTab':
        // ファイルビューワーで開く
        vscode.postMessage({
          command: 'openFileViewer'
        });
        break;
      case 'updateProjectPath':
        // 直接Custom Eventを発行
        const pathEvent = new CustomEvent('project-path-updated', {
          detail: message
        });
        document.dispatchEvent(pathEvent);
        break;
      case 'updateProjectName':
        // 直接Custom Eventを発行
        const event = new CustomEvent('project-name-updated', {
          detail: { name: message.projectName }
        });
        document.dispatchEvent(event);
        break;
      case 'updateMarkdownContent':
        // 現在アクティブなタブIDを確認
        const activeTabId = stateManager.getState().activeTab;

        // 強制更新フラグがある場合は処理
        if (message.forceRefresh) {
          // 要件定義か進捗状況のコンテンツの場合
          if (message.forRequirements) {
            // 要件定義コンテンツを状態に保存
            stateManager.setState({
              requirementsContent: message.content,
              requirementsLastUpdate: Date.now()
            }, false);

            // タブがアクティブな場合は表示を更新
            if (activeTabId === 'requirements') {
              const requirementsContent = document.querySelector('#requirements-tab .markdown-content');
              if (requirementsContent) {
                requirementsContent.innerHTML = '';
                setTimeout(() => {
                  markdownViewer.updateContent(message.content, requirementsContent);
                }, 10);
              } else {
                markdownViewer.updateContent(message.content);
              }
            } else {
              stateManager.setState({ requirementsNeedsUpdate: true }, false);
            }
          } else if (message.forScopeProgress) {
            // 進捗状況コンテンツを状態に保存
            stateManager.setState({
              scopeProgressContent: message.content,
              scopeProgressLastUpdate: Date.now()
            }, false);

            // タブがアクティブな場合は表示を更新
            if (activeTabId === 'scope-progress') {
              markdownViewer.updateContent(message.content);
            }
          } else {
            // その他の通常コンテンツを更新
            markdownViewer.updateContent(message.content);
          }
          window._lastContentUpdateTime = Date.now();
          break;
        }

        // 進捗状況のコンテンツ
        if (message.forScopeProgress) {
          stateManager.setState({ 
            scopeProgressContent: message.content 
          }, false);
          
          if (activeTabId === 'scope-progress') {
            markdownViewer.updateContent(message.content);
          }
          break;
        }

        // 要件定義のコンテンツ
        if (message.forRequirements) {
          stateManager.setState({
            requirementsContent: message.content,
            requirementsFilePath: message.filePath,
            requirementsLastUpdate: Date.now()
          }, false);

          if (activeTabId === 'requirements') {
            const requirementsContainer = document.querySelector('#requirements-tab .markdown-content');
            if (requirementsContainer && window.markdownViewer) {
              window.markdownViewer.updateContent(message.content, requirementsContainer);
            } else {
              markdownViewer.updateContent(message.content);
            }
          } else {
            stateManager.setState({
              requirementsNeedsUpdate: true
            }, false);
          }
          break;
        }

        // 通常のコンテンツ
        markdownViewer.updateContent(message.content);
        break;
        
      case 'updateTabContent':
        // 特定のタブに対するコンテンツ更新
        if (message.tabId && message.content) {
          const currentActiveTab = stateManager.getState().activeTab;
          if (currentActiveTab === message.tabId) {
            const tabContentEl = document.querySelector(`#${message.tabId}-tab .markdown-content`);
            if (tabContentEl) {
              markdownViewer.updateContent(message.content, tabContentEl);
            }
          }
        }
        break;

      case 'updateProjects':
        // プロジェクト一覧更新イベント
        const projectsEvent = new CustomEvent('projects-updated', {
          detail: {
            projects: message.projects,
            activeProject: message.activeProject
          }
        });
        document.dispatchEvent(projectsEvent);
        break;


      case 'syncProjectState':
        // プロジェクト状態の同期
        if (message.project) {
          stateManager.syncProjectState(message.project);
        }
        break;
    }
  });

})();