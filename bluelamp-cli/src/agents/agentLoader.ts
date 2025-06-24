import * as fs from 'fs';
import * as path from 'path';
import { AgentId, AgentInfo, AgentConfig } from '../types';

export class AgentLoader {
  private agentsConfig!: AgentConfig;
  private agentsDir: string;

  constructor(configPath?: string, agentsDir?: string) {
    // 実行時のディレクトリを基準にパスを解決
    const baseDir = path.dirname(path.dirname(__dirname)); // dist/agents -> src -> project root
    this.agentsDir = agentsDir ? path.resolve(agentsDir) : path.join(baseDir, '16agents');
    const configFilePath = configPath ? path.resolve(configPath) : path.join(baseDir, 'config', 'agents.json');
    this.loadAgentsConfig(configFilePath);
  }

  private loadAgentsConfig(configPath: string): void {
    try {
      const configFullPath = path.resolve(configPath);
      const configData = fs.readFileSync(configFullPath, 'utf-8');
      this.agentsConfig = JSON.parse(configData);
    } catch (error) {
      throw new Error(`エージェント設定ファイルの読み込みに失敗しました: ${error}`);
    }
  }

  /**
   * 指定されたエージェントの情報を取得
   */
  getAgentInfo(agentId: AgentId): AgentInfo | null {
    return this.agentsConfig.agents[agentId] || null;
  }

  /**
   * 指定されたエージェントの情報を取得（getAgentのエイリアス）
   */
  getAgent(agentId: AgentId): AgentInfo | null {
    return this.getAgentInfo(agentId);
  }

  /**
   * 全エージェントの情報を取得
   */
  getAllAgents(): AgentInfo[] {
    return Object.values(this.agentsConfig.agents);
  }

  /**
   * カテゴリ別にエージェントを取得
   */
  getAgentsByCategory(category: string): AgentInfo[] {
    return this.getAllAgents().filter(agent => agent.category === category);
  }

  /**
   * エージェントのプロンプトファイルを読み込み
   */
  async loadAgentPrompt(agentId: AgentId): Promise<string> {
    const agentInfo = this.getAgentInfo(agentId);
    if (!agentInfo) {
      throw new Error(`エージェント ${agentId} が見つかりません`);
    }

    const promptPath = path.join(this.agentsDir, agentInfo.promptFile);

    try {
      const promptContent = await fs.promises.readFile(promptPath, 'utf-8');
      return promptContent;
    } catch (error) {
      throw new Error(`プロンプトファイルの読み込みに失敗しました: ${promptPath} - ${error}`);
    }
  }

  /**
   * エージェントが存在するかチェック
   */
  agentExists(agentId: AgentId): boolean {
    return agentId in this.agentsConfig.agents;
  }

  /**
   * 依存関係を持つエージェントを取得
   */
  getAgentDependencies(agentId: AgentId): AgentId[] {
    const agentInfo = this.getAgentInfo(agentId);
    return agentInfo ? agentInfo.dependencies : [];
  }

  /**
   * 指定されたエージェントに依存するエージェントを取得
   */
  getDependentAgents(agentId: AgentId): AgentId[] {
    return this.getAllAgents()
      .filter(agent => agent.dependencies.includes(agentId))
      .map(agent => agent.id);
  }

  /**
   * エージェント名で検索
   */
  findAgentByName(name: string): AgentInfo | null {
    const agents = this.getAllAgents();

    // 完全一致
    let found = agents.find(agent =>
      agent.name === name ||
      agent.id === name
    );

    if (found) return found;

    // 部分一致
    found = agents.find(agent =>
      agent.name.includes(name) ||
      agent.description.includes(name)
    );

    return found || null;
  }

  /**
   * キーワードでエージェントを検索
   */
  searchAgentsByKeywords(keywords: string[]): AgentInfo[] {
    const agents = this.getAllAgents();
    const results: { agent: AgentInfo; score: number }[] = [];

    for (const agent of agents) {
      let score = 0;
      const searchText = `${agent.name} ${agent.description}`.toLowerCase();

      for (const keyword of keywords) {
        const lowerKeyword = keyword.toLowerCase();
        if (searchText.includes(lowerKeyword)) {
          // 名前に含まれる場合は高スコア
          if (agent.name.toLowerCase().includes(lowerKeyword)) {
            score += 10;
          }
          // 説明に含まれる場合は中スコア
          else if (agent.description.toLowerCase().includes(lowerKeyword)) {
            score += 5;
          }
          // その他の場合は低スコア
          else {
            score += 1;
          }
        }
      }

      if (score > 0) {
        results.push({ agent, score });
      }
    }

    // スコア順でソート
    results.sort((a, b) => b.score - a.score);
    return results.map(result => result.agent);
  }

  /**
   * エージェント統計情報を取得
   */
  getAgentStats(): {
    total: number;
    byCategory: Record<string, number>;
    withDependencies: number;
    independent: number;
  } {
    const agents = this.getAllAgents();
    const byCategory: Record<string, number> = {};
    let withDependencies = 0;

    for (const agent of agents) {
      // カテゴリ別カウント
      byCategory[agent.category] = (byCategory[agent.category] || 0) + 1;

      // 依存関係を持つエージェントカウント
      if (agent.dependencies.length > 0) {
        withDependencies++;
      }
    }

    return {
      total: agents.length,
      byCategory,
      withDependencies,
      independent: agents.length - withDependencies
    };
  }

  /**
   * エージェント設定の検証
   */
  validateAgentConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const agents = this.getAllAgents();
    const agentIds = new Set(agents.map(a => a.id));

    for (const agent of agents) {
      // 必須フィールドチェック
      if (!agent.id || !agent.name || !agent.promptFile) {
        errors.push(`エージェント ${agent.id || 'unknown'}: 必須フィールドが不足しています`);
      }

      // 依存関係の循環チェック
      for (const depId of agent.dependencies) {
        if (!agentIds.has(depId)) {
          errors.push(`エージェント ${agent.id}: 存在しない依存関係 ${depId}`);
        }
      }

      // プロンプトファイルの存在チェック
      const promptPath = path.join(this.agentsDir, agent.promptFile);
      if (!fs.existsSync(promptPath)) {
        errors.push(`エージェント ${agent.id}: プロンプトファイルが見つかりません ${promptPath}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
