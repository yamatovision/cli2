# オーケストレーターのAIアーキテクチャとコンテキスト管理

## 核心的な質問：「オーケストレーター自体は誰が判断しているのか？」

### 実は3つのアプローチがある

## 1. ルールベース + AI ハイブリッド方式（現実的）

```typescript
class HybridOrchestrator {
  // ルールベース：タスクの依存関係は事前定義
  private taskTemplates = {
    "認証機能追加": {
      tasks: ["要件定義", "DB設計", "API設計", "実装"],
      dependencies: {
        "DB設計": ["要件定義"],
        "API設計": ["要件定義"],
        "実装": ["DB設計", "API設計"]
      }
    }
  };

  // AI：ユーザーの意図を理解してテンプレートを選択
  async analyzeUserIntent(input: string): Promise<string> {
    const prompt = `
      ユーザーリクエスト: ${input}

      以下のテンプレートから最適なものを選んでください：
      1. 認証機能追加
      2. CRUD機能追加
      3. UI改善
      4. バグ修正

      回答は番号のみ:
    `;

    // 小さなAI判断（コンテキスト消費少）
    const templateChoice = await this.askAI(prompt);
    return this.taskTemplates[templateChoice];
  }
}
```

## 2. メタAI方式（AIがAIを制御）

```typescript
class MetaAIOrchestrator {
  private orchestratorAI: Claude;  // オーケストレーター専用AI
  private agentAIs: Map<string, Claude>;  // 各エージェント用AI

  // オーケストレーターAIが全体を統括
  async executeRequest(userRequest: string) {
    // オーケストレーターAIのプロンプト（簡潔に）
    const orchestratorPrompt = `
      あなたはタスクマネージャーです。
      ユーザーリクエスト: ${userRequest}

      以下の形式でタスク分解してください：
      {
        "tasks": [
          {"id": "T1", "agent": "要件定義", "input": "..."},
          {"id": "T2", "agent": "DB設計", "depends_on": ["T1"]}
        ]
      }
    `;

    // タスク計画を生成（小さなコンテキスト）
    const plan = await this.orchestratorAI.generate(orchestratorPrompt);

    // 各エージェントAIを起動
    for (const task of plan.tasks) {
      await this.executeTask(task);
    }
  }

  // 各エージェントは独立したAIインスタンス
  async executeTask(task: Task) {
    const agentAI = this.agentAIs.get(task.agent);

    // エージェント専用のコンテキスト（分離）
    const agentPrompt = `
      あなたは${task.agent}エージェントです。
      タスク: ${task.input}
      依存データ: ${this.getTaskResults(task.depends_on)}

      実行してください。
    `;

    return await agentAI.generate(agentPrompt);
  }
}
```

## 3. コンテキスト効率化アーキテクチャ

### 問題：コンテキストウィンドウの制約
- Claude 3: 200kトークン
- 全エージェントで共有すると、すぐに枯渇

### 解決策：階層的コンテキスト管理

```typescript
class ContextEfficientOrchestrator {
  // レベル1: マスターコンテキスト（最小限）
  private masterContext = {
    projectOverview: "ECサイト開発",
    currentPhase: "認証機能追加",
    completedTasks: ["T1", "T2"]
  };

  // レベル2: エージェント固有コンテキスト
  private agentContexts = new Map<string, Context>();

  // レベル3: 共有メモリ（要約のみ）
  private sharedMemory = new SharedMemory();

  // コンテキストを効率的に管理
  async prepareAgentContext(agentId: string, task: Task): Promise<string> {
    // 必要最小限の情報のみ含める
    const context = {
      // マスター情報（要約）
      project: this.summarize(this.masterContext),

      // 依存タスクの結果（要約）
      dependencies: await this.getDependencySummaries(task.depends_on),

      // エージェント固有の履歴（最新のみ）
      history: this.agentContexts.get(agentId)?.getRecent(5),

      // 現在のタスク
      currentTask: task
    };

    // コンパクトなプロンプトを生成
    return this.buildCompactPrompt(context);
  }

  // 結果を要約して保存
  async saveResult(taskId: string, result: any) {
    // フル結果をファイルに保存
    await this.saveToFile(`results/${taskId}.json`, result);

    // 要約のみメモリに保持
    const summary = await this.summarizeResult(result);
    this.sharedMemory.set(taskId, summary);
  }
}
```

## 4. 実用的な実装パターン

### パターンA: シングルAI + ステートマシン
```typescript
class StateMachineOrchestrator {
  private state: OrchestratorState;
  private ai: Claude;

  async processUserRequest(request: string) {
    // Step 1: AIでタスク分解（1回のみ）
    const tasks = await this.ai.decomposeTasks(request);

    // Step 2: ステートマシンで実行管理（AIなし）
    const stateMachine = new TaskStateMachine(tasks);

    while (!stateMachine.isComplete()) {
      const nextTasks = stateMachine.getReadyTasks();

      // 並列実行
      await Promise.all(
        nextTasks.map(task => this.executeTask(task))
      );

      stateMachine.updateProgress();
    }
  }
}
```

### パターンB: 分散AI（各エージェントが独立）
```typescript
class DistributedAIOrchestrator {
  // 各エージェントが独自のAIセッション
  async executeWithIndependentAgents(request: string) {
    // 初期分解のみオーケストレーターAIが実行
    const taskOutline = await this.decomposeRequest(request);

    // 各エージェントが自律的に実行
    const agentPromises = taskOutline.map(async (task) => {
      const agent = new AutonomousAgent(task.type);

      // エージェントは自分のコンテキストで動作
      return await agent.executeAutonomously({
        task: task,
        sharedData: this.getMinimalSharedData()
      });
    });

    return await Promise.all(agentPromises);
  }
}
```

## 5. BlueLamp CLIでの実装提案

### 実用的アプローチ：軽量オーケストレーター + 専門エージェント

```typescript
export class BlueLampSmartOrchestrator {
  // 軽量な判断ロジック
  private decisionEngine = new LightweightDecisionEngine();

  async orchestrate(userRequest: string) {
    // 1. パターンマッチングで基本判断
    const pattern = this.matchRequestPattern(userRequest);

    // 2. 複雑な場合のみAIを使用
    let executionPlan;
    if (pattern.complexity > 0.7) {
      executionPlan = await this.askAIForPlan(userRequest);
    } else {
      executionPlan = this.useTemplatedPlan(pattern);
    }

    // 3. エージェントを効率的に実行
    return await this.executeWithMinimalContext(executionPlan);
  }

  // コンテキスト最小化戦略
  private async executeWithMinimalContext(plan: ExecutionPlan) {
    const results = new Map();

    for (const phase of plan.phases) {
      const phaseResults = await Promise.all(
        phase.tasks.map(async task => {
          // 必要な情報のみ渡す
          const minimalContext = {
            task: task.description,
            dependencies: this.extractEssentials(results, task.deps),
            constraints: task.constraints
          };

          // エージェントは独立して実行
          const agent = this.createAgent(task.agentType);
          return await agent.execute(minimalContext);
        })
      );

      // 結果を要約して保存
      phaseResults.forEach((result, i) => {
        results.set(phase.tasks[i].id, this.summarize(result));
      });
    }

    return results;
  }
}
```

## まとめ：現実的な実装方法

1. **オーケストレーター = 軽量な調整役**
   - 複雑な判断はしない
   - タスクの順序と依存関係を管理するだけ

2. **各エージェントが賢い**
   - 専門分野で自律的に判断
   - 独自のコンテキストで動作

3. **コンテキスト効率化**
   - 共有は最小限（要約のみ）
   - 各エージェントは必要な情報だけ受け取る
   - 結果はファイルに保存、メモリには要約のみ

4. **AIの使い分け**
   - 簡単な判断：ルールベース
   - 複雑な判断：AI（でも短いプロンプト）
   - 実行：各エージェントが独立してAI利用

これにより、コンテキストウィンドウの制約を回避しながら、自律的なマルチエージェントシステムを実現できます。
