# ブラウザエージェント統合実装計画

## ディレクトリ構造とプロジェクト分離戦略

### 現在の構造
```
AppGenius/
├── cli/                    # ブルーランプCLI（browsing_agent, visual_browsing_agent含む）
├── vscode-extension/       # VSCode拡張機能
├── portal/                 # Webポータル
└── docs/                   # ドキュメント
```

### Phase 1: 環境変数アシスタント（現在のAppGenius）
**対象ディレクトリ**: `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/vscode-extension/`
**使用エージェント**: `browsing_agent`

### Phase 2: LP/HP制作特化プロジェクト（コピープロジェクト）
**対象ディレクトリ**: `/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGeniusのコピー/`
**使用エージェント**: `visual_browsing_agent`

## Phase 2: プロジェクト分離とファイル移行計画

### 移行対象ファイル・フォルダ

#### 1. 必須移行ファイル（CLIシステム）
```bash
# 元のディレクトリから移行
AppGenius/cli/ → AppGeniusのコピー/cli/
```

**移行するファイル**:
- `cli/bluelamp` - メインCLI実行ファイル
- `cli/agent_configs.toml` - エージェント設定（visual_browsing_agent含む）
- `cli/config.toml` - CLI設定
- `cli/openhands/` - OpenHandsコア（visual_browsing_agent実装含む）
- `cli/pyproject.toml` - Python依存関係
- `cli/poetry.lock` - 依存関係ロック
- `cli/install-bluelamp.sh` - インストールスクリプト

#### 2. VSCode拡張機能の改修
```bash
# 新しい構造
AppGeniusのコピー/
├── cli/                    # 移行したCLIシステム
├── vscode-extension/       # LP/HP制作特化の拡張機能
│   ├── src/
│   │   ├── services/
│   │   │   ├── UIAnalysisService.ts      # 新規作成
│   │   │   └── VisualBrowsingService.ts  # 新規作成
│   │   ├── ui/
│   │   │   ├── lpgenius/                 # 新規作成
│   │   │   └── hpgenius/                 # 新規作成
│   │   └── extension.ts                  # LP/HP機能追加
│   └── package.json                      # LP/HP用コマンド追加
└── docs/
    ├── lpgenius_requirements.md
    ├── hpgenius_requirements.md
    └── LPGeniusImplementationPLAN.md
```

#### 3. 不要ファイルの削除
```bash
# コピープロジェクトから削除
AppGeniusのコピー/portal/          # バックエンド不要
AppGeniusのコピー/docs/deployment/ # デプロイ関連不要
```

### 具体的な移行手順

#### Step 1: CLIシステムの移行
```bash
# 1. 必要なCLIファイルをコピー
cp -r AppGenius/cli/ AppGeniusのコピー/cli/

# 2. 不要なファイルを削除
rm -rf AppGeniusのコピー/cli/logs/
rm -rf AppGeniusのコピー/cli/cache/
rm -rf AppGeniusのコピー/cli/workspace/
```

#### Step 2: VSCode拡張機能の特化
```bash
# 1. package.jsonの更新
# LP/HP制作用のコマンドを追加
# 環境変数アシスタント関連のコマンドを削除

# 2. 新しいサービスクラスの作成
# UIAnalysisService.ts
# VisualBrowsingService.ts

# 3. 新しいUIパネルの作成
# LPGeniusPanel.ts
# HPGeniusPanel.ts
```

#### Step 3: プロンプトファイルの整理
```bash
# LP/HP特化のプロンプトを作成
AppGeniusのコピー/docs/prompts/
├── ★1conversion_strategist.md
├── ★2sales_copywriter.md
├── ★3lp_designer.md
├── ★4lp_architect.md
├── ★5performance_optimizer.md
├── ★6tracking_setup.md
├── ★7implementation_engineer.md
├── ★8ab_test_manager.md
├── ★9brand_strategist.md        # HP用
├── ★10sitemap_architect.md      # HP用
├── ★11content_strategist.md     # HP用
├── ★12design_system_creator.md  # HP用
├── ★13ux_designer.md           # HP用
├── ★14frontend_implementer.md  # HP用
├── ★15performance_optimizer.md # HP用
├── ★16seo_specialist.md        # HP用
├── ★17cms_integration.md       # HP用
└── ★18qa_manager.md            # HP用
```

### 最終的なディレクトリ構造

#### 元のAppGenius（汎用開発支援）
```
AppGenius/
├── cli/                    # browsing_agent統合済み
├── vscode-extension/       # 環境変数アシスタント追加
│   ├── src/
│   │   ├── services/
│   │   │   └── BrowserAutomationService.ts
│   │   └── ui/
│   │       └── environmentVariables/
│   │           └── EnvironmentVariablesAssistantPanel.ts
│   └── package.json        # 環境変数アシスタントコマンド追加
├── portal/                 # Webポータル（そのまま）
└── docs/
    └── browser-integration-plan.md
```

#### コピープロジェクト（LP/HP制作特化）
```
AppGeniusのコピー/
├── cli/                    # visual_browsing_agent統合済み
├── vscode-extension/       # LP/HP制作特化
│   ├── src/
│   │   ├── services/
│   │   │   ├── UIAnalysisService.ts
│   │   │   └── VisualBrowsingService.ts
│   │   └── ui/
│   │       ├── lpgenius/
│   │       │   ├── LPGeniusPanel.ts
│   │       │   └── ConversionStrategyPanel.ts
│   │       └── hpgenius/
│   │           ├── HPGeniusPanel.ts
│   │           └── BrandStrategyPanel.ts
│   └── package.json        # LP/HP制作コマンド追加
└── docs/
    ├── lpgenius_requirements.md
    ├── hpgenius_requirements.md
    └── LPGeniusImplementationPLAN.md
```

## Phase 1: 環境変数アシスタントにブラウザ操作機能追加

### 1.1 新しいサービスクラスの作成

#### `BrowserAutomationService.ts`
```typescript
// src/services/BrowserAutomationService.ts
import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import { Logger } from '../utils/logger';
import { AppGeniusEventBus, AppGeniusEventType } from './AppGeniusEventBus';

export interface BrowserTask {
  id: string;
  type: 'environment_setup' | 'ui_analysis' | 'deployment';
  target: string; // AWS, GCP, Vercel, etc.
  instructions: string;
  credentials?: {
    username?: string;
    password?: string;
    apiKey?: string;
  };
}

export interface BrowserResult {
  taskId: string;
  success: boolean;
  data?: any;
  error?: string;
  screenshots?: string[];
}

export class BrowserAutomationService {
  private static instance: BrowserAutomationService;
  private eventBus: AppGeniusEventBus;
  private activeProcesses: Map<string, childProcess.ChildProcess> = new Map();

  private constructor() {
    this.eventBus = AppGeniusEventBus.getInstance();
  }

  public static getInstance(): BrowserAutomationService {
    if (!BrowserAutomationService.instance) {
      BrowserAutomationService.instance = new BrowserAutomationService();
    }
    return BrowserAutomationService.instance;
  }

  /**
   * ブラウザエージェントタスクを実行
   */
  public async executeBrowserTask(task: BrowserTask): Promise<BrowserResult> {
    try {
      // ブルーランプCLIを使用してブラウザエージェントを起動
      const command = this.buildBrowserCommand(task);
      const process = await this.launchBrowserAgent(command, task.id);
      
      this.activeProcesses.set(task.id, process);
      
      return await this.waitForResult(task.id);
    } catch (error) {
      Logger.error(`ブラウザタスク実行エラー: ${error}`);
      return {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 環境変数設定専用のメソッド
   */
  public async setupEnvironmentVariables(
    platform: 'aws' | 'gcp' | 'vercel' | 'netlify',
    variables: Record<string, string>
  ): Promise<BrowserResult> {
    const task: BrowserTask = {
      id: `env_setup_${Date.now()}`,
      type: 'environment_setup',
      target: platform,
      instructions: `Set environment variables: ${JSON.stringify(variables)}`
    };

    return this.executeBrowserTask(task);
  }

  private buildBrowserCommand(task: BrowserTask): string {
    // ブルーランプCLIコマンドを構築
    const cliPath = vscode.workspace.getConfiguration('appgeniusAI').get<string>('cliPath') || 'bluelamp';
    
    return `${cliPath} --agent browsing_agent --task "${task.instructions}" --target ${task.target}`;
  }

  private async launchBrowserAgent(command: string, taskId: string): Promise<childProcess.ChildProcess> {
    return new Promise((resolve, reject) => {
      const process = childProcess.spawn(command, [], {
        shell: true,
        cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
      });

      process.on('spawn', () => {
        Logger.info(`ブラウザエージェント起動: ${taskId}`);
        resolve(process);
      });

      process.on('error', (error) => {
        Logger.error(`ブラウザエージェント起動エラー: ${error}`);
        reject(error);
      });
    });
  }

  private async waitForResult(taskId: string): Promise<BrowserResult> {
    // 結果ファイルの監視またはプロセス出力の解析
    // 実装詳細は後述
    return {
      taskId,
      success: true,
      data: {}
    };
  }
}
```

#### `EnvironmentVariablesAssistantPanel.ts`
```typescript
// src/ui/environmentVariables/EnvironmentVariablesAssistantPanel.ts
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

  protected static _createOrShowPanel(extensionUri: vscode.Uri): EnvironmentVariablesAssistantPanel {
    const column = vscode.window.activeTextEditor?.viewColumn;

    if (EnvironmentVariablesAssistantPanel.currentPanel) {
      EnvironmentVariablesAssistantPanel.currentPanel._panel.reveal(column);
      return EnvironmentVariablesAssistantPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      EnvironmentVariablesAssistantPanel.viewType,
      '環境変数アシスタント',
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
    return EnvironmentVariablesAssistantPanel.currentPanel;
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
          data: result.data
        });
      } else {
        this._panel.webview.postMessage({
          type: 'setupError',
          message: `設定エラー: ${result.error}`
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
            }
            .platform-selector {
                margin-bottom: 20px;
            }
            .variable-input {
                margin-bottom: 10px;
            }
            .variable-input input {
                width: 100%;
                padding: 8px;
                margin-top: 4px;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
            }
            .action-buttons {
                margin-top: 20px;
            }
            .action-buttons button {
                padding: 10px 20px;
                margin-right: 10px;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                cursor: pointer;
            }
            .status-area {
                margin-top: 20px;
                padding: 10px;
                background-color: var(--vscode-textBlockQuote-background);
                border-left: 4px solid var(--vscode-textBlockQuote-border);
            }
        </style>
    </head>
    <body>
        <h1>🌐 環境変数アシスタント</h1>
        <p>AIがブラウザを操作して、クラウドサービスの環境変数を自動設定します。</p>
        
        <div class="platform-selector">
            <label for="platform">プラットフォーム:</label>
            <select id="platform">
                <option value="aws">AWS (Lambda, ECS)</option>
                <option value="gcp">Google Cloud Platform</option>
                <option value="vercel">Vercel</option>
                <option value="netlify">Netlify</option>
            </select>
        </div>

        <div id="variables-container">
            <h3>環境変数</h3>
            <div class="variable-input">
                <label>変数名:</label>
                <input type="text" placeholder="例: DATABASE_URL" class="var-name">
                <label>値:</label>
                <input type="text" placeholder="例: postgresql://..." class="var-value">
            </div>
        </div>

        <div class="action-buttons">
            <button onclick="addVariable()">+ 変数を追加</button>
            <button onclick="setupEnvironmentVariables()" id="setup-btn">🚀 自動設定開始</button>
            <button onclick="testConnection()">🔍 接続テスト</button>
        </div>

        <div id="status" class="status-area" style="display: none;">
            <div id="status-message"></div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            
            function addVariable() {
                const container = document.getElementById('variables-container');
                const div = document.createElement('div');
                div.className = 'variable-input';
                div.innerHTML = \`
                    <label>変数名:</label>
                    <input type="text" placeholder="例: API_KEY" class="var-name">
                    <label>値:</label>
                    <input type="text" placeholder="例: your-api-key" class="var-value">
                    <button onclick="this.parentElement.remove()">削除</button>
                \`;
                container.appendChild(div);
            }

            function setupEnvironmentVariables() {
                const platform = document.getElementById('platform').value;
                const variables = {};
                
                document.querySelectorAll('.variable-input').forEach(input => {
                    const name = input.querySelector('.var-name').value;
                    const value = input.querySelector('.var-value').value;
                    if (name && value) {
                        variables[name] = value;
                    }
                });

                if (Object.keys(variables).length === 0) {
                    alert('環境変数を入力してください');
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

            function showStatus(message, type = 'info') {
                const statusDiv = document.getElementById('status');
                const messageDiv = document.getElementById('status-message');
                messageDiv.textContent = message;
                statusDiv.style.display = 'block';
                
                if (type === 'error') {
                    statusDiv.style.borderLeftColor = 'var(--vscode-errorForeground)';
                } else if (type === 'success') {
                    statusDiv.style.borderLeftColor = 'var(--vscode-terminal-ansiGreen)';
                } else {
                    statusDiv.style.borderLeftColor = 'var(--vscode-textBlockQuote-border)';
                }
            }

            // メッセージ受信処理
            window.addEventListener('message', event => {
                const message = event.data;
                
                switch (message.type) {
                    case 'setupStarted':
                        showStatus(message.message, 'info');
                        break;
                    case 'setupCompleted':
                        showStatus(message.message, 'success');
                        document.getElementById('setup-btn').disabled = false;
                        break;
                    case 'setupError':
                        showStatus(message.message, 'error');
                        document.getElementById('setup-btn').disabled = false;
                        break;
                }
            });
        </script>
    </body>
    </html>`;
  }

  public dispose(): void {
    EnvironmentVariablesAssistantPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
```

### 1.2 コマンド登録とメニュー統合

#### `package.json` への追加
```json
{
  "contributes": {
    "commands": [
      {
        "command": "appgenius-ai.openEnvironmentVariablesAssistant",
        "title": "AppGenius AI: 環境変数アシスタントを開く",
        "icon": "$(globe)"
      },
      {
        "command": "appgenius-ai.setupAWSEnvironment",
        "title": "AppGenius AI: AWS環境変数を自動設定"
      },
      {
        "command": "appgenius-ai.setupGCPEnvironment", 
        "title": "AppGenius AI: GCP環境変数を自動設定"
      }
    ],
    "keybindings": [
      {
        "command": "appgenius-ai.openEnvironmentVariablesAssistant",
        "key": "ctrl+shift+e",
        "mac": "cmd+shift+e",
        "when": "editorTextFocus"
      }
    ],
    "configuration": {
      "properties": {
        "appgeniusAI.browserAutomation.enabled": {
          "type": "boolean",
          "default": true,
          "description": "ブラウザ自動化機能を有効にする"
        },
        "appgeniusAI.browserAutomation.headless": {
          "type": "boolean", 
          "default": false,
          "description": "ヘッドレスモードでブラウザを実行"
        },
        "appgeniusAI.browserAutomation.timeout": {
          "type": "number",
          "default": 30000,
          "description": "ブラウザ操作のタイムアウト（ミリ秒）"
        }
      }
    }
  }
}
```

#### `extension.ts` への統合
```typescript
// extension.ts に追加
import { EnvironmentVariablesAssistantPanel } from './ui/environmentVariables/EnvironmentVariablesAssistantPanel';
import { BrowserAutomationService } from './services/BrowserAutomationService';

export function activate(context: vscode.ExtensionContext) {
  // 既存のコード...

  // 環境変数アシスタントコマンド
  const openEnvironmentVariablesAssistant = vscode.commands.registerCommand(
    'appgenius-ai.openEnvironmentVariablesAssistant',
    () => {
      EnvironmentVariablesAssistantPanel.createOrShow(context.extensionUri);
    }
  );

  // AWS環境変数設定コマンド
  const setupAWSEnvironment = vscode.commands.registerCommand(
    'appgenius-ai.setupAWSEnvironment',
    async () => {
      const browserService = BrowserAutomationService.getInstance();
      const variables = await vscode.window.showInputBox({
        prompt: '設定する環境変数をJSON形式で入力してください',
        placeHolder: '{"DATABASE_URL": "postgresql://...", "API_KEY": "your-key"}'
      });

      if (variables) {
        try {
          const parsedVars = JSON.parse(variables);
          const result = await browserService.setupEnvironmentVariables('aws', parsedVars);
          
          if (result.success) {
            vscode.window.showInformationMessage('AWS環境変数の設定が完了しました');
          } else {
            vscode.window.showErrorMessage(`設定エラー: ${result.error}`);
          }
        } catch (error) {
          vscode.window.showErrorMessage('JSON形式が正しくありません');
        }
      }
    }
  );

  context.subscriptions.push(
    openEnvironmentVariablesAssistant,
    setupAWSEnvironment
  );
}
```

### 1.3 ブルーランプCLIとの連携強化

#### CLI側の拡張エージェント設定
```toml
# agent_configs.toml に追加
[agents.browser_automation]
name = "BrowserAutomationAgent"
classpath = "openhands.agenthub.browsing_agent.browsing_agent:BrowsingAgent"
system_prompt_filename = "browser_automation_agent.j2"
description = "ブラウザ操作による環境設定とUI分析を担当"

[agents.visual_browser_automation]
name = "VisualBrowserAutomationAgent" 
classpath = "openhands.agenthub.visualbrowsing_agent.visualbrowsing_agent:VisualBrowsingAgent"
system_prompt_filename = "visual_browser_automation_agent.j2"
description = "ビジュアル情報を活用した高度なブラウザ操作を担当"
```

#### 専用プロンプトテンプレート
```jinja2
<!-- browser_automation_agent.j2 -->
# ブラウザ自動化エージェント

あなたはWebブラウザを操作して、クラウドサービスの設定や情報収集を行う専門エージェントです。

## 主な責務
1. **環境変数設定**: AWS、GCP、Vercel等での環境変数自動設定
2. **サービス設定**: APIキー生成、Webhook設定、ドメイン設定
3. **情報収集**: 管理画面からの設定値取得、ステータス確認
4. **検証**: 設定が正しく反映されているかの確認

## 操作ガイドライン
- セキュリティを最優先に、認証情報は適切に管理
- 操作手順を詳細にログに記録
- エラー時は具体的な原因と解決策を提示
- スクリーンショットで操作結果を証拠として保存

## 対応プラットフォーム
- AWS (Lambda, ECS, Amplify)
- Google Cloud Platform (Cloud Run, App Engine)
- Vercel (Environment Variables, Domains)
- Netlify (Site Settings, Environment Variables)
- GitHub (Secrets, Actions)

現在のタスク: {{ task_description }}
対象プラットフォーム: {{ target_platform }}
```

## Phase 1 実装スケジュール

### Week 1: 基盤構築
- [ ] `BrowserAutomationService` 実装
- [ ] `EnvironmentVariablesAssistantPanel` 基本UI作成
- [ ] CLI連携テスト

### Week 2: 機能実装
- [ ] AWS環境変数設定機能
- [ ] GCP環境変数設定機能
- [ ] エラーハンドリング強化

### Week 3: UI/UX改善
- [ ] プログレス表示
- [ ] スクリーンショット表示
- [ ] 設定履歴機能

### Week 4: テスト・最適化
- [ ] 統合テスト
- [ ] パフォーマンス最適化
- [ ] ドキュメント作成

---

## Phase 2: モックアップデザイナーに参考サイト分析機能追加

### 2.1 UI分析サービスの作成

#### `UIAnalysisService.ts`
```typescript
// src/services/UIAnalysisService.ts
import { BrowserAutomationService, BrowserTask, BrowserResult } from './BrowserAutomationService';

export interface UIAnalysisRequest {
  targetUrl: string;
  analysisType: 'layout' | 'components' | 'colors' | 'typography' | 'full';
  extractAssets?: boolean;
}

export interface UIAnalysisResult {
  url: string;
  layout: {
    structure: string;
    responsive: boolean;
    breakpoints: string[];
  };
  components: {
    buttons: ComponentInfo[];
    forms: ComponentInfo[];
    navigation: ComponentInfo[];
    cards: ComponentInfo[];
  };
  design: {
    colorPalette: string[];
    typography: FontInfo[];
    spacing: string[];
  };
  assets: {
    images: string[];
    icons: string[];
    logos: string[];
  };
  code: {
    html: string;
    css: string;
    framework?: string;
  };
}

interface ComponentInfo {
  type: string;
  styles: Record<string, string>;
  html: string;
  screenshot?: string;
}

interface FontInfo {
  family: string;
  sizes: string[];
  weights: string[];
}

export class UIAnalysisService {
  private browserService: BrowserAutomationService;

  constructor() {
    this.browserService = BrowserAutomationService.getInstance();
  }

  /**
   * Webサイトの UI/UX を分析
   */
  public async analyzeWebsite(request: UIAnalysisRequest): Promise<UIAnalysisResult> {
    const task: BrowserTask = {
      id: `ui_analysis_${Date.now()}`,
      type: 'ui_analysis',
      target: request.targetUrl,
      instructions: `Analyze website UI/UX: ${JSON.stringify(request)}`
    };

    const result = await this.browserService.executeBrowserTask(task);
    
    if (result.success && result.data) {
      return this.parseAnalysisResult(result.data);
    } else {
      throw new Error(`UI分析エラー: ${result.error}`);
    }
  }

  /**
   * 競合サイト分析
   */
  public async analyzeCompetitors(urls: string[]): Promise<UIAnalysisResult[]> {
    const results: UIAnalysisResult[] = [];
    
    for (const url of urls) {
      try {
        const analysis = await this.analyzeWebsite({
          targetUrl: url,
          analysisType: 'full',
          extractAssets: true
        });
        results.push(analysis);
      } catch (error) {
        console.error(`競合サイト分析エラー (${url}):`, error);
      }
    }
    
    return results;
  }

  /**
   * デザインシステム情報取得
   */
  public async extractDesignSystem(frameworkUrl: string): Promise<{
    components: ComponentInfo[];
    tokens: Record<string, any>;
    guidelines: string[];
  }> {
    const task: BrowserTask = {
      id: `design_system_${Date.now()}`,
      type: 'ui_analysis',
      target: frameworkUrl,
      instructions: 'Extract design system components and tokens'
    };

    const result = await this.browserService.executeBrowserTask(task);
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(`デザインシステム取得エラー: ${result.error}`);
    }
  }

  private parseAnalysisResult(data: any): UIAnalysisResult {
    // ブラウザエージェントからの結果をパース
    return {
      url: data.url,
      layout: data.layout || {},
      components: data.components || {},
      design: data.design || {},
      assets: data.assets || {},
      code: data.code || {}
    };
  }
}
```

### 2.2 モックアップデザイナーの拡張

#### `MockupGalleryPanel.ts` の拡張
```typescript
// 既存のMockupGalleryPanel.tsに追加
import { UIAnalysisService, UIAnalysisRequest } from '../../services/UIAnalysisService';

export class MockupGalleryPanel extends ProtectedPanel {
  // 既存のコード...
  private uiAnalysisService: UIAnalysisService;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    // 既存のコード...
    this.uiAnalysisService = new UIAnalysisService();
  }

  private async _handleMessage(message: any): Promise<void> {
    switch (message.type) {
      // 既存のケース...
      case 'analyzeReferenceWebsite':
        await this._handleWebsiteAnalysis(message.data);
        break;
      case 'analyzeCompetitors':
        await this._handleCompetitorAnalysis(message.data);
        break;
      case 'extractDesignSystem':
        await this._handleDesignSystemExtraction(message.data);
        break;
    }
  }

  private async _handleWebsiteAnalysis(data: { url: string; analysisType: string }): Promise<void> {
    try {
      this._panel.webview.postMessage({
        type: 'analysisStarted',
        message: `${data.url} の分析を開始しています...`
      });

      const request: UIAnalysisRequest = {
        targetUrl: data.url,
        analysisType: data.analysisType as any,
        extractAssets: true
      };

      const result = await this.uiAnalysisService.analyzeWebsite(request);

      this._panel.webview.postMessage({
        type: 'analysisCompleted',
        data: result
      });
    } catch (error) {
      this._panel.webview.postMessage({
        type: 'analysisError',
        message: `分析エラー: ${error}`
      });
    }
  }

  private async _handleCompetitorAnalysis(data: { urls: string[] }): Promise<void> {
    try {
      this._panel.webview.postMessage({
        type: 'competitorAnalysisStarted',
        message: '競合サイト分析を開始しています...'
      });

      const results = await this.uiAnalysisService.analyzeCompetitors(data.urls);

      this._panel.webview.postMessage({
        type: 'competitorAnalysisCompleted',
        data: results
      });
    } catch (error) {
      this._panel.webview.postMessage({
        type: 'competitorAnalysisError',
        message: `競合分析エラー: ${error}`
      });
    }
  }

  // HTMLテンプレートに分析機能を追加
  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
    <html lang="ja">
    <head>
        <!-- 既存のhead要素... -->
        <style>
            /* 既存のスタイル... */
            .analysis-section {
                margin-top: 30px;
                padding: 20px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
            }
            .url-input {
                width: 100%;
                padding: 8px;
                margin: 10px 0;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
            }
            .analysis-results {
                margin-top: 20px;
                max-height: 400px;
                overflow-y: auto;
            }
            .component-preview {
                border: 1px solid var(--vscode-panel-border);
                margin: 10px 0;
                padding: 10px;
                border-radius: 4px;
            }
        </style>
    </head>
    <body>
        <!-- 既存のコンテンツ... -->
        
        <div class="analysis-section">
            <h2>🔍 参考サイト分析</h2>
            <p>競合サイトやデザインの参考にしたいWebサイトを分析して、デザイン要素を抽出します。</p>
            
            <div>
                <label for="reference-url">分析対象URL:</label>
                <input type="url" id="reference-url" class="url-input" 
                       placeholder="https://example.com">
                
                <label for="analysis-type">分析タイプ:</label>
                <select id="analysis-type">
                    <option value="full">完全分析</option>
                    <option value="layout">レイアウトのみ</option>
                    <option value="components">コンポーネントのみ</option>
                    <option value="colors">カラーパレットのみ</option>
                    <option value="typography">タイポグラフィのみ</option>
                </select>
                
                <button onclick="analyzeReferenceWebsite()">🚀 分析開始</button>
            </div>
            
            <div>
                <h3>競合サイト一括分析</h3>
                <textarea id="competitor-urls" class="url-input" rows="4" 
                          placeholder="https://competitor1.com&#10;https://competitor2.com&#10;https://competitor3.com"></textarea>
                <button onclick="analyzeCompetitors()">📊 競合分析開始</button>
            </div>
            
            <div id="analysis-results" class="analysis-results" style="display: none;">
                <h3>分析結果</h3>
                <div id="analysis-content"></div>
            </div>
        </div>

        <div class="analysis-section">
            <h2>🎨 デザインシステム取得</h2>
            <p>Material-UI、Tailwind CSS等のデザインシステムから情報を取得します。</p>
            
            <select id="design-system">
                <option value="https://mui.com">Material-UI</option>
                <option value="https://tailwindcss.com">Tailwind CSS</option>
                <option value="https://ant.design">Ant Design</option>
                <option value="https://chakra-ui.com">Chakra UI</option>
                <option value="custom">カスタムURL</option>
            </select>
            
            <input type="url" id="custom-design-system-url" class="url-input" 
                   placeholder="カスタムデザインシステムのURL" style="display: none;">
            
            <button onclick="extractDesignSystem()">📥 デザインシステム取得</button>
        </div>

        <script>
            // 既存のJavaScript...
            
            function analyzeReferenceWebsite() {
                const url = document.getElementById('reference-url').value;
                const analysisType = document.getElementById('analysis-type').value;
                
                if (!url) {
                    alert('URLを入力してください');
                    return;
                }
                
                showAnalysisStatus('分析を開始しています...', 'info');
                
                vscode.postMessage({
                    type: 'analyzeReferenceWebsite',
                    data: { url, analysisType }
                });
            }
            
            function analyzeCompetitors() {
                const urlsText = document.getElementById('competitor-urls').value;
                const urls = urlsText.split('\\n').filter(url => url.trim());
                
                if (urls.length === 0) {
                    alert('競合サイトのURLを入力してください');
                    return;
                }
                
                showAnalysisStatus('競合サイト分析を開始しています...', 'info');
                
                vscode.postMessage({
                    type: 'analyzeCompetitors',
                    data: { urls }
                });
            }
            
            function extractDesignSystem() {
                const select = document.getElementById('design-system');
                const customUrl = document.getElementById('custom-design-system-url');
                
                let url = select.value;
                if (url === 'custom') {
                    url = customUrl.value;
                    if (!url) {
                        alert('カスタムURLを入力してください');
                        return;
                    }
                }
                
                showAnalysisStatus('デザインシステムを取得しています...', 'info');
                
                vscode.postMessage({
                    type: 'extractDesignSystem',
                    data: { url }
                });
            }
            
            function showAnalysisStatus(message, type = 'info') {
                const resultsDiv = document.getElementById('analysis-results');
                const contentDiv = document.getElementById('analysis-content');
                
                contentDiv.innerHTML = \`<div class="status-message \${type}">\${message}</div>\`;
                resultsDiv.style.display = 'block';
            }
            
            function displayAnalysisResults(data) {
                const contentDiv = document.getElementById('analysis-content');
                
                let html = '<div class="analysis-result">';
                html += \`<h4>🌐 \${data.url}</h4>\`;
                
                // カラーパレット表示
                if (data.design && data.design.colorPalette) {
                    html += '<div class="color-palette">';
                    html += '<h5>カラーパレット:</h5>';
                    data.design.colorPalette.forEach(color => {
                        html += \`<span class="color-swatch" style="background-color: \${color}; display: inline-block; width: 30px; height: 30px; margin: 2px; border: 1px solid #ccc;" title="\${color}"></span>\`;
                    });
                    html += '</div>';
                }
                
                // コンポーネント表示
                if (data.components) {
                    html += '<div class="components-section">';
                    html += '<h5>抽出されたコンポーネント:</h5>';
                    
                    Object.keys(data.components).forEach(componentType => {
                        if (data.components[componentType].length > 0) {
                            html += \`<h6>\${componentType}:</h6>\`;
                            data.components[componentType].forEach((component, index) => {
                                html += \`
                                    <div class="component-preview">
                                        <div class="component-html">\${component.html}</div>
                                        <button onclick="applyComponentStyle('\${componentType}', \${index})">このスタイルを適用</button>
                                    </div>
                                \`;
                            });
                        }
                    });
                    html += '</div>';
                }
                
                html += '</div>';
                contentDiv.innerHTML = html;
            }
            
            function applyComponentStyle(componentType, index) {
                // 選択されたコンポーネントスタイルをモックアップに適用
                vscode.postMessage({
                    type: 'applyComponentStyle',
                    data: { componentType, index }
                });
            }
            
            // デザインシステム選択の処理
            document.getElementById('design-system').addEventListener('change', function() {
                const customUrl = document.getElementById('custom-design-system-url');
                if (this.value === 'custom') {
                    customUrl.style.display = 'block';
                } else {
                    customUrl.style.display = 'none';
                }
            });
            
            // メッセージ受信処理の拡張
            window.addEventListener('message', event => {
                const message = event.data;
                
                switch (message.type) {
                    // 既存のケース...
                    case 'analysisStarted':
                    case 'competitorAnalysisStarted':
                        showAnalysisStatus(message.message, 'info');
                        break;
                    case 'analysisCompleted':
                        displayAnalysisResults(message.data);
                        break;
                    case 'competitorAnalysisCompleted':
                        displayCompetitorAnalysisResults(message.data);
                        break;
                    case 'analysisError':
                    case 'competitorAnalysisError':
                        showAnalysisStatus(message.message, 'error');
                        break;
                }
            });
            
            function displayCompetitorAnalysisResults(results) {
                const contentDiv = document.getElementById('analysis-content');
                
                let html = '<div class="competitor-analysis-results">';
                html += '<h4>📊 競合サイト分析結果</h4>';
                
                results.forEach((result, index) => {
                    html += \`
                        <div class="competitor-result">
                            <h5>サイト \${index + 1}: \${result.url}</h5>
                            <div class="competitor-summary">
                                <p>主要カラー: \${result.design.colorPalette ? result.design.colorPalette.slice(0, 3).join(', ') : 'N/A'}</p>
                                <p>レスポンシブ: \${result.layout.responsive ? 'Yes' : 'No'}</p>
                                <button onclick="viewDetailedAnalysis(\${index})">詳細を表示</button>
                            </div>
                        </div>
                    \`;
                });
                
                html += '</div>';
                contentDiv.innerHTML = html;
            }
        </script>
    </body>
    </html>`;
  }
}
```

## Phase 2 実装スケジュール

### Week 1: UI分析基盤
- [ ] `UIAnalysisService` 実装
- [ ] ブラウザエージェント用プロンプト作成
- [ ] 基本的なWebサイト分析機能

### Week 2: モックアップデザイナー統合
- [ ] 分析結果表示UI
- [ ] コンポーネント抽出機能
- [ ] カラーパレット表示

### Week 3: 高度な分析機能
- [ ] 競合サイト一括分析
- [ ] デザインシステム情報取得
- [ ] 分析結果のモックアップ適用

### Week 4: 最適化・テスト
- [ ] パフォーマンス最適化
- [ ] エラーハンドリング強化
- [ ] ユーザビリティテスト

---

## Phase 3: 新しいブラウザアシスタントパネル作成

### 3.1 統合ブラウザアシスタントパネル

#### `BrowserAssistantPanel.ts`
```typescript
// src/ui/browserAssistant/BrowserAssistantPanel.ts
import * as vscode from 'vscode';
import { ProtectedPanel } from '../auth/ProtectedPanel';
import { Feature } from '../../core/auth/roles';
import { BrowserAutomationService } from '../../services/BrowserAutomationService';
import { UIAnalysisService } from '../../services/UIAnalysisService';

export class BrowserAssistantPanel extends ProtectedPanel {
  public static currentPanel: BrowserAssistantPanel | undefined;
  private static readonly viewType = 'browserAssistant';
  protected static readonly _feature: Feature = Feature.BROWSER_ASSISTANT;

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private browserService: BrowserAutomationService;
  private uiAnalysisService: UIAnalysisService;

  protected static _createOrShowPanel(extensionUri: vscode.Uri): BrowserAssistantPanel {
    const column = vscode.window.activeTextEditor?.viewColumn;

    if (BrowserAssistantPanel.currentPanel) {
      BrowserAssistantPanel.currentPanel._panel.reveal(column);
      return BrowserAssistantPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      BrowserAssistantPanel.viewType,
      '🌐 ブラウザアシスタント',
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

    BrowserAssistantPanel.currentPanel = new BrowserAssistantPanel(panel, extensionUri);
    return BrowserAssistantPanel.currentPanel;
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    super();
    this._panel = panel;
    this._extensionUri = extensionUri;
    this.browserService = BrowserAutomationService.getInstance();
    this.uiAnalysisService = new UIAnalysisService();

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
      case 'executeCustomTask':
        await this._handleCustomTask(message.data);
        break;
      case 'startLiveTesting':
        await this._handleLiveTesting(message.data);
        break;
      case 'automateDeployment':
        await this._handleDeploymentAutomation(message.data);
        break;
      case 'performQACheck':
        await this._handleQACheck(message.data);
        break;
    }
  }

  private async _handleCustomTask(data: {
    description: string;
    targetUrl?: string;
    platform?: string;
  }): Promise<void> {
    try {
      this._panel.webview.postMessage({
        type: 'taskStarted',
        message: 'カスタムタスクを実行しています...'
      });

      const result = await this.browserService.executeBrowserTask({
        id: `custom_${Date.now()}`,
        type: 'environment_setup', // または適切なタイプ
        target: data.targetUrl || data.platform || 'general',
        instructions: data.description
      });

      this._panel.webview.postMessage({
        type: 'taskCompleted',
        data: result
      });
    } catch (error) {
      this._panel.webview.postMessage({
        type: 'taskError',
        message: `タスク実行エラー: ${error}`
      });
    }
  }

  private async _handleLiveTesting(data: {
    appUrl: string;
    testScenarios: string[];
  }): Promise<void> {
    // ライブアプリケーションのテスト実行
    // 実装詳細...
  }

  private async _handleDeploymentAutomation(data: {
    platform: string;
    projectPath: string;
    config: Record<string, any>;
  }): Promise<void> {
    // デプロイメント自動化
    // 実装詳細...
  }

  private async _handleQACheck(data: {
    targetUrl: string;
    checkTypes: string[];
  }): Promise<void> {
    // 品質保証チェック
    // 実装詳細...
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ブラウザアシスタント</title>
        <style>
            body {
                font-family: var(--vscode-font-family);
                color: var(--vscode-foreground);
                background-color: var(--vscode-editor-background);
                padding: 20px;
                line-height: 1.6;
            }
            .dashboard {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .card {
                background-color: var(--vscode-panel-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                padding: 20px;
                transition: transform 0.2s;
            }
            .card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .card h3 {
                margin-top: 0;
                color: var(--vscode-textLink-foreground);
            }
            .card-icon {
                font-size: 2em;
                margin-bottom: 10px;
            }
            .action-button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
                width: 100%;
            }
            .action-button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            .input-group {
                margin-bottom: 15px;
            }
            .input-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            .input-group input,
            .input-group textarea,
            .input-group select {
                width: 100%;
                padding: 8px;
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                border-radius: 4px;
            }
            .status-area {
                margin-top: 20px;
                padding: 15px;
                background-color: var(--vscode-textBlockQuote-background);
                border-left: 4px solid var(--vscode-textBlockQuote-border);
                border-radius: 4px;
                display: none;
            }
            .task-history {
                margin-top: 30px;
            }
            .task-item {
                background-color: var(--vscode-list-hoverBackground);
                padding: 10px;
                margin-bottom: 10px;
                border-radius: 4px;
                border-left: 3px solid var(--vscode-textLink-foreground);
            }
        </style>
    </head>
    <body>
        <h1>🌐 ブラウザアシスタント</h1>
        <p>AIがブラウザを操作して、様々なタスクを自動化します。</p>

        <div class="dashboard">
            <div class="card">
                <div class="card-icon">⚙️</div>
                <h3>環境設定自動化</h3>
                <p>クラウドサービスの環境変数やAPIキーを自動設定</p>
                <div class="input-group">
                    <label for="env-platform">プラットフォーム:</label>
                    <select id="env-platform">
                        <option value="aws">AWS</option>
                        <option value="gcp">Google Cloud</option>
                        <option value="vercel">Vercel</option>
                        <option value="netlify">Netlify</option>
                    </select>
                </div>
                <button class="action-button" onclick="openEnvironmentSetup()">環境設定を開始</button>
            </div>

            <div class="card">
                <div class="card-icon">🎨</div>
                <h3>UI/UX分析</h3>
                <p>競合サイトやデザインシステムを分析してインスピレーションを取得</p>
                <div class="input-group">
                    <label for="analysis-url">分析対象URL:</label>
                    <input type="url" id="analysis-url" placeholder="https://example.com">
                </div>
                <button class="action-button" onclick="startUIAnalysis()">UI分析を開始</button>
            </div>

            <div class="card">
                <div class="card-icon">🚀</div>
                <h3>デプロイメント自動化</h3>
                <p>アプリケーションのデプロイメントプロセスを自動化</p>
                <div class="input-group">
                    <label for="deploy-platform">デプロイ先:</label>
                    <select id="deploy-platform">
                        <option value="vercel">Vercel</option>
                        <option value="netlify">Netlify</option>
                        <option value="heroku">Heroku</option>
                        <option value="gcp">Google Cloud Run</option>
                    </select>
                </div>
                <button class="action-button" onclick="startDeployment()">デプロイを開始</button>
            </div>

            <div class="card">
                <div class="card-icon">🔍</div>
                <h3>ライブテスト</h3>
                <p>デプロイされたアプリケーションの動作テストを実行</p>
                <div class="input-group">
                    <label for="test-url">テスト対象URL:</label>
                    <input type="url" id="test-url" placeholder="https://your-app.com">
                </div>
                <button class="action-button" onclick="startLiveTesting()">ライブテストを開始</button>
            </div>

            <div class="card">
                <div class="card-icon">✅</div>
                <h3>品質保証チェック</h3>
                <p>アクセシビリティ、パフォーマンス、SEOの自動チェック</p>
                <div class="input-group">
                    <label for="qa-url">チェック対象URL:</label>
                    <input type="url" id="qa-url" placeholder="https://your-app.com">
                </div>
                <button class="action-button" onclick="startQACheck()">品質チェックを開始</button>
            </div>

            <div class="card">
                <div class="card-icon">🛠️</div>
                <h3>カスタムタスク</h3>
                <p>自由にブラウザ操作タスクを定義して実行</p>
                <div class="input-group">
                    <label for="custom-task">タスクの説明:</label>
                    <textarea id="custom-task" rows="3" 
                              placeholder="例: GitHubでリポジトリを作成してWebhookを設定"></textarea>
                </div>
                <button class="action-button" onclick="executeCustomTask()">カスタムタスクを実行</button>
            </div>
        </div>

        <div id="status" class="status-area">
            <div id="status-message"></div>
            <div id="status-progress"></div>
        </div>

        <div class="task-history">
            <h2>📋 タスク履歴</h2>
            <div id="task-history-list">
                <!-- タスク履歴がここに表示される -->
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            let taskHistory = [];

            function openEnvironmentSetup() {
                const platform = document.getElementById('env-platform').value;
                
                vscode.postMessage({
                    type: 'openEnvironmentSetup',
                    data: { platform }
                });
            }

            function startUIAnalysis() {
                const url = document.getElementById('analysis-url').value;
                
                if (!url) {
                    alert('分析対象のURLを入力してください');
                    return;
                }

                showStatus('UI分析を開始しています...', 'info');
                addTaskToHistory('UI分析', url, 'running');

                vscode.postMessage({
                    type: 'startUIAnalysis',
                    data: { url }
                });
            }

            function startDeployment() {
                const platform = document.getElementById('deploy-platform').value;
                
                showStatus('デプロイメントを開始しています...', 'info');
                addTaskToHistory('デプロイメント', platform, 'running');

                vscode.postMessage({
                    type: 'automateDeployment',
                    data: { 
                        platform,
                        projectPath: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
                    }
                });
            }

            function startLiveTesting() {
                const url = document.getElementById('test-url').value;
                
                if (!url) {
                    alert('テスト対象のURLを入力してください');
                    return;
                }

                showStatus('ライブテストを開始しています...', 'info');
                addTaskToHistory('ライブテスト', url, 'running');

                vscode.postMessage({
                    type: 'startLiveTesting',
                    data: { 
                        appUrl: url,
                        testScenarios: ['basic_navigation', 'form_submission', 'responsive_check']
                    }
                });
            }

            function startQACheck() {
                const url = document.getElementById('qa-url').value;
                
                if (!url) {
                    alert('チェック対象のURLを入力してください');
                    return;
                }

                showStatus('品質チェックを開始しています...', 'info');
                addTaskToHistory('品質チェック', url, 'running');

                vscode.postMessage({
                    type: 'performQACheck',
                    data: { 
                        targetUrl: url,
                        checkTypes: ['accessibility', 'performance', 'seo', 'security']
                    }
                });
            }

            function executeCustomTask() {
                const description = document.getElementById('custom-task').value;
                
                if (!description) {
                    alert('タスクの説明を入力してください');
                    return;
                }

                showStatus('カスタムタスクを実行しています...', 'info');
                addTaskToHistory('カスタムタスク', description, 'running');

                vscode.postMessage({
                    type: 'executeCustomTask',
                    data: { description }
                });
            }

            function showStatus(message, type = 'info') {
                const statusDiv = document.getElementById('status');
                const messageDiv = document.getElementById('status-message');
                
                messageDiv.textContent = message;
                statusDiv.style.display = 'block';
                
                if (type === 'error') {
                    statusDiv.style.borderLeftColor = 'var(--vscode-errorForeground)';
                } else if (type === 'success') {
                    statusDiv.style.borderLeftColor = 'var(--vscode-terminal-ansiGreen)';
                } else {
                    statusDiv.style.borderLeftColor = 'var(--vscode-textBlockQuote-border)';
                }
            }

            function addTaskToHistory(taskType, target, status) {
                const task = {
                    id: Date.now(),
                    type: taskType,
                    target: target,
                    status: status,
                    timestamp: new Date().toLocaleString()
                };
                
                taskHistory.unshift(task);
                updateTaskHistoryDisplay();
            }

            function updateTaskHistoryDisplay() {
                const historyList = document.getElementById('task-history-list');
                
                if (taskHistory.length === 0) {
                    historyList.innerHTML = '<p>まだタスクの履歴がありません。</p>';
                    return;
                }

                let html = '';
                taskHistory.slice(0, 10).forEach(task => {
                    const statusIcon = task.status === 'completed' ? '✅' : 
                                     task.status === 'error' ? '❌' : '🔄';
                    
                    html += \`
                        <div class="task-item">
                            <strong>\${statusIcon} \${task.type}</strong>
                            <div>対象: \${task.target}</div>
                            <div>実行時刻: \${task.timestamp}</div>
                        </div>
                    \`;
                });
                
                historyList.innerHTML = html;
            }

            function updateTaskStatus(taskId, status, result) {
                const task = taskHistory.find(t => t.id === taskId);
                if (task) {
                    task.status = status;
                    task.result = result;
                    updateTaskHistoryDisplay();
                }
            }

            // メッセージ受信処理
            window.addEventListener('message', event => {
                const message = event.data;
                
                switch (message.type) {
                    case 'taskStarted':
                        showStatus(message.message, 'info');
                        break;
                    case 'taskCompleted':
                        showStatus('タスクが完了しました', 'success');
                        // タスク履歴の更新
                        break;
                    case 'taskError':
                        showStatus(message.message, 'error');
                        break;
                }
            });

            // 初期化
            updateTaskHistoryDisplay();
        </script>
    </body>
    </html>`;
  }

  private _update(): void {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  public dispose(): void {
    BrowserAssistantPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
```

### 3.2 権限管理の拡張

#### `roles.ts` への追加
```typescript
// src/core/auth/roles.ts に追加
export enum Feature {
  // 既存の機能...
  BROWSER_ASSISTANT = 'browser_assistant',
  ENVIRONMENT_VARIABLES = 'environment_variables',
  UI_ANALYSIS = 'ui_analysis',
  DEPLOYMENT_AUTOMATION = 'deployment_automation',
  LIVE_TESTING = 'live_testing',
  QA_AUTOMATION = 'qa_automation'
}
```

### 3.3 統合コマンドの追加

#### `package.json` への追加
```json
{
  "contributes": {
    "commands": [
      {
        "command": "appgenius-ai.openBrowserAssistant",
        "title": "AppGenius AI: ブラウザアシスタントを開く",
        "icon": "$(globe)"
      },
      {
        "command": "appgenius-ai.quickEnvironmentSetup",
        "title": "AppGenius AI: クイック環境設定"
      },
      {
        "command": "appgenius-ai.analyzeCurrentWebsite",
        "title": "AppGenius AI: 現在のWebサイトを分析"
      },
      {
        "command": "appgenius-ai.automateDeployment",
        "title": "AppGenius AI: デプロイメント自動化"
      }
    ],
    "menus": {
      "commandPalette": [
        {
          "command": "appgenius-ai.openBrowserAssistant",
          "when": "config.appgeniusAI.browserAutomation.enabled"
        }
      ],
      "view/title": [
        {
          "command": "appgenius-ai.openBrowserAssistant",
          "group": "navigation",
          "when": "view == appgenius-tools"
        }
      ]
    }
  }
}
```

## Phase 3 実装スケジュール

### Week 1: 統合パネル基盤
- [ ] `BrowserAssistantPanel` 基本実装
- [ ] 権限管理システム統合
- [ ] ダッシュボードUI作成

### Week 2: 高度な自動化機能
- [ ] ライブテスト機能
- [ ] デプロイメント自動化
- [ ] 品質保証チェック

### Week 3: ユーザビリティ向上
- [ ] タスク履歴管理
- [ ] プログレス表示
- [ ] エラー回復機能

### Week 4: 最終統合・テスト
- [ ] 全機能の統合テスト
- [ ] パフォーマンス最適化
- [ ] ドキュメント完成

---

## 全体実装ロードマップ

### 総開発期間: 12週間

**Phase 1 (Week 1-4)**: 環境変数アシスタント
**Phase 2 (Week 5-8)**: モックアップデザイナー拡張
**Phase 3 (Week 9-12)**: 統合ブラウザアシスタント

### 技術的要件
- Node.js 16+
- TypeScript 4.5+
- VSCode Extension API 1.80+
- ブルーランプCLI (OpenHands)

### 依存関係
- `puppeteer` または `playwright` (ブラウザ自動化)
- `sharp` (画像処理)
- `cheerio` (HTML解析)
- `color-thief` (カラーパレット抽出)

この実装計画により、ブルーランプVSCode拡張機能は業界初の「AI駆動ブラウザ自動化統合開発環境」となり、開発者の生産性を劇的に向上させることができます。