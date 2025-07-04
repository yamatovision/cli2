/**
 * CLI認証ミドルウェア
 * CLIトークンによる認証を行うミドルウェア
 * P-007: 認証付きプロンプト取得API用
 */
const CliTokenService = require('../services/cli-token.service');
const HoneypotService = require('../services/honeypot.service');

/**
 * CLIトークン認証ミドルウェア
 * X-CLI-Token ヘッダーからトークンを取得し、検証する
 */
const verifyCliToken = async (req, res, next) => {
  try {
    // ハニーポット検知を先に実行
    // APIキーを様々な場所から取得
    const apiKey = req.headers['x-api-key'] || 
                  req.headers['authorization']?.replace('Bearer ', '') ||
                  req.body?.apiKey ||
                  req.query?.apiKey ||
                  req.params?.apiKey;
    
    // トラップキーかチェック
    if (apiKey && HoneypotService.isTrapKey(apiKey)) {
      console.log('🍯 ハニーポットキーを検出:', apiKey.substring(0, 10) + '...');
      
      // トラップ処理を非同期で実行
      HoneypotService.handleTrapTriggered(req, apiKey).catch(err => {
        console.error('トラップ処理エラー:', err);
      });
      
      // 「当たり」トラップキーの場合のみハニーポットモードを有効化
      if (HoneypotService.isWinningTrapKey(apiKey)) {
        console.log('✨ 「当たり」トラップキー！偽プロンプトを返します');
        
        // リクエストにハニーポットフラグを設定
        req.isHoneypot = true;
        req.trapKey = apiKey;
        
        // ユーザー情報をダミーで設定（認証をスキップ）
        req.user = {
          _id: 'trap-user-' + Date.now(),
          email: 'trap@honeypot.local',
          name: 'Trap User'
        };
        
        req.tokenData = {
          userId: req.user._id,
          tokenId: 'trap-token-' + Date.now(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isValid: true
        };
        
        // 正常に処理を続行（偽プロンプトを返す）
        return next();
      } else {
        // 「外れ」トラップキーの場合はエラーを返す
        console.log('❌ 「外れ」トラップキー！エラーを返します');
        
        // リアルなエラーパターンをランダムに選択
        const errorPatterns = [
          { status: 401, error: 'INVALID_API_KEY', message: 'Invalid API key format' },
          { status: 403, error: 'API_KEY_REVOKED', message: 'This API key has been revoked' },
          { status: 403, error: 'SUBSCRIPTION_REQUIRED', message: 'This feature requires a paid subscription' },
          { status: 429, error: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Please try again later' }
        ];
        
        const errorResponse = errorPatterns[Math.floor(Math.random() * errorPatterns.length)];
        
        return res.status(errorResponse.status).json({
          success: false,
          error: errorResponse.error,
          message: errorResponse.message
        });
      }
    }
    
    // ヘッダーからトークンを取得
    const token = req.headers['x-cli-token'];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'CLIトークンが提供されていません'
      });
    }
    
    // 特定のダミーキーの場合は別処理
    if (token === 'bluelamp_cli_token_x9y8z7w6v5u4t3s2') {
      console.log('✨ ダミーキーを検出！偽プロンプトを返します');
      
      // ハニーポットモードを有効化
      req.isHoneypot = true;
      req.trapKey = token;
      
      // ダミーユーザー情報を設定
      req.user = {
        _id: 'trap-user-' + Date.now(),
        email: 'trap@honeypot.local',
        name: 'Trap User'
      };
      
      req.tokenData = {
        userId: req.user._id,
        tokenId: 'trap-token-' + Date.now(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isValid: true
      };
      
      return next();
    }
    
    // トークンを検証
    const tokenData = await CliTokenService.verifyToken(token);
    
    if (!tokenData || !tokenData.isValid) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'CLIトークンが無効または期限切れです'
      });
    }
    
    // リクエストオブジェクトにユーザー情報とトークン情報を追加
    req.user = tokenData.user;
    req.cliToken = tokenData.token;
    req.tokenData = {
      userId: tokenData.user._id,
      tokenId: tokenData.token._id,
      expiresAt: tokenData.token.expiresAt,
      isValid: true
    };
    
    console.log('CLI認証成功:', {
      userId: req.user._id,
      email: req.user.email,
      tokenId: req.cliToken._id
    });
    
    next();
    
  } catch (error) {
    console.error('CLI認証エラー:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '認証処理中にエラーが発生しました'
    });
  }
};

module.exports = {
  verifyCliToken
};