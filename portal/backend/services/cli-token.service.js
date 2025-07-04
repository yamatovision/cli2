/**
 * CLIトークン管理サービス
 * CLIトークンの生成、検証、管理を行うサービス層
 * P-006: トークン管理サービス
 */
const CliToken = require('../models/cliToken.model');
const SimpleUser = require('../models/simpleUser.model');
const crypto = require('crypto');
const os = require('os');

class CliTokenService {
  
  /**
   * CLIトークンを生成
   * @param {string} userId - ユーザーID
   * @param {Object} deviceInfo - デバイス情報
   * @param {Object} options - オプション
   * @returns {Promise<Object>} 生成されたトークン情報
   */
  static async generateToken(userId, deviceInfo = {}, options = {}) {
    try {
      console.log('CliTokenService.generateToken: トークン生成開始', { userId, deviceInfo });
      
      // ユーザーの存在確認
      const user = await SimpleUser.findById(userId);
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }
      
      // 既存のアクティブなトークンを無効化（オプション）
      if (options.revokeExisting !== false) {
        await this.revokeUserTokens(userId, 'replaced');
      }
      
      // トークン生成
      const tokenValue = this._generateTokenValue();
      
      // 有効期限設定（デフォルト7日）
      const expirationDays = options.expirationDays || 7;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);
      
      // デバイス情報の補完
      const enrichedDeviceInfo = this._enrichDeviceInfo(deviceInfo);
      
      // トークンハッシュを事前に生成
      const crypto = require('crypto');
      const tokenHash = crypto.createHash('sha256').update(tokenValue).digest('hex');
      
      // CLIトークンを作成
      const cliToken = new CliToken({
        userId: userId,
        token: tokenValue,
        tokenHash: tokenHash,
        expiresAt: expiresAt,
        deviceInfo: enrichedDeviceInfo,
        isActive: true
      });
      
      await cliToken.save();
      
      console.log('CliTokenService.generateToken: トークン生成完了', {
        tokenId: cliToken._id,
        userId: userId,
        expiresAt: expiresAt
      });
      
      // 重要: tokenValueは生のトークンなので、レスポンスで返す
      // DBには保存されていない（ハッシュのみ保存）
      return {
        token: tokenValue,  // これがCLIに送信される生のトークン
        tokenId: cliToken._id,
        expiresAt: expiresAt,
        expiresIn: expirationDays * 24 * 60 * 60, // 秒単位
        deviceInfo: enrichedDeviceInfo
      };
      
    } catch (error) {
      console.error('CliTokenService.generateToken: エラー', error);
      throw error;
    }
  }
  
  /**
   * トークンを検証
   * @param {string} token - 検証するトークン
   * @returns {Promise<Object|null>} ユーザー情報またはnull
   */
  static async verifyToken(token) {
    try {
      console.log('CliTokenService.verifyToken: トークン検証開始');
      
      if (!token) {
        console.log('CliTokenService.verifyToken: トークンが提供されていません');
        return null;
      }
      
      // トークンを検索
      const cliToken = await CliToken.findByToken(token);
      
      if (!cliToken) {
        console.log('CliTokenService.verifyToken: トークンが見つかりません');
        return null;
      }
      
      // 有効性チェック
      if (!cliToken.isValid()) {
        console.log('CliTokenService.verifyToken: トークンが無効です');
        return null;
      }
      
      // 使用記録を更新
      await cliToken.recordUsage();
      
      console.log('CliTokenService.verifyToken: トークン検証成功', {
        tokenId: cliToken._id,
        userId: cliToken.userId._id
      });
      
      return {
        user: cliToken.userId,
        token: cliToken,
        isValid: true
      };
      
    } catch (error) {
      console.error('CliTokenService.verifyToken: エラー', error);
      return null;
    }
  }
  
  /**
   * ユーザーのトークンを無効化
   * @param {string} userId - ユーザーID
   * @param {string} reason - 無効化理由
   * @returns {Promise<number>} 無効化されたトークン数
   */
  static async revokeUserTokens(userId, reason = 'revoked') {
    try {
      console.log('CliTokenService.revokeUserTokens: トークン無効化開始', { userId, reason });
      
      const activeTokens = await CliToken.findActiveTokensByUser(userId);
      
      let revokedCount = 0;
      for (const token of activeTokens) {
        await token.deactivate(reason);
        revokedCount++;
      }
      
      console.log('CliTokenService.revokeUserTokens: トークン無効化完了', {
        userId,
        revokedCount
      });
      
      return revokedCount;
      
    } catch (error) {
      console.error('CliTokenService.revokeUserTokens: エラー', error);
      throw error;
    }
  }
  
  /**
   * 特定のトークンを無効化
   * @param {string} token - 無効化するトークン
   * @param {string} reason - 無効化理由
   * @returns {Promise<boolean>} 成功/失敗
   */
  static async revokeToken(token, reason = 'revoked') {
    try {
      console.log('CliTokenService.revokeToken: 特定トークン無効化開始');
      
      // findByTokenメソッドは内部でハッシュ化して検索するので、
      // 生のトークンをそのまま渡す
      const cliToken = await CliToken.findByToken(token);
      
      if (!cliToken) {
        console.log('CliTokenService.revokeToken: トークンが見つかりません');
        return false;
      }
      
      await cliToken.deactivate(reason);
      
      console.log('CliTokenService.revokeToken: トークン無効化完了', {
        tokenId: cliToken._id
      });
      
      return true;
      
    } catch (error) {
      console.error('CliTokenService.revokeToken: エラー', error);
      throw error;
    }
  }
  
  /**
   * ユーザーのアクティブなトークン一覧を取得
   * @param {string} userId - ユーザーID
   * @returns {Promise<Array>} トークン一覧
   */
  static async getUserTokens(userId) {
    try {
      console.log('CliTokenService.getUserTokens: ユーザートークン取得開始', { userId });
      
      const tokens = await CliToken.findActiveTokensByUser(userId);
      
      console.log('CliTokenService.getUserTokens: トークン取得完了', {
        userId,
        tokenCount: tokens.length
      });
      
      return tokens;
      
    } catch (error) {
      console.error('CliTokenService.getUserTokens: エラー', error);
      throw error;
    }
  }
  
  /**
   * 期限切れトークンのクリーンアップ
   * @returns {Promise<number>} クリーンアップされたトークン数
   */
  static async cleanupExpiredTokens() {
    try {
      console.log('CliTokenService.cleanupExpiredTokens: 期限切れトークンクリーンアップ開始');
      
      const expiredTokens = await CliToken.findExpiredTokens();
      
      let cleanedCount = 0;
      for (const token of expiredTokens) {
        if (token.isActive) {
          await token.deactivate('expired');
        }
        cleanedCount++;
      }
      
      console.log('CliTokenService.cleanupExpiredTokens: クリーンアップ完了', {
        cleanedCount
      });
      
      return cleanedCount;
      
    } catch (error) {
      console.error('CliTokenService.cleanupExpiredTokens: エラー', error);
      throw error;
    }
  }
  
  /**
   * トークン統計情報を取得
   * @param {string} userId - ユーザーID（オプション）
   * @returns {Promise<Object>} 統計情報
   */
  static async getTokenStats(userId = null) {
    try {
      console.log('CliTokenService.getTokenStats: 統計情報取得開始', { userId });
      
      const query = userId ? { userId } : {};
      
      const [
        totalTokens,
        activeTokens,
        expiredTokens,
        recentTokens
      ] = await Promise.all([
        CliToken.countDocuments(query),
        CliToken.countDocuments({ ...query, isActive: true, expiresAt: { $gt: new Date() } }),
        CliToken.countDocuments({ ...query, expiresAt: { $lte: new Date() } }),
        CliToken.countDocuments({ 
          ...query, 
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
        })
      ]);
      
      const stats = {
        totalTokens,
        activeTokens,
        expiredTokens,
        recentTokens,
        inactiveTokens: totalTokens - activeTokens
      };
      
      console.log('CliTokenService.getTokenStats: 統計情報取得完了', stats);
      
      return stats;
      
    } catch (error) {
      console.error('CliTokenService.getTokenStats: エラー', error);
      throw error;
    }
  }
  
  // ===== プライベートメソッド =====
  
  /**
   * トークン値を生成
   * @returns {string} 生成されたトークン
   * @private
   */
  static _generateTokenValue() {
    const prefix = 'cli_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now().toString(36);
    return `${prefix}${timestamp}_${randomBytes}`;
  }
  
  /**
   * デバイス情報を補完
   * @param {Object} deviceInfo - 基本デバイス情報
   * @returns {Object} 補完されたデバイス情報
   * @private
   */
  static _enrichDeviceInfo(deviceInfo) {
    const enriched = {
      deviceName: deviceInfo.deviceName || os.hostname(),
      platform: deviceInfo.platform || os.platform(),
      arch: deviceInfo.arch || os.arch(),
      hostname: deviceInfo.hostname || os.hostname(),
      ipAddress: deviceInfo.ipAddress || null,
      userAgent: deviceInfo.userAgent || 'BlueLamp CLI'
    };
    
    return enriched;
  }
}

module.exports = CliTokenService;