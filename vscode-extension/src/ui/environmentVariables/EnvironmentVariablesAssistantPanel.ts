import * as vscode from 'vscode';
import { ProtectedPanel } from '../auth/ProtectedPanel';
import { Feature } from '../../core/auth/roles';
import { BrowserAutomationService, BrowserResult } from '../../services/BrowserAutomationService';
import { Logger } from '../../utils/logger';

export class EnvironmentVariablesAssistantPanel extends ProtectedPanel {
  public static currentPanel: EnvironmentVariablesAssistantPanel | undefined;
  private static readonly viewType = 'environmentVariablesAssistant';
  protected static readonly _feature: Feature = Feature.ENVIRONMENT_VARIABLES;

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private browserService: BrowserAutomationService;

  public static createOrShow(extensionUri: vscode.Uri): void {
    const column = vscode.window.activeTextEditor?.viewColumn;

    // 権限チェック
    if (!ProtectedPanel.checkPermissionForFeature(EnvironmentVariablesAssistantPanel._feature, 'EnvironmentVariablesAssistantPanel')) {
      vscode.window.showErrorMessage('環境変数アシスタントにアクセスする権限がありません。');
      return;
    }

    // 既存のパネルがある場合は表示
    if (EnvironmentVariablesAssistantPanel.currentPanel) {
      EnvironmentVariablesAssistantPanel.currentPanel._panel.reveal(column);
      return;
    }

    // 新しいパネルを作成
    const panel = vscode.window.createWebviewPanel(
      EnvironmentVariablesAssistantPanel.viewType,
      '🌐 環境変数アシスタント',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media'),
          vscode.Uri.joinPath(extensionUri, 'dist')
        ]
      }
    );

    EnvironmentVariablesAssistantPanel.currentPanel = new EnvironmentVariablesAssistantPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    super();
    this._panel = panel;
    this._extensionUri = extensionUri;
    this.browserService = BrowserAutomationService.getInstance();

    this._update();
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        await this._handleMessage(message);
      },
      null,
      this._disposables
    );
  }

  private async _handleMessage(message: any): Promise<void> {
    switch (message.type) {
      case 'setupEnvironmentVariables':
        await this._handleEnvironmentSetup(message.data);
        break;
      case 'testConnection':
        await this._handleConnectionTest(message.data);
        break;
      case 'stopTask':
        await this._handleStopTask(message.data);
        break;
      case 'getActiveTasks':
        await this._handleGetActiveTasks();
        break;
    }
  }

  private async _handleEnvironmentSetup(data: {
    platform: string;
    variables: Record<string, string>;
  }): Promise<void> {
    try {
      this._panel.webview.postMessage({
        type: 'setupStarted',
        message: `${data.platform}での環境変数設定を開始しています...`
      });

      const result: BrowserResult = await this.browserService.setupEnvironmentVariables(
        data.platform as any,
        data.variables
      );

      if (result.success) {
        this._panel.webview.postMessage({
          type: 'setupCompleted',
          message: '環境変数の設定が完了しました',
          data: result.data,
          logs: result.logs
        });
      } else {
        this._panel.webview.postMessage({
          type: 'setupError',
          message: `設定エラー: ${result.error}`,
          logs: result.logs
        });
      }
    } catch (error) {
      Logger.error(`環境変数設定エラー: ${error}`);
      this._panel.webview.postMessage({
        type: 'setupError',
        message: `予期しないエラーが発生しました: ${error}`
      });
    }
  }

  private async _handleConnectionTest(data: { platform: string }): Promise<void> {
    try {
      this._panel.webview.postMessage({
        type: 'testStarted',
        message: `${data.platform}への接続をテストしています...`
      });

      const result: BrowserResult = await this.browserService.testConnection(data.platform);

      if (result.success) {
        this._panel.webview.postMessage({
          type: 'testCompleted',
          message: '接続テストが成功しました',
          data: result.data,
          logs: result.logs
        });
      } else {
        this._panel.webview.postMessage({
          type: 'testError',
          message: `接続テストエラー: ${result.error}`,
          logs: result.logs
        });
      }
    } catch (error) {
      Logger.error(`接続テストエラー: ${error}`);
      this._panel.webview.postMessage({
        type: 'testError',
        message: `予期しないエラーが発生しました: ${error}`
      });
    }
  }

  private async _handleStopTask(data: { taskId: string }): Promise<void> {
    try {
      const stopped = this.browserService.stopTask(data.taskId);
      this._panel.webview.postMessage({
        type: 'taskStopped',
        message: stopped ? 'タスクを停止しました' : 'タスクが見つからないか、既に終了しています',
        taskId: data.taskId
      });
    } catch (error) {
      Logger.error(`タスク停止エラー: ${error}`);
      this._panel.webview.postMessage({
        type: 'taskStopError',
        message: `タスク停止エラー: ${error}`,
        taskId: data.taskId
      });
    }
  }

  private async _handleGetActiveTasks(): Promise<void> {
    try {
      const activeTasks = this.browserService.getActiveTasks();
      this._panel.webview.postMessage({
        type: 'activeTasksUpdated',
        tasks: activeTasks
      });
    } catch (error) {
      Logger.error(`アクティブタスク取得エラー: ${error}`);
    }
  }

  private _update(): void {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>環境変数アシスタント</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                padding: 20px;
                margin: 0;
            }
            
            .header {
                display: flex;
                align-items: center;
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }
            
            .platform-selector {
                margin-bottom: 25px;
                padding: 20px;
                background-color: var(--vscode-textBlockQuote-background);
                border-radius: 8px;
                border-left: 4px solid var(--vscode-textBlockQuote-border);
            }
            
            .platform-selector h3 {
                margin-top: 0;
                margin-bottom: 15px;
                color: var(--vscode-textLink-foreground);
            }
            
            .platform-selector select {
                width: 100%;
                padding: 8px 12px;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
                font-size: 14px;
            }
            
            .variables-section {
                margin-bottom: 25px;
                padding: 20px;
                background-color: var(--vscode-textBlockQuote-background);
                border-radius: 8px;
                border-left: 4px solid var(--vscode-textBlockQuote-border);
            }
            
            .variables-section h3 {
                margin-top: 0;
                margin-bottom: 15px;
                color: var(--vscode-textLink-foreground);
            }
            
            .variable-input {
                display: grid;
                grid-template-columns: 1fr 1fr auto;
                gap: 10px;
                margin-bottom: 10px;
                align-items: end;
            }
            
            .variable-input label {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                margin-bottom: 4px;
                display: block;
            }
            
            .variable-input input {
                padding: 8px 12px;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
                font-size: 14px;
            }
            
            .variable-input input:focus {
                outline: none;
                border-color: var(--vscode-focusBorder);
            }
            
            .btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background-color 0.2s;
            }
            
            .btn-primary {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
            }
            
            .btn-primary:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            
            .btn-secondary {
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
            }
            
            .btn-secondary:hover {
                background-color: var(--vscode-button-secondaryHoverBackground);
            }
            
            .btn-danger {
                background-color: var(--vscode-errorForeground);
                color: var(--vscode-editor-background);
            }
            
            .btn-small {
                padding: 4px 8px;
                font-size: 12px;
            }
            
            .action-buttons {
                display: flex;
                gap: 10px;
                margin-top: 20px;
                flex-wrap: wrap;
            }
            
            .status-area {
                margin-top: 25px;
                padding: 15px;
                background-color: var(--vscode-textBlockQuote-background);
                border-left: 4px solid var(--vscode-textBlockQuote-border);
                border-radius: 4px;
                display: none;
            }
            
            .status-area.info {
                border-left-color: var(--vscode-textLink-foreground);
            }
            
            .status-area.success {
                border-left-color: var(--vscode-terminal-ansiGreen);
            }
            
            .status-area.error {
                border-left-color: var(--vscode-errorForeground);
            }
            
            .status-message {
                font-weight: 500;
                margin-bottom: 10px;
            }
            
            .logs-container {
                max-height: 200px;
                overflow-y: auto;
                background-color: var(--vscode-editor-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
                padding: 10px;
                font-family: var(--vscode-editor-font-family);
                font-size: 12px;
                margin-top: 10px;
            }
            
            .log-entry {
                margin-bottom: 5px;
                word-break: break-all;
            }
            
            .active-tasks {
                margin-top: 25px;
                padding: 15px;
                background-color: var(--vscode-textBlockQuote-background);
                border-radius: 8px;
                border-left: 4px solid var(--vscode-textBlockQuote-border);
            }
            
            .active-tasks h3 {
                margin-top: 0;
                margin-bottom: 15px;
                color: var(--vscode-textLink-foreground);
            }
            
            .task-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background-color: var(--vscode-input-background);
                border-radius: 4px;
                margin-bottom: 8px;
            }
            
            .task-id {
                font-family: var(--vscode-editor-font-family);
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
            }
            
            .add-variable-btn {
                margin-top: 15px;
            }
            
            .description {
                color: var(--vscode-descriptionForeground);
                font-size: 14px;
                line-height: 1.5;
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🌐 環境変数アシスタント</h1>
        </div>
        
        <p class="description">
            AIがブラウザを操作して、クラウドサービスの環境変数を自動設定します。
            AWS、GCP、Vercel、Netlifyなどの管理画面にアクセスし、指定された環境変数を安全に設定できます。
        </p>
        
        <div class="platform-selector">
            <h3>📋 プラットフォーム選択</h3>
            <select id="platform">
                <option value="aws">AWS (Lambda, ECS, Amplify)</option>
                <option value="gcp">Google Cloud Platform</option>
                <option value="vercel">Vercel</option>
                <option value="netlify">Netlify</option>
            </select>
        </div>

        <div class="variables-section">
            <h3>⚙️ 環境変数</h3>
            <div id="variables-container">
                <div class="variable-input">
                    <div>
                        <label>変数名</label>
                        <input type="text" placeholder="例: DATABASE_URL" class="var-name">
                    </div>
                    <div>
                        <label>値</label>
                        <input type="text" placeholder="例: postgresql://..." class="var-value">
                    </div>
                    <button class="btn btn-danger btn-small" onclick="removeVariable(this)" style="display: none;">削除</button>
                </div>
            </div>
            <button class="btn btn-secondary add-variable-btn" onclick="addVariable()">+ 変数を追加</button>
        </div>

        <div class="action-buttons">
            <button class="btn btn-primary" onclick="setupEnvironmentVariables()" id="setup-btn">
                🚀 自動設定開始
            </button>
            <button class="btn btn-secondary" onclick="testConnection()">
                🔍 接続テスト
            </button>
            <button class="btn btn-secondary" onclick="refreshActiveTasks()">
                🔄 タスク状況更新
            </button>
        </div>

        <div id="status" class="status-area">
            <div id="status-message" class="status-message"></div>
            <div id="logs" class="logs-container" style="display: none;"></div>
        </div>

        <div class="active-tasks">
            <h3>🔄 実行中のタスク</h3>
            <div id="active-tasks-list">
                <p style="color: var(--vscode-descriptionForeground); font-style: italic;">実行中のタスクはありません</p>
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            
            function addVariable() {
                const container = document.getElementById('variables-container');
                const div = document.createElement('div');
                div.className = 'variable-input';
                div.innerHTML = \`
                    <div>
                        <label>変数名</label>
                        <input type="text" placeholder="例: API_KEY" class="var-name">
                    </div>
                    <div>
                        <label>値</label>
                        <input type="text" placeholder="例: your-api-key" class="var-value">
                    </div>
                    <button class="btn btn-danger btn-small" onclick="removeVariable(this)">削除</button>
                \`;
                container.appendChild(div);
                updateDeleteButtons();
            }

            function removeVariable(button) {
                button.parentElement.remove();
                updateDeleteButtons();
            }

            function updateDeleteButtons() {
                const inputs = document.querySelectorAll('.variable-input');
                inputs.forEach((input, index) => {
                    const deleteBtn = input.querySelector('.btn-danger');
                    if (deleteBtn) {
                        deleteBtn.style.display = inputs.length > 1 ? 'block' : 'none';
                    }
                });
            }

            function setupEnvironmentVariables() {
                const platform = document.getElementById('platform').value;
                const variables = {};
                
                document.querySelectorAll('.variable-input').forEach(input => {
                    const name = input.querySelector('.var-name').value.trim();
                    const value = input.querySelector('.var-value').value.trim();
                    if (name && value) {
                        variables[name] = value;
                    }
                });

                if (Object.keys(variables).length === 0) {
                    showStatus('環境変数を入力してください', 'error');
                    return;
                }

                showStatus('設定を開始しています...', 'info');
                document.getElementById('setup-btn').disabled = true;

                vscode.postMessage({
                    type: 'setupEnvironmentVariables',
                    data: { platform, variables }
                });
            }

            function testConnection() {
                const platform = document.getElementById('platform').value;
                showStatus('接続をテストしています...', 'info');
                
                vscode.postMessage({
                    type: 'testConnection',
                    data: { platform }
                });
            }

            function refreshActiveTasks() {
                vscode.postMessage({
                    type: 'getActiveTasks'
                });
            }

            function stopTask(taskId) {
                vscode.postMessage({
                    type: 'stopTask',
                    data: { taskId }
                });
            }

            function showStatus(message, type = 'info') {
                const statusDiv = document.getElementById('status');
                const messageDiv = document.getElementById('status-message');
                const logsDiv = document.getElementById('logs');
                
                messageDiv.textContent = message;
                statusDiv.className = \`status-area \${type}\`;
                statusDiv.style.display = 'block';
                logsDiv.style.display = 'none';
            }

            function showLogs(logs) {
                const logsDiv = document.getElementById('logs');
                if (logs && logs.length > 0) {
                    logsDiv.innerHTML = logs.map(log => 
                        \`<div class="log-entry">\${escapeHtml(log)}</div>\`
                    ).join('');
                    logsDiv.style.display = 'block';
                }
            }

            function updateActiveTasks(tasks) {
                const container = document.getElementById('active-tasks-list');
                if (!tasks || tasks.length === 0) {
                    container.innerHTML = '<p style="color: var(--vscode-descriptionForeground); font-style: italic;">実行中のタスクはありません</p>';
                } else {
                    container.innerHTML = tasks.map(taskId => \`
                        <div class="task-item">
                            <span class="task-id">\${taskId}</span>
                            <button class="btn btn-danger btn-small" onclick="stopTask('\${taskId}')">停止</button>
                        </div>
                    \`).join('');
                }
            }

            function escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            // メッセージ受信処理
            window.addEventListener('message', event => {
                const message = event.data;
                
                switch (message.type) {
                    case 'setupStarted':
                    case 'testStarted':
                        showStatus(message.message, 'info');
                        break;
                    case 'setupCompleted':
                    case 'testCompleted':
                        showStatus(message.message, 'success');
                        if (message.logs) showLogs(message.logs);
                        document.getElementById('setup-btn').disabled = false;
                        refreshActiveTasks();
                        break;
                    case 'setupError':
                    case 'testError':
                        showStatus(message.message, 'error');
                        if (message.logs) showLogs(message.logs);
                        document.getElementById('setup-btn').disabled = false;
                        refreshActiveTasks();
                        break;
                    case 'taskStopped':
                        showStatus(message.message, 'info');
                        refreshActiveTasks();
                        break;
                    case 'taskStopError':
                        showStatus(message.message, 'error');
                        break;
                    case 'activeTasksUpdated':
                        updateActiveTasks(message.tasks);
                        break;
                }
            });

            // 初期化
            updateDeleteButtons();
            refreshActiveTasks();
        </script>
    </body>
    </html>`;
  }

  public dispose(): void {
    EnvironmentVariablesAssistantPanel.currentPanel = undefined;

    // Clean up resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}