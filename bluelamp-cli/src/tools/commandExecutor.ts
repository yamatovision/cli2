import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export class CommandExecutor {

  /**
   * コマンドを実行（非同期）
   */
  static async execute(command: string, cwd?: string): Promise<CommandResult> {
    try {
      const options = cwd ? { cwd, shell: '/bin/bash' } : { shell: '/bin/bash' };
      const { stdout, stderr } = await execAsync(command, options);

      return {
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        exitCode: 0,
        success: true
      };
    } catch (error: any) {
      return {
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || error.message,
        exitCode: error.code || 1,
        success: false
      };
    }
  }

  /**
   * インタラクティブなコマンドを実行
   */
  static async executeInteractive(
    command: string,
    args: string[] = [],
    cwd?: string,
    onOutput?: (data: string) => void
  ): Promise<CommandResult> {
    return new Promise((resolve) => {
      const options = cwd ? { cwd, stdio: 'pipe' as const } : { stdio: 'pipe' as const };
      const child = spawn(command, args, options);

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        if (onOutput) {
          onOutput(output);
        }
      });

      child.stderr?.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        if (onOutput) {
          onOutput(output);
        }
      });

      child.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
          success: (code || 0) === 0
        });
      });

      child.on('error', (error) => {
        resolve({
          stdout,
          stderr: error.message,
          exitCode: 1,
          success: false
        });
      });
    });
  }

  /**
   * 複数のコマンドを順次実行
   */
  static async executeSequence(commands: string[], cwd?: string): Promise<CommandResult[]> {
    const results: CommandResult[] = [];

    for (const command of commands) {
      const result = await this.execute(command, cwd);
      results.push(result);

      // エラーが発生した場合は停止
      if (!result.success) {
        break;
      }
    }

    return results;
  }

  /**
   * Git関連のコマンド
   */
  static async gitInit(cwd: string): Promise<CommandResult> {
    return this.execute('git init', cwd);
  }

  static async gitAdd(files: string = '.', cwd?: string): Promise<CommandResult> {
    return this.execute(`git add ${files}`, cwd);
  }

  static async gitCommit(message: string, cwd?: string): Promise<CommandResult> {
    return this.execute(`git commit -m "${message}"`, cwd);
  }

  /**
   * NPM関連のコマンド
   */
  static async npmInit(cwd: string): Promise<CommandResult> {
    return this.execute('npm init -y', cwd);
  }

  static async npmInstall(packages?: string[], cwd?: string): Promise<CommandResult> {
    const packageList = packages ? packages.join(' ') : '';
    return this.execute(`npm install ${packageList}`, cwd);
  }

  static async npmRun(script: string, cwd?: string): Promise<CommandResult> {
    return this.execute(`npm run ${script}`, cwd);
  }
}
