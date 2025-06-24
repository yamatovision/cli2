# BlueLamp CLI マルチエージェントシステム 実装計画書

**バージョン**: 3.0.0
**作成日**: 2025-06-23
**実装期間**: 4-6週間（段階的）
**前回失敗の教訓を活かした確実な実装戦略**

## 1. 実装戦略

### 1.1 段階的実装アプローチ

**なぜ段階的か？**
- 前回の失敗：一度に全機能を実装して破綻
- 今回の戦略：動作する最小システムから段階的拡張
- 各フェーズで動作確認とフィードバック収集

### 1.2 実装フェーズ概要

```
Phase 1 (1-2週間): 基本オーケストレーション
├── 動作する最小システム
├── 単一エージェント実行
└── 基本的な進捗表示

Phase 2 (1-2週間): 依存関係管理
├── エージェント間の順序制御
├── 共有コンテキスト管理
└── エラーハンドリング

Phase 3 (2週間): 自律的実行
├── 並列実行制御
├── 動的ワークフロー調整
└── Web UI統合
```

## 2. Phase 1: 基本オーケストレーション（1-2週間）

### 2.1 目標
**「動作する最小システム」の構築**
- ユーザーが入力 → 適切なエージェント選択 → 実行 → 結果表示

### 2.2 実装タスク

#### Week 1: 基盤構築
- [ ] **Day 1-2**: プロジェクト初期化
  ```bash
  npm init
  TypeScript設定
  基本的なディレクトリ構造作成
  ```

- [ ] **Day 3-4**: エージェントローダー実装
  ```typescript
  // 16agents/ からプロンプトを読み込み
  class AgentLoader {
    loadAgent(agentId: string): AgentPrompt
    listAvailableAgents(): AgentInfo[]
  }
  ```

- [ ] **Day 5-7**: 基本オーケストレーター実装
  ```typescript
  class BasicOrchestrator {
    analyzeUserInput(input: string): TaskAnalysis
    selectAgent(analysis: TaskAnalysis): AgentId
    executeAgent(agentId: AgentId, input: string): Promise<Result>
  }
  ```

#### Week 2: 統合とテスト
- [ ] **Day 8-10**: CLI インターフェース実装
  ```bash
  bluelamp "要件定義をしたい"
  # → ★1 要件定義エンジニアを実行
  ```

- [ ] **Day 11-12**: 進捗表示システム
  ```
  🟢 ★1 要件定義エンジニア
  ├── 分析中... ████████░░ 80%
  └── ETA: 30秒
  ```

- [ ] **Day 13-14**: 統合テストと調整

### 2.3 Phase 1 成果物

```
bluelamp-cli/
├── src/
│   ├── orchestrator/
│   │   └── basicOrchestrator.ts    ✅ 実装完了
│   ├── agents/
│   │   ├── agentLoader.ts          ✅ 実装完了
│   │   └── agentRunner.ts          ✅ 実装完了
│   ├── tools/
│   │   └── progressDisplay.ts      ✅ 実装完了
│   └── cli.ts                      ✅ 実装完了
├── 16agents/ -> ../16agents/       ✅ シンボリックリンク
└── package.json                    ✅ 実装完了
```

### 2.4 Phase 1 検証基準

- [ ] `bluelamp "要件定義したい"` で ★1 エージェントが実行される
- [ ] 進捗が視覚的に表示される
- [ ] 結果が `results/` ディレクトリに保存される
- [ ] エラー時に適切なメッセージが表示される

## 3. Phase 2: 依存関係管理（1-2週間）

### 3.1 目標
**エージェント間の協調動作の実現**
- 依存関係に基づく順次実行
- エージェント間のコンテキスト共有

### 3.2 実装タスク

#### Week 3: 依存関係エンジン
- [ ] **Day 15-17**: 依存関係定義システム
  ```json
  // config/workflows.json
  {
    "basic-development": {
      "★1": { "dependencies": [] },
      "★2": { "dependencies": ["★1"] },
      "★3": { "dependencies": ["★1"] },
      "★4": { "dependencies": ["★1", "★3"] }
    }
  }
  ```

- [ ] **Day 18-19**: タスクキューシステム
  ```typescript
  class TaskQueue {
    addTask(task: Task): void
    getReadyTasks(): Task[]
    markCompleted(taskId: string): void
  }
  ```

- [ ] **Day 20-21**: コンテキスト管理システム
  ```typescript
  class ContextManager {
    saveAgentOutput(agentId: string, output: any): void
    getSharedContext(): SharedContext
    updateProjectState(updates: StateUpdate[]): void
  }
  ```

#### Week 4: 統合と最適化
- [ ] **Day 22-24**: ワークフローエンジン実装
  ```typescript
  class WorkflowEngine {
    executeWorkflow(workflowName: string, input: string): Promise<WorkflowResult>
    pauseWorkflow(): void
    resumeWorkflow(): void
  }
  ```

- [ ] **Day 25-26**: エラーハンドリングと復旧
- [ ] **Day 27-28**: 統合テストと性能調整

### 3.3 Phase 2 成果物

```
bluelamp-cli/
├── src/
│   ├── orchestrator/
│   │   ├── workflowEngine.ts       ✅ 新規実装
│   │   └── dependencyResolver.ts   ✅ 新規実装
│   ├── agents/
│   │   └── contextManager.ts       ✅ 新規実装
│   ├── queue/
│   │   └── taskQueue.ts            ✅ 新規実装
│   └── state/
│       └── projectState.ts         ✅ 新規実装
├── config/
│   └── workflows.json              ✅ 新規作成
└── results/                        ✅ 結果保存ディレクトリ
```

### 3.4 Phase 2 検証基準

- [ ] `bluelamp --workflow=basic-dev "新プロジェクト"` で複数エージェントが順次実行
- [ ] ★1完了後に★2と★3が並列で開始される
- [ ] エージェント間でファイルやデータが共有される
- [ ] 中断・再開機能が動作する

## 4. Phase 3: 自律的実行（2週間）

### 4.1 目標
**OpenHandsライクな自律的システムの実現**
- 並列実行制御
- 動的ワークフロー調整
- Web UI統合

### 4.2 実装タスク

#### Week 5: 並列実行システム
- [ ] **Day 29-31**: 並列実行エンジン
  ```typescript
  class ParallelExecutor {
    executeParallel(tasks: Task[]): Promise<Result[]>
    manageResources(): void
    handleConcurrency(): void
  }
  ```

- [ ] **Day 32-33**: 動的ワークフロー調整
  ```typescript
  class DynamicWorkflow {
    adjustWorkflow(currentState: State, newRequirements: Requirements): Workflow
    optimizeExecution(performance: PerformanceMetrics): void
  }
  ```

- [ ] **Day 34-35**: リアルタイム進捗システム

#### Week 6: UI統合と最終調整
- [ ] **Day 36-38**: Web UI実装
  ```
  http://localhost:3000/dashboard
  ├── リアルタイム進捗表示
  ├── エージェント状態監視
  └── 手動介入機能
  ```

- [ ] **Day 39-40**: 最終統合テスト
- [ ] **Day 41-42**: ドキュメント整備とリリース準備

### 4.3 Phase 3 成果物

```
bluelamp-cli/
├── src/
│   ├── parallel/
│   │   └── parallelExecutor.ts     ✅ 新規実装
│   ├── dynamic/
│   │   └── dynamicWorkflow.ts      ✅ 新規実装
│   └── ui/
│       ├── webServer.ts            ✅ 新規実装
│       └── dashboard/              ✅ 新規実装
├── web/                            ✅ Web UI
└── dist/                           ✅ ビルド出力
```

## 5. 技術実装詳細

### 5.1 コア技術スタック

```json
{
  "dependencies": {
    "commander": "^11.0.0",      // CLI引数解析
    "inquirer": "^9.2.0",        // インタラクティブプロンプト
    "chalk": "^5.3.0",           // カラー出力
    "ora": "^7.0.0",             // スピナー表示
    "axios": "^1.5.0",           // HTTP通信
    "ws": "^8.14.0",             // WebSocket（リアルタイム通信）
    "express": "^4.18.0",        // Web UI サーバー
    "chokidar": "^3.5.0"         // ファイル監視
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### 5.2 ファイル操作ツール実装

```typescript
// ClaudeCodeライクなツール群
class FileOperationTools {
  async readFile(path: string): Promise<string> {
    // ファイル読み込み + エラーハンドリング
  }

  async writeFile(path: string, content: string): Promise<void> {
    // ファイル書き込み + バックアップ
  }

  async editFile(path: string, changes: EditChange[]): Promise<void> {
    // 部分編集 + 差分管理
  }

  async searchFiles(pattern: string, directory?: string): Promise<FileMatch[]> {
    // ファイル検索 + 内容検索
  }

  async executeCommand(command: string, options?: ExecOptions): Promise<CommandResult> {
    // コマンド実行 + 出力キャプチャ
  }
}
```

### 5.3 エージェント実行システム

```typescript
class AgentRunner {
  async runAgent(agentId: string, input: string, context: SharedContext): Promise<AgentResult> {
    // 1. プロンプト読み込み
    const prompt = await this.agentLoader.loadAgent(agentId)

    // 2. コンテキスト構築
    const fullPrompt = this.buildPrompt(prompt, input, context)

    // 3. Claude API実行
    const response = await this.claudeApi.chat(fullPrompt, {
      tools: this.fileTools.getToolDefinitions()
    })

    // 4. ツール実行
    const result = await this.executeTools(response.toolCalls)

    // 5. 結果保存
    await this.saveResult(agentId, result)

    return result
  }
}
```

## 6. テスト戦略

### 6.1 テストピラミッド

```
E2E Tests (10%)
├── 完全なワークフロー実行テスト
└── ユーザーシナリオテスト

Integration Tests (30%)
├── エージェント間連携テスト
├── ファイル操作統合テスト
└── API統合テスト

Unit Tests (60%)
├── 個別クラス・関数テスト
├── ルールエンジンテスト
└── ユーティリティテスト
```

### 6.2 各フェーズのテスト

#### Phase 1 テスト
```bash
npm test:unit          # 単体テスト
npm test:integration   # 統合テスト
npm test:cli          # CLI動作テスト
```

#### Phase 2 テスト
```bash
npm test:workflow     # ワークフローテスト
npm test:dependency   # 依存関係テスト
npm test:context      # コンテキスト共有テスト
```

#### Phase 3 テスト
```bash
npm test:parallel     # 並列実行テスト
npm test:ui          # Web UIテスト
npm test:e2e         # エンドツーエンドテスト
```

## 7. リスク管理と対策

### 7.1 技術的リスク

| リスク | 影響度 | 対策 | 担当フェーズ |
|--------|--------|------|-------------|
| コンテキスト制約 | 高 | セッション分割、要約機能 | Phase 2 |
| パフォーマンス劣化 | 中 | 非同期処理、キャッシュ | Phase 3 |
| エージェント整合性 | 高 | バリデーション、状態管理 | Phase 2 |
| UI複雑化 | 低 | シンプル設計、段階的実装 | Phase 3 |

### 7.2 プロジェクトリスク

| リスク | 影響度 | 対策 | 監視指標 |
|--------|--------|------|----------|
| 開発遅延 | 中 | バッファ期間、MVP重視 | 週次進捗 |
| 実用性不足 | 高 | ユーザーテスト、フィードバック | 各フェーズ終了時 |
| 複雑さ増大 | 中 | 段階的実装、リファクタリング | コード品質メトリクス |

## 8. 成功指標とマイルストーン

### 8.1 Phase 1 成功指標
- [ ] 単一エージェント実行成功率 > 95%
- [ ] 平均応答時間 < 30秒
- [ ] エラー時の適切なメッセージ表示 100%

### 8.2 Phase 2 成功指標
- [ ] 依存関係解決成功率 > 90%
- [ ] エージェント間データ共有成功率 > 95%
- [ ] 中断・再開機能動作率 > 90%

### 8.3 Phase 3 成功指標
- [ ] 並列実行効率 > 70%（シーケンシャル比）
- [ ] Web UI応答性 < 2秒
- [ ] 全体システム安定性 > 95%

## 9. 次のアクション

### 9.1 即座に開始すべきタスク
1. **プロジェクト初期化** (今日)
   ```bash
   cd bluelamp-cli
   npm init -y
   npm install typescript @types/node --save-dev
   ```

2. **基本構造作成** (明日)
   ```bash
   mkdir -p src/{orchestrator,agents,tools,types}
   touch src/cli.ts
   ```

3. **最初のエージェントローダー実装** (今週中)

### 9.2 週次レビューポイント
- **Week 1**: 基盤構築完了確認
- **Week 2**: Phase 1 動作確認
- **Week 3**: 依存関係システム確認
- **Week 4**: Phase 2 統合確認
- **Week 5**: 並列実行確認
- **Week 6**: 最終リリース準備

---

この実装計画書は、前回の失敗を踏まえた現実的で段階的なアプローチを採用しています。各フェーズで確実に動作するシステムを構築し、段階的に機能を拡張していきます。
