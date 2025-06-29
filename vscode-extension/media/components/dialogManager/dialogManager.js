// @ts-check
import stateManager from '../../core/stateManager.js';

class DialogManager {
  constructor() {
    this.container = document.querySelector('.dialog-container') || this._createDialogContainer();
    this.activeTimeout = null;
    this.vscode = this._getVSCodeApi();
    this.initialize();
  }
  
  /**
   * VSCode API を安全に取得
   * @returns {Object} VSCode API オブジェクト
   */
  _getVSCodeApi() {
    try {
      // 既存のAPIがあるか確認
      if (typeof window.vsCodeApi !== 'undefined') {
        console.log('DialogManager: 既存のVSCode APIを使用します');
        return window.vsCodeApi;
      }
      // 新規取得
      const api = acquireVsCodeApi();
      console.log('DialogManager: VSCode APIを新規取得しました');
      // グローバル変数として保存
      window.vsCodeApi = api;
      return api;
    } catch (e) {
      console.error('DialogManager: VSCode API取得エラー:', e);
      // エラー時のフォールバック
      return {
        postMessage: function(msg) { 
          console.log('DialogManager: ダミーvscode.postMessage:', msg); 
        },
        getState: function() { return {}; },
        setState: function() {}
      };
    }
  }
  
  initialize() {
    console.log('DialogManager initialized');
  }
  
  /**
   * ダイアログコンテナを作成
   * @returns {HTMLElement} ダイアログコンテナ
   */
  _createDialogContainer() {
    const container = document.createElement('div');
    container.className = 'dialog-container';
    document.body.appendChild(container);
    return container;
  }
  
  /**
   * エラーメッセージを表示
   * @param {string} message エラーメッセージ
   * @param {number} [duration=5000] 表示時間（ミリ秒）
   */
  showError(message, duration = 5000) {
    this._showNotification(message, 'error', duration);
  }
  
  /**
   * 成功メッセージを表示
   * @param {string} message 成功メッセージ
   * @param {number} [duration=3000] 表示時間（ミリ秒）
   */
  showSuccess(message, duration = 3000) {
    this._showNotification(message, 'success', duration);
  }
  
  /**
   * 情報メッセージを表示
   * @param {string} message 情報メッセージ
   * @param {number} [duration=3000] 表示時間（ミリ秒）
   */
  showInfo(message, duration = 3000) {
    this._showNotification(message, 'info', duration);
  }
  
  /**
   * 警告メッセージを表示
   * @param {string} message 警告メッセージ
   * @param {number} [duration=4000] 表示時間（ミリ秒）
   */
  showWarning(message, duration = 4000) {
    this._showNotification(message, 'warning', duration);
  }
  
  /**
   * 通知メッセージを表示
   * @param {string} message メッセージ
   * @param {string} type 通知タイプ（error, success, info, warning）
   * @param {number} duration 表示時間（ミリ秒）
   */
  _showNotification(message, type, duration) {
    // 既存の通知を削除
    const existingNotifications = this.container.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
      this.container.removeChild(notification);
    });
    
    // 新しい通知を作成
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // タイプに応じたアイコン
    let icon = '';
    switch (type) {
      case 'error':
        icon = '❌';
        break;
      case 'success':
        icon = '✅';
        break;
      case 'info':
        icon = 'ℹ️';
        break;
      case 'warning':
        icon = '⚠️';
        break;
    }
    
    notification.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-message">${message}</div>
      <button class="notification-close">×</button>
    `;
    
    // 閉じるボタンのイベント
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
      this.container.removeChild(notification);
    });
    
    // 通知を表示
    this.container.appendChild(notification);
    
    // アニメーション
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // 自動的に非表示にする
    if (this.activeTimeout) {
      clearTimeout(this.activeTimeout);
    }
    
    this.activeTimeout = setTimeout(() => {
      notification.classList.remove('show');
      notification.classList.add('hide');
      
      // アニメーション完了後に削除
      setTimeout(() => {
        if (this.container.contains(notification)) {
          this.container.removeChild(notification);
        }
      }, 300);
    }, duration);
  }
  
  /**
   * 確認ダイアログを表示
   * @param {string} message 確認メッセージ
   * @param {string} title タイトル
   * @returns {Promise<boolean>} ユーザーの選択（OK: true, キャンセル: false）
   */
  async showConfirmDialog(message, title = '確認') {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'dialog-overlay';
      
      const dialog = document.createElement('div');
      dialog.className = 'dialog confirm-dialog';
      
      dialog.innerHTML = `
        <div class="dialog-header">
          <div class="dialog-title">${title}</div>
          <button class="dialog-close">×</button>
        </div>
        <div class="dialog-content">
          <p>${message}</p>
        </div>
        <div class="dialog-footer">
          <button class="dialog-button cancel-button">キャンセル</button>
          <button class="dialog-button primary-button">OK</button>
        </div>
      `;
      
      // 閉じるボタンのイベント
      const closeButton = dialog.querySelector('.dialog-close');
      closeButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(false);
      });
      
      // キャンセルボタンのイベント
      const cancelButton = dialog.querySelector('.cancel-button');
      cancelButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(false);
      });
      
      // OKボタンのイベント
      const okButton = dialog.querySelector('.primary-button');
      okButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(true);
      });
      
      // オーバーレイをクリックしたら閉じる
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
          resolve(false);
        }
      });
      
      // ダイアログを表示
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      
      // フォーカスをOKボタンに設定
      okButton.focus();
    });
  }
  
  /**
   * 入力ダイアログを表示
   * @param {string} message プロンプトメッセージ
   * @param {string} defaultValue デフォルト値
   * @param {string} title タイトル
   * @returns {Promise<string|null>} ユーザーの入力（キャンセル時はnull）
   */
  async showPromptDialog(message, defaultValue = '', title = '入力') {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'dialog-overlay';
      
      const dialog = document.createElement('div');
      dialog.className = 'dialog prompt-dialog';
      
      dialog.innerHTML = `
        <div class="dialog-header">
          <div class="dialog-title">${title}</div>
          <button class="dialog-close">×</button>
        </div>
        <div class="dialog-content">
          <p>${message}</p>
          <input type="text" class="dialog-input" value="${defaultValue}">
        </div>
        <div class="dialog-footer">
          <button class="dialog-button cancel-button">キャンセル</button>
          <button class="dialog-button primary-button">OK</button>
        </div>
      `;
      
      const input = dialog.querySelector('.dialog-input');
      
      // 閉じるボタンのイベント
      const closeButton = dialog.querySelector('.dialog-close');
      closeButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(null);
      });
      
      // キャンセルボタンのイベント
      const cancelButton = dialog.querySelector('.cancel-button');
      cancelButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(null);
      });
      
      // OKボタンのイベント
      const okButton = dialog.querySelector('.primary-button');
      okButton.addEventListener('click', () => {
        const value = input.value;
        document.body.removeChild(overlay);
        resolve(value);
      });
      
      // Enterキーでの送信
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const value = input.value;
          document.body.removeChild(overlay);
          resolve(value);
        }
      });
      
      // オーバーレイをクリックしたら閉じる
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
          resolve(null);
        }
      });
      
      // ダイアログを表示
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      
      // フォーカスを入力欄に設定
      input.focus();
      input.select();
    });
  }
  
  /**
   * ターミナルモード選択ダイアログを表示
   * @param {string} url プロンプトURL
   * @param {string} name プロンプト名
   * @param {number} index プロンプトインデックス
   */
  showTerminalModeDialog(url, name, index) {
    // 既存のダイアログがあれば削除
    const existingDialog = document.getElementById('terminal-mode-dialog');
    if (existingDialog) {
      existingDialog.remove();
    }
    
    // 現在のプロジェクト名を取得
    // stateManagerから取得する（存在しない場合はデフォルト値を使用）
    const currentProject = stateManager && stateManager.state && stateManager.state.activeProjectName ? 
      stateManager.state.activeProjectName : '選択なし';
    
    // モーダルオーバーレイとダイアログを作成
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.id = 'terminal-mode-overlay';
    
    const dialog = document.createElement('div');
    dialog.id = 'terminal-mode-dialog';
    dialog.className = 'dialog';
    
    // ブルーランプテーマカラーに合わせたアイコンを追加
    dialog.innerHTML = `
      <div class="dialog-header">
        <div class="dialog-title">ターミナル表示モードを選択</div>
        <button class="dialog-close">×</button>
      </div>
      <div class="dialog-content">
        <p>ClaudeCodeの起動方法を選択してください：</p>
        <div class="project-info">現在のプロジェクト：<span class="current-project-name">${currentProject}</span></div>
      </div>
      <div class="dialog-footer">
        <button id="split-terminal-btn" class="dialog-button primary-button">
          <span class="material-icons" style="font-size: 18px; margin-right: 8px;">vertical_split</span>
          分割ターミナルで表示
        </button>
        <button id="new-tab-terminal-btn" class="dialog-button">
          <span class="material-icons" style="font-size: 18px; margin-right: 8px;">tab</span>
          新しいタブで表示
        </button>
      </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // 閉じるボタンのイベント
    const closeButton = dialog.querySelector('.dialog-close');
    closeButton.addEventListener('click', () => {
      overlay.remove();
    });
    
    // ボタンのイベントリスナーを設定
    document.getElementById('split-terminal-btn').addEventListener('click', () => {
      // 分割ターミナルモードを選択（true）
      this.vscode.postMessage({
        command: 'launchPromptFromURL',
        url: url,
        name: name,
        index: index,
        splitTerminal: true  // 分割ターミナルモード
      });
      
      // ダイアログを閉じる
      overlay.remove();
    });
    
    document.getElementById('new-tab-terminal-btn').addEventListener('click', () => {
      // 新しいタブモードを選択（false）
      this.vscode.postMessage({
        command: 'launchPromptFromURL',
        url: url,
        name: name,
        index: index,
        splitTerminal: false  // 新しいタブモード
      });
      
      // ダイアログを閉じる
      overlay.remove();
    });
  }
  
  /**
   * モーダル内ターミナルモード選択ダイアログを表示
   * @param {string} url プロンプトURL
   * @param {number} promptId プロンプトID
   * @param {string} promptName プロンプト名
   */
  showModalTerminalModeDialog(url, promptId, promptName) {
    // 既存のダイアログがあれば削除
    const existingDialog = document.getElementById('modal-terminal-mode-dialog');
    if (existingDialog) {
      existingDialog.remove();
    }
    
    // 現在のプロジェクト名を取得
    // stateManagerから取得する（存在しない場合はデフォルト値を使用）
    const currentProject = stateManager && stateManager.state && stateManager.state.activeProjectName ? 
      stateManager.state.activeProjectName : '選択なし';
    
    // モーダルオーバーレイとダイアログを作成
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.id = 'modal-terminal-mode-overlay';
    
    const dialog = document.createElement('div');
    dialog.id = 'modal-terminal-mode-dialog';
    dialog.className = 'dialog';
    
    dialog.innerHTML = `
      <div class="dialog-header">
        <div class="dialog-title">ターミナル表示モードを選択</div>
        <button class="dialog-close">×</button>
      </div>
      <div class="dialog-content">
        <p>ClaudeCodeの起動方法を選択してください：</p>
        <div class="project-info">現在のプロジェクト：<span class="current-project-name">${currentProject}</span></div>
      </div>
      <div class="dialog-footer">
        <button id="modal-split-terminal-btn" class="dialog-button primary-button">
          <span class="material-icons" style="font-size: 18px; margin-right: 8px;">vertical_split</span>
          分割ターミナルで表示
        </button>
        <button id="modal-new-tab-terminal-btn" class="dialog-button">
          <span class="material-icons" style="font-size: 18px; margin-right: 8px;">tab</span>
          新しいタブで表示
        </button>
      </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // 閉じるボタンのイベント
    const closeButton = dialog.querySelector('.dialog-close');
    closeButton.addEventListener('click', () => {
      overlay.remove();
    });
    
    // ボタンのイベントリスナーを設定
    document.getElementById('modal-split-terminal-btn').addEventListener('click', () => {
      // 分割ターミナルモードを選択（true）
      this.vscode.postMessage({
        command: 'launchPromptFromURL',
        url: url,
        index: promptId,
        name: promptName,
        splitTerminal: true  // 分割ターミナルモード
      });
      
      // ダイアログを閉じる
      overlay.remove();
    });
    
    document.getElementById('modal-new-tab-terminal-btn').addEventListener('click', () => {
      // 新しいタブモードを選択（false）
      this.vscode.postMessage({
        command: 'launchPromptFromURL',
        url: url,
        index: promptId,
        name: promptName,
        splitTerminal: false  // 新しいタブモード
      });
      
      // ダイアログを閉じる
      overlay.remove();
    });
  }
  
  /**
   * ブルーランプ起動用ターミナルモード選択ダイアログを表示
   */
  showBluelampLaunchDialog() {
    console.log('DialogManager: ブルーランプ起動ダイアログを表示します');
    
    // 既存のダイアログがあれば削除
    const existingDialog = document.getElementById('bluelamp-launch-dialog');
    if (existingDialog) {
      existingDialog.remove();
    }
    
    // モーダルオーバーレイとダイアログを作成
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.id = 'bluelamp-launch-overlay';
    
    const dialog = document.createElement('div');
    dialog.id = 'bluelamp-launch-dialog';
    dialog.className = 'dialog';
    
    dialog.innerHTML = `
      <div class="dialog-header">
        <div class="dialog-title">ブルーランプを起動</div>
        <button class="dialog-close">×</button>
      </div>
      <div class="dialog-content">
        <p>ターミナルの表示方法を選択してください：</p>
        <div style="background-color: #f0f0f0; padding: 12px 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #ddd;">
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">起動ディレクトリ:</div>
          <div style="font-size: 14px; font-weight: 600; color: #333; word-break: break-all; font-family: monospace;">
            ${window.currentProjectPath || 'プロジェクトが選択されていません'}
          </div>
        </div>
      </div>
      <div class="dialog-footer">
        <button id="bluelamp-split-terminal-btn" class="dialog-button primary-button">
          <span class="material-icons" style="font-size: 18px; margin-right: 8px;">vertical_split</span>
          分割ターミナルで起動
        </button>
        <button id="bluelamp-new-tab-terminal-btn" class="dialog-button">
          <span class="material-icons" style="font-size: 18px; margin-right: 8px;">tab</span>
          新しいタブで起動
        </button>
      </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // 閉じるボタンのイベント
    const closeButton = dialog.querySelector('.dialog-close');
    closeButton.addEventListener('click', () => {
      overlay.remove();
    });
    
    // ボタンのイベントリスナーを設定
    document.getElementById('bluelamp-split-terminal-btn').addEventListener('click', () => {
      console.log('DialogManager: 分割ターミナルボタンがクリックされました');
      // 分割ターミナルモードでブルーランプを起動
      const message = {
        command: 'launchBluelamp',
        splitTerminal: true
      };
      console.log('DialogManager: メッセージを送信:', message);
      this.vscode.postMessage(message);
      
      // ダイアログを閉じる
      overlay.remove();
    });
    
    document.getElementById('bluelamp-new-tab-terminal-btn').addEventListener('click', () => {
      console.log('DialogManager: 新しいタブターミナルボタンがクリックされました');
      // 新しいタブモードでブルーランプを起動
      const message = {
        command: 'launchBluelamp',
        splitTerminal: false
      };
      console.log('DialogManager: メッセージを送信:', message);
      this.vscode.postMessage(message);
      
      // ダイアログを閉じる
      overlay.remove();
    });
  }

  /**
   * デバッグメッセージを表示
   * @param {string} message メッセージ内容
   * @param {number} [duration=3000] 表示時間（ミリ秒）
   */
  showDebugMessage(message, duration = 3000) {
    const debugMessage = document.createElement('div');
    debugMessage.style.position = 'fixed';
    debugMessage.style.bottom = '20px';
    debugMessage.style.left = '20px';
    debugMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    debugMessage.style.color = 'white';
    debugMessage.style.padding = '8px 16px';
    debugMessage.style.borderRadius = '4px';
    debugMessage.style.zIndex = '999999';
    debugMessage.style.fontFamily = 'monospace';
    debugMessage.textContent = message;
    document.body.appendChild(debugMessage);
    
    // 指定時間後にデバッグメッセージを消す
    setTimeout(() => {
      if (debugMessage.parentNode) {
        debugMessage.parentNode.removeChild(debugMessage);
      }
    }, duration);
  }
}

// 初期化して公開
const dialogManager = new DialogManager();
export default dialogManager;