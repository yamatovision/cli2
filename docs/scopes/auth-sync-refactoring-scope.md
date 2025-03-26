# 認証状態同期リファクタリングスコープ

## 概要

AppGeniusの認証システムにおいて、SimpleAuthServiceとPermissionManagerの間で認証状態が適切に同期されないことがある問題が発見されました。この問題により、ログイン成功後もスコープマネージャーなどの機能へのアクセスが拒否されることがあります。このスコープでは、認証状態の同期機構を根本的にリファクタリングし、より堅牢かつシンプルな実装を行います。

## 目的

- 認証状態の管理と同期を一元化し、複数のコンポーネント間での整合性を確保する
- 複雑化したSimpleAuthServiceを責務ごとに分割し、保守性と拡張性を向上させる
- 明示的な認証状態の更新パターンを導入し、イベント伝播を確実にする
- ログイン・ログアウト・権限チェック時のエラーを削減する

## 作業範囲

1. 認証状態管理の中央集権化
   - AuthStateManagerの作成と実装
   - グローバル状態アクセスの安全なパターン導入

2. SimpleAuthServiceの分割
   - AuthStateManager - 認証状態の一元管理
   - TokenStorage - トークン保存処理の分離
   - ApiKeyManager - APIキー管理の分離
   - AuthEventBus - イベント管理の中央化

3. PermissionManagerの改善
   - 認証状態の取得方法の改善
   - イベント購読メカニズムの強化

4. 統合テストの追加
   - 認証状態同期のテストケース追加
   - エッジケース検証の強化

## 技術的アプローチ

### AuthStateManagerの実装

```typescript
// 認証状態を一元管理するためのシングルトンクラス
export class AuthStateManager {
  private static instance: AuthStateManager;
  private _currentState: AuthState;
  private _onStateChanged = new vscode.EventEmitter<AuthState>();
  
  // 公開イベント
  public readonly onStateChanged = this._onStateChanged.event;
  
  private constructor() {
    this._currentState = AuthStateBuilder.guest().build();
  }
  
  public static getInstance(): AuthStateManager {
    if (!AuthStateManager.instance) {
      AuthStateManager.instance = new AuthStateManager();
    }
    return AuthStateManager.instance;
  }
  
  // 認証状態の更新 - すべての状態更新はここを通す
  public updateState(newState: AuthState): void {
    const oldState = this._currentState;
    this._currentState = newState;
    
    // グローバル状態に保存（デバッグおよび複数インスタンス間での共有用）
    // @ts-ignore - グローバル変数への代入
    global._appgenius_auth_state = newState;
    
    // イベント発火
    this._onStateChanged.fire(newState);
    
    // 詳細なログ出力
    Logger.info(`AuthStateManager: 認証状態更新 [${oldState.isAuthenticated} => ${newState.isAuthenticated}]`);
    if (newState.isAuthenticated) {
      Logger.info(`AuthStateManager: 認証状態詳細 - ユーザー=${newState.username}, ロール=${newState.role}, 有効期限=${new Date(newState.expiresAt || 0).toISOString()}`);
    }
  }
  
  // 現在の認証状態を取得
  public getCurrentState(): AuthState {
    return this._currentState;
  }
  
  // ゲスト状態にリセット
  public resetToGuest(): void {
    this.updateState(AuthStateBuilder.guest().build());
  }
}
```

### TokenStorage実装

```typescript
// トークン保存処理を担当するクラス
export class TokenStorage {
  private static instance: TokenStorage;
  private _secretStorage: vscode.SecretStorage;
  
  // ストレージキー
  private readonly ACCESS_TOKEN_KEY = 'appgenius.accessToken';
  private readonly REFRESH_TOKEN_KEY = 'appgenius.refreshToken';
  private readonly TOKEN_EXPIRY_KEY = 'appgenius.tokenExpiry';
  
  private constructor(context: vscode.ExtensionContext) {
    this._secretStorage = context.secrets;
  }
  
  public static getInstance(context?: vscode.ExtensionContext): TokenStorage {
    if (!TokenStorage.instance) {
      if (!context) {
        throw new Error('TokenStorageの初期化時にはExtensionContextが必要です');
      }
      TokenStorage.instance = new TokenStorage(context);
    }
    return TokenStorage.instance;
  }
  
  // トークンの保存
  public async saveTokens(accessToken: string, refreshToken: string, expiryInSeconds: number): Promise<void> {
    try {
      const expiryTimestamp = Date.now() + (expiryInSeconds * 1000);
      
      await this._secretStorage.store(this.ACCESS_TOKEN_KEY, accessToken);
      await this._secretStorage.store(this.REFRESH_TOKEN_KEY, refreshToken);
      await this._secretStorage.store(this.TOKEN_EXPIRY_KEY, expiryTimestamp.toString());
      
      Logger.info('TokenStorage: トークン保存完了');
      return true;
    } catch (error) {
      Logger.error('TokenStorage: トークン保存エラー', error as Error);
      throw error;
    }
  }
  
  // トークンの読み込み
  public async loadTokens(): Promise<{accessToken?: string, refreshToken?: string, expiry?: number}> {
    try {
      const accessToken = await this._secretStorage.get(this.ACCESS_TOKEN_KEY) || undefined;
      const refreshToken = await this._secretStorage.get(this.REFRESH_TOKEN_KEY) || undefined;
      const expiryStr = await this._secretStorage.get(this.TOKEN_EXPIRY_KEY);
      const expiry = expiryStr ? parseInt(expiryStr, 10) : undefined;
      
      return { accessToken, refreshToken, expiry };
    } catch (error) {
      Logger.error('TokenStorage: トークン読み込みエラー', error as Error);
      return {};
    }
  }
  
  // トークンのクリア
  public async clearTokens(): Promise<void> {
    try {
      await this._secretStorage.delete(this.ACCESS_TOKEN_KEY);
      await this._secretStorage.delete(this.REFRESH_TOKEN_KEY);
      await this._secretStorage.delete(this.TOKEN_EXPIRY_KEY);
      
      Logger.info('TokenStorage: トークンクリア完了');
    } catch (error) {
      Logger.error('TokenStorage: トークンクリアエラー', error as Error);
    }
  }
}
```

### ApiKeyManager実装

```typescript
// APIキー管理を担当するクラス
export class ApiKeyManager {
  private static instance: ApiKeyManager;
  private _secretStorage: vscode.SecretStorage;
  private _apiKey: string | undefined;
  
  // ストレージキー
  private readonly API_KEY_DATA_KEY = 'appgenius.apiKey';
  
  private constructor(context: vscode.ExtensionContext) {
    this._secretStorage = context.secrets;
  }
  
  public static getInstance(context?: vscode.ExtensionContext): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      if (!context) {
        throw new Error('ApiKeyManagerの初期化時にはExtensionContextが必要です');
      }
      ApiKeyManager.instance = new ApiKeyManager(context);
    }
    return ApiKeyManager.instance;
  }
  
  // APIキーの保存
  public async saveApiKey(apiKey: string): Promise<void> {
    try {
      this._apiKey = apiKey;
      await this._secretStorage.store(this.API_KEY_DATA_KEY, apiKey);
      
      const maskedKey = apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 4);
      Logger.info(`ApiKeyManager: APIキー保存完了 (${maskedKey})`);
    } catch (error) {
      Logger.error('ApiKeyManager: APIキー保存エラー', error as Error);
      throw error;
    }
  }
  
  // APIキーの読み込み
  public async loadApiKey(): Promise<string | undefined> {
    try {
      const apiKey = await this._secretStorage.get(this.API_KEY_DATA_KEY) || undefined;
      if (apiKey) {
        this._apiKey = apiKey;
        const maskedKey = apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 4);
        Logger.info(`ApiKeyManager: APIキー読み込み完了 (${maskedKey})`);
      }
      return apiKey;
    } catch (error) {
      Logger.error('ApiKeyManager: APIキー読み込みエラー', error as Error);
      return undefined;
    }
  }
  
  // メモリ内のAPIキー取得（キャッシュ）
  public getApiKey(): string | undefined {
    return this._apiKey;
  }
  
  // APIキーのクリア
  public async clearApiKey(): Promise<void> {
    try {
      this._apiKey = undefined;
      await this._secretStorage.delete(this.API_KEY_DATA_KEY);
      
      Logger.info('ApiKeyManager: APIキークリア完了');
    } catch (error) {
      Logger.error('ApiKeyManager: APIキークリアエラー', error as Error);
    }
  }
}
```

### PermissionManager改善

```typescript
// 既存のPermissionManagerを改善
export class PermissionManager {
  // ... 既存のコード ...
  
  /**
   * 認証状態変更ハンドラー
   */
  private _handleAuthStateChanged(): void {
    try {
      // AuthStateManagerから直接最新の状態を取得
      const authStateManager = AuthStateManager.getInstance();
      const currentState = authStateManager.getCurrentState();
      
      // 詳細ログ出力
      Logger.info(`PermissionManager: 認証状態変更を検知しました - 認証状態=${currentState.isAuthenticated}, ユーザー=${currentState.username || 'なし'}, ロール=${currentState.role}`);
      
      // 権限変更イベントを発行
      this._onPermissionsChanged.fire();
      Logger.info(`PermissionManager: 権限変更イベントを発行しました - 認証状態=${currentState.isAuthenticated}, ロール=${currentState.role}`);
    } catch (error) {
      Logger.error('PermissionManager: 認証状態変更ハンドリング中にエラーが発生しました', error as Error);
    }
  }
  
  /**
   * 特定機能へのアクセス権限を確認
   */
  public canAccess(feature: Feature): boolean {
    try {
      // AuthStateManagerから直接取得
      const authStateManager = AuthStateManager.getInstance();
      const state = authStateManager.getCurrentState();
      
      // 詳細なログ出力
      Logger.info(`PermissionManager: 権限チェック - 機能=${feature}, 認証状態=${state.isAuthenticated}, ユーザー=${state.username || 'なし'}, ロール=${state.role}, ユーザーID=${state.userId || 'なし'}`);
      
      // 以下は既存コードと同じ...
    } catch (error) {
      Logger.error(`PermissionManager: 権限チェック中にエラーが発生しました`, error as Error);
      return false;
    }
  }
}
```

### 統合テスト

```typescript
// 認証状態同期のテスト
describe('認証状態同期テスト', () => {
  let authStateManager: AuthStateManager;
  let permissionManager: PermissionManager;
  
  beforeEach(() => {
    // テスト環境のセットアップ
    // ...
  });
  
  test('ログイン後にPermissionManagerが認証状態を認識する', async () => {
    // 認証状態変更のモック
    const newState = new AuthStateBuilder()
      .setAuthenticated(true)
      .setUserId('test-user')
      .setUsername('Test User')
      .setRole(Role.USER)
      .build();
    
    // 状態更新
    authStateManager.updateState(newState);
    
    // イベント伝播のための小さな遅延
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // PermissionManagerが正しくアクセス権限を計算することを検証
    expect(permissionManager.canAccess(Feature.SCOPE_MANAGER)).toBe(true);
    expect(permissionManager.isLoggedIn()).toBe(true);
    expect(permissionManager.getCurrentRole()).toBe(Role.USER);
  });
  
  test('ログアウト後にPermissionManagerが認証状態を認識する', async () => {
    // まずログイン状態に
    const loginState = new AuthStateBuilder()
      .setAuthenticated(true)
      .setUserId('test-user')
      .setUsername('Test User')
      .setRole(Role.USER)
      .build();
    
    authStateManager.updateState(loginState);
    
    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // ログアウト状態に
    authStateManager.resetToGuest();
    
    // イベント伝播のための小さな遅延
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // PermissionManagerが正しくアクセス権限を計算することを検証
    expect(permissionManager.canAccess(Feature.SCOPE_MANAGER)).toBe(false);
    expect(permissionManager.isLoggedIn()).toBe(false);
    expect(permissionManager.getCurrentRole()).toBe(Role.GUEST);
  });
});
```

## 変更するファイル

1. **新規ファイル**
   - src/core/auth/AuthStateManager.ts - 認証状態の一元管理
   - src/core/auth/TokenStorage.ts - トークン保存処理
   - src/core/auth/ApiKeyManager.ts - APIキー管理
   - src/core/auth/AuthEventBus.ts - 認証イベント管理
   - test/unit/auth/authStateSync.test.ts - 認証状態同期のテスト

2. **修正するファイル**
   - src/core/auth/SimpleAuthService.ts - 既存の認証サービス
   - src/core/auth/PermissionManager.ts - 権限管理
   - src/core/auth/TokenManager.ts - トークン管理
   - src/services/ClaudeCodeAuthSync.ts - ClaudeCode認証連携
   - src/ui/auth/AuthStatusBar.ts - 認証状態表示

## 実装の優先順位

1. AuthStateManagerの実装
2. TokenStorageの実装 
3. ApiKeyManagerの実装
4. 既存のSimpleAuthServiceの修正
5. PermissionManagerの修正
6. 統合テストの追加

## 検証方法

1. 自動テストによる検証
   - 認証状態更新時のイベント伝播テスト
   - 状態変更後のPermissionManager挙動テスト
   - エッジケースでの安定性テスト

2. 手動テスト
   - ログイン・ログアウトのワークフローテスト
   - スコープマネージャーへのアクセステスト
   - VSCodeとClaudeCode間の認証連携テスト

## 期待される結果

- ログイン後に適切な権限が即座に反映される
- スコープマネージャーなどの機能へのアクセスが安定する
- シンプルな状態管理による可読性と保守性の向上
- 認証関連のコンポーネント間での状態の整合性が確保される
- エラーログと診断情報の品質向上

## 完了の定義

- 全ての自動テストが合格
- 手動テストでログイン後のスコープマネージャーアクセスが100%成功
- コードレビューで設計の改善が確認される
- リファクタリングによる副作用がないことの確認