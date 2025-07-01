/**
 * シンプルなルーター
 * シンプル版のAPIエンドポイントをすべて定義
 */
const express = require('express');
const router = express.Router();
// 従来のミドルウェアの代わりにSimple専用のミドルウェアを使用
const simpleAuthMiddleware = require('../middlewares/simple-auth.middleware');
const rateLimitMiddleware = require('../middlewares/rate-limit.middleware');

// コントローラー
const simpleAuthController = require('../controllers/simpleAuth.controller');
const simpleUserController = require('../controllers/simpleUser.controller');
const simpleOrganizationController = require('../controllers/simpleOrganization.controller');
const simpleAuthDebug = require('../controllers/simpleAuth.debug');

// ===== 認証系エンドポイント =====
router.post('/auth/register', rateLimitMiddleware.authRateLimit, simpleAuthController.register);
router.post('/auth/login', rateLimitMiddleware.authRateLimit, simpleAuthController.login);
router.post('/auth/force-login', rateLimitMiddleware.authRateLimit, simpleAuthController.forceLogin);
router.post('/auth/refresh-token', rateLimitMiddleware.authRateLimit, simpleAuthController.refreshToken);
router.post('/auth/logout', rateLimitMiddleware.authRateLimit, simpleAuthController.logout);

// 認証チェックエンドポイント（シンプル版）- レート制限とミドルウェアを適用
router.get('/auth/check', rateLimitMiddleware.authRateLimit, simpleAuthMiddleware.verifySimpleToken, simpleAuthController.checkAuth);

// CLI APIキー認証エンドポイント
router.post('/auth/cli-verify', rateLimitMiddleware.authRateLimit, simpleAuthController.cliVerify);

// CLI専用ログアウトエンドポイント
router.post('/auth/cli-logout', rateLimitMiddleware.authRateLimit, simpleAuthController.cliLogout);

// ユーザーのAPIキーを取得するエンドポイント
router.get('/user/apikey', simpleAuthMiddleware.verifySimpleToken, simpleUserController.getUserApiKey);

// ユーザーのAnthropicAPIキーを取得するエンドポイント（新方式）
router.get('/user/anthropic-api-key', simpleAuthMiddleware.verifySimpleToken, simpleAuthController.getUserAnthropicApiKey);

// デバッグエンドポイントを追加
router.get('/auth/debug', simpleAuthMiddleware.verifySimpleToken, simpleAuthDebug.debugAuth);

// レート制限情報を取得するエンドポイント（管理者のみ）
router.get('/auth/rate-limits', 
  simpleAuthMiddleware.verifySimpleToken, 
  simpleAuthMiddleware.isSimpleAdmin, 
  (req, res) => {
    const rateLimitInfo = rateLimitMiddleware.getRateLimitInfo();
    res.json({
      success: true,
      data: rateLimitInfo
    });
  });

// ===== ユーザー系エンドポイント =====
router.get('/users', simpleAuthMiddleware.verifySimpleToken, simpleUserController.getUsers);
router.get('/users/profile', simpleAuthMiddleware.verifySimpleToken, simpleUserController.getUserProfile);
// 現在のユーザー情報を取得するエンドポイントを追加（auth.service.jsが使用）
router.get('/auth/users/me', simpleAuthMiddleware.verifySimpleToken, simpleUserController.getUserProfile);
router.get('/users/:id', simpleAuthMiddleware.verifySimpleToken, simpleUserController.getUser);
router.post('/users', simpleAuthMiddleware.verifySimpleToken, simpleAuthMiddleware.isSimpleAdmin, simpleUserController.createUser);
router.put('/users/:id', simpleAuthMiddleware.verifySimpleToken, simpleAuthMiddleware.isSimpleAdmin, simpleUserController.updateUser);
router.delete('/users/:id', simpleAuthMiddleware.verifySimpleToken, simpleAuthMiddleware.isSimpleAdmin, simpleUserController.deleteUser);
router.put('/users/change-password', simpleAuthMiddleware.verifySimpleToken, simpleUserController.changePassword);
// ClaudeCode起動カウンターインクリメント
router.post('/users/:id/increment-claude-code-launch', simpleAuthMiddleware.verifySimpleToken, simpleUserController.incrementClaudeCodeLaunchCount);

// ===== CLI APIキー管理エンドポイント =====
router.post('/users/:userId/cli-api-key', simpleAuthMiddleware.verifySimpleToken, simpleUserController.generateCliApiKey);
router.get('/users/:userId/cli-api-key', simpleAuthMiddleware.verifySimpleToken, simpleUserController.getCliApiKeys);
router.delete('/users/:userId/cli-api-key/:key', simpleAuthMiddleware.verifySimpleToken, simpleUserController.deactivateCliApiKey);

// ===== 組織系エンドポイント =====
router.get('/organizations', simpleAuthMiddleware.verifySimpleToken, simpleOrganizationController.getOrganizations);
router.get('/organizations/:id', simpleAuthMiddleware.verifySimpleToken, simpleOrganizationController.getOrganization);
router.post('/organizations', simpleAuthMiddleware.verifySimpleToken, simpleOrganizationController.createOrganization);
router.put('/organizations/:id', simpleAuthMiddleware.verifySimpleToken, simpleOrganizationController.updateOrganization);
router.delete('/organizations/:id', simpleAuthMiddleware.verifySimpleToken, simpleAuthMiddleware.isSimpleAdmin, simpleOrganizationController.deleteOrganization);

// ===== APIキー系エンドポイント =====
router.get('/organizations/:id/apikeys', simpleAuthMiddleware.verifySimpleToken, simpleOrganizationController.getApiKeys);
router.post('/organizations/:id/apikeys', simpleAuthMiddleware.verifySimpleToken, simpleAuthMiddleware.isSimpleAdmin, simpleOrganizationController.addApiKey);
router.delete('/organizations/:id/apikeys/:keyId', simpleAuthMiddleware.verifySimpleToken, simpleAuthMiddleware.isSimpleAdmin, simpleOrganizationController.removeApiKey);

// ===== 組織ユーザー管理エンドポイント =====
router.get('/organizations/:id/users', simpleAuthMiddleware.verifySimpleToken, simpleOrganizationController.getOrganizationUsers);
router.post('/organizations/:id/users', simpleAuthMiddleware.verifySimpleToken, simpleAuthMiddleware.isSimpleAdmin, simpleOrganizationController.addOrganizationUser);
router.delete('/organizations/:id/users/:userId', simpleAuthMiddleware.verifySimpleToken, simpleAuthMiddleware.isSimpleAdmin, simpleOrganizationController.removeOrganizationUser);
router.put('/organizations/:id/users/:userId/role', simpleAuthMiddleware.verifySimpleToken, simpleAuthMiddleware.isSimpleAdmin, simpleOrganizationController.updateUserRole);

// ===== ワークスペース系エンドポイント =====
router.post('/organizations/:id/create-workspace', simpleAuthMiddleware.verifySimpleToken, simpleOrganizationController.createWorkspace);


module.exports = router;