// @ts-check

/**
 * プロンプトカード管理モジュール
 * 
 * プロンプトカードの表示と管理を担当するモジュール
 */

// 外部モジュールのインポート
import dialogManager from '../dialogManager/dialogManager.js';

// VSCode API取得
let vscode;
try {
  // グローバル変数として既に存在するか確認
  if (typeof window.vsCodeApi !== 'undefined') {
    vscode = window.vsCodeApi;
    console.log('promptCards: 既存のVSCode APIを使用します');
  } else {
    // 新規取得
    vscode = acquireVsCodeApi();
    console.log('promptCards: VSCode APIを新規取得しました');
    // グローバル変数として保存して他のスクリプトでも使えるように
    window.vsCodeApi = vscode;
  }
} catch (e) {
  console.error('promptCards: VSCode API取得エラー:', e);
  // エラー時のフォールバック
  vscode = {
    postMessage: function(msg) { 
      console.log('ダミーvscode.postMessage:', msg); 
    },
    getState: function() { return {}; },
    setState: function() {}
  };
}

// ブルーランプCLI起動機能
// 従来の16個のプロンプトカードは削除し、単一のブルーランプ起動機能に統合

/**
 * プロンプトカードマネージャークラス
 */
class PromptCardsManager {
  constructor() {
    this.initialized = false;
    this.modalInitialized = false;
    
    // 初期化状態を監視して必要に応じて初期化を行う
    document.addEventListener('DOMContentLoaded', () => {
      this._checkAndInitialize();
    });
  }

  /**
   * 状態を確認し必要に応じて初期化
   * @private
   */
  _checkAndInitialize() {
    // プロンプトタブの要素が存在するか確認
    setTimeout(() => {
      const promptsTab = document.getElementById('prompts-tab');
      if (promptsTab && !this.initialized) {
        this.initializePromptCards();
      }
      
      const promptGrid = document.querySelector('.claude-code-share-area .prompt-grid');
      if (promptGrid && !this.modalInitialized) {
        this.initializePromptCardsInModal();
      }
    }, 100);
  }

  /**
   * ブルーランプ起動ボタンの初期化
   * 従来のプロンプトカード表示の代わりに、直接ターミナルモード選択ダイアログを表示
   */
  initializePromptCards() {
    console.log('promptCards: ブルーランプ起動機能の初期化を開始');
    
    const promptsTab = document.getElementById('prompts-tab');
    if (!promptsTab) {
      console.warn('promptCards: プロンプトタブが存在しないため初期化をスキップします');
      return;
    }
    
    // 既存のコンテンツをクリア（二重初期化防止）
    const existingGrid = promptsTab.querySelector('.prompt-grid');
    if (existingGrid) {
      console.log('promptCards: 既存のプロンプトグリッドを削除します');
      existingGrid.remove();
    }
    
    // ブルーランプ起動ボタンを作成
    const launchButton = document.createElement('div');
    launchButton.className = 'bluelamp-launch-button';
    launchButton.innerHTML = `
      <span class="material-icons">terminal</span>
      <h3>ブルーランプを起動</h3>
      <p>プロジェクトでブルーランプCLIを起動します</p>
    `;
    
    // クリックイベント - 直接ターミナルモード選択ダイアログを表示
    launchButton.addEventListener('click', () => {
      console.log('promptCards: ブルーランプ起動ボタンがクリックされました');
      this.launchBluelamp();
    });
    
    // プロンプトタブにボタンを追加
    promptsTab.appendChild(launchButton);
    
    this.initialized = true;
    console.log('promptCards: ブルーランプ起動機能の初期化が完了しました');
    
    // カスタムイベントを発行
    const event = new CustomEvent('bluelamp-launch-initialized');
    document.dispatchEvent(event);
  }

  /**
   * レガシーメソッド - モーダル内プロンプトカード初期化（削除予定）
   * @deprecated ブルーランプCLI移行により不要
   */
  initializePromptCardsInModal() {
    console.warn('promptCards: initializePromptCardsInModal は非推奨です。ブルーランプ起動機能を使用してください。');
    
    // 何もしない（レガシー互換性のため空実装）
    this.modalInitialized = true;
    const event = new CustomEvent('modal-prompt-cards-deprecated');
    document.dispatchEvent(event);
  }

  /**
   * ブルーランプを起動する
   * ターミナルモード選択ダイアログを表示し、選択後にブルーランプCLIを起動
   */
  launchBluelamp() {
    console.log('promptCards: ブルーランプ起動処理を開始');
    
    // ターミナルモード選択ダイアログを表示
    dialogManager.showBluelampLaunchDialog();
  }

  /**
   * レガシーメソッド - 互換性のために保持（将来削除予定）
   * @deprecated 使用しないでください
   */
  getPromptInfo(index) {
    console.warn('promptCards: getPromptInfo は非推奨です。ブルーランプ起動機能を使用してください。');
    return null;
  }

  /**
   * レガシーメソッド - 互換性のために保持（将来削除予定）
   * @deprecated 使用しないでください
   */
  getPromptUrl(index) {
    console.warn('promptCards: getPromptUrl は非推奨です。ブルーランプ起動機能を使用してください。');
    return null;
  }

  /**
   * レガシーメソッド - 互換性のために保持（将来削除予定）
   * @deprecated 使用しないでください
   */
  getAllPromptInfo() {
    console.warn('promptCards: getAllPromptInfo は非推奨です。ブルーランプ起動機能を使用してください。');
    return [];
  }
}

// シングルトンインスタンスの作成とエクスポート
const promptCards = new PromptCardsManager();
export default promptCards;