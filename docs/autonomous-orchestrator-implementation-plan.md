# BlueLamp CLI 自律的オーケストレーター実装計画書

**作成日**: 2025-06-23
**バージョン**: 1.0
**対象**: 16エージェントプロンプトを活用したマルチエージェントシステム

## 1. プロジェクト概要

### 1.1 目標
16種類の専門エージェントプロンプト（`/16agents/`）を活用し、OpenHandsライクな自律的マルチエージェントシステムを構築する。

### 1.2 核心的な設計思想
- **ルールベースオーケストレーター**: コンテキスト消費を最小限に抑制
- **専門エージェントの自律性**: 各エージェントが独立したAIセッションで動作
- **階層的コンテキスト管理**: 200kトークン制約を効率的に回避
- **視覚的進捗表示**: リアルタイムでエージェント活動を可視化

## 2. アーキテクチャ設計

### 2.1 システム全体構成

```
┌─────────────────────────────────────────────────────────┐
│                BlueLamp Orchestrator                    │
│  ┌─────────────────┐  ┌─────────────────────────────────┐ │
│  │ Rule Engine     │  │ Context Manager                 │ │
│  │ (AI不使用)      │  │ - Session Rotation              │ │
│  │                 │  │ - Memory Optimization           │ │
│  └─────────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                Agent Dispatcher                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│  │ Task Queue  │ │ Dependency  │ │ Progress Tracker    │ │
│  │ Manager     │ │ Resolver    │ │                     │ │
│  └─────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                16 Specialized Agents                    │
│  ★1 要件定義    ★2 UIUX      ★3 データ    ★4 アーキ   │
│  ★5 実装計画    ★6 環境構築  ★7 プロトタイプ ★8 バックエンド │
│  ★9 テスト      ★10 API統合  ★11 デバッグ   ★12 デプロイ │
│  ★13 GitHub     ★14 TypeScript ★15 機能拡張 ★16 リファクタ │
└─────────────────────────────────────────────────────────┘
```

### 2.2 コンテキスト管理戦略

```typescript
interface ContextStrategy {
  // レベル1: マスターコンテキスト（5k tokens以下）
  masterContext: {
    projectType: string;
    currentPhase: string;
    completedTasks: string[];
  };

  // レベル2: エージェント固有セッション（150k tokens以下）
  agentSessions: Map<string, ClaudeSession>;

  // レベル3: タスク専用セッション（50k tokens以下）
  taskSessions: Map<string, ClaudeSession>;

  // レベル4: ファイルベース詳細データ
  fileStorage: FileBasedStorage;
}
```

## 3. 実装フェーズ

### Phase 1: 基盤構築（2週間）

#### 3.1.1 オーケストレーター基盤
```typescript
// src/orchestrator/core.ts
export class BlueLampOrchestrator {
  private ruleEngine: RuleBasedEngine;
  private contextManager: HierarchicalContextManager;
  private agentDispatcher: AgentDispatcher;
  private uiManager: MultiAgentUIManager;

  async orchestrate(userRequest: string): Promise<void> {
    // 1. ルールベース分析（AIなし）
    const analysis = await this.ruleEngine.analyze(userRequest);

    // 2. 実行計画生成
    const plan = this.createExecutionPlan(analysis);

    // 3. 自律的実行
    await this.executeAutonomously(plan);
  }
}
```

#### 3.1.2 ルールベースエンジン
```typescript
// src/orchestrator/rule-engine.ts
export class RuleBasedEngine {
  private workflowTemplates = new Map<string, WorkflowTemplate>();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // 新機能開発ワークフロー
    this.workflowTemplates.set('feature_development', {
      phases: [
        {
          name: 'Planning',
          agents: ['★1', '★2', '★3', '★4'],
          parallel: true
        },
        {
          name: 'Implementation',
          agents: ['★7', '★8'],
          parallel: true,
          dependencies: ['Planning']
        },
        {
          name: 'Integration',
          agents: ['★9', '★10'],
          parallel: true,
          dependencies: ['Implementation']
        },
        {
          name: 'Deployment',
          agents: ['★12', '★13'],
          parallel: true,
          dependencies: ['Integration']
        }
      ]
    });

    // バグ修正ワークフロー
    this.workflowTemplates.set('bug_fix', {
      phases: [
        {
          name: 'Investigation',
          agents: ['★11'],
          parallel: false
        },
        {
          name: 'Fix',
          agents: ['★16', '★14'],
          parallel: true,
          dependencies: ['Investigation']
        },
        {
          name: 'Verification',
          agents: ['★9'],
          parallel: false,
          dependencies: ['Fix']
        }
      ]
    });
  }

  analyze(userRequest: string): RuleAnalysis {
    // パターンマッチングで判断
    const patterns = [
      { regex: /新機能|機能追加|実装/, workflow: 'feature_development', confidence: 0.9 },
      { regex: /バグ|エラー|修正|デバッグ/, workflow: 'bug_fix', confidence: 0.85 },
      { regex: /リファクタ|改善|最適化/, workflow: 'refactoring', confidence: 0.8 },
      { regex: /デプロイ|リリース|公開/, workflow: 'deployment', confidence: 0.9 }
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(userRequest)) {
        return {
          workflow: pattern.workflow,
          confidence: pattern.confidence,
          template: this.workflowTemplates.get(pattern.workflow)
        };
      }
    }

    return { workflow: 'general', confidence: 0.5 };
  }
}
```

#### 3.1.3 階層的コンテキスト管理
```typescript
// src/orchestrator/context-manager.ts
export class HierarchicalContextManager {
  private masterContext: MasterContext;
  private agentSessions: Map<string, SessionPool> = new Map();
  private fileStorage: FileBasedStorage;

  async getOptimizedContext(agentId: string, task: Task): Promise<string> {
    // セッションプールから最適なセッションを取得
    const sessionPool = this.getOrCreateSessionPool(agentId);
    const session = await sessionPool.getAvailableSession();

    // 必要最小限のコンテキストを構築
    const context = {
      project: this.masterContext.getSummary(),
      task: task.description,
      dependencies: await this.getDependencySummaries(task.dependencies),
      agentHistory: session.getRecentHistory(3)
    };

    return this.buildCompactPrompt(context);
  }

  private getOrCreateSessionPool(agentId: string): SessionPool {
    if (!this.agentSessions.has(agentId)) {
      this.agentSessions.set(agentId, new SessionPool(agentId, 3)); // 最大3セッション
    }
    return this.agentSessions.get(agentId)!;
  }
}

class SessionPool {
  private sessions: ClaudeSession[] = [];
  private currentIndex = 0;
  private maxTokensPerSession = 150000;

  async getAvailableSession(): Promise<ClaudeSession> {
    const current = this.sessions[this.currentIndex];

    if (!current || current.tokenCount > this.maxTokensPerSession) {
      // 新しいセッションを作成
      const newSession = await this.createSessionWithContinuity();
      this.sessions[this.currentIndex] = newSession;

      // ローテーション
      this.currentIndex = (this.currentIndex + 1) % 3;

      return newSession;
    }

    return current;
  }

  private async createSessionWithContinuity(): Promise<ClaudeSession> {
    const session = new ClaudeSession();

    // 継続性のための要約を引き継ぎ
    if (this.sessions.length > 0) {
      const summary = await this.generateContinuitySummary();
      await session.initialize(summary);
    }

    return session;
  }
}
```

### Phase 2: エージェント統合（3週間）

#### 3.2.1 エージェント基底クラス
```typescript
// src/agents/base-agent.ts
export abstract class BaseAgent {
  protected agentId: string;
  protected promptTemplate: string;
  protected session: ClaudeSession;
  protected tools: Tool[];

  constructor(agentId: string, session: ClaudeSession) {
    this.agentId = agentId;
    this.session = session;
    this.promptTemplate = this.loadPromptTemplate();
    this.tools = this.initializeTools();
  }

  private loadPromptTemplate(): string {
    // /16agents/ フォルダからプロンプトを読み込み
    const promptPath = path.join(__dirname, '../../16agents', `${this.getPromptFileName()}`);
    return fs.readFileSync(promptPath, 'utf8');
  }

  abstract getPromptFileName(): string;

  async execute(task: Task, context: AgentContext): Promise<AgentResult> {
    try {
      // プロンプトを構築
      const prompt = this.buildPrompt(task, context);

      // Claude APIで実行
      const response = await this.session.generate({
        prompt,
        tools: this.tools,
        maxTokens: 40000
      });

      // 結果を処理
      return this.processResult(response);

    } catch (error) {
      return this.handleError(task, error);
    }
  }

  private buildPrompt(task: Task, context: AgentContext): string {
    return `
${this.promptTemplate}

## 現在のタスク
${task.description}

## プロジェクトコンテキスト
${context.projectSummary}

## 依存タスクの結果
${context.dependencies.map(dep => `- ${dep.summary}`).join('\n')}

## 実行してください
    `;
  }
}
```

#### 3.2.2 具体的エージェント実装
```typescript
// src/agents/requirements-engineer.ts
export class RequirementsEngineerAgent extends BaseAgent {
  getPromptFileName(): string {
    return '01-requirements-engineer.md';
  }

  protected initializeTools(): Tool[] {
    return [
      new ReadTool(),
      new WriteTool(),
      new EditTool()
    ];
  }
}

// src/agents/uiux-designer.ts
export class UIUXDesignerAgent extends BaseAgent {
  getPromptFileName(): string {
    return '02-uiux-designer.md';
  }

  protected initializeTools(): Tool[] {
    return [
      new ReadTool(),
      new WriteTool(),
      new EditTool(),
      new MockupGeneratorTool()
    ];
  }
}

// 他の14エージェントも同様に実装...
```

#### 3.2.3 エージェントディスパッチャー
```typescript
// src/orchestrator/agent-dispatcher.ts
export class AgentDispatcher {
  private agentFactory: AgentFactory;
  private contextManager: HierarchicalContextManager;
  private progressTracker: ProgressTracker;

  async dispatchToAgent(agentId: string, task: Task): Promise<AgentResult> {
    // 1. セッションを取得
    const session = await this.contextManager.getSessionForAgent(agentId);

    // 2. エージェントを作成
    const agent = this.agentFactory.createAgent(agentId, session);

    // 3. コンテキストを準備
    const context = await this.contextManager.getOptimizedContext(agentId, task);

    // 4. 進捗追跡開始
    this.progressTracker.startTask(task.id, agentId);

    // 5. エージェント実行
    const result = await agent.execute(task, context);

    // 6. 結果を保存
    await this.contextManager.saveResult(task.id, result);

    // 7. 進捗更新
    this.progressTracker.completeTask(task.id);

    return result;
  }

  async executePhaseInParallel(phase: Phase): Promise<AgentResult[]> {
    const tasks = phase.tasks.map(task =>
      this.dispatchToAgent(task.agentId, task)
    );

    return await Promise.all(tasks);
  }
}
```

### Phase 3: UI/UX実装（2週間）

#### 3.3.1 マルチエージェントUI
```typescript
// src/ui/multi-agent-ui.ts
export class MultiAgentUIManager {
  private runningAgents: Map<string, AgentStatus> = new Map();
  private updateInterval: NodeJS.Timeout;

  startDisplay(): void {
    this.updateInterval = setInterval(() => {
      this.renderAgentActivity();
    }, 1000);
  }

  private renderAgentActivity(): void {
    console.clear();
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  🚀 BlueLamp Multi-Agent System - Active Agents');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log();

    // アクティブなエージェントを表示
    const activeAgents = Array.from(this.runningAgents.entries())
      .filter(([_, status]) => status.isActive);

    if (activeAgents.length === 0) {
      console.log('  💤 No active agents');
      return;
    }

    // 2列レイアウトで表示
    for (let i = 0; i < activeAgents.length; i += 2) {
      const left = activeAgents[i];
      const right = activeAgents[i + 1];

      this.renderAgentPair(left, right);
    }

    // 全体進捗
    this.renderOverallProgress();
  }

  private renderAgentPair(left: [string, AgentStatus], right?: [string, AgentStatus]): void {
    const leftBox = this.createAgentBox(left[0], left[1]);
    const rightBox = right ? this.createAgentBox(right[0], right[1]) : this.createEmptyBox();

    // 2つのボックスを横並びで表示
    const leftLines = leftBox.split('\n');
    const rightLines = rightBox.split('\n');

    for (let i = 0; i < Math.max(leftLines.length, rightLines.length); i++) {
      const leftLine = leftLines[i] || ' '.repeat(40);
      const rightLine = rightLines[i] || ' '.repeat(40);
      console.log(`${leftLine}  ${rightLine}`);
    }
    console.log();
  }

  private createAgentBox(agentId: string, status: AgentStatus): string {
    const emoji = this.getStatusEmoji(status);
    const progress = Math.round(status.progress * 100);
    const progressBar = this.createProgressBar(status.progress);

    return `
┌─── ${emoji} ${status.name} ─────────────────────┐
│ Task: ${status.currentTask.substring(0, 30)}...   │
│ ${progressBar} ${progress}%                      │
│ ${status.lastAction.substring(0, 35)}...         │
│ Tokens: ${status.tokensUsed.toLocaleString()}    │
└──────────────────────────────────────────────┘`.trim();
  }

  private getStatusEmoji(status: AgentStatus): string {
    if (status.isComplete) return '✅';
    if (status.isRunning) return '🟢';
    if (status.hasError) return '❌';
    return '⏸️';
  }

  private createProgressBar(progress: number): string {
    const width = 20;
    const filled = Math.round(progress * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  private renderOverallProgress(): void {
    const total = this.runningAgents.size;
    const completed = Array.from(this.runningAgents.values())
      .filter(status => status.isComplete).length;

    console.log('─'.repeat(80));
    console.log(`📊 Overall Progress: ${completed}/${total} agents completed`);
    console.log('─'.repeat(80));
  }
}
```

#### 3.3.2 インタラクティブ制御
```typescript
// src/ui/interactive-controller.ts
export class InteractiveController {
  private orchestrator: BlueLampOrchestrator;
  private uiManager: MultiAgentUIManager;

  async startInteractiveSession(): Promise<void> {
    console.log('🚀 BlueLamp Multi-Agent System v3.0');
    console.log('=====================================');
    console.log();

    while (true) {
      const userInput = await this.promptUser();

      if (userInput.toLowerCase() === 'exit') {
        break;
      }

      if (userInput.toLowerCase() === 'status') {
        this.showDetailedStatus();
        continue;
      }

      // オーケストレーターで実行
      await this.orchestrator.orchestrate(userInput);
    }
  }

  private async promptUser(): Promise<string> {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      readline.question('You: ', (answer: string) => {
        readline.close();
        resolve(answer);
      });
    });
  }
}
```

### Phase 4: 高度な機能（3週間）

#### 3.4.1 学習と最適化
```typescript
// src/orchestrator/learning-engine.ts
export class LearningEngine {
  private executionHistory: ExecutionRecord[] = [];
  private performanceMetrics: Map<string, AgentMetrics> = new Map();

  recordExecution(record: ExecutionRecord): void {
    this.executionHistory.push(record);
    this.updateMetrics(record);
  }

  suggestOptimizations(): Optimization[] {
    const suggestions: Optimization[] = [];

    // 実行時間の分析
    const slowAgents = this.identifySlowAgents();
    for (const agent of slowAgents) {
      suggestions.push({
        type: 'performance',
        target: agent.id,
        suggestion: `${agent.name}の実行時間が平均より${agent.slowdownFactor}倍遅いです。プロンプトの最適化を検討してください。`
      });
    }

    // 依存関係の最適化
    const parallelizableSteps = this.identifyParallelizableSteps();
    for (const step of parallelizableSteps) {
      suggestions.push({
        type: 'parallelization',
        target: step.id,
        suggestion: `${step.name}は並列実行可能です。実行時間を${step.estimatedSpeedup}%短縮できます。`
      });
    }

    return suggestions;
  }
}
```

#### 3.4.2 エラーリカバリー
```typescript
// src/orchestrator/error-recovery.ts
export class ErrorRecoveryManager {
  private retryStrategies: Map<string, RetryStrategy> = new Map();

  constructor() {
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    // API制限エラー
    this.retryStrategies.set('rate_limit', {
      maxRetries: 5,
      backoffStrategy: 'exponential',
      baseDelay: 1000
    });

    // コンテキスト制限エラー
    this.retryStrategies.set('context_limit', {
      maxRetries: 3,
      backoffStrategy: 'immediate',
      recovery: 'context_reset'
    });

    // ツール実行エラー
    this.retryStrategies.set('tool_error', {
      maxRetries: 3,
      backoffStrategy: 'linear',
      baseDelay: 500
    });
  }

  async handleError(error: AgentError, context: ErrorContext): Promise<RecoveryResult> {
    const strategy = this.retryStrategies.get(error.type);

    if (!strategy) {
      return { success: false, reason: 'No recovery strategy found' };
    }

    for (let attempt = 1; attempt <= strategy.maxRetries; attempt++) {
      try {
        // リカバリー処理
        if (strategy.recovery === 'context_reset') {
          await this.resetAgentContext(context.agentId);
        }

        // 遅延
        if (strategy.baseDelay) {
          const delay = this.calculateDelay(strategy, attempt);
          await this.sleep(delay);
        }

        // 再試行
        const result = await context.retryFunction();

        return { success: true, result, attempts: attempt };

      } catch (retryError) {
        if (attempt === strategy.maxRetries) {
          return {
            success: false,
            reason: `Max retries (${strategy.maxRetries}) exceeded`,
            lastError: retryError
          };
        }
      }
    }
  }
}
```

## 4. 実装スケジュール

### 4.1 詳細タイムライン

| 週 | フェーズ | 主要成果物 | 担当者 |
|---|---------|-----------|--------|
| 1-2 | Phase 1 | オーケストレーター基盤、ルールエンジン、コンテキスト管理 | 開発者1 |
| 3-5 | Phase 2 | 16エージェント統合、ディスパッチャー、セッション管理 | 開発者1-2 |
| 6-7 | Phase 3 | マルチエージェントUI、インタラクティブ制御 | 開発者1 |
| 8-10 | Phase 4 | 学習エンジン、エラーリカバリー、最適化 | 開発者1-2 |

### 4.2 マイルストーン

- **Week 2**: 基本的なオーケストレーション動作確認
- **Week 5**: 16エージェント並列実行成功
- **Week 7**: 視覚的UI完成、デモ可能状態
- **Week 10**: 本格運用可能な完成版

## 5. 技術的考慮事項

### 5.1 パフォーマンス最適化
- **並列実行**: 依存関係のないタスクは並列実行
- **セッションプーリング**: エージェント毎に最大3セッション
- **コンテキスト圧縮**: 要約化による効率的なメモリ使用

### 5.2 エラーハンドリング
- **グレースフルデグラデーション**: 一部エージェント失敗時の継続実行
- **自動リトライ**: 指数バックオフによる再試行
- **代替エージェント**: 主要エージェント失敗時の代替実行

### 5.3 セキュリティ
- **プロンプトインジェクション対策**: 入力サニタイゼーション
- **API制限管理**: レート制限の監視と制御
- **機密情報保護**: ログからの機密情報除外

## 6. 期待される成果

### 6.1 定量的効果
- **開発効率**: 従来比300%向上（並列実行による）
- **品質向上**: 専門エージェントによる高品質な成果物
- **コスト削減**: 効率的なコンテキスト管理によるAPI料金最適化

### 6.2 定性的効果
- **ユーザー体験**: 視覚的で直感的な操作
- **透明性**: 各エージェントの活動が明確
- **拡張性**: 新しいエージェントの追加が容易

## 7. リスク管理

### 7.1 技術的リスク
| リスク | 影響度 | 対策 |
|--------|--------|------|
| コンテキスト制限 | 高 | 階層的管理、セッションローテーション |
| API制限 | 中 | レート制限監視、指数バックオフ |
| エージェント間競合 | 中 | ファイルロック、状態管理 |

### 7.2 運用リスク
| リスク | 影響度 | 対策 |
|--------|--------|------|
| 長時間実行 | 中 | 進捗表示、中断・再開機能 |
| メモリリーク | 低 | 定期的なセッションクリーンアップ |
| 設定ミス | 低 | 設定検証、デフォルト値設定 |

## 8. 次のステップ

1. **Phase 1開始**: オーケストレーター基盤の実装
2. **プロトタイプ作成**: 2-3エージェントでの動作確認
3. **段階的拡張**: 残りエージェントの順次統合
4. **ユーザーテスト**: 実際のプロジェクトでの検証

---

この実装計画により、BlueLamp CLIは単なるツールから真の「AI開発パートナー」へと進化し、OpenHandsと同等以上の自律的マルチエージェントシステムを実現できます。
