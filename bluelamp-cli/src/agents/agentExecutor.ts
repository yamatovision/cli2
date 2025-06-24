import { Agent, Task, ExecutionResult } from '../types';
import { ClaudeClient } from '../tools/claudeClient';
import { FileOperations } from '../tools/fileOperations';
import { CommandExecutor } from '../tools/commandExecutor';
import { AgentLoader } from './agentLoader';
import chalk from 'chalk';
import ora from 'ora';

export class AgentExecutor {
  private claudeClient: ClaudeClient;
  private agentLoader: AgentLoader;

  constructor() {
    this.claudeClient = new ClaudeClient();
    this.agentLoader = new AgentLoader();
  }

  /**
   * 単一エージェントを実行
   */
  async executeAgent(agentId: string, userInput: string, context?: any): Promise<ExecutionResult> {
    const spinner = ora(`🤖 ${agentId} を実行中...`).start();

    try {
      // エージェント情報を取得
      const agent = this.agentLoader.getAgent(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      // エージェントプロンプトを読み込み
      const promptPath = `16agents/${agent.promptFile}`;
      const agentPrompt = FileOperations.readFile(promptPath);

      // プロンプトを構築
      const fullPrompt = this.buildPrompt(agentPrompt, userInput, context);

      spinner.text = `🧠 ${agent.name} が分析中...`;

      // Claude APIに送信
      const response = await this.claudeClient.complete(fullPrompt);

      spinner.text = `💾 結果を保存中...`;

      // 結果を解析して実行
      const executionResult = await this.processAgentResponse(agent, response, userInput);

      spinner.succeed(`✅ ${agent.name} 完了`);

      return {
        agentId,
        success: true,
        output: response,
        files: executionResult.files,
        commands: executionResult.commands,
        nextSteps: executionResult.nextSteps
      };

    } catch (error) {
      spinner.fail(`❌ ${agentId} でエラーが発生`);
      console.error(chalk.red(`Error executing agent ${agentId}:`), error);

      return {
        agentId,
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        files: [],
        commands: [],
        nextSteps: []
      };
    }
  }

  /**
   * 複数エージェントを順次実行
   */
  async executeAgentSequence(tasks: Task[], userInput: string): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    let context: any = { userInput, previousResults: [] };

    console.log(chalk.blue(`\n🚀 ${tasks.length}個のエージェントを順次実行開始\n`));

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      console.log(chalk.yellow(`\n📋 Phase ${i + 1}: ${task.agentId}`));

      const result = await this.executeAgent(task.agentId, userInput, context);
      results.push(result);

      // 次のエージェントのためにコンテキストを更新
      context.previousResults.push(result);

      // エラーが発生した場合は停止するかユーザーに確認
      if (!result.success) {
        console.log(chalk.red(`\n⚠️  ${task.agentId} でエラーが発生しました。`));
        console.log(chalk.red(`エラー: ${result.error}`));

        // 重要でないエラーの場合は続行
        if (task.priority !== 'urgent') {
          console.log(chalk.yellow('続行します...\n'));
          continue;
        } else {
          console.log(chalk.red('重要なエラーのため実行を停止します。\n'));
          break;
        }
      }

      console.log(chalk.green(`✅ ${task.agentId} 完了\n`));
    }

    return results;
  }

  /**
   * プロンプトを構築
   */
  private buildPrompt(agentPrompt: string, userInput: string, context?: any): string {
    let prompt = agentPrompt;

    // ユーザー入力を追加
    prompt += `\n\n## ユーザーからの要求\n${userInput}`;

    // コンテキストがある場合は追加
    if (context?.previousResults?.length > 0) {
      prompt += '\n\n## 前のエージェントの実行結果\n';
      context.previousResults.forEach((result: ExecutionResult, index: number) => {
        prompt += `\n### ${result.agentId} の結果:\n`;
        prompt += `成功: ${result.success}\n`;
        if (result.files.length > 0) {
          prompt += `作成されたファイル: ${result.files.join(', ')}\n`;
        }
        if (result.commands.length > 0) {
          prompt += `実行されたコマンド: ${result.commands.join(', ')}\n`;
        }
      });
    }

    // 実行指示を追加
    prompt += `\n\n## 実行指示
以下の形式で回答してください：

### 分析結果
[あなたの分析内容]

### 実行計画
[具体的な実行ステップ]

### ファイル操作
\`\`\`json
{
  "files": [
    {
      "path": "ファイルパス",
      "content": "ファイル内容",
      "action": "create|update|delete"
    }
  ]
}
\`\`\`

### コマンド実行
\`\`\`json
{
  "commands": [
    {
      "command": "実行するコマンド",
      "description": "コマンドの説明",
      "cwd": "実行ディレクトリ（オプション）"
    }
  ]
}
\`\`\`

### 次のステップ
[次に実行すべき内容や推奨事項]`;

    return prompt;
  }

  /**
   * エージェントの応答を処理して実際の操作を実行
   */
  private async processAgentResponse(agent: Agent, response: string, userInput: string): Promise<{
    files: string[];
    commands: string[];
    nextSteps: string[];
  }> {
    const files: string[] = [];
    const commands: string[] = [];
    const nextSteps: string[] = [];

    try {
      // ファイル操作の抽出と実行
      const fileMatch = response.match(/```json\s*\n([\s\S]*?)\n```/);
      if (fileMatch) {
        try {
          const fileOps = JSON.parse(fileMatch[1]);
          if (fileOps.files) {
            for (const fileOp of fileOps.files) {
              switch (fileOp.action) {
                case 'create':
                case 'update':
                  FileOperations.writeFile(fileOp.path, fileOp.content);
                  files.push(fileOp.path);
                  console.log(chalk.green(`📄 ファイル作成: ${fileOp.path}`));
                  break;
                case 'delete':
                  FileOperations.deleteFile(fileOp.path);
                  files.push(fileOp.path);
                  console.log(chalk.yellow(`🗑️  ファイル削除: ${fileOp.path}`));
                  break;
              }
            }
          }
        } catch (error) {
          console.log(chalk.yellow('⚠️  ファイル操作の解析に失敗しました'));
        }
      }

      // コマンド実行の抽出と実行
      const commandMatches = response.match(/### コマンド実行\s*```json\s*\n([\s\S]*?)\n```/);
      if (commandMatches) {
        try {
          const commandOps = JSON.parse(commandMatches[1]);
          if (commandOps.commands) {
            for (const cmdOp of commandOps.commands) {
              console.log(chalk.blue(`⚡ コマンド実行: ${cmdOp.command}`));
              const result = await CommandExecutor.execute(cmdOp.command, cmdOp.cwd);
              commands.push(cmdOp.command);

              if (result.success) {
                console.log(chalk.green(`✅ コマンド成功`));
                if (result.stdout) {
                  console.log(chalk.gray(result.stdout.slice(0, 200) + '...'));
                }
              } else {
                console.log(chalk.red(`❌ コマンド失敗: ${result.stderr}`));
              }
            }
          }
        } catch (error) {
          console.log(chalk.yellow('⚠️  コマンド実行の解析に失敗しました'));
        }
      }

      // 次のステップの抽出
      const nextStepsMatch = response.match(/### 次のステップ\s*\n([\s\S]*?)(?=\n###|\n```|$)/);
      if (nextStepsMatch) {
        const steps = nextStepsMatch[1].trim().split('\n').filter(line => line.trim());
        nextSteps.push(...steps);
      }

    } catch (error) {
      console.log(chalk.yellow('⚠️  応答の解析中にエラーが発生しました'));
    }

    return { files, commands, nextSteps };
  }
}
