"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginWebviewPanel = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const AuthenticationService_1 = require("../../core/auth/AuthenticationService");
const SimpleAuthService_1 = require("../../core/auth/SimpleAuthService");
const logger_1 = require("../../utils/logger");
/**
 * LoginWebviewPanel - VSCode内でのログインUI
 *
 * ユーザーのログイン情報を入力するためのWebビューパネルを提供します。
 */
class LoginWebviewPanel {
    /**
     * Webビューパネルを作成または表示
     */
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // 既存のパネルがある場合は再利用
        if (LoginWebviewPanel.currentPanel) {
            LoginWebviewPanel.currentPanel._panel.reveal(column);
            return LoginWebviewPanel.currentPanel;
        }
        // 新しいパネルを作成
        const panel = vscode.window.createWebviewPanel('appgeniusLogin', 'AppGenius ログイン', column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, 'webviews', 'auth')
            ]
        });
        LoginWebviewPanel.currentPanel = new LoginWebviewPanel(panel, extensionUri);
        return LoginWebviewPanel.currentPanel;
    }
    /**
     * パネルコンストラクタ
     */
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._authService = AuthenticationService_1.AuthenticationService.getInstance();
        this._simpleAuthService = SimpleAuthService_1.SimpleAuthService.getInstance(); // SimpleAuthServiceを初期化
        // コンテンツの設定
        this._update();
        // イベントリスナーの設定
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'login':
                    await this._handleLogin(message.email, message.password);
                    break;
                case 'reset-password':
                    this._handleResetPassword(message.email);
                    break;
                case 'close':
                    this._panel.dispose();
                    break;
            }
        }, null, this._disposables);
    }
    /**
     * WebViewのHTMLを更新
     */
    _update() {
        const webview = this._panel.webview;
        this._panel.title = 'AppGenius ログイン';
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }
    /**
     * WebViewのHTML生成
     */
    _getHtmlForWebview(webview) {
        // HTMlファイルパス
        const htmlFilePath = path.join(this._extensionUri.fsPath, 'webviews', 'auth', 'index.html');
        // HTMLファイルが存在するか確認
        if (fs.existsSync(htmlFilePath)) {
            // ファイルからHTMLを読み込む
            let html = fs.readFileSync(htmlFilePath, 'utf8');
            // スクリプトとスタイルのURIを取得
            const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webviews', 'auth', 'style.css'));
            const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webviews', 'auth', 'script.js'));
            // APIエンドポイントなどの環境変数を挿入
            const portalApiUrl = process.env.PORTAL_API_URL || 'http://localhost:3000/api';
            // 変数を置換
            html = html
                .replace('${styleUri}', styleUri.toString())
                .replace('${scriptUri}', scriptUri.toString())
                .replace('${apiBaseUrl}', portalApiUrl);
            return html;
        }
        else {
            // HTMLファイルが存在しない場合はモックアップからHTMLを生成
            return this._getDefaultHtml(webview);
        }
    }
    /**
     * デフォルトのHTML生成（モックアップHTMLファイルが無い場合）
     */
    _getDefaultHtml(webview) {
        // 基本的なスタイル
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        // ノンスの生成（CSP用）
        const nonce = this._getNonce();
        return `<!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
      <link href="${styleUri}" rel="stylesheet">
      <title>AppGenius ログイン</title>
      <style>
        :root {
          --vscode-background: #1e1e1e;
          --vscode-foreground: #d4d4d4;
          --vscode-input-background: #3c3c3c;
          --vscode-input-foreground: #cccccc;
          --vscode-button-background: #0e639c;
          --vscode-button-foreground: #ffffff;
          --vscode-button-hover-background: #1177bb;
          --vscode-link-color: #3794ff;
          --vscode-focus-border: #007fd4;
          --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        body {
          margin: 0;
          padding: 20px;
          font-family: var(--font-family);
          font-size: 14px;
          background-color: var(--vscode-background);
          color: var(--vscode-foreground);
        }
        
        .auth-container {
          max-width: 400px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .auth-header {
          text-align: center;
          margin-bottom: 25px;
        }
        
        .logo {
          width: 60px;
          height: 60px;
          margin-bottom: 15px;
          display: block;
          margin-left: auto;
          margin-right: auto;
          background-color: #4a6eff;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 24px;
        }
        
        .auth-title {
          margin: 0;
          font-size: 24px;
          font-weight: 500;
        }
        
        .auth-subtitle {
          margin-top: 8px;
          color: #a0a0a0;
          font-size: 14px;
        }
        
        .auth-form {
          display: flex;
          flex-direction: column;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        label {
          display: block;
          margin-bottom: 6px;
          font-size: 12px;
          color: #a0a0a0;
        }
        
        input {
          width: 100%;
          padding: 8px 10px;
          background-color: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          border: 1px solid transparent;
          border-radius: 2px;
          outline: none;
          font-size: 14px;
          font-family: var(--font-family);
          box-sizing: border-box;
        }
        
        input:focus {
          border-color: var(--vscode-focus-border);
        }
        
        .forgot-password {
          text-align: right;
          margin-bottom: 20px;
          font-size: 12px;
        }
        
        .forgot-password a {
          color: var(--vscode-link-color);
          text-decoration: none;
          cursor: pointer;
        }
        
        .auth-button {
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          padding: 8px 12px;
          border-radius: 2px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          font-family: var(--font-family);
          transition: background-color 0.2s;
        }
        
        .auth-button:hover {
          background-color: var(--vscode-button-hover-background);
        }
        
        .auth-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 12px;
          color: #a0a0a0;
        }
        
        .auth-footer a {
          color: var(--vscode-link-color);
          text-decoration: none;
        }
        
        .status-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 16px;
          font-size: 12px;
          color: #a0a0a0;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 6px;
        }
        
        .status-dot.connected {
          background-color: #4CAF50;
        }
        
        .status-dot.disconnected {
          background-color: #F44336;
        }

        .error-message {
          color: #F44336;
          font-size: 12px;
          margin-top: 4px;
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="auth-container">
        <div class="auth-header">
          <div class="logo">AG</div>
          <h1 class="auth-title">AppGenius</h1>
          <p class="auth-subtitle">VSCode拡張機能認証</p>
        </div>
        
        <form class="auth-form" id="loginForm">
          <div class="form-group">
            <label for="email">メールアドレス</label>
            <input type="email" id="email" placeholder="name@example.com" required />
            <div class="error-message" id="email-error"></div>
          </div>
          <div class="form-group">
            <label for="password">パスワード</label>
            <input type="password" id="password" placeholder="••••••••" required />
            <div class="error-message" id="password-error"></div>
          </div>
          <div class="forgot-password">
            <a href="#" id="resetPassword">パスワードをお忘れですか？</a>
          </div>
          <button type="submit" class="auth-button">ログイン</button>
          <div class="error-message" id="login-error"></div>
        </form>
        
        <div class="status-indicator">
          <div class="status-dot disconnected" id="status-dot"></div>
          <span id="status-text">サーバーに接続中...</span>
        </div>
        
        <div class="auth-footer">
          <p>ログインすることで、AppGenius APIへのアクセスが許可されます</p>
        </div>
      </div>
      
      <script nonce="${nonce}">
        (function() {
          const vscode = acquireVsCodeApi();
          
          // DOM要素
          const loginForm = document.getElementById('loginForm');
          const emailInput = document.getElementById('email');
          const passwordInput = document.getElementById('password');
          const resetPasswordLink = document.getElementById('resetPassword');
          const loginError = document.getElementById('login-error');
          const statusDot = document.getElementById('status-dot');
          const statusText = document.getElementById('status-text');
          
          // サーバー接続確認（仮のコード）
          setTimeout(() => {
            // 実際にはサーバー接続チェックロジックが必要
            statusDot.classList.remove('disconnected');
            statusDot.classList.add('connected');
            statusText.textContent = '接続済み';
          }, 1500);
          
          // ログインフォーム送信
          loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // 入力値の検証
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            
            if (!email) {
              showError('email-error', 'メールアドレスを入力してください');
              return;
            }
            
            if (!isValidEmail(email)) {
              showError('email-error', '有効なメールアドレスを入力してください');
              return;
            }
            
            if (!password) {
              showError('password-error', 'パスワードを入力してください');
              return;
            }
            
            // ログイン処理
            vscode.postMessage({
              command: 'login',
              email,
              password
            });
            
            // ログイン中表示
            statusText.textContent = 'ログイン中...';
          });
          
          // パスワードリセットリンク
          resetPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            
            if (!email || !isValidEmail(email)) {
              showError('email-error', 'パスワードリセットには有効なメールアドレスを入力してください');
              return;
            }
            
            vscode.postMessage({
              command: 'reset-password',
              email
            });
          });
          
          // エラー表示関数
          function showError(elementId, message) {
            const errorElement = document.getElementById(elementId);
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // 3秒後に消える
            setTimeout(() => {
              errorElement.style.display = 'none';
            }, 3000);
          }
          
          // メール形式チェック
          function isValidEmail(email) {
            const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return re.test(email);
          }
          
          // メッセージ受信
          window.addEventListener('message', (event) => {
            const message = event.data;
            
            switch (message.type) {
              case 'login-result':
                if (message.success) {
                  // ログイン成功
                  statusDot.classList.remove('disconnected');
                  statusDot.classList.add('connected');
                  statusText.textContent = '認証成功';
                  
                  // パネルを閉じる前に成功メッセージを表示
                  setTimeout(() => {
                    vscode.postMessage({ command: 'close' });
                  }, 1500);
                } else {
                  // ログイン失敗
                  showError('login-error', message.error || 'ログインに失敗しました');
                  statusText.textContent = '接続済み';
                }
                break;
                
              case 'reset-password-result':
                if (message.success) {
                  // パスワードリセットメール送信成功
                  vscode.window.showInformationMessage('パスワードリセット手順をメールで送信しました');
                } else {
                  // パスワードリセット失敗
                  showError('email-error', message.error || 'パスワードリセットに失敗しました');
                }
                break;
            }
          });
        })();
      </script>
    </body>
    </html>`;
    }
    /**
     * ランダムなnonceを生成（CSP対策）
     */
    _getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    /**
     * ログイン処理ハンドラー
     */
    async _handleLogin(email, password) {
        try {
            logger_1.Logger.info('LoginWebviewPanel: SimpleAuthServiceを使用してログイン処理を開始します');
            // SimpleAuthServiceでログイン処理を実行
            try {
                // ログイン処理を実行
                await this._simpleAuthService.login(email, password);
                // 認証状態を確認
                const isAuthenticated = this._simpleAuthService.isAuthenticated();
                if (isAuthenticated) {
                    // ログイン成功メッセージ
                    this._panel.webview.postMessage({
                        type: 'login-result',
                        success: true
                    });
                    // 成功通知
                    vscode.window.showInformationMessage('AppGeniusにログインしました');
                    // APIキー表示は不要なので削除
                    // setTimeout(async () => {
                    //   await this._showApiKeyAfterLogin();
                    // }, 1000);
                    // 少し待ってからパネルを閉じる
                    setTimeout(() => {
                        this._panel.dispose();
                    }, 1500);
                    return;
                }
            }
            catch (simpleAuthError) {
                logger_1.Logger.error('SimpleAuthServiceログイン処理エラー:', simpleAuthError);
                // エラーが発生した場合は、後続の処理でメッセージを表示
            }
            // SimpleAuthServiceが失敗した場合や成功しなかった場合、レガシーのAuthenticationServiceでのログインを試行
            logger_1.Logger.info('SimpleAuthServiceログイン失敗、レガシー認証を試行します');
            const legacySuccess = await this._authService.login(email, password);
            if (legacySuccess) {
                // ログイン成功メッセージ
                this._panel.webview.postMessage({
                    type: 'login-result',
                    success: true
                });
                // 成功通知
                vscode.window.showInformationMessage('AppGeniusにログインしました（レガシー認証）');
                // APIキー表示は不要なので削除
                // setTimeout(async () => {
                //   await this._showApiKeyAfterLogin();
                // }, 1000);
                // 少し待ってからパネルを閉じる
                setTimeout(() => {
                    this._panel.dispose();
                }, 1500);
            }
            else {
                // エラー情報を取得
                const authError = this._authService.getLastError();
                let errorMessage = 'メールアドレスまたはパスワードが正しくありません';
                if (authError) {
                    // エラーコードに応じたメッセージ
                    switch (authError.code) {
                        case 'invalid_credentials':
                            errorMessage = 'メールアドレスまたはパスワードが正しくありません';
                            break;
                        case 'access_denied':
                            errorMessage = 'アクセスが拒否されました。権限をご確認ください';
                            break;
                        case 'rate_limited':
                            errorMessage = 'リクエスト回数が多すぎます。しばらく待ってから再試行してください';
                            break;
                        case 'missing_credentials':
                            errorMessage = 'クライアントID/シークレットが設定されていません。環境設定を確認してください';
                            break;
                        default:
                            // authErrorからメッセージを使用
                            errorMessage = authError.message || errorMessage;
                    }
                }
                // ログイン失敗メッセージ
                this._panel.webview.postMessage({
                    type: 'login-result',
                    success: false,
                    error: errorMessage
                });
                // 致命的なエラーの場合は通知も表示
                if (authError && (authError.code === 'missing_credentials' || authError.code === 'server_error')) {
                    vscode.window.showErrorMessage(`ログインエラー: ${errorMessage}`);
                }
            }
        }
        catch (error) {
            console.error('ログイン処理中にエラーが発生しました:', error);
            logger_1.Logger.error('ログイン処理中にエラーが発生しました:', error);
            // エラーメッセージ
            this._panel.webview.postMessage({
                type: 'login-result',
                success: false,
                error: `ログイン処理中にエラーが発生しました: ${error.message}`
            });
            // 通知も表示
            vscode.window.showErrorMessage(`ログイン処理中にエラーが発生しました: ${error.message}`);
        }
    }
    /**
     * パスワードリセット処理ハンドラー
     */
    _handleResetPassword(email) {
        // 通常はAPIでパスワードリセットを実行するが、
        // 現在の段階では機能は未実装なので、単にメッセージを表示
        vscode.window.showInformationMessage(`パスワードリセット機能は現在実装中です。メールアドレス ${email} に対するリセット方法については管理者にお問い合わせください。`);
        // WebViewにも結果を送信
        this._panel.webview.postMessage({
            type: 'reset-password-result',
            success: false,
            error: 'パスワードリセット機能は現在実装中です'
        });
    }
    /**
     * ログイン後にAPIキーを表示 (不要なので削除)
     * この機能は不要になったためコメントアウト
     */
    /*
    private async _showApiKeyAfterLogin(): Promise<void> {
      try {
        // 直接インスタンス変数のSimpleAuthServiceからAPIキーを取得
        const apiKey = await this._simpleAuthService.getApiKey();
        
        if (!apiKey) {
          Logger.warn('ログイン後のAPIキー表示: APIキーが見つかりません');
          // APIキーが見つからない場合でもエラーメッセージを表示
          vscode.window.showWarningMessage(
            'APIキーが見つかりませんでした。ClaudeCode連携には別途APIキーの設定が必要になる場合があります。',
            { modal: true }
          );
          return;
        }
        
        // APIキーが文字列であることを確認
        if (typeof apiKey !== 'string') {
          Logger.error(`APIキーの型が正しくありません: ${typeof apiKey}`);
          return;
        }
        
        // APIキーをマスク処理（先頭5文字と末尾4文字のみ表示）
        const maskedApiKey = apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 4);
        
        // ユーザー情報を取得
        const userData = this._simpleAuthService.getCurrentUser();
        const userName = userData?.name || 'ユーザー';
        
        // APIキー情報をメッセージボックスで表示
        vscode.window.showInformationMessage(
          `${userName}さんのClaudeAPIキー: ${maskedApiKey}`,
          { modal: true, detail: 'このAPIキーはClaudeCode連携に使用されます。' }
        );
        
        Logger.info('APIキー情報をログイン成功後に表示しました');
      } catch (error) {
        Logger.error('APIキー表示中にエラーが発生しました', error as Error);
        // エラーが発生した場合でもユーザーに通知
        vscode.window.showErrorMessage(
          'APIキー情報の表示中にエラーが発生しました。ClaudeCode連携には別途APIキーの設定が必要になる場合があります。'
        );
      }
    }
    */
    /**
     * リソースの解放
     */
    dispose() {
        LoginWebviewPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
exports.LoginWebviewPanel = LoginWebviewPanel;
//# sourceMappingURL=LoginWebviewPanel.js.map