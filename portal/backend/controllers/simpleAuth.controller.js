/**
 * シンプルな認証コントローラー
 * ログイン、ログアウト、トークンリフレッシュの処理を行います
 */
const SimpleUser = require('../models/simpleUser.model');
const jwt = require('jsonwebtoken');
// 通常の認証設定ではなく、専用の設定ファイルを使用
const simpleAuthConfig = require('../config/simple-auth.config');
// 認証ヘルパーを追加
const authHelper = require('../utils/simpleAuth.helper');
// AnthropicApiKeyモデルは廃止済み（レガシーコード削除）
// セッション管理サービスを追加
const SessionService = require('../services/session.service');

/**
 * ユーザーログイン
 * @route POST /api/simple/auth/login
 */
exports.login = async (req, res) => {
  try {
    console.log("=============================================================");
    console.log("シンプル認証コントローラー: ログインリクエスト受信");
    console.log("リクエストボディ:", req.body);
    console.log(`ログイン試行: ユーザー=${req.body.email || '未指定'}`);
    console.log("リクエストヘッダー:", {
      contentType: req.headers['content-type'],
      accept: req.headers['accept'],
      origin: req.headers['origin'],
      referer: req.headers['referer']
    });
    console.log("=============================================================");
    
    const { email, password, clientType = 'portal' } = req.body;
    
    // 必須パラメータの検証
    if (!email || !password) {
      console.log("シンプル認証コントローラー: 必須パラメータ欠如");
      return res.status(400).json({
        success: false,
        message: 'メールアドレスとパスワードは必須です'
      });
    }
    
    // クライアントタイプの検証
    const validClientTypes = ['vscode', 'portal', 'cli'];
    if (!validClientTypes.includes(clientType)) {
      console.log("シンプル認証コントローラー: 無効なクライアントタイプ", clientType);
      return res.status(400).json({
        success: false,
        message: '無効なクライアントタイプです'
      });
    }
    
    console.log("ログイン試行: クライアントタイプ=" + clientType);
    
    // ユーザーを検索
    console.log("シンプル認証コントローラー: ユーザー検索", email);
    const user = await SimpleUser.findByEmail(email);
    
    if (!user) {
      console.log("シンプル認証コントローラー: ユーザーが見つかりません");
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }
    
    console.log("シンプル認証コントローラー: ユーザー見つかりました", user.name);
    
    // アカウントが無効化されていないか確認
    if (user.status !== 'active') {
      console.log("シンプル認証コントローラー: アカウント無効", user.status);
      return res.status(401).json({
        success: false,
        message: 'アカウントが無効化されています'
      });
    }
    
    // パスワードを検証
    console.log("シンプル認証コントローラー: パスワード検証開始");
    const isPasswordValid = await user.validatePassword(password);
    
    if (!isPasswordValid) {
      console.log("シンプル認証コントローラー: パスワード不一致");
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }
    
    console.log("シンプル認証コントローラー: パスワード検証に成功");
    
    // クライアントタイプ別のアクティブセッションの確認
    console.log("シンプル認証コントローラー: クライアントタイプ別アクティブセッション確認");
    const hasActiveSessionForClient = await SessionService.hasActiveSessionForClient(user._id, clientType);
    
    if (hasActiveSessionForClient) {
      // 同じクライアントタイプで既存セッションがある場合の処理
      console.log("シンプル認証コントローラー: 同じクライアントタイプで既存のアクティブセッションを検出");
      const sessionInfo = await SessionService.getUserSessionForClient(user._id, clientType);
      
      // 新規ログイン時は既存セッションを即座に無効化（シングルセッション制御）
      console.log(`シンプル認証コントローラー: 既存セッション（${sessionInfo ? sessionInfo.sessionId : 'unknown'}）を新規ログインのため無効化`);
      await SessionService.clearSessionForClient(user._id, clientType);
    }
    
    // セッション作成
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const sessionId = await SessionService.createSessionForClient(user._id, clientType, ipAddress, userAgent);
    console.log("シンプル認証コントローラー: 新規セッション作成", { sessionId, clientType });
    
    // Simple認証専用のアクセストークンを生成（セッションIDを含む）
    console.log("シンプル認証コントローラー: トークン生成開始");
    console.log("シンプル認証コントローラー: シークレットキー", {
      secret: simpleAuthConfig.jwtSecret.substring(0, 5) + '...',
      issuer: simpleAuthConfig.jwtOptions.issuer,
      audience: simpleAuthConfig.jwtOptions.audience
    });
    
    // ヘルパー関数を使用してトークンを生成（セッションIDを含む）
    const accessToken = authHelper.generateAccessToken(user._id, user.role, user.accountStatus, sessionId);
    
    // ヘルパー関数を使用してリフレッシュトークンを生成
    const refreshToken = authHelper.generateRefreshToken(user._id);
    
    // CLI認証の場合、CLI APIキーを自動発行（リフレッシュトークン保存前に実行）
    let cliApiKey = null;
    if (clientType === 'cli') {
      console.log("CLI認証: CLI APIキーを自動発行");
      console.log("CLI認証: clientType確認", clientType);
      console.log("CLI認証: user._id", user._id);
      console.log("CLI認証: user.cliApiKeys数", user.cliApiKeys ? user.cliApiKeys.length : 0);
      try {
        // 最新のユーザー情報を再取得（バージョン競合を避けるため）
        const freshUser = await SimpleUser.findById(user._id);
        console.log("CLI認証: generateCliApiKey呼び出し前");
        cliApiKey = await freshUser.generateCliApiKey();
        console.log("CLI認証: generateCliApiKeyの返り値", cliApiKey);
        console.log("CLI認証: CLI APIキー発行完了", cliApiKey ? cliApiKey.substring(0, 8) + '...' : 'null');
        console.log("CLI認証: cliApiKey変数の値", cliApiKey);
        console.log("CLI認証: typeof cliApiKey", typeof cliApiKey);
        
        // リフレッシュトークンも同じユーザーオブジェクトに保存
        freshUser.refreshToken = refreshToken;
        await freshUser.save();
        
        // 元のuserオブジェクトを更新
        user = freshUser;
      } catch (error) {
        console.error("CLI認証: CLI APIキー発行エラー", error);
        console.error("CLI認証: エラースタック", error.stack);
        console.error("CLI認証: エラー詳細", error.message);
        // エラーが発生した場合は通常のリフレッシュトークン保存を実行
        user.refreshToken = refreshToken;
        await user.save();
      }
    } else {
      // CLI以外の場合は通常通りリフレッシュトークンを保存
      user.refreshToken = refreshToken;
      await user.save();
    }
    
    // CORS対応ヘッダー設定
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    
    // APIキー情報を取得（シンプル化）
    let apiKeyInfo = null;
    if (user.apiKeyValue) {
      apiKeyInfo = {
        keyValue: user.apiKeyValue,
        status: 'active'
      };
    }
    
    // APIキー取得後のログ記録
    console.log("============ シンプル認証コントローラー: ログイン成功 ============");
    console.log(`ログイン成功: ユーザー=${user.name}, メール=${user.email}, ロール=${user.role}, ID=${user._id}`);
    console.log("APIキー情報:", apiKeyInfo ? `状態=${apiKeyInfo.status}` : "なし");
    console.log("CLI APIキー:", cliApiKey ? `発行済み (${cliApiKey.substring(0, 8)}...)` : "なし");
    console.log("==================================================================");
    
    // レスポンス
    const responseData = {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        apiKeyId: user.apiKeyId,
        apiKeyValue: user.apiKeyValue
      },
      apiKey: apiKeyInfo
    };
    
    // CLI認証の場合、CLI APIキーをレスポンスに含める
    console.log("CLI認証: レスポンス構築前", { 
      clientType, 
      cliApiKey: cliApiKey ? 'あり' : 'なし',
      cliApiKeyValue: cliApiKey,
      cliApiKeyType: typeof cliApiKey
    });
    if (clientType === 'cli' && cliApiKey) {
      console.log("CLI認証: cliApiKeyをレスポンスに追加", cliApiKey.substring(0, 8) + '...');
      responseData.cliApiKey = cliApiKey;
    } else if (clientType === 'cli') {
      console.log("CLI認証: cliApiKeyがnullまたはundefinedのためレスポンスに追加されません");
      console.log("CLI認証: cliApiKey詳細", { value: cliApiKey, type: typeof cliApiKey });
    }
    
    console.log("CLI認証: 最終レスポンスデータのキー", Object.keys(responseData));
    console.log("CLI認証: responseData.cliApiKey", responseData.cliApiKey);
    
    return res.status(200).json({
      success: true,
      message: 'ログインに成功しました',
      data: responseData
    });
  } catch (error) {
    console.error('ログインエラー:', error);
    return res.status(500).json({
      success: false,
      message: 'ログイン処理中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * トークンリフレッシュ
 * @route POST /api/simple/auth/refresh-token
 */
exports.refreshToken = async (req, res) => {
  try {
    console.log('refreshToken: リフレッシュトークン処理開始');
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      console.log('refreshToken: リフレッシュトークンがリクエストに含まれていません');
      return res.status(400).json({
        success: false,
        message: 'リフレッシュトークンは必須です'
      });
    }
    
    try {
      // ヘルパー関数を使用してリフレッシュトークンを検証
      console.log('refreshToken: トークン検証開始');
      const decoded = authHelper.verifyRefreshToken(refreshToken);
      console.log('refreshToken: トークン検証成功', { id: decoded.id });
      
      // ユーザーを検索
      console.log('refreshToken: ユーザー検索開始');
      const user = await SimpleUser.findOne({ 
        _id: decoded.id,
        refreshToken: refreshToken,
        status: 'active'
      });
      
      if (!user) {
        console.log('refreshToken: ユーザーが見つかりません');
        return res.status(401).json({
          success: false,
          message: '無効なリフレッシュトークンです'
        });
      }
      
      console.log('refreshToken: ユーザー見つかりました', { id: user._id, role: user.role });
      
      // 既存のセッション情報を取得してトークンに含める（portalクライアント用）
      console.log('refreshToken: 既存セッション情報を取得');
      const activeSession = await SessionService.getUserSessionForClient(user._id, 'portal');
      const sessionId = activeSession ? activeSession.sessionId : null;
      
      // ヘルパーを使用して新しいアクセストークンを生成（セッションIDを含む）
      console.log('refreshToken: 新しいアクセストークン生成', { sessionId });
      const newAccessToken = authHelper.generateAccessToken(user._id, user.role, user.accountStatus, sessionId);
      
      // ヘルパーを使用して新しいリフレッシュトークンを生成
      console.log('refreshToken: 新しいリフレッシュトークン生成');
      const newRefreshToken = authHelper.generateRefreshToken(user._id);
      
      // 新しいリフレッシュトークンをユーザーに保存
      console.log('refreshToken: ユーザーにトークン保存');
      user.refreshToken = newRefreshToken;
      await user.save();
      
      // トークンの一部を出力
      console.log('refreshToken: 生成トークン', {
        accessToken: newAccessToken.substring(0, 15) + '...',
        refreshToken: newRefreshToken.substring(0, 15) + '...'
      });
      
      // CORS対応ヘッダー設定
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
      
      // レスポンス
      console.log('refreshToken: 成功レスポンス送信');
      return res.status(200).json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (jwtError) {
      // JWTエラー処理
      console.error('refreshToken: JWT検証エラー', jwtError);
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'リフレッシュトークンの有効期限が切れています'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: '無効なリフレッシュトークンです'
      });
    }
  } catch (error) {
    console.error('トークンリフレッシュエラー:', error);
    return res.status(500).json({
      success: false,
      message: 'トークンリフレッシュ中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * ログアウト
 * @route POST /api/simple/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    const { refreshToken, clientType = 'portal' } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'リフレッシュトークンは必須です'
      });
    }
    
    // ユーザーを検索してリフレッシュトークンをクリア
    const user = await SimpleUser.findOne({ refreshToken });
    
    if (user) {
      user.refreshToken = null;
      await user.save();
      
      // クライアントタイプ別のセッションをクリア
      await SessionService.clearSessionForClient(user._id, clientType);
      console.log("シンプル認証コントローラー: クライアントタイプ別セッションをクリアしました", { userId: user._id, clientType });
    }
    
    // CORS対応ヘッダー設定
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    
    return res.status(200).json({
      success: true,
      message: 'ログアウトしました'
    });
  } catch (error) {
    console.error('ログアウトエラー:', error);
    return res.status(500).json({
      success: false,
      message: 'ログアウト処理中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * ユーザー登録
 * @route POST /api/simple/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // 必須パラメータの検証
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'ユーザー名、メールアドレス、パスワードは必須です'
      });
    }
    
    // パスワード強度の検証
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'パスワードは8文字以上である必要があります'
      });
    }
    
    // メールアドレスの重複チェック
    const existingUser = await SimpleUser.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'このメールアドレスは既に使用されています'
      });
    }
    
    // ユーザー数の確認（最初のユーザーはSuperAdminに設定）
    const userCount = await SimpleUser.countDocuments();
    const role = userCount === 0 ? 'SuperAdmin' : 'User';
    
    // 新しいユーザーを作成
    const newUser = new SimpleUser({
      name,
      email: email.toLowerCase(),
      password,
      role,
      status: 'active'
    });
    
    // 保存
    await newUser.save();
    
    // ヘルパーを使用してアクセストークンを生成
    const accessToken = authHelper.generateAccessToken(newUser._id, newUser.role, newUser.accountStatus);
    
    // ヘルパーを使用してリフレッシュトークンを生成
    const refreshToken = authHelper.generateRefreshToken(newUser._id);
    
    // リフレッシュトークンをユーザーに保存
    newUser.refreshToken = refreshToken;
    await newUser.save();
    
    // レスポンス
    return res.status(201).json({
      success: true,
      message: 'ユーザー登録に成功しました',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      }
    });
  } catch (error) {
    console.error('ユーザー登録エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'ユーザー登録中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * 認証チェック
 * @route GET /api/simple/auth/check
 */
exports.checkAuth = async (req, res) => {
  try {
    const userId = req.userId;
    
    // ユーザー情報を取得（シンプル実装）
    const user = await SimpleUser.findById(userId, '-password -refreshToken');
    
    // ユーザーが見つからない場合
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }
    
    // ユーザーが無効化または削除された場合
    if (user.status !== 'active' || user.deleted === true) {
      return res.status(401).json({
        success: false,
        message: 'アカウントが無効化または削除されました',
        errorCode: 'ACCOUNT_DELETED'
      });
    }
    
    // CORS対応ヘッダー設定
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    
    // APIキー情報を取得（シンプル化）
    let apiKeyInfo = null;
    if (user.apiKeyValue) {
      apiKeyInfo = {
        keyValue: user.apiKeyValue,
        status: 'active'
      };
    }
    
    // 成功レスポンス
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          apiKeyValue: user.apiKeyValue  // シンプルに
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '認証チェック中にエラーが発生しました'
    });
  }
};

/**
 * CLI専用ログアウト
 * @route POST /api/simple/auth/cli-logout
 */
exports.cliLogout = async (req, res) => {
  try {
    console.log("=============================================================");
    console.log("CLI認証: ログアウトリクエスト受信");
    console.log("ヘッダー:", req.headers);
    console.log("=============================================================");
    
    // APIキーの取得（ヘッダーから）
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      console.log("CLI認証: APIキーが提供されていません");
      return res.status(401).json({
        success: false,
        error: 'API key is required'
      });
    }
    
    // APIキーの形式チェック
    if (!apiKey.startsWith('CLI_')) {
      console.log("CLI認証: 不正なAPIキー形式");
      return res.status(401).json({
        success: false,
        error: 'Invalid API key format'
      });
    }
    
    // ユーザーを検索
    console.log("CLI認証: APIキーでユーザー検索");
    const user = await SimpleUser.findByCliApiKey(apiKey);
    
    if (!user) {
      console.log("CLI認証: 有効なユーザーが見つかりません");
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }
    
    console.log(`CLI認証: ログアウト処理開始 - ユーザー: ${user.name} (${user._id})`);
    
    // CLI APIキーを無効化
    try {
      await user.deactivateCliApiKey(apiKey);
      console.log("CLI認証: APIキー無効化完了");
    } catch (error) {
      console.error("CLI認証: APIキー無効化エラー", error);
      // エラーが発生してもログアウト処理は継続
    }
    
    // CLIセッションをクリア
    try {
      await SessionService.clearSessionForClient(user._id, 'cli');
      console.log("CLI認証: CLIセッションクリア完了");
    } catch (error) {
      console.error("CLI認証: セッションクリアエラー", error);
      // エラーが発生してもログアウト処理は継続
    }
    
    console.log("============ CLI認証: ログアウト完了 ============");
    console.log(`ログアウト完了: ユーザー=${user.name}, メール=${user.email}`);
    console.log("================================================");
    
    // CORS対応ヘッダー設定
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,X-API-Key');
    
    return res.status(200).json({
      success: true,
      message: 'CLI logout successful'
    });
  } catch (error) {
    console.error('CLI認証: ログアウトエラー:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during logout',
      message: error.message
    });
  }
};

/**
 * ユーザーのAnthropicAPIキーを取得
 * @route GET /api/simple/user/anthropic-api-key
 */
exports.getUserAnthropicApiKey = async (req, res) => {
  try {
    const userId = req.userId;
    
    // ユーザー情報を取得
    const user = await SimpleUser.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }
    
    // APIキー情報を取得（シンプル化）
    let apiKeyData = null;
    if (user.apiKeyValue) {
      apiKeyData = {
        apiKeyFull: user.apiKeyValue,
        keyHint: user.apiKeyValue.substring(0, 5) + '...',
        status: 'active'
      };
      console.log(`anthropic-api-key エンドポイントがユーザー ${user.name} (${user._id}) のAPIキーを取得しました`);
    }
    
    // APIキーが見つからない場合
    if (!apiKeyData) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーにAPIキーが設定されていません'
      });
    }
    
    // CORS対応ヘッダー設定
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    
    // 成功レスポンス
    return res.status(200).json({
      success: true,
      data: apiKeyData
    });
  } catch (error) {
    console.error('Anthropic APIキー取得エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'APIキーの取得中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * 強制ログイン（既存セッションを終了して新規ログイン）
 * @route POST /api/simple/auth/force-login
 */
exports.forceLogin = async (req, res) => {
  try {
    console.log("=============================================================");
    console.log("シンプル認証コントローラー: 強制ログインリクエスト受信");
    console.log("リクエストボディ:", req.body);
    console.log(`強制ログイン試行: ユーザー=${req.body.email || '未指定'}`);
    console.log("=============================================================");
    
    const { email, password, forceLogin } = req.body;
    
    // 必須パラメータの検証
    if (!email || !password) {
      console.log("シンプル認証コントローラー: 必須パラメータ欠如");
      return res.status(400).json({
        success: false,
        message: 'メールアドレスとパスワードは必須です'
      });
    }
    
    // forceLoginフラグの確認
    if (!forceLogin) {
      console.log("シンプル認証コントローラー: 強制ログインフラグが無効");
      return res.status(400).json({
        success: false,
        message: '強制ログインフラグが設定されていません'
      });
    }
    
    // ユーザーを検索
    console.log("シンプル認証コントローラー: ユーザー検索", email);
    const user = await SimpleUser.findByEmail(email);
    
    if (!user) {
      console.log("シンプル認証コントローラー: ユーザーが見つかりません");
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }
    
    console.log("シンプル認証コントローラー: ユーザー見つかりました", user.name);
    
    // アカウントが無効化されていないか確認
    if (user.status !== 'active') {
      console.log("シンプル認証コントローラー: アカウント無効", user.status);
      return res.status(401).json({
        success: false,
        message: 'アカウントが無効化されています'
      });
    }
    
    // パスワードを検証
    console.log("シンプル認証コントローラー: パスワード検証開始");
    const isPasswordValid = await user.validatePassword(password);
    
    if (!isPasswordValid) {
      console.log("シンプル認証コントローラー: パスワード不一致");
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }
    
    console.log("シンプル認証コントローラー: パスワード検証に成功");
    
    // 既存セッションを強制終了して新しいセッションを作成
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const { newSessionId, previousSession } = await SessionService.forceCreateSession(user._id, ipAddress, userAgent);
    console.log("シンプル認証コントローラー: 強制的に新規セッション作成", newSessionId);
    
    // Simple認証専用のアクセストークンを生成（セッションIDを含む）
    const accessToken = authHelper.generateAccessToken(user._id, user.role, user.accountStatus, newSessionId);
    
    // ヘルパー関数を使用してリフレッシュトークンを生成
    const refreshToken = authHelper.generateRefreshToken(user._id);
    
    // リフレッシュトークンをユーザーに保存
    user.refreshToken = refreshToken;
    await user.save();
    
    // CORS対応ヘッダー設定
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    
    // APIキー情報を取得（通常のログインと同じロジック）
    let apiKeyInfo = null;
    
    // 新方式：ユーザーに直接保存されているAPIキー値を優先
    if (user.apiKeyValue) {
      apiKeyInfo = {
        id: user.apiKeyId || 'direct_key',
        keyValue: user.apiKeyValue,
        status: 'active'
      };
    }
    
    console.log("============ シンプル認証コントローラー: 強制ログイン成功 ============");
    console.log(`強制ログイン成功: ユーザー=${user.name}, メール=${user.email}, ロール=${user.role}, ID=${user._id}`);
    console.log("前のセッション情報:", previousSession ? `セッションID=${previousSession.sessionId}` : "なし");
    console.log("==================================================================");
    
    // レスポンス
    return res.status(200).json({
      success: true,
      message: '強制ログインに成功しました',
      previousSessionTerminated: !!previousSession,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          apiKeyId: user.apiKeyId,
          apiKeyValue: user.apiKeyValue
        },
        apiKey: apiKeyInfo
      }
    });
  } catch (error) {
    console.error('強制ログインエラー:', error);
    return res.status(500).json({
      success: false,
      message: '強制ログイン処理中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * CLI APIキー認証
 * @route POST /api/simple/auth/cli-verify
 */
exports.cliVerify = async (req, res) => {
  try {
    console.log("=============================================================");
    console.log("CLI認証: APIキー検証リクエスト受信");
    console.log("ヘッダー:", req.headers);
    console.log("=============================================================");
    
    // APIキーの取得（ヘッダーから）
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      console.log("CLI認証: APIキーが提供されていません");
      return res.status(401).json({
        success: false,
        error: 'API key is required'
      });
    }
    
    // APIキーの形式チェック
    if (!apiKey.startsWith('CLI_')) {
      console.log("CLI認証: 不正なAPIキー形式");
      return res.status(401).json({
        success: false,
        error: 'Invalid API key format'
      });
    }
    
    // ユーザーを検索
    console.log("CLI認証: APIキーでユーザー検索");
    const user = await SimpleUser.findByCliApiKey(apiKey);
    
    if (!user) {
      console.log("CLI認証: 有効なユーザーが見つかりません");
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }
    
    // ユーザーステータスチェック
    if (user.status !== 'active') {
      console.log("CLI認証: ユーザーが無効化されています");
      return res.status(403).json({
        success: false,
        error: 'User is disabled'
      });
    }
    
    // APIキーの最終使用日時を更新
    await user.updateCliApiKeyUsage(apiKey);
    
    console.log("============ CLI認証: 認証成功 ============");
    console.log(`認証成功: ユーザー=${user.name}, メール=${user.email}, ロール=${user.role}`);
    console.log("=========================================");
    
    // レスポンス
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('CLI認証エラー:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};