/**
 * CLI認証コントローラー
 * CLI専用の認証処理を行うコントローラー
 * P-004: CLIトークン発行API完成
 */
const SimpleUser = require('../models/simpleUser.model');
const CliTokenService = require('../services/cli-token.service');
const bcrypt = require('bcryptjs');

/**
 * CLIログイン - メール/パスワード認証後のCLIトークン生成
 * @route POST /api/cli/login
 */
exports.cliLogin = async (req, res) => {
  try {
    console.log("=============================================================");
    console.log("CLI認証コントローラー: CLIログインリクエスト受信");
    console.log("リクエストボディ:", req.body);
    console.log("リクエストヘッダー:", {
      contentType: req.headers['content-type'],
      accept: req.headers['accept'],
      userAgent: req.headers['user-agent'],
      origin: req.headers['origin']
    });
    console.log("=============================================================");
    
    const { email, password, deviceInfo = {} } = req.body;
    
    // 必須パラメータの検証
    if (!email || !password) {
      console.log("CLI認証コントローラー: 必須パラメータ欠如");
      return res.status(400).json({
        success: false,
        message: 'メールアドレスとパスワードは必須です',
        error: 'MISSING_CREDENTIALS'
      });
    }
    
    // メールアドレス形式の検証
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      console.log("CLI認証コントローラー: 無効なメールアドレス形式");
      return res.status(400).json({
        success: false,
        message: '有効なメールアドレスを入力してください',
        error: 'INVALID_EMAIL_FORMAT'
      });
    }
    
    // ユーザー検索
    console.log("CLI認証コントローラー: ユーザー検索開始", { email });
    const user = await SimpleUser.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log("CLI認証コントローラー: ユーザーが見つかりません");
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません',
        error: 'INVALID_CREDENTIALS'
      });
    }
    
    // アカウントステータス確認
    if (user.status !== 'active') {
      console.log("CLI認証コントローラー: アカウントが無効", { status: user.status });
      return res.status(401).json({
        success: false,
        message: 'アカウントが無効になっています',
        error: 'ACCOUNT_DISABLED'
      });
    }
    
    // セキュリティステータス確認（ハニーポット検知によるブロック）
    if (user.securityStatus && user.securityStatus.isBlocked) {
      console.log("CLI認証コントローラー: セキュリティ違反によりブロック", { 
        userEmail: user.email,
        blockedAt: user.securityStatus.blockedAt,
        reason: user.securityStatus.blockReason
      });
      
      return res.status(403).json({
        success: false,
        message: 'アカウントが制限されています',
        error: 'ACCOUNT_BLOCKED',
        details: {
          reason: user.securityStatus.blockReason || 'セキュリティ違反が検出されました',
          canAppeal: user.securityStatus.canAppeal || false,
          appealUrl: 'https://bluelamp.ai/support/appeal'
        }
      });
    }
    
    // パスワード検証
    console.log("CLI認証コントローラー: パスワード検証開始");
    const isPasswordValid = await user.validatePassword(password);
    
    if (!isPasswordValid) {
      console.log("CLI認証コントローラー: パスワード検証失敗");
      return res.status(401).json({
        success: false,
        message: 'メールアドレスまたはパスワードが正しくありません',
        error: 'INVALID_CREDENTIALS'
      });
    }
    
    console.log("CLI認証コントローラー: 認証成功、CLIトークン生成開始");
    
    // デバイス情報の補完
    const enrichedDeviceInfo = {
      ...deviceInfo,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };
    
    // CLIトークン生成
    const tokenData = await CliTokenService.generateToken(
      user._id,
      enrichedDeviceInfo,
      {
        expirationDays: 7, // 7日間有効
        revokeExisting: true // 既存トークンを無効化
      }
    );
    
    console.log("CLI認証コントローラー: CLIトークン生成完了", {
      userId: user._id,
      tokenId: tokenData.tokenId,
      expiresAt: tokenData.expiresAt
    });
    
    // レスポンス形式（P-004要件）
    const response = {
      success: true,
      message: 'CLIログインが成功しました',
      data: {
        token: tokenData.token,
        userId: user._id.toString(),
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        expiresIn: tokenData.expiresIn, // 秒単位
        expiresAt: tokenData.expiresAt.toISOString(),
        deviceInfo: tokenData.deviceInfo
      }
    };
    
    console.log("CLI認証コントローラー: レスポンス送信", {
      success: true,
      userId: user._id,
      expiresIn: tokenData.expiresIn
    });
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error("CLI認証コントローラー: CLIログインエラー", error);
    
    // エラーの詳細をログに記録
    console.error("エラー詳細:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'サーバー内部エラーが発生しました',
      error: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
};

/**
 * CLIトークン検証
 * @route POST /api/cli/verify
 */
exports.cliVerify = async (req, res) => {
  try {
    console.log("CLI認証コントローラー: CLIトークン検証リクエスト受信");
    
    const { token } = req.body;
    const authHeader = req.headers.authorization;
    
    // トークンの取得（ボディまたはヘッダーから）
    let cliToken = token;
    if (!cliToken && authHeader && authHeader.startsWith('Bearer ')) {
      cliToken = authHeader.substring(7);
    }
    if (!cliToken && req.headers['x-cli-token']) {
      cliToken = req.headers['x-cli-token'];
    }
    
    if (!cliToken) {
      console.log("CLI認証コントローラー: トークンが提供されていません");
      return res.status(400).json({
        success: false,
        message: 'CLIトークンが必要です',
        error: 'MISSING_TOKEN'
      });
    }
    
    // トークン検証
    console.log("CLI認証コントローラー: トークン検証開始");
    const verificationResult = await CliTokenService.verifyToken(cliToken);
    
    if (!verificationResult || !verificationResult.isValid) {
      console.log("CLI認証コントローラー: トークン検証失敗");
      return res.status(401).json({
        success: false,
        message: 'CLIトークンが無効です',
        error: 'INVALID_TOKEN'
      });
    }
    
    const { user, token: tokenDoc } = verificationResult;
    
    console.log("CLI認証コントローラー: トークン検証成功", {
      userId: user._id,
      tokenId: tokenDoc._id
    });
    
    // レスポンス
    res.status(200).json({
      success: true,
      message: 'CLIトークンが有効です',
      data: {
        userId: user._id.toString(),
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        tokenValid: true,
        expiresAt: tokenDoc.expiresAt.toISOString(),
        remainingTime: tokenDoc.remainingTime,
        lastUsed: tokenDoc.lastUsed ? tokenDoc.lastUsed.toISOString() : null
      }
    });
    
  } catch (error) {
    console.error("CLI認証コントローラー: CLIトークン検証エラー", error);
    
    res.status(500).json({
      success: false,
      message: 'サーバー内部エラーが発生しました',
      error: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
};

/**
 * CLIログアウト - トークン無効化
 * @route POST /api/cli/logout
 */
exports.cliLogout = async (req, res) => {
  try {
    console.log("CLI認証コントローラー: CLIログアウトリクエスト受信");
    
    const { token } = req.body;
    const authHeader = req.headers.authorization;
    
    // トークンの取得
    let cliToken = token;
    if (!cliToken && authHeader && authHeader.startsWith('Bearer ')) {
      cliToken = authHeader.substring(7);
    }
    if (!cliToken && req.headers['x-cli-token']) {
      cliToken = req.headers['x-cli-token'];
    }
    
    if (!cliToken) {
      console.log("CLI認証コントローラー: トークンが提供されていません");
      return res.status(400).json({
        success: false,
        message: 'CLIトークンが必要です',
        error: 'MISSING_TOKEN'
      });
    }
    
    // トークン無効化
    console.log("CLI認証コントローラー: トークン無効化開始");
    const revoked = await CliTokenService.revokeToken(cliToken, 'logout');
    
    if (!revoked) {
      console.log("CLI認証コントローラー: トークンが見つかりません");
      return res.status(404).json({
        success: false,
        message: 'CLIトークンが見つかりません',
        error: 'TOKEN_NOT_FOUND'
      });
    }
    
    console.log("CLI認証コントローラー: CLIログアウト成功");
    
    res.status(200).json({
      success: true,
      message: 'CLIログアウトが成功しました'
    });
    
  } catch (error) {
    console.error("CLI認証コントローラー: CLIログアウトエラー", error);
    
    res.status(500).json({
      success: false,
      message: 'サーバー内部エラーが発生しました',
      error: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
};

/**
 * ユーザーのCLIトークン一覧取得
 * @route GET /api/cli/tokens
 */
exports.getUserCliTokens = async (req, res) => {
  try {
    console.log("CLI認証コントローラー: ユーザーCLIトークン一覧取得リクエスト受信");
    
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDが必要です',
        error: 'MISSING_USER_ID'
      });
    }
    
    // トークン一覧取得
    const tokens = await CliTokenService.getUserTokens(userId);
    
    console.log("CLI認証コントローラー: トークン一覧取得完了", {
      userId,
      tokenCount: tokens.length
    });
    
    res.status(200).json({
      success: true,
      message: 'CLIトークン一覧を取得しました',
      data: {
        tokens: tokens.map(token => ({
          id: token._id.toString(),
          createdAt: token.createdAt.toISOString(),
          expiresAt: token.expiresAt.toISOString(),
          lastUsed: token.lastUsed ? token.lastUsed.toISOString() : null,
          usageCount: token.usageCount,
          deviceInfo: token.deviceInfo,
          isActive: token.isActive,
          remainingTime: token.remainingTime,
          remainingTimeHuman: token.remainingTimeHuman
        }))
      }
    });
    
  } catch (error) {
    console.error("CLI認証コントローラー: ユーザーCLIトークン一覧取得エラー", error);
    
    res.status(500).json({
      success: false,
      message: 'サーバー内部エラーが発生しました',
      error: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
};

/**
 * CLIトークン統計情報取得
 * @route GET /api/cli/stats
 */
exports.getCliTokenStats = async (req, res) => {
  try {
    console.log("CLI認証コントローラー: CLIトークン統計情報取得リクエスト受信");
    
    const { userId } = req.query;
    
    // 統計情報取得
    const stats = await CliTokenService.getTokenStats(userId);
    
    console.log("CLI認証コントローラー: 統計情報取得完了", stats);
    
    res.status(200).json({
      success: true,
      message: 'CLIトークン統計情報を取得しました',
      data: stats
    });
    
  } catch (error) {
    console.error("CLI認証コントローラー: CLIトークン統計情報取得エラー", error);
    
    res.status(500).json({
      success: false,
      message: 'サーバー内部エラーが発生しました',
      error: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
};