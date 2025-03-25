import { Logger } from '../../utils/logger';

/**
 * ClaudeCode認証同期を管理するクラス
 * 認証関連の処理を担当
 */
export class AuthSyncManager {
  // SimpleAuthサービスとAuthenticationServiceのインスタンス
  private simpleAuthService: any | null = null;
  private authService: any | null = null;
  private authSync: any | null = null;
  
  /**
   * 認証サービスの初期化と取得
   */
  public async initAuthServices(): Promise<boolean> {
    try {
      // 認証同期サービスを取得
      if (!this.authSync) {
        this.authSync = await import('../ClaudeCodeAuthSync')
          .then(module => module.ClaudeCodeAuthSync.getInstance());
      }
      
      // 認証サービスを取得
      if (!this.authService) {
        this.authService = await import('../../core/auth/AuthenticationService')
          .then(module => module.AuthenticationService.getInstance());
      }
      
      // SimpleAuthServiceのインスタンスも取得（APIキー取得用）
      if (!this.simpleAuthService) {
        try {
          this.simpleAuthService = await import('../../core/auth/SimpleAuthService')
            .then(module => module.SimpleAuthService.getInstance());
          Logger.info('SimpleAuthServiceのインスタンスを取得しました');
        } catch (error) {
          Logger.warn('SimpleAuthServiceのインスタンス取得に失敗しました。レガシー認証を使用します', error as Error);
          // SimpleAuthService無しでも続行可能
        }
      }
      
      return true;
    } catch (error) {
      Logger.error('認証サービスの初期化に失敗しました', error as Error);
      return false;
    }
  }
  
  /**
   * CLIログイン状態を確認
   */
  public isClaudeCliLoggedIn(): boolean {
    if (!this.authSync) {
      Logger.warn('authSyncが初期化されていません。ログイン状態の確認に失敗しました。');
      return false;
    }
    
    const isLoggedIn = this.authSync.isClaudeCliLoggedIn();
    Logger.info(`Claude CLI ログイン状態: ${isLoggedIn ? 'ログイン済み' : '未ログイン'}`);
    return isLoggedIn;
  }
  
  /**
   * APIキーが利用可能かどうかを確認
   * @throws {Error} APIキーが利用できない場合にエラー
   */
  public async isApiKeyAvailable(): Promise<boolean> {
    if (!this.simpleAuthService) {
      throw new Error('認証サービスが初期化されていません。再ログインを試みてください。');
    }
    
    try {
      const apiKey = await this.simpleAuthService.getApiKey();
      
      if (!apiKey) {
        // 詳細なエラーメッセージ
        const errorMessage = `
【APIキーが見つかりません】
ユーザーにAnthropicAPIキーが設定されていないためClaudeCodeを起動できません。

考えられる対処法:
1. 管理者にAPIキーの設定を依頼してください
2. ポータル管理画面でAPIキーを確認・更新してください
3. 一度ログアウトして再ログインを試してください

詳細: AnthropicApiKeyモデルからAPIキーを取得できませんでした
`;
        Logger.error(errorMessage);
        throw new Error('AnthropicAPIキーが設定されていません。管理者に連絡してAPIキーの設定を依頼してください。');
      }
      
      Logger.info(`AuthSyncManager: APIキー取得成功 (${apiKey.substring(0, 5)}...)`);
      return true;
    } catch (error) {
      Logger.error('AuthSyncManager: APIキー確認エラー', error as Error);
      // エラーを再スロー
      throw error;
    }
  }
  
  /**
   * サービス利用のためのAPIキー情報をマスク処理して取得（ログ用）
   */
  public async getApiKeyInfo(): Promise<{ 
    available: boolean; 
    maskedApiKey?: string; 
    userId?: string;
    userName?: string;
    userRole?: string;
    orgName?: string;
  }> {
    if (!this.simpleAuthService) {
      return { available: false };
    }
    
    try {
      const apiKey = await this.simpleAuthService.getApiKey();
      
      if (!apiKey) {
        return { available: false };
      }
      
      // ユーザー情報の取得
      const userInfo = this.simpleAuthService.getCurrentUser();
      const userId = userInfo?.id || 'unknown';
      const userName = userInfo?.name || 'unknown';
      const userRole = userInfo?.role || 'unknown';
      const orgName = userInfo?.organization?.name || 'none';
      
      // APIキーをマスク処理して表示（セキュリティ対策）
      const apiKeyMasked = apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 4);
      
      return {
        available: true,
        maskedApiKey: apiKeyMasked,
        userId,
        userName,
        userRole,
        orgName
      };
    } catch (error) {
      Logger.error('APIキー情報の取得に失敗しました', error as Error);
      return { available: false };
    }
  }
  
  /**
   * 認証トークンのリフレッシュを試行
   */
  public async refreshTokens(): Promise<boolean> {
    if (!this.simpleAuthService) {
      return false;
    }
    
    try {
      Logger.info('トークンリフレッシュを試みます');
      const refreshResult = await this.simpleAuthService.verifyAuthState();
      Logger.info(`トークンリフレッシュ結果: ${refreshResult ? '成功' : '失敗'}`);
      
      return refreshResult;
    } catch (error) {
      Logger.error('トークンリフレッシュ中にエラーが発生しました', error as Error);
      return false;
    }
  }
  
  /**
   * AppGenius専用認証ファイルに認証情報を同期
   */
  public async syncTokensToAppGeniusAuth(): Promise<boolean> {
    if (!this.authSync) {
      await this.initAuthServices();
      
      if (!this.authSync) {
        Logger.error('認証同期サービスの初期化に失敗しました');
        return false;
      }
    }
    
    try {
      await this.authSync.syncTokensToAppGeniusAuth();
      Logger.info('AppGenius専用の認証情報を同期しました');
      return true;
    } catch (error) {
      Logger.error('AppGenius専用の認証情報の同期に失敗しました', error as Error);
      return false;
    }
  }
  
  /**
   * AppGenius専用の認証ファイルパスを取得
   */
  public getAppGeniusAuthFilePath(): string {
    if (!this.authSync) {
      throw new Error('認証同期サービスが初期化されていません');
    }
    
    return this.authSync.getAppGeniusAuthFilePath();
  }
  
  /**
   * ログイン状態の再確認と必要に応じたリログインプロンプト
   */
  public async ensureLoggedIn(): Promise<boolean> {
    if (!this.simpleAuthService) {
      throw new Error('認証サービスが初期化されていません。再ログインを試みてください。');
    }
    
    const isLoggedIn = this.isClaudeCliLoggedIn();
    
    // APIキーが利用可能か確認（例外が発生する可能性あり）
    await this.isApiKeyAvailable();
    
    // ログインしていない場合、再ログインを要求
    if (!isLoggedIn) {
      Logger.warn('【認証問題】Claude CLIがログイン状態ではありません');
      
      // 再ログインをユーザーに要求
      const vscode = await import('vscode');
      const askRelogin = await vscode.window.showWarningMessage(
        'ClaudeCode CLIの認証状態が不正です。再ログインしますか？',
        { modal: true },
        '再ログイン', 'キャンセル'
      );
      
      if (askRelogin === '再ログイン') {
        Logger.info('ユーザーが再ログインを選択しました');
        await this.simpleAuthService.logout();
        
        // ログインパネルを表示するコマンドを実行
        await vscode.commands.executeCommand('appgenius-ai.login');
        
        // 現在の実行を中断する必要がある
        throw new Error('再ログインが必要です。ログイン後に再度実行してください。');
      } else {
        // キャンセルが選択された場合は処理を終了
        throw new Error('認証プロセスがキャンセルされました。ClaudeCodeの起動には正しい認証情報が必要です。');
      }
    }
    
    // トークンリフレッシュを試行
    const refreshed = await this.refreshTokens();
    if (!refreshed) {
      throw new Error('認証トークンのリフレッシュに失敗しました。再ログインを試みてください。');
    }
    
    return true;
  }
}