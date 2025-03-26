// デバッグ探偵 JavaScript

(function() {
  // VSCode WebView API
  const vscode = acquireVsCodeApi();
  
  // 状態の初期化
  let state = {
    projectPath: '',
    currentErrorSession: null,
    relatedFiles: [],
    detectedErrorType: '',
    sessions: [],
    knowledgeBase: []
  };
  
  // DOM要素の取得
  const errorLogTextarea = document.getElementById('error-log');
  const investigateErrorBtn = document.getElementById('investigate-error-btn');
  const notificationArea = document.getElementById('notification-area');
  
  // テーマの適用
  function applyTheme(theme) {
    const container = document.querySelector('.detective-container');
    if (!container) return;
    
    if (theme === 'dark') {
      container.classList.remove('theme-light');
      container.classList.add('theme-dark');
    } else {
      container.classList.remove('theme-dark');
      container.classList.add('theme-light');
    }
  }
  
  // 保存されているテーマを適用
  function applyStoredTheme() {
    const theme = localStorage.getItem('app-theme') || 'light';
    applyTheme(theme);
  }
  
  // テーマ変更イベントのリスナーを設定
  function setupThemeListener() {
    // 保存されているテーマを適用
    applyStoredTheme();
    
    // テーマ変更イベントをリッスン
    document.addEventListener('theme-changed', (e) => {
      applyTheme(e.detail.theme);
    });
  }
  
  // 初期化
  function initialize() {
    // イベントリスナーの登録
    investigateErrorBtn.addEventListener('click', investigateError);
    
    // キーボードアクセシビリティ対応
    setupKeyboardAccessibility();
    
    // メッセージハンドラの登録
    window.addEventListener('message', handleMessages);
    
    // テーマリスナーを設定
    setupThemeListener();
    
    // 保存された状態を復元
    restoreState();
  }
  
  // 状態の復元
  function restoreState() {
    const savedState = vscode.getState();
    if (savedState) {
      state = { ...state, ...savedState };
      updateUI();
    }
  }
  
  // 状態の保存
  function saveState() {
    vscode.setState(state);
  }
  
  // UIの更新
  function updateUI() {
    // 現在の調査セッションの表示
    updateCurrentSession();
  }
  
  // 削除：タブナビゲーション機能は不要
  
  // キーボードアクセシビリティの設定
  function setupKeyboardAccessibility() {
    // フォーカス可視性の向上
    document.addEventListener('keydown', handleGlobalKeyDown);
  }
  
  // グローバルキーボードイベント
  function handleGlobalKeyDown(event) {
    // Escキーでのモーダルクローズなど
    if (event.key === 'Escape') {
      const modal = document.querySelector('.modal.active');
      if (modal) {
        closeModal(modal);
      }
    }
  }
  
  // メッセージハンドラ
  function handleMessages(event) {
    const message = event.data;
    
    switch (message.command) {
      case 'showError':
        showError(message.message);
        break;
        
      case 'errorSessionCreated':
        handleErrorSessionCreated(message);
        break;
        
      case 'errorSessions':
        handleErrorSessions(message);
        break;
        
      case 'updateState':
        handleUpdateState(message);
        break;
        
      case 'errorTypeDetected':
        handleErrorTypeDetected(message);
        break;
    }
  }
  
  // 状態更新処理
  function handleUpdateState(message) {
    state = {
      ...state,
      currentErrorSession: message.currentErrorSession || state.currentErrorSession,
      relatedFiles: message.relatedFiles || state.relatedFiles,
      detectedErrorType: message.detectedErrorType || state.detectedErrorType,
      sessions: message.sessions || state.sessions,
      knowledgeBase: message.knowledgeBase || state.knowledgeBase,
      projectPath: message.projectPath || state.projectPath
    };
    
    saveState();
    updateUI();
  }
  
  // エラーセッション一覧の処理
  function handleErrorSessions(message) {
    state.sessions = message.sessions || [];
    saveState();
    updateErrorSessions();
  }
  
  // エラータイプ検出の処理
  function handleErrorTypeDetected(message) {
    state.detectedErrorType = message.errorType;
    saveState();
    
    // エラータイプを通知
    announce(`エラータイプを検出しました: ${message.errorType}`);
  }
  
  // エラーの調査依頼
  function investigateError() {
    const errorLog = errorLogTextarea.value.trim();
    
    if (!errorLog) {
      showError('エラーログを入力してください');
      return;
    }
    
    // 処理中の状態を表示
    investigateErrorBtn.disabled = true;
    investigateErrorBtn.textContent = '処理中...';
    investigateErrorBtn.setAttribute('aria-busy', 'true');
    
    // アクセシビリティ通知
    announce('エラーの調査を開始します。処理中...');
    
    vscode.postMessage({
      command: 'investigateError',
      errorLog
    });
  }
  
  // エラーセッション作成完了ハンドラ
  function handleErrorSessionCreated(message) {
    // 状態を更新
    state.currentErrorSession = {
      id: message.sessionId,
      errorType: message.errorType,
      status: 'investigating'
    };
    state.detectedErrorType = message.errorType;
    
    saveState();
    
    // エラーログをクリア
    errorLogTextarea.value = '';
    
    // ボタンを元に戻す
    investigateErrorBtn.disabled = false;
    investigateErrorBtn.textContent = 'このエラーの調査を依頼する';
    investigateErrorBtn.setAttribute('aria-busy', 'false');
    
    // 完了メッセージ
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.setAttribute('role', 'status');
    successMessage.setAttribute('aria-live', 'polite');
    successMessage.innerHTML = `
      <div class="success-icon" aria-hidden="true">✅</div>
      <div class="success-text">エラーの調査を依頼しました。ClaudeCodeが起動します。</div>
    `;
    
    // 既存のメッセージがあれば削除
    const existingMessage = document.querySelector('.success-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    // メッセージを表示
    document.querySelector('.error-input').appendChild(successMessage);
    
    // アクセシビリティ通知
    announce('エラーの調査を依頼しました。ClaudeCodeが起動します。');
    
    // VSCodeの通知も表示
    vscode.postMessage({
      command: 'showVSCodeMessage',
      type: 'info',
      message: 'エラーの調査を依頼しました。ClaudeCodeが起動します。'
    });
    
    // 現在のセッションを表示
    updateCurrentSession();
    
    // 3秒後にメッセージを消す
    setTimeout(() => {
      const message = document.querySelector('.success-message');
      if (message) {
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 500);
      }
    }, 3000);
  }
  
  // 現在のセッションの表示を更新
  function updateCurrentSession() {
    const sessionSection = document.getElementById('current-session-section');
    const sessionContainer = document.getElementById('current-session-container');
    
    if (!sessionSection || !sessionContainer) return;
    
    if (state.currentErrorSession) {
      sessionSection.style.display = 'block';
      sessionContainer.innerHTML = `
        <div class="current-session-info">
          <h3>エラータイプ: ${state.detectedErrorType || '分析中...'}</h3>
          <div class="session-status">
            <span class="status-badge investigating">調査中</span>
            <span class="session-id">(セッションID: ${state.currentErrorSession.id})</span>
          </div>
        </div>
      `;
    } else {
      sessionSection.style.display = 'none';
      sessionContainer.innerHTML = '';
    }
  }
  
  // 関連ファイルの表示を更新
  function updateRelatedFiles() {
    const filesSection = document.getElementById('related-files-section');
    const filesContainer = document.getElementById('related-files-container');
    
    if (!filesSection || !filesContainer) return;
    
    // 関連ファイルセクションを非表示にする
    filesSection.style.display = 'none';
    filesContainer.innerHTML = '';
  }
  
  // 不要な機能を削除（過去のセッション、知見ベース）
  
  // エラーメッセージの表示
  function showError(message) {
    // アクセシビリティ通知
    announce(`エラー: ${message}`, 'assertive');
    
    // VSCodeの通知API
    vscode.postMessage({
      command: 'showVSCodeMessage',
      type: 'error',
      message
    });
  }
  
  // アクセシビリティ通知
  function announce(message, importance = 'polite') {
    if (notificationArea) {
      notificationArea.setAttribute('aria-live', importance);
      notificationArea.textContent = message;
    }
  }
  
  // ステータスのテキスト表現を取得
  function getStatusText(status) {
    switch (status) {
      case 'new': return '新規';
      case 'investigating': return '調査中';
      case 'resolved': return '解決済み';
      default: return '不明';
    }
  }
  
  // 初期化を実行
  initialize();
})();