/**
 * テスト用ルート
 * 開発・デバッグ用のエンドポイント
 * 本番環境では無効化すること
 */
const express = require('express');
const router = express.Router();
const HoneypotService = require('../services/honeypot.service');

/**
 * ハニーポットテスト用エンドポイント
 * トラップキーを使ってテスト可能
 */
router.post('/honeypot-test', async (req, res) => {
    try {
        const { apiKey } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({
                success: false,
                message: 'APIキーが必要です'
            });
        }
        
        // トラップキーかチェック
        if (HoneypotService.isTrapKey(apiKey)) {
            // トラップ処理（ただしアカウントはブロックしない）
            console.log('🧪 テスト: ハニーポットトラップ検知！');
            console.log('テストAPIキー:', apiKey);
            
            return res.status(403).json({
                success: false,
                message: 'テスト成功：このAPIキーはトラップとして検知されました',
                trapDetected: true,
                apiKey: apiKey
            });
        }
        
        return res.json({
            success: true,
            message: 'このAPIキーは正常です（トラップではありません）',
            trapDetected: false,
            apiKey: apiKey
        });
        
    } catch (error) {
        console.error('ハニーポットテストエラー:', error);
        return res.status(500).json({
            success: false,
            message: 'テスト中にエラーが発生しました',
            error: error.message
        });
    }
});

/**
 * トラップキーリスト取得（開発用）
 */
router.get('/trap-keys', (req, res) => {
    // 本番環境では無効化
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({
            success: false,
            message: 'Not found'
        });
    }
    
    return res.json({
        success: true,
        message: 'トラップキーのリスト（開発用）',
        trapKeys: HoneypotService.TRAP_KEYS.slice(0, 5), // 最初の5個だけ表示
        totalCount: HoneypotService.TRAP_KEYS.length
    });
});

/**
 * ハニーポット統計情報
 */
router.get('/honeypot-stats', async (req, res) => {
    try {
        const stats = await HoneypotService.getTrapStatistics();
        
        return res.json({
            success: true,
            message: 'ハニーポット統計情報',
            stats: stats
        });
        
    } catch (error) {
        console.error('統計取得エラー:', error);
        return res.status(500).json({
            success: false,
            message: '統計情報の取得に失敗しました',
            error: error.message
        });
    }
});

module.exports = router;