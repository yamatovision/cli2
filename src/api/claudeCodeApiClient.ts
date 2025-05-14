import axios from 'axios';
import * as vscode from 'vscode';
import { SimpleAuthService } from '../core/auth/SimpleAuthService';
import { Logger } from '../utils/logger';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from '../utils/ErrorHandler';

/**
 * ClaudeCodeApiClient - ClaudeCode CLIと連携するためのAPIクライアント
 * 
 * プロンプトライブラリやユーザー認証情報の同期に使用します。
 */
export class ClaudeCodeApiClient {
  private static instance: ClaudeCodeApiClient;
  private _simpleAuthService?: SimpleAuthService;
  private _baseUrl: string;
  private _errorHandler: ErrorHandler;

  /**
   * コンストラクタ
   */
  private constructor() {
    // SimpleAuthServiceを使用
    try {
      // VSCode拡張のコンテキストを取得（複数の変数名に対応）
      const context = (global as any).__extensionContext || (global as any).extensionContext;
      if (context) {
        this._simpleAuthService = SimpleAuthService.getInstance(context);
        Logger.info('ClaudeCodeApiClient: SimpleAuthServiceを使用します');
      } else {
        // グローバルコンテキストが見つからない場合はエラーログを記録してnullを設定する
        Logger.warn('ClaudeCodeApiClient: 拡張コンテキストが見つかりません。認証機能が制限されます。');
        this._simpleAuthService = undefined;
      }
    } catch (error) {
      Logger.error('ClaudeCodeApiClient: SimpleAuthServiceの取得に失敗しました', error as Error);
      // エラーを投げる代わりにnullを設定して継続する
      this._simpleAuthService = undefined;
    }

    this._errorHandler = ErrorHandler.getInstance();
    // API URLを環境変数から取得、またはデフォルト値を使用
    this._baseUrl = process.env.PORTAL_API_URL || 'https://appgenius-portal-test-235426778039.asia-northeast1.run.app/api';
    Logger.info('ClaudeCodeApiClient initialized with baseUrl: ' + this._baseUrl);
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): ClaudeCodeApiClient {
    if (!ClaudeCodeApiClient.instance) {
      ClaudeCodeApiClient.instance = new ClaudeCodeApiClient();
    }
    return ClaudeCodeApiClient.instance;
  }

  /**
   * API呼び出し用の設定を取得
   */
  private async _getApiConfig() {
    let authHeader = {};

    try {
      // SimpleAuthServiceから認証ヘッダーを取得
      if (this._simpleAuthService) {
        try {
          authHeader = this._simpleAuthService.getAuthHeader();
          Logger.debug('ClaudeCodeApiClient: SimpleAuthServiceからヘッダーを取得しました');
        } catch (headerError) {
          Logger.warn('ClaudeCodeApiClient: 認証ヘッダーの取得中にエラーが発生しました', headerError as Error);
          // エラーが発生しても空のヘッダーで継続
          authHeader = {};
        }
      } else {
        Logger.warn('ClaudeCodeApiClient: SimpleAuthServiceが初期化されていません');
      }
    } catch (error) {
      // 何らかの予期しないエラーが発生した場合でも処理を継続
      Logger.error('ClaudeCodeApiClient: API設定の取得中に予期しないエラーが発生しました', error as Error);
    }

    return {
      headers: authHeader
    };
  }

  /**
   * プロンプト一覧を取得
   * @param filters フィルター条件（カテゴリ、タグなど）
   */
  public async getPrompts(filters?: { category?: string, tags?: string[] }): Promise<any[]> {
    try {
      const config = await this._getApiConfig();
      
      // フィルターをクエリパラメータに変換
      let queryParams = '';
      if (filters) {
        const params = new URLSearchParams();
        if (filters.category) {
          params.append('category', filters.category);
        }
        if (filters.tags && filters.tags.length > 0) {
          params.append('tags', filters.tags.join(','));
        }
        queryParams = `?${params.toString()}`;
      }
      
      const response = await axios.get(`${this._baseUrl}/sdk/prompts${queryParams}`, config);
      
      if (response.status === 200 && Array.isArray(response.data.prompts)) {
        return response.data.prompts;
      }
      
      return [];
    } catch (error) {
      console.error('プロンプト一覧の取得に失敗しました:', error);
      this._handleApiError(error);
      return [];
    }
  }

  /**
   * プロンプトの詳細を取得
   * @param promptId プロンプトID
   */
  public async getPromptDetail(promptId: string): Promise<any | null> {
    try {
      const config = await this._getApiConfig();
      const response = await axios.get(`${this._baseUrl}/sdk/prompts/${promptId}`, config);
      
      if (response.status === 200 && response.data.prompt) {
        return response.data.prompt;
      }
      
      return null;
    } catch (error) {
      console.error(`プロンプト詳細の取得に失敗しました (ID: ${promptId}):`, error);
      this._handleApiError(error);
      return null;
    }
  }




  /**
   * 指数バックオフとジッターを用いたリトライ処理
   * @param operation 実行する非同期操作
   * @param maxRetries 最大リトライ回数
   * @param retryableStatusCodes リトライ可能なHTTPステータスコード
   * @param operationName 操作名（ログ用）
   * @returns 操作の結果
   */
  private async _retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    retryableStatusCodes: number[] = [429, 500, 502, 503, 504],
    operationName: string = '操作'
  ): Promise<T> {
    let retries = 0;
    const baseDelay = 1000; // 1秒

    while (true) {
      try {
        return await operation();
      } catch (error) {
        retries++;
        
        // エラーを適切にログに記録
        Logger.error(`【API連携】${operationName}に失敗しました (${retries}回目)`, error as Error);
        
        // リトライ判断
        let shouldRetry = false;
        
        if (axios.isAxiosError(error)) {
          const statusCode = error.response?.status;
          
          // 認証エラーの場合、トークンをリフレッシュしてリトライ
          if (statusCode === 401) {
            Logger.info('【API連携】トークンの有効期限切れ。リフレッシュを試みます');
            let refreshSucceeded = false;

            // SimpleAuthServiceを使用
            if (this._simpleAuthService) {
              const verified = await this._simpleAuthService.verifyAuthState();
              refreshSucceeded = verified;
              Logger.info(`【API連携】SimpleAuthService検証結果: ${verified}`);

              shouldRetry = refreshSucceeded && retries <= maxRetries;

              if (!refreshSucceeded && retries >= maxRetries) {
                // 最大リトライ回数に達し、かつリフレッシュに失敗した場合はログアウト
                Logger.warn('【API連携】トークンリフレッシュに失敗し、最大リトライ回数に達しました。ログアウトします');
                await this._simpleAuthService.logout();
                vscode.window.showErrorMessage('認証の有効期限が切れました。再度ログインしてください。');
              }
            } else {
              Logger.warn('【API連携】SimpleAuthServiceが初期化されていません。認証エラーを処理できません。');
              vscode.window.showErrorMessage('認証の有効期限が切れました。再度ログインしてください。');
              shouldRetry = false;
            }
          }
          // ネットワークエラーまたは特定のステータスコードならリトライ
          else if (!statusCode || retryableStatusCodes.includes(statusCode)) {
            shouldRetry = retries <= maxRetries;
          }
        } else {
          // その他のエラーの場合もリトライ
          shouldRetry = retries <= maxRetries;
        }
        
        // リトライしない場合はエラーを再スロー
        if (!shouldRetry) {
          // ErrorHandlerを使用して詳細なエラー情報を記録
          this._errorHandler.handleError(error, 'ClaudeCodeApiClient');
          throw error;
        }
        
        // 指数バックオフ + ジッター計算
        const delay = baseDelay * Math.pow(2, retries - 1) * (0.5 + Math.random() * 0.5);
        Logger.info(`【API連携】${operationName}を${delay}ms後に再試行します (${retries}/${maxRetries})`);
        
        // 指定時間待機
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * APIエラー処理
   * 認証エラーの場合はトークンリフレッシュを試みる
   */
  private async _handleApiError(error: any): Promise<void> {
    // ErrorHandlerを使用して詳細なエラー情報を記録
    this._errorHandler.handleError(error, 'ClaudeCodeApiClient');

    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;

      if (statusCode === 401) {
        // 認証エラーの場合、トークンリフレッシュを試みる
        Logger.info('【API連携】認証エラー(401)。トークンリフレッシュを試みます');
        let refreshSucceeded = false;

        // SimpleAuthServiceを使用
        if (this._simpleAuthService) {
          const verified = await this._simpleAuthService.verifyAuthState();
          refreshSucceeded = verified;
          Logger.info(`【API連携】SimpleAuthService検証結果: ${verified}`);

          if (!refreshSucceeded) {
            // リフレッシュに失敗した場合はログアウト
            Logger.warn('【API連携】トークンリフレッシュに失敗しました。ログアウトします');
            await this._simpleAuthService.logout();
            vscode.window.showErrorMessage('認証の有効期限が切れました。再度ログインしてください。');
          }
        } else {
          Logger.warn('【API連携】SimpleAuthServiceが初期化されていません。認証エラーを処理できません。');
          vscode.window.showErrorMessage('認証の有効期限が切れました。再度ログインしてください。');
        }
      } else if (statusCode === 403) {
        // 権限エラー
        Logger.warn('【API連携】権限エラー(403): アクセス権限がありません');
        vscode.window.showErrorMessage('この操作を行う権限がありません。');
      } else if (statusCode === 404) {
        // リソースが見つからない
        Logger.warn(`【API連携】リソースが見つかりません(404): ${error.config?.url}`);
        vscode.window.showErrorMessage('リクエストされたリソースが見つかりません。');
      } else if (statusCode && statusCode >= 500) {
        // サーバーエラー
        Logger.error(`【API連携】サーバーエラー(${statusCode}): ${error.config?.url}`, error as Error);
        vscode.window.showErrorMessage(`サーバーエラーが発生しました(${statusCode})。しばらく時間をおいて再試行してください。`);
      } else {
        // その他のエラー
        const errorMessage = error.response?.data?.message
          ? error.response.data.message
          : '不明なエラーが発生しました。';
        
        Logger.error(`【API連携】API呼び出しエラー: ${errorMessage}`, error as Error);
        vscode.window.showErrorMessage(`API呼び出し中にエラーが発生しました: ${errorMessage}`);
      }
    } else {
      // Axiosエラーでない場合
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました。';
      Logger.error(`【API連携】不明なエラー: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
      vscode.window.showErrorMessage(`API呼び出し中にエラーが発生しました: ${errorMessage}`);
    }
  }
  
  /**
   * 公開URLからプロンプトを取得
   * @param url プロンプトの公開URL
   * @returns プロンプト情報
   */
  public async getPromptFromPublicUrl(url: string): Promise<any | null> {
    try {
      return await this._retryWithExponentialBackoff(async () => {
        // URLからトークンを抽出（例: https://example.com/api/prompts/public/abcd1234 からabcd1234を抽出）
        const token = url.split('/').pop();
  
        if (!token) {
          throw new Error('Invalid prompt URL format');
        }
  
        // トークンを使用して公開APIからプロンプト情報を取得
        // 認証不要のため、通常のaxiosインスタンスを使用
        // URLからベースURLを抽出せず、代わりにデフォルトのAPIエンドポイントを使用する
        const baseUrl = this._baseUrl;
        Logger.info(`【API連携】公開プロンプトの取得を開始: ${baseUrl}/prompts/public/${token} (元URL: ${url})`);
        const response = await axios.get(`${baseUrl}/prompts/public/${token}`);
  
        if (response.status === 200 && response.data) {
          Logger.info('【API連携】公開プロンプトの取得が成功しました');
          return response.data;
        }
  
        return null;
      }, 3, [429, 500, 502, 503, 504], '公開プロンプト取得');
    } catch (error) {
      Logger.error(`【API連携】公開URLからのプロンプト取得に失敗しました (URL: ${url})`, error as Error);
      this._handleApiError(error);
      return null;
    }
  }
  
  /**
   * プロンプトの同期情報を取得
   * @returns 同期情報（新しいプロンプト、更新されたプロンプトなど）
   */
  public async getSyncUpdates(): Promise<{ prompts: any[] }> {
    try {
      const config = await this._getApiConfig();
      
      return await this._retryWithExponentialBackoff(async () => {
        Logger.info('【API連携】プロンプト同期情報の取得を開始');
        const response = await axios.get(`${this._baseUrl}/sdk/prompts/sync`, config);
        
        if (response.status === 200 && response.data) {
          Logger.info(`【API連携】プロンプト同期情報の取得が成功しました: ${response.data.prompts?.length || 0}件のプロンプト`);
          return {
            prompts: response.data.prompts || []
          };
        }
        
        return { prompts: [] };
      }, 3, [429, 500, 502, 503, 504], 'プロンプト同期情報取得');
    } catch (error) {
      Logger.error('【API連携】プロンプト同期情報の取得に失敗しました', error as Error);
      this._handleApiError(error);
      return { prompts: [] };
    }
  }


  /**
   * ClaudeCode起動カウンターをインクリメント
   * @param userId ユーザーID
   */
  public async incrementClaudeCodeLaunchCount(userId: string): Promise<any> {
    try {
      // ユーザーIDが無効な場合は早期リターン
      if (!userId) {
        Logger.warn(`【API連携】ClaudeCode起動カウンター: 無効なユーザーID`);
        return null;
      }

      // 認証サービスが初期化されていない場合は警告して処理をスキップ
      if (!this._simpleAuthService) {
        Logger.warn(`【API連携】ClaudeCode起動カウンター: 認証サービスが初期化されていないため、更新をスキップします`);
        return null;
      }

      // ログの簡素化（セキュリティ向上）
      Logger.info(`【API連携】ClaudeCode起動カウンターを更新します`);

      // API設定を取得
      const config = await this._getApiConfig();
      const hasAuthHeader = config?.headers && (config.headers['Authorization'] || config.headers['authorization'] || config.headers['x-api-key']);
      Logger.info(`【デバッグ】API認証ヘッダー: ${hasAuthHeader ? '存在します' : '存在しません'}`);

      // 認証ヘッダーがない場合はスキップ
      if (!hasAuthHeader) {
        Logger.warn(`【API連携】ClaudeCode起動カウンター: 認証ヘッダーがないため、更新をスキップします`);
        return null;
      }

      // APIエンドポイントURL
      const url = `${this._baseUrl}/simple/users/${userId}/increment-claude-code-launch`;

      // APIリクエスト送信
      Logger.info(`【デバッグ】API呼び出し開始`);
      const response = await axios.post(url, {}, config);

      // レスポンス分析
      Logger.info(`【デバッグ】API呼び出しステータス: ${response.status}`);

      if (response.status === 200) {
        const newCount = response.data?.data?.claudeCodeLaunchCount || 'N/A';
        Logger.info(`【API連携】ClaudeCode起動カウンター更新成功: 新しい値=${newCount}`);
        return response.data;
      }

      Logger.warn(`【API連携】ClaudeCode起動カウンター更新：予期しないレスポンス (${response.status})`);
      return null;
    } catch (error) {
      Logger.error('【API連携】ClaudeCode起動カウンター更新エラー');

      // エラーの詳細を分析（センシティブな情報を出力しない）
      if (axios.isAxiosError(error)) {
        if (error.response) {
          Logger.error(`【デバッグ】APIエラー: ステータス=${error.response.status}`);
        } else if (error.request) {
          Logger.error(`【デバッグ】APIエラー: リクエストは送信されましたがレスポンスがありません`);
        } else {
          Logger.error(`【デバッグ】APIエラー: リクエスト設定中にエラーが発生しました`);
        }
      }

      // エラーハンドリングでも例外が発生しないように try-catch で囲む
      try {
        this._handleApiError(error);
      } catch (handlerError) {
        Logger.error('【API連携】エラーハンドラでさらにエラーが発生しました', handlerError as Error);
      }
      return null;
    }
  }
}