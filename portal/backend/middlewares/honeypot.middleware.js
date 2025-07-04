/**
 * ハニーポット検知ミドルウェア
 * APIリクエストでトラップキーの使用を検知
 */

const HoneypotService = require('../services/honeypot.service');

/**
 * ハニーポット検知ミドルウェア
 * @param {Object} req - リクエストオブジェクト
 * @param {Object} res - レスポンスオブジェクト
 * @param {Function} next - 次のミドルウェア
 */
const honeypotDetection = async (req, res, next) => {
    try {
        // APIキーを様々な場所から取得
        const apiKey = req.headers['x-api-key'] || 
                      req.headers['authorization']?.replace('Bearer ', '') ||
                      req.body?.apiKey ||
                      req.query?.apiKey ||
                      req.params?.apiKey;
        
        // APIキーがない場合はスキップ
        if (!apiKey) {
            return next();
        }
        
        // トラップキーかチェック
        if (HoneypotService.isTrapKey(apiKey)) {
            console.log('🚨 ハニーポットトラップ検知！');
            
            // トラップ処理を実行
            const result = await HoneypotService.handleTrapTriggered(req, apiKey);
            
            // エラーレスポンスを返す
            return res.status(403).json({
                success: false,
                message: 'セキュリティ違反が検出されました',
                error: 'SECURITY_VIOLATION',
                details: {
                    message: '不正なアクセスが検出されたため、アカウントが制限されました。',
                    canAppeal: true,
                    appealUrl: 'https://bluelamp.ai/support/appeal'
                }
            });
        }
        
        // トラップでない場合は次へ
        next();
        
    } catch (error) {
        console.error('ハニーポット検知エラー:', error);
        // エラーが発生しても処理を継続
        next();
    }
};

/**
 * 特定のルートにのみ適用するハニーポット検知
 * より細かい制御が必要な場合に使用
 */
const honeypotProtected = (options = {}) => {
    return async (req, res, next) => {
        // オプションに基づいてカスタマイズ可能
        const { 
            customKeys = [],
            logOnly = false,
            skipUserCheck = false 
        } = options;
        
        try {
            const apiKey = req.headers['x-api-key'] || 
                          req.body?.apiKey ||
                          req.query?.apiKey;
            
            if (!apiKey) {
                return next();
            }
            
            // カスタムキーも含めてチェック
            const allTrapKeys = [...HoneypotService.TRAP_KEYS, ...customKeys];
            const isTrap = allTrapKeys.includes(apiKey) || 
                          HoneypotService.isTrapKey(apiKey);
            
            if (isTrap) {
                if (logOnly) {
                    // ログのみモード
                    console.log('🔍 ハニーポット検知（ログのみ）:', apiKey);
                    req.honeypotDetected = true;
                    return next();
                }
                
                // 通常の処理
                await HoneypotService.handleTrapTriggered(req, apiKey);
                
                return res.status(403).json({
                    success: false,
                    message: 'アクセスが拒否されました',
                    error: 'ACCESS_DENIED'
                });
            }
            
            next();
            
        } catch (error) {
            console.error('ハニーポット保護エラー:', error);
            next();
        }
    };
};

module.exports = {
    honeypotDetection,
    honeypotProtected
};