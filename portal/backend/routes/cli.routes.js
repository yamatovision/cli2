/**
 * CLI認証ルート設定
 * P-004: CLIトークン発行API
 * P-007: 認証付きプロンプト取得API
 * 
 * エンドポイント:
 * - POST /api/cli/login      - CLIログイン（トークン発行）
 * - POST /api/cli/verify     - CLIトークン検証
 * - POST /api/cli/logout     - CLIログアウト（トークン無効化）
 * - GET  /api/cli/tokens     - ユーザーのCLIトークン一覧
 * - GET  /api/cli/stats      - CLIトークン統計情報
 * - GET  /api/cli/prompts/:id - 認証付きプロンプト取得
 */
const express = require('express');
const router = express.Router();
const cliAuthController = require('../controllers/cliAuth.controller');
const cliPromptController = require('../controllers/cliPrompt.controller');
const { verifySimpleToken } = require('../middlewares/simple-auth.middleware');
const { verifyCliToken } = require('../middlewares/cli-auth.middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit.middleware');
const { honeypotDetection } = require('../middlewares/honeypot.middleware');

/**
 * CLI認証エンドポイント（認証不要）
 */
// CLIログイン - レート制限付き
router.post('/login', 
  rateLimitMiddleware.authRateLimit,
  cliAuthController.cliLogin
);

// CLIトークン検証
router.post('/verify', 
  cliAuthController.cliVerify
);

// CLIログアウト
router.post('/logout', 
  cliAuthController.cliLogout
);

/**
 * 管理者用エンドポイント（認証必要）
 */
// ユーザーのCLIトークン一覧取得
router.get('/tokens/:userId', 
  verifySimpleToken,
  cliAuthController.getUserCliTokens
);

// CLIトークン統計情報取得
router.get('/stats', 
  verifySimpleToken,
  cliAuthController.getCliTokenStats
);

/**
 * CLI プロンプト取得エンドポイント（CLI認証必要）
 */
// 公開プロンプト一覧取得
router.get('/prompts', 
  verifyCliToken,  // verifyCliTokenにハニーポット検知を統合済み
  cliPromptController.getPublicPrompts
);

// 特定プロンプト取得
router.get('/prompts/:id', 
  verifyCliToken,  // verifyCliTokenにハニーポット検知を統合済み
  cliPromptController.getPrompt
);

module.exports = router;