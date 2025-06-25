import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ClaudeCodeIntegrationService } from '../services/ClaudeCodeIntegrationService';
import { ClaudeCodeApiClient } from '../api/claudeCodeApiClient';
import { Logger } from '../utils/logger';
import { SimpleAuthService } from '../core/auth/SimpleAuthService';

/**
 * ClaudeCode連携関連のコマンド登録とハンドラー
 */
export function registerClaudeCodeCommands(context: vscode.ExtensionContext): void {
  // サービスのインスタンス
  const integrationService = ClaudeCodeIntegrationService.getInstance();
  const apiClient = ClaudeCodeApiClient.getInstance();

  // SimpleAuthServiceのインスタンスを取得
  let authService: SimpleAuthService;
  try {
    const context = (global as any).appgeniusContext;
    if (context) {
      authService = SimpleAuthService.getInstance(context);
    } else {
      throw new Error('コンテキストが見つかりません');
    }
  } catch (error) {
    Logger.error('SimpleAuthServiceの初期化に失敗しました', error as Error);
    throw error;
  }

  // コマンド登録
  context.subscriptions.push(
    vscode.commands.registerCommand('appgenius.claudeCode.checkInstallation', checkClaudeCodeInstallation)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('appgenius.claudeCode.install', installClaudeCode)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('appgenius.claudeCode.launchWithPrompt', launchWithPrompt)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('appgenius.claudeCode.openPromptLibrary', openPromptLibrary)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('appgenius.claudeCode.syncPrompts', syncPrompts)
  );
  
  context.subscriptions.push(
    vscode.commands.registerCommand('appgenius.claudeCode.launchFromUrl', launchFromUrl)
  );

  // ClaudeCodeインストール確認
  async function checkClaudeCodeInstallation(): Promise<boolean> {
    try {
      const isAvailable = await integrationService.isClaudeCodeAvailable();
      
      if (!isAvailable) {
        const answer = await vscode.window.showInformationMessage(
          'ClaudeCodeがインストールされていないようです。インストールしますか？',
          'インストール',
          'キャンセル'
        );
        
        if (answer === 'インストール') {
          return await installClaudeCode();
        }
        
        return false;
      }
      
      vscode.window.showInformationMessage('ClaudeCodeは既にインストールされています。');
      return true;
    } catch (error) {
      Logger.error('ClaudeCodeインストール確認中にエラーが発生しました', error as Error);
      vscode.window.showErrorMessage(`ClaudeCodeインストール確認中にエラーが発生しました: ${(error as Error).message}`);
      return false;
    }
  }

  // ClaudeCodeインストール
  async function installClaudeCode(): Promise<boolean> {
    try {
      const installed = await integrationService.installClaudeCode();
      
      if (installed) {
        vscode.window.showInformationMessage('ClaudeCodeが正常にインストールされました。');
      } else {
        vscode.window.showErrorMessage('ClaudeCodeのインストールに失敗しました。管理者権限で再試行してください。');
      }
      
      return installed;
    } catch (error) {
      Logger.error('ClaudeCodeインストール中にエラーが発生しました', error as Error);
      vscode.window.showErrorMessage(`ClaudeCodeインストール中にエラーが発生しました: ${(error as Error).message}`);
      return false;
    }
  }

  // プロンプトを指定してClaudeCodeを起動
  async function launchWithPrompt(): Promise<void> {
    try {
      // 認証確認
      if (!authService.isAuthenticated()) {
        const answer = await vscode.window.showInformationMessage(
          'この機能を使用するにはログインが必要です。',
          'ログイン',
          'キャンセル'
        );
        
        if (answer === 'ログイン') {
          vscode.commands.executeCommand('appgenius.login');
        }
        
        return;
      }
      
      // ClaudeCodeの確認
      const isAvailable = await integrationService.isClaudeCodeAvailable();
      if (!isAvailable) {
        const answer = await vscode.window.showInformationMessage(
          'ClaudeCodeがインストールされていないようです。インストールしますか？',
          'インストール',
          'キャンセル'
        );
        
        if (answer === 'インストール') {
          const installed = await installClaudeCode();
          if (!installed) {
            return;
          }
        } else {
          return;
        }
      }
      
      // プロンプト一覧を取得
      const prompts = await apiClient.getPrompts();
      
      if (!prompts || prompts.length === 0) {
        vscode.window.showInformationMessage('利用可能なプロンプトがありません。プロンプトライブラリに追加してください。');
        return;
      }
      
      // QuickPickで選択肢を表示
      const promptItems = prompts.map(prompt => ({
        label: prompt.title,
        description: prompt.category || '',
        detail: prompt.tags ? prompt.tags.join(', ') : '',
        id: prompt.id
      }));
      
      const selectedItem = await vscode.window.showQuickPick(promptItems, {
        placeHolder: '使用するプロンプトを選択してください',
        matchOnDescription: true,
        matchOnDetail: true
      });
      
      if (!selectedItem) {
        return;
      }
      
      // プロジェクトルートを取得
      const workspaceFolders = vscode.workspace.workspaceFolders;
      let projectPath: string;
      
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('プロジェクトフォルダが開かれていません。');
        return;
      } else if (workspaceFolders.length === 1) {
        projectPath = workspaceFolders[0].uri.fsPath;
      } else {
        // 複数のワークスペースがある場合は選択させる
        const folderItems = workspaceFolders.map(folder => ({
          label: folder.name,
          description: folder.uri.fsPath,
          path: folder.uri.fsPath
        }));
        
        const selectedFolder = await vscode.window.showQuickPick(folderItems, {
          placeHolder: 'プロジェクトフォルダを選択してください'
        });
        
        if (!selectedFolder) {
          return;
        }
        
        projectPath = selectedFolder.path;
      }
      
      // ClaudeCodeを起動
      await integrationService.launchWithPrompt(selectedItem.id, projectPath);
      
    } catch (error) {
      Logger.error('プロンプト指定のClaudeCode起動中にエラーが発生しました', error as Error);
      vscode.window.showErrorMessage(`プロンプト指定のClaudeCode起動中にエラーが発生しました: ${(error as Error).message}`);
    }
  }

  // プロンプトライブラリを開く
  async function openPromptLibrary(): Promise<void> {
    try {
      // 認証確認
      if (!authService.isAuthenticated()) {
        const answer = await vscode.window.showInformationMessage(
          'この機能を使用するにはログインが必要です。',
          'ログイン',
          'キャンセル'
        );
        
        if (answer === 'ログイン') {
          vscode.commands.executeCommand('appgenius.login');
        }
        
        return;
      }
      
      // プロンプトディレクトリを確認
      const configDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.vscode', 'appgenius');
      const promptDir = path.join(configDir, 'prompts');
      
      if (!fs.existsSync(promptDir)) {
        fs.mkdirSync(promptDir, { recursive: true });
      }
      
      // Explorerでプロンプトディレクトリを開く
      vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(promptDir));
      
    } catch (error) {
      Logger.error('プロンプトライブラリを開く操作中にエラーが発生しました', error as Error);
      vscode.window.showErrorMessage(`プロンプトライブラリを開く操作中にエラーが発生しました: ${(error as Error).message}`);
    }
  }

  // プロンプトを同期
  async function syncPrompts(): Promise<void> {
    try {
      // 認証確認
      if (!authService.isAuthenticated()) {
        const answer = await vscode.window.showInformationMessage(
          'この機能を使用するにはログインが必要です。',
          'ログイン',
          'キャンセル'
        );
        
        if (answer === 'ログイン') {
          vscode.commands.executeCommand('appgenius.login');
        }
        
        return;
      }
      
      // プログレス表示
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'プロンプトを同期中...',
          cancellable: false
        },
        async (progress) => {
          progress.report({ increment: 30, message: 'プロンプト情報を取得中...' });
          
          // 更新情報を取得
          const updates = await apiClient.getSyncUpdates();
          
          progress.report({ increment: 30, message: `${updates.prompts.length}件のプロンプトを同期中...` });
          
          if (updates.prompts && updates.prompts.length > 0) {
            // 同期先ディレクトリを確認
            const configDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.vscode', 'appgenius');
            const promptDir = path.join(configDir, 'prompts');
            
            if (!fs.existsSync(promptDir)) {
              fs.mkdirSync(promptDir, { recursive: true });
            }
            
            // プロンプトを書き出し
            for (const prompt of updates.prompts) {
              const fileName = `${prompt.id.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
              const filePath = path.join(promptDir, fileName);
              
              // プロンプト内容をマークダウン形式で生成
              let content = `# ${prompt.title}\n\n`;
              content += `型: ${prompt.type}\n`;
              content += `カテゴリ: ${prompt.category || 'なし'}\n`;
              content += `タグ: ${prompt.tags ? prompt.tags.join(', ') : 'なし'}\n`;
              content += `最終更新: ${new Date(prompt.updatedAt).toLocaleString()}\n\n`;
              content += `---\n\n`;
              content += prompt.content;
              
              // ファイルに書き込み
              fs.writeFileSync(filePath, content, 'utf8');
            }
            
            progress.report({ increment: 40, message: '同期が完了しました' });
            
            vscode.window.showInformationMessage(`${updates.prompts.length}件のプロンプトを同期しました。`);
          } else {
            progress.report({ increment: 70, message: '同期するプロンプトはありませんでした' });
            
            vscode.window.showInformationMessage('同期するプロンプトはありませんでした。');
          }
        }
      );
    } catch (error) {
      Logger.error('プロンプト同期中にエラーが発生しました', error as Error);
      vscode.window.showErrorMessage(`プロンプト同期中にエラーが発生しました: ${(error as Error).message}`);
    }
  }
  
  // 公開URLからClaudeCodeを起動
  async function launchFromUrl(): Promise<void> {
    try {
      // URLの入力を求める
      const url = await vscode.window.showInputBox({
        prompt: 'プロンプトの公開URLを入力してください',
        placeHolder: 'https://example.com/api/prompts/public/abcd1234'
      });

      if (!url) {
        return; // ユーザーがキャンセルした場合
      }
      
      // ClaudeCodeの確認
      const isAvailable = await integrationService.isClaudeCodeAvailable();
      if (!isAvailable) {
        const answer = await vscode.window.showInformationMessage(
          'ClaudeCodeがインストールされていないようです。インストールしますか？',
          'インストール',
          'キャンセル'
        );
        
        if (answer === 'インストール') {
          const installed = await installClaudeCode();
          if (!installed) {
            return;
          }
        } else {
          return;
        }
      }

      // 現在のワークスペースフォルダを取得
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('ワークスペースフォルダが開かれていません。');
        return;
      }

      // 複数のワークスペースがある場合は選択させる
      let projectPath: string;
      if (workspaceFolders.length === 1) {
        projectPath = workspaceFolders[0].uri.fsPath;
      } else {
        const folderItems = workspaceFolders.map(folder => ({
          label: folder.name,
          description: folder.uri.fsPath,
          path: folder.uri.fsPath
        }));

        const selectedFolder = await vscode.window.showQuickPick(folderItems, {
          placeHolder: 'プロジェクトフォルダを選択してください'
        });

        if (!selectedFolder) {
          return; // ユーザーがキャンセルした場合
        }

        projectPath = selectedFolder.path;
      }

      // URLを検証
      try {
        new URL(url); // URLとして妥当かチェック
      } catch (e) {
        vscode.window.showErrorMessage('無効なURLです。正しいプロンプト共有URLを入力してください。');
        return;
      }

      // ClaudeCode起動
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'ClaudeCodeを起動しています...',
          cancellable: false
        },
        async (progress) => {
          progress.report({ increment: 50, message: 'プロンプトを読み込み中...' });
          const result = await integrationService.launchWithPublicUrl(url, projectPath);
          
          if (!result) {
            throw new Error('ClaudeCodeの起動に失敗しました');
          }
          
          progress.report({ increment: 50, message: 'ClaudeCodeを起動しました' });
        }
      );
    } catch (error) {
      Logger.error('公開URLからのClaudeCode起動に失敗しました', error as Error);
      vscode.window.showErrorMessage(`公開URLからのClaudeCode起動に失敗しました: ${(error as Error).message}`);
    }
  }
}