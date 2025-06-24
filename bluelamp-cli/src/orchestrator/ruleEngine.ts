import { UserInput, InputAnalysis, Task, ExecutionPlan, ExecutionPhase, AgentId, TaskType, TaskPriority } from '../types';
import { AgentLoader } from '../agents/agentLoader';

// 入力分析ルール
const INPUT_ANALYSIS_RULES = {
  keywords: {
    "要件定義": { agent: "★1", priority: "high" as TaskPriority, taskType: "requirements" as TaskType },
    "要件": { agent: "★1", priority: "high" as TaskPriority, taskType: "requirements" as TaskType },
    "仕様": { agent: "★1", priority: "high" as TaskPriority, taskType: "requirements" as TaskType },
    "モックアップ": { agent: "★2", priority: "medium" as TaskPriority, taskType: "design" as TaskType },
    "デザイン": { agent: "★2", priority: "medium" as TaskPriority, taskType: "design" as TaskType },
    "UI": { agent: "★2", priority: "medium" as TaskPriority, taskType: "design" as TaskType },
    "UX": { agent: "★2", priority: "medium" as TaskPriority, taskType: "design" as TaskType },
    "データベース": { agent: "★3", priority: "high" as TaskPriority, taskType: "design" as TaskType },
    "データモデル": { agent: "★3", priority: "high" as TaskPriority, taskType: "design" as TaskType },
    "スキーマ": { agent: "★3", priority: "high" as TaskPriority, taskType: "design" as TaskType },
    "アーキテクチャ": { agent: "★4", priority: "high" as TaskPriority, taskType: "design" as TaskType },
    "設計": { agent: "★4", priority: "high" as TaskPriority, taskType: "design" as TaskType },
    "実装": { agent: "★5", priority: "medium" as TaskPriority, taskType: "implementation" as TaskType },
    "開発": { agent: "★5", priority: "medium" as TaskPriority, taskType: "implementation" as TaskType },
    "環境構築": { agent: "★6", priority: "low" as TaskPriority, taskType: "implementation" as TaskType },
    "セットアップ": { agent: "★6", priority: "low" as TaskPriority, taskType: "implementation" as TaskType },
    "プロトタイプ": { agent: "★7", priority: "medium" as TaskPriority, taskType: "implementation" as TaskType },
    "バックエンド": { agent: "★8", priority: "high" as TaskPriority, taskType: "implementation" as TaskType },
    "サーバー": { agent: "★8", priority: "high" as TaskPriority, taskType: "implementation" as TaskType },
    "API": { agent: "★8", priority: "high" as TaskPriority, taskType: "implementation" as TaskType },
    "テスト": { agent: "★9", priority: "medium" as TaskPriority, taskType: "testing" as TaskType },
    "品質": { agent: "★9", priority: "medium" as TaskPriority, taskType: "testing" as TaskType },
    "統合": { agent: "★10", priority: "high" as TaskPriority, taskType: "integration" as TaskType },
    "連携": { agent: "★10", priority: "high" as TaskPriority, taskType: "integration" as TaskType },
    "デバッグ": { agent: "★11", priority: "urgent" as TaskPriority, taskType: "debugging" as TaskType },
    "エラー": { agent: "★11", priority: "urgent" as TaskPriority, taskType: "debugging" as TaskType },
    "問題": { agent: "★11", priority: "urgent" as TaskPriority, taskType: "debugging" as TaskType },
    "デプロイ": { agent: "★12", priority: "low" as TaskPriority, taskType: "deployment" as TaskType },
    "本番": { agent: "★12", priority: "low" as TaskPriority, taskType: "deployment" as TaskType },
    "Git": { agent: "★13", priority: "low" as TaskPriority, taskType: "documentation" as TaskType },
    "GitHub": { agent: "★13", priority: "low" as TaskPriority, taskType: "documentation" as TaskType },
    "TypeScript": { agent: "★14", priority: "medium" as TaskPriority, taskType: "debugging" as TaskType },
    "型エラー": { agent: "★14", priority: "medium" as TaskPriority, taskType: "debugging" as TaskType },
    "機能追加": { agent: "★15", priority: "medium" as TaskPriority, taskType: "implementation" as TaskType },
    "新機能": { agent: "★15", priority: "medium" as TaskPriority, taskType: "implementation" as TaskType },
    "リファクタリング": { agent: "★16", priority: "low" as TaskPriority, taskType: "refactoring" as TaskType },
    "改善": { agent: "★16", priority: "low" as TaskPriority, taskType: "refactoring" as TaskType }
  },
  patterns: {
    "新しいプロジェクト": ["★1", "★2", "★3", "★4", "★5"],
    "Webアプリ": ["★1", "★2", "★3", "★4", "★5", "★6", "★7", "★8"],
    "既存プロジェクト改善": ["★11", "★14", "★15", "★16"],
    "デプロイ準備": ["★9", "★12", "★13"],
    "フルスタック開発": ["★1", "★2", "★3", "★4", "★5", "★6", "★7", "★8", "★9", "★10", "★12"]
  }
};

export class RuleEngine {
  private agentLoader: AgentLoader;

  constructor(agentLoader: AgentLoader) {
    this.agentLoader = agentLoader;
  }

  /**
   * ユーザー入力を分析してタスクタイプとエージェントを特定
   */
  async analyzeInput(input: UserInput): Promise<InputAnalysis> {
    const text = input.text.toLowerCase();
    const keywords = this.extractKeywords(text);
    const suggestedAgents = this.findSuggestedAgents(text, keywords);
    const taskType = this.determineTaskType(keywords);
    const confidence = this.calculateConfidence(keywords, suggestedAgents);

    return {
      intent: this.determineIntent(text),
      keywords,
      suggestedAgents,
      confidence,
      taskType
    };
  }

  /**
   * 分析結果からタスクを生成
   */
  async generateTasks(analysis: InputAnalysis, userInput: UserInput): Promise<Task[]> {
    const tasks: Task[] = [];

    // 特定のエージェントが指定されている場合
    if (userInput.options?.agent) {
      const agentId = userInput.options.agent;
      if (this.agentLoader.agentExists(agentId)) {
        tasks.push(this.createTask(agentId, userInput.text, analysis.taskType));
      }
      return tasks;
    }

    // パターンマッチングによるワークフロー生成
    const workflowAgents = this.matchWorkflowPattern(userInput.text);
    if (workflowAgents.length > 0) {
      for (const agentId of workflowAgents) {
        tasks.push(this.createTask(agentId, userInput.text, analysis.taskType));
      }
      return tasks;
    }

    // 推奨エージェントからタスク生成
    if (analysis.suggestedAgents.length > 0) {
      // 高信頼度の場合は最初のエージェントのみ
      if (analysis.confidence > 0.8) {
        const agentId = analysis.suggestedAgents[0];
        tasks.push(this.createTask(agentId, userInput.text, analysis.taskType));
      } else {
        // 低信頼度の場合は複数エージェントを提案
        for (const agentId of analysis.suggestedAgents.slice(0, 3)) {
          tasks.push(this.createTask(agentId, userInput.text, analysis.taskType));
        }
      }
    } else {
      // デフォルトは要件定義エンジニア
      tasks.push(this.createTask("★1", userInput.text, "requirements"));
    }

    return tasks;
  }

  /**
   * タスクから実行計画を作成
   */
  async createExecutionPlan(tasks: Task[]): Promise<ExecutionPlan> {
    const phases = this.organizeTasks(tasks);
    const totalEstimatedDuration = this.calculateTotalDuration(phases);

    return {
      id: this.generatePlanId(),
      phases,
      totalEstimatedDuration
    };
  }

  /**
   * エージェント選択（単一エージェント用）
   */
  selectAgent(taskType: TaskType): AgentId {
    const typeToAgentMap: Record<TaskType, AgentId> = {
      requirements: "★1",
      design: "★2",
      implementation: "★7",
      testing: "★9",
      deployment: "★12",
      debugging: "★11",
      refactoring: "★16",
      documentation: "★13"
    };

    return typeToAgentMap[taskType] || "★1";
  }

  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];

    for (const keyword of Object.keys(INPUT_ANALYSIS_RULES.keywords)) {
      if (text.includes(keyword.toLowerCase())) {
        keywords.push(keyword);
      }
    }

    return keywords;
  }

  private findSuggestedAgents(text: string, keywords: string[]): AgentId[] {
    const agentScores: Record<AgentId, number> = {};

    // キーワードベースのスコアリング
    for (const keyword of keywords) {
      const rule = INPUT_ANALYSIS_RULES.keywords[keyword as keyof typeof INPUT_ANALYSIS_RULES.keywords];
      if (rule) {
        const agentId = rule.agent;
        agentScores[agentId] = (agentScores[agentId] || 0) + this.getPriorityScore(rule.priority);
      }
    }

    // パターンマッチング
    for (const [pattern, agents] of Object.entries(INPUT_ANALYSIS_RULES.patterns)) {
      if (text.includes(pattern.toLowerCase())) {
        for (const agentId of agents) {
          agentScores[agentId] = (agentScores[agentId] || 0) + 5;
        }
      }
    }

    // スコア順でソート
    return Object.entries(agentScores)
      .sort(([, a], [, b]) => b - a)
      .map(([agentId]) => agentId as AgentId);
  }

  private determineTaskType(keywords: string[]): TaskType {
    const typeScores: Record<TaskType, number> = {
      requirements: 0,
      design: 0,
      implementation: 0,
      testing: 0,
      deployment: 0,
      debugging: 0,
      refactoring: 0,
      documentation: 0
    };

    for (const keyword of keywords) {
      const rule = INPUT_ANALYSIS_RULES.keywords[keyword as keyof typeof INPUT_ANALYSIS_RULES.keywords];
      if (rule) {
        typeScores[rule.taskType]++;
      }
    }

    // 最高スコアのタスクタイプを返す
    return Object.entries(typeScores)
      .sort(([, a], [, b]) => b - a)[0][0] as TaskType;
  }

  private calculateConfidence(keywords: string[], suggestedAgents: AgentId[]): number {
    if (keywords.length === 0) return 0.1;
    if (suggestedAgents.length === 0) return 0.2;

    // キーワード数とエージェント候補数から信頼度を計算
    const keywordScore = Math.min(keywords.length / 3, 1);
    const agentScore = suggestedAgents.length > 0 ? 0.5 : 0;

    return Math.min(keywordScore + agentScore, 1);
  }

  private determineIntent(text: string): string {
    if (text.includes("作りたい") || text.includes("開発")) {
      return "新規開発";
    }
    if (text.includes("修正") || text.includes("改善")) {
      return "既存改善";
    }
    if (text.includes("デバッグ") || text.includes("エラー")) {
      return "問題解決";
    }
    return "一般的な開発支援";
  }

  private matchWorkflowPattern(text: string): AgentId[] {
    for (const [pattern, agents] of Object.entries(INPUT_ANALYSIS_RULES.patterns)) {
      if (text.toLowerCase().includes(pattern.toLowerCase())) {
        return agents as AgentId[];
      }
    }
    return [];
  }

  private createTask(agentId: AgentId, input: string, taskType: TaskType): Task {
    const priority = this.determinePriority(taskType);

    return {
      id: this.generateTaskId(),
      agentId,
      input,
      dependencies: this.agentLoader.getAgentDependencies(agentId),
      status: 'pending',
      priority,
      estimatedDuration: this.estimateDuration(agentId, taskType)
    };
  }

  private organizeTasks(tasks: Task[]): ExecutionPhase[] {
    const phases: ExecutionPhase[] = [];
    const processedTasks = new Set<string>();
    const taskMap = new Map(tasks.map(task => [task.id, task]));

    // 依存関係に基づいてフェーズを作成
    while (processedTasks.size < tasks.length) {
      const readyTasks = tasks.filter(task =>
        !processedTasks.has(task.id) &&
        task.dependencies.every(depId => {
          const depTask = Array.from(taskMap.values()).find(t => t.agentId === depId);
          return !depTask || processedTasks.has(depTask.id);
        })
      );

      if (readyTasks.length === 0) {
        // 循環依存の可能性があるため、残りのタスクを強制的に追加
        const remainingTasks = tasks.filter(task => !processedTasks.has(task.id));
        if (remainingTasks.length > 0) {
          phases.push({
            name: `Phase ${phases.length + 1} (強制実行)`,
            tasks: remainingTasks,
            parallel: false
          });
          remainingTasks.forEach(task => processedTasks.add(task.id));
        }
        break;
      }

      phases.push({
        name: `Phase ${phases.length + 1}`,
        tasks: readyTasks,
        parallel: readyTasks.length > 1
      });

      readyTasks.forEach(task => processedTasks.add(task.id));
    }

    return phases;
  }

  private calculateTotalDuration(phases: ExecutionPhase[]): number {
    return phases.reduce((total, phase) => {
      if (phase.parallel) {
        // 並列実行の場合は最長時間
        const maxDuration = Math.max(...phase.tasks.map(task => task.estimatedDuration || 0));
        return total + maxDuration;
      } else {
        // 順次実行の場合は合計時間
        const totalDuration = phase.tasks.reduce((sum, task) => sum + (task.estimatedDuration || 0), 0);
        return total + totalDuration;
      }
    }, 0);
  }

  private getPriorityScore(priority: TaskPriority): number {
    const scores = { urgent: 10, high: 7, medium: 5, low: 2 };
    return scores[priority];
  }

  private determinePriority(taskType: TaskType): TaskPriority {
    const priorityMap: Record<TaskType, TaskPriority> = {
      debugging: 'urgent',
      requirements: 'high',
      design: 'high',
      implementation: 'medium',
      testing: 'medium',
      deployment: 'low',
      refactoring: 'low',
      documentation: 'low'
    };
    return priorityMap[taskType] || 'medium';
  }

  private estimateDuration(agentId: AgentId, taskType: TaskType): number {
    // エージェントとタスクタイプに基づく推定時間（秒）
    const baseDurations: Record<TaskType, number> = {
      requirements: 300,    // 5分
      design: 600,         // 10分
      implementation: 1200, // 20分
      testing: 900,        // 15分
      deployment: 600,     // 10分
      debugging: 1800,     // 30分
      refactoring: 1500,   // 25分
      documentation: 300   // 5分
    };

    return baseDurations[taskType] || 600;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePlanId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
