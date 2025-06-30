import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
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
  logs?: string[];
}

export class BrowserAutomationService {
  private static instance: BrowserAutomationService;
  private eventBus: AppGeniusEventBus;
  private activeProcesses: Map<string, childProcess.ChildProcess> = new Map();
  private cliPath: string;

  private constructor() {
    this.eventBus = AppGeniusEventBus.getInstance();
    this.cliPath = this.getCliPath();
  }

  public static getInstance(): BrowserAutomationService {
    if (!BrowserAutomationService.instance) {
      BrowserAutomationService.instance = new BrowserAutomationService();
    }
    return BrowserAutomationService.instance;
  }

  /**
   * CLIパスを取得
   */
  private getCliPath(): string {
    const config = vscode.workspace.getConfiguration('appgeniusAI');
    const customPath = config.get<string>('cliPath');
    
    if (customPath) {
      return customPath;
    }

    // デフォルトパス: VSCode拡張機能のディレクトリから相対的にCLIを探す
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspaceFolder) {
      const defaultCliPath = path.join(workspaceFolder, '..', 'cli', 'bluelamp');
      if (fs.existsSync(defaultCliPath)) {
        return defaultCliPath;
      }
    }

    // フォールバック: システムPATHから探す
    return 'bluelamp';
  }

  /**
   * ブラウザエージェントタスクを実行
   */
  public async executeBrowserTask(task: BrowserTask): Promise<BrowserResult> {
    try {
      Logger.info(`ブラウザタスク開始: ${task.id} - ${task.type}`);
      
      // イベント発行: タスク開始
      this.eventBus.emit(
        AppGeniusEventType.CLAUDE_CODE_STARTED,
        { taskId: task.id, type: task.type, target: task.target },
        'BrowserAutomationService'
      );

      // ブルーランプCLIを使用してブラウザエージェントを起動
      const command = this.buildBrowserCommand(task);
      const process = await this.launchBrowserAgent(command, task.id);
      
      this.activeProcesses.set(task.id, process);
      
      const result = await this.waitForResult(task.id, process);
      
      // プロセスをクリーンアップ
      this.activeProcesses.delete(task.id);
      
      // イベント発行: タスク完了
      this.eventBus.emit(
        AppGeniusEventType.CLAUDE_CODE_COMPLETED,
        { taskId: task.id, result },
        'BrowserAutomationService'
      );

      return result;
    } catch (error) {
      Logger.error(`ブラウザタスク実行エラー: ${error}`);
      
      // イベント発行: タスクエラー
      this.eventBus.emit(
        AppGeniusEventType.CLAUDE_CODE_ERROR,
        { taskId: task.id, error: error instanceof Error ? error.message : String(error) },
        'BrowserAutomationService'
      );

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
      instructions: `Set environment variables for ${platform}: ${JSON.stringify(variables)}`
    };

    return this.executeBrowserTask(task);
  }

  /**
   * 接続テスト専用のメソッド
   */
  public async testConnection(platform: string): Promise<BrowserResult> {
    const task: BrowserTask = {
      id: `connection_test_${Date.now()}`,
      type: 'environment_setup',
      target: platform,
      instructions: `Test connection to ${platform} platform`
    };

    return this.executeBrowserTask(task);
  }

  /**
   * ブルーランプCLIコマンドを構築
   */
  private buildBrowserCommand(task: BrowserTask): string {
    const args = [
      '--agent', 'browsing_agent',
      '--task', `"${task.instructions}"`,
      '--target', task.target
    ];

    // 追加オプション
    const config = vscode.workspace.getConfiguration('appgeniusAI.browserAutomation');
    if (config.get<boolean>('headless')) {
      args.push('--headless');
    }

    const timeout = config.get<number>('timeout');
    if (timeout) {
      args.push('--timeout', timeout.toString());
    }

    return `${this.cliPath} ${args.join(' ')}`;
  }

  /**
   * ブラウザエージェントを起動
   */
  private async launchBrowserAgent(command: string, taskId: string): Promise<childProcess.ChildProcess> {
    return new Promise((resolve, reject) => {
      Logger.info(`ブラウザエージェント起動コマンド: ${command}`);

      const process = childProcess.spawn(command, [], {
        shell: true,
        cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      process.on('spawn', () => {
        Logger.info(`ブラウザエージェント起動成功: ${taskId}`);
        resolve(process);
      });

      process.on('error', (error) => {
        Logger.error(`ブラウザエージェント起動エラー: ${error}`);
        reject(error);
      });

      // 標準出力をログに記録
      process.stdout?.on('data', (data) => {
        const output = data.toString();
        Logger.debug(`[${taskId}] stdout: ${output}`);
        
        // プログレス情報をイベントで通知
        this.eventBus.emit(
          AppGeniusEventType.CLAUDE_CODE_PROGRESS,
          { taskId, output, type: 'stdout' },
          'BrowserAutomationService'
        );
      });

      // 標準エラーをログに記録
      process.stderr?.on('data', (data) => {
        const output = data.toString();
        Logger.warn(`[${taskId}] stderr: ${output}`);
        
        // エラー情報をイベントで通知
        this.eventBus.emit(
          AppGeniusEventType.CLAUDE_CODE_PROGRESS,
          { taskId, output, type: 'stderr' },
          'BrowserAutomationService'
        );
      });
    });
  }

  /**
   * プロセスの実行結果を待機
   */
  private async waitForResult(taskId: string, process: childProcess.ChildProcess): Promise<BrowserResult> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      const logs: string[] = [];

      // 出力を収集
      process.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        logs.push(`[stdout] ${output}`);
      });

      process.stderr?.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        logs.push(`[stderr] ${output}`);
      });

      // プロセス終了を待機
      process.on('close', (code) => {
        Logger.info(`ブラウザエージェント終了: ${taskId}, exit code: ${code}`);

        const success = code === 0;
        const result: BrowserResult = {
          taskId,
          success,
          logs,
          data: success ? this.parseOutput(stdout) : undefined,
          error: success ? undefined : stderr || `Process exited with code ${code}`
        };

        resolve(result);
      });

      // タイムアウト設定
      const timeout = vscode.workspace.getConfiguration('appgeniusAI.browserAutomation').get<number>('timeout') || 30000;
      setTimeout(() => {
        if (!process.killed) {
          Logger.warn(`ブラウザエージェントタイムアウト: ${taskId}`);
          process.kill();
          resolve({
            taskId,
            success: false,
            error: 'Process timeout',
            logs
          });
        }
      }, timeout);
    });
  }

  /**
   * 出力を解析してデータを抽出
   */
  private parseOutput(output: string): any {
    try {
      // JSON形式の出力を探す
      const jsonMatch = output.match(/\{.*\}/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // 構造化されたデータを抽出
      const lines = output.split('\n').filter(line => line.trim());
      const data: any = {
        summary: lines[lines.length - 1] || 'Task completed',
        details: lines
      };

      return data;
    } catch (error) {
      Logger.warn(`出力解析エラー: ${error}`);
      return {
        raw: output,
        summary: 'Task completed (raw output)'
      };
    }
  }

  /**
   * アクティブなタスクを停止
   */
  public stopTask(taskId: string): boolean {
    const process = this.activeProcesses.get(taskId);
    if (process && !process.killed) {
      Logger.info(`ブラウザタスク停止: ${taskId}`);
      process.kill();
      this.activeProcesses.delete(taskId);
      
      // イベント発行: タスク停止
      this.eventBus.emit(
        AppGeniusEventType.CLAUDE_CODE_STOPPED,
        { taskId },
        'BrowserAutomationService'
      );
      
      return true;
    }
    return false;
  }

  /**
   * 全てのアクティブなタスクを停止
   */
  public stopAllTasks(): void {
    Logger.info('全ブラウザタスクを停止中...');
    for (const [taskId, process] of this.activeProcesses) {
      if (!process.killed) {
        process.kill();
        this.eventBus.emit(
          AppGeniusEventType.CLAUDE_CODE_STOPPED,
          { taskId },
          'BrowserAutomationService'
        );
      }
    }
    this.activeProcesses.clear();
  }

  /**
   * アクティブなタスクの一覧を取得
   */
  public getActiveTasks(): string[] {
    return Array.from(this.activeProcesses.keys());
  }

  /**
   * サービスの破棄
   */
  public dispose(): void {
    this.stopAllTasks();
  }
}