/**
 * AnthropicAdminService
 * Anthropic Admin APIとの連携を行うサービス
 */
const axios = require('axios');
const crypto = require('crypto');
const Organization = require('../models/organization.model');
const Workspace = require('../models/workspace.model');
const AnthropicApiKey = require('../models/anthropicApiKey.model');
const logger = require('../utils/logger');

class AnthropicAdminService {
  constructor() {
    this.baseUrl = 'https://api.anthropic.com/v1';
    this.version = '2023-06-01';
  }

  /**
   * API呼び出し用ヘッダーを取得
   * @param {string} adminApiKey - Admin API Key
   * @returns {Object} - リクエストヘッダー
   */
  _getHeaders(adminApiKey) {
    return {
      'anthropic-version': this.version,
      'x-api-key': adminApiKey
    };
  }

  /**
   * APIレスポンスをログに記録（機密情報は削除）
   * @param {string} operation - 操作名
   * @param {Object} response - レスポンス
   * @param {Error} error - エラー（存在する場合）
   */
  _logResponse(operation, response, error) {
    if (error) {
      logger.error(`Anthropic Admin API ${operation} エラー:`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
      return;
    }
    
    // 成功レスポンスのログ（APIキー情報はマスク）
    const sanitizedData = JSON.parse(JSON.stringify(response.data));
    if (sanitizedData.data && Array.isArray(sanitizedData.data)) {
      sanitizedData.data.forEach(item => {
        if (item.key) {
          item.key = '********';
        }
      });
    }
    
    logger.debug(`Anthropic Admin API ${operation} 成功:`, {
      status: response.status,
      data: sanitizedData
    });
  }

  /**
   * API呼び出しの実行
   * @param {string} method - HTTPメソッド
   * @param {string} endpoint - APIエンドポイント
   * @param {string} adminApiKey - Admin API Key
   * @param {Object} data - リクエストボディ
   * @returns {Promise<Object>} - API呼び出し結果
   */
  async _executeRequest(method, endpoint, adminApiKey, data = null) {
    try {
      const headers = this._getHeaders(adminApiKey);
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers,
        data: method !== 'GET' ? data : undefined
      };
      
      const response = await axios(config);
      this._logResponse(`${method} ${endpoint}`, response);
      return response.data;
    } catch (error) {
      this._logResponse(`${method} ${endpoint}`, null, error);
      throw this._formatError(error);
    }
  }

  /**
   * エラーオブジェクトのフォーマット
   * @param {Error} error - 元のエラーオブジェクト
   * @returns {Error} - フォーマットされたエラー
   */
  _formatError(error) {
    // APIからのエラーレスポンスがある場合
    if (error.response && error.response.data) {
      const apiError = new Error(error.response.data.error?.message || 'Anthropic API エラー');
      apiError.status = error.response.status;
      apiError.code = error.response.data.error?.type || 'api_error';
      apiError.details = error.response.data;
      return apiError;
    }
    
    // 接続エラーなどの場合
    const networkError = new Error(error.message || 'Anthropicとの通信エラー');
    networkError.code = error.code || 'network_error';
    return networkError;
  }

  /**
   * 組織メンバー一覧取得
   * @param {string} adminApiKey - Admin API Key
   * @param {number} limit - 取得件数制限
   * @returns {Promise<Object>} - 組織メンバーリスト
   */
  async listOrganizationMembers(adminApiKey, limit = 100) {
    return this._executeRequest('GET', `/organizations/users?limit=${limit}`, adminApiKey);
  }

  /**
   * メンバーの役割更新
   * @param {string} adminApiKey - Admin API Key
   * @param {string} userId - ユーザーID
   * @param {string} role - 新しい役割
   * @returns {Promise<Object>} - 更新結果
   */
  async updateMemberRole(adminApiKey, userId, role) {
    return this._executeRequest('POST', `/organizations/users/${userId}`, adminApiKey, { role });
  }

  /**
   * メンバー削除
   * @param {string} adminApiKey - Admin API Key
   * @param {string} userId - ユーザーID
   * @returns {Promise<Object>} - 削除結果
   */
  async removeMember(adminApiKey, userId) {
    return this._executeRequest('DELETE', `/organizations/users/${userId}`, adminApiKey);
  }

  /**
   * 組織への招待作成
   * @param {string} adminApiKey - Admin API Key
   * @param {string} email - 招待するメールアドレス
   * @param {string} role - 招待する役割
   * @returns {Promise<Object>} - 招待結果
   */
  async createInvite(adminApiKey, email, role) {
    return this._executeRequest('POST', '/organizations/invites', adminApiKey, { email, role });
  }

  /**
   * 招待一覧取得
   * @param {string} adminApiKey - Admin API Key
   * @param {number} limit - 取得件数制限
   * @returns {Promise<Object>} - 招待リスト
   */
  async listInvites(adminApiKey, limit = 100) {
    return this._executeRequest('GET', `/organizations/invites?limit=${limit}`, adminApiKey);
  }

  /**
   * 招待削除
   * @param {string} adminApiKey - Admin API Key
   * @param {string} inviteId - 招待ID
   * @returns {Promise<Object>} - 削除結果
   */
  async deleteInvite(adminApiKey, inviteId) {
    return this._executeRequest('DELETE', `/organizations/invites/${inviteId}`, adminApiKey);
  }

  /**
   * ワークスペース作成
   * @param {string} adminApiKey - Admin API Key
   * @param {string} name - ワークスペース名
   * @returns {Promise<Object>} - 作成結果
   */
  async createWorkspace(adminApiKey, name) {
    return this._executeRequest('POST', '/organizations/workspaces', adminApiKey, { name });
  }

  /**
   * ワークスペース一覧取得
   * @param {string} adminApiKey - Admin API Key
   * @param {boolean} includeArchived - アーカイブされたワークスペースも含めるか
   * @param {number} limit - 取得件数制限
   * @returns {Promise<Object>} - ワークスペースリスト
   */
  async listWorkspaces(adminApiKey, includeArchived = false, limit = 100) {
    return this._executeRequest('GET', `/organizations/workspaces?limit=${limit}&include_archived=${includeArchived}`, adminApiKey);
  }

  /**
   * ワークスペースをアーカイブ
   * @param {string} adminApiKey - Admin API Key
   * @param {string} workspaceId - ワークスペースID
   * @returns {Promise<Object>} - アーカイブ結果
   */
  async archiveWorkspace(adminApiKey, workspaceId) {
    return this._executeRequest('POST', `/organizations/workspaces/${workspaceId}/archive`, adminApiKey);
  }

  /**
   * ワークスペースにメンバー追加
   * @param {string} adminApiKey - Admin API Key
   * @param {string} workspaceId - ワークスペースID
   * @param {string} userId - ユーザーID
   * @param {string} role - 役割
   * @returns {Promise<Object>} - 追加結果
   */
  async addWorkspaceMember(adminApiKey, workspaceId, userId, role) {
    return this._executeRequest('POST', `/organizations/workspaces/${workspaceId}/members`, adminApiKey, {
      user_id: userId,
      workspace_role: role
    });
  }

  /**
   * ワークスペースメンバー一覧取得
   * @param {string} adminApiKey - Admin API Key
   * @param {string} workspaceId - ワークスペースID
   * @param {number} limit - 取得件数制限
   * @returns {Promise<Object>} - メンバーリスト
   */
  async listWorkspaceMembers(adminApiKey, workspaceId, limit = 100) {
    return this._executeRequest('GET', `/organizations/workspaces/${workspaceId}/members?limit=${limit}`, adminApiKey);
  }

  /**
   * ワークスペースメンバーの役割更新
   * @param {string} adminApiKey - Admin API Key
   * @param {string} workspaceId - ワークスペースID
   * @param {string} userId - ユーザーID
   * @param {string} role - 新しい役割
   * @returns {Promise<Object>} - 更新結果
   */
  async updateWorkspaceMemberRole(adminApiKey, workspaceId, userId, role) {
    return this._executeRequest('POST', `/organizations/workspaces/${workspaceId}/members/${userId}`, adminApiKey, {
      workspace_role: role
    });
  }

  /**
   * ワークスペースからメンバー削除
   * @param {string} adminApiKey - Admin API Key
   * @param {string} workspaceId - ワークスペースID
   * @param {string} userId - ユーザーID
   * @returns {Promise<Object>} - 削除結果
   */
  async removeWorkspaceMember(adminApiKey, workspaceId, userId) {
    return this._executeRequest('DELETE', `/organizations/workspaces/${workspaceId}/members/${userId}`, adminApiKey);
  }

  /**
   * APIキー一覧取得
   * @param {string} adminApiKey - Admin API Key
   * @param {string} workspaceId - ワークスペースID (オプション)
   * @param {string} status - ステータス ('active' or 'inactive')
   * @param {number} limit - 取得件数制限
   * @returns {Promise<Object>} - APIキーリスト
   */
  async listApiKeys(adminApiKey, workspaceId = null, status = 'active', limit = 100) {
    let url = `/organizations/api_keys?limit=${limit}&status=${status}`;
    if (workspaceId) {
      url += `&workspace_id=${workspaceId}`;
    }
    return this._executeRequest('GET', url, adminApiKey);
  }

  /**
   * APIキー更新
   * @param {string} adminApiKey - Admin API Key
   * @param {string} apiKeyId - APIキーID
   * @param {Object} updateData - 更新データ（status, nameなど）
   * @returns {Promise<Object>} - 更新結果
   */
  async updateApiKey(adminApiKey, apiKeyId, updateData) {
    return this._executeRequest('POST', `/organizations/api_keys/${apiKeyId}`, adminApiKey, updateData);
  }

  /**
   * Admin API Key暗号化
   * @param {string} adminApiKey - 暗号化するAdmin API Key
   * @param {string} secret - 暗号化に使用する秘密鍵
   * @returns {string} - 暗号化されたAPIキー
   */
  encryptAdminApiKey(adminApiKey, secret) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), iv);
      let encrypted = cipher.update(adminApiKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      return iv.toString('hex') + ':' + authTag + ':' + encrypted;
    } catch (error) {
      logger.error('Admin API Key暗号化エラー:', error);
      throw new Error('APIキーの暗号化に失敗しました');
    }
  }

  /**
   * Admin API Key復号化
   * @param {string} encryptedAdminApiKey - 暗号化されたAdmin API Key
   * @param {string} secret - 復号化に使用する秘密鍵
   * @returns {string} - 復号化されたAPIキー
   */
  decryptAdminApiKey(encryptedAdminApiKey, secret) {
    try {
      const parts = encryptedAdminApiKey.split(':');
      if (parts.length !== 3) {
        throw new Error('暗号化されたAPIキーの形式が無効です');
      }
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      logger.error('Admin API Key復号化エラー:', error);
      throw new Error('APIキーの復号化に失敗しました');
    }
  }

  /**
   * APIキーの検証と情報取得
   * @param {string} adminApiKey - Admin API Key
   * @param {string} keyToVerify - 検証するAPIキー
   * @returns {Promise<Object>} - APIキー情報
   */
  async verifyApiKey(adminApiKey, keyToVerify) {
    try {
      // AdminApiKeyを使ってAnthropicから現在のAPIキー一覧を取得
      const apiKeys = await this.listApiKeys(adminApiKey);
      
      if (!apiKeys || !apiKeys.data || apiKeys.data.length === 0) {
        throw new Error('APIキーの取得に失敗しました');
      }
      
      // デバッグ情報としてAPIキー一覧を記録
      logger.debug('利用可能なAPIキー数:', apiKeys.data.length);
      
      // APIキーIDで直接検索
      let matchingKey = apiKeys.data.find(key => {
        // Anthropic APIからの特定条件によるマッチング
        // ここでは最終的にAPIキーIDを特定できればよい
        return key.id && (
          // APIキーIDでの部分一致
          (keyToVerify.includes(key.id)) ||
          // Anthropic APIから返される値でのマッチング
          (key.partial_key_hint && keyToVerify.endsWith(key.partial_key_hint.substring(key.partial_key_hint.length - 4)))
        );
      });
      
      // API呼び出しで見つからない場合、ローカルデータベースから検索を試みる
      if (!matchingKey) {
        try {
          logger.debug('APIから取得できませんでした。ローカルデータベースから検索します');
          
          // データベースから検索を試みる - 完全なキー値で検索
          let dbKey = null;
          
          try {
            // APIキーの完全一致で検索
            dbKey = await AnthropicApiKey.findOne({
              apiKeyFull: keyToVerify
            }).exec();
            
            // キーが見つからない場合はAPIキーIDからの検索も試す
            if (!dbKey) {
              // APIキーIDの最初の部分をキーから抽出して検索
              const keyParts = keyToVerify.split('_');
              if (keyParts.length > 1) {
                const keyIdPrefix = keyParts[0] + '_' + keyParts[1];
                dbKey = await AnthropicApiKey.findOne({
                  apiKeyId: { $regex: `^${keyIdPrefix}`, $options: 'i' }
                }).exec();
              }
            }
            
          } catch (searchError) {
            logger.error('データベース検索中にエラーまたはタイムアウトが発生:', searchError);
            // エラーを捕捉して処理を続行
          }
          
          // データベースで見つかった場合、手動で返却形式を作成
          if (dbKey) {
            logger.debug(`ローカルデータベースからAPIキーが見つかりました: ${dbKey.apiKeyId} (${dbKey.name})`);
            // APIとの同期のために最終使用時間を更新
            dbKey.lastUsedAt = new Date();
            await dbKey.save();
            
            // APIレスポンスと同様の形式で返す
            matchingKey = {
              id: dbKey.apiKeyId,
              name: dbKey.name,
              status: dbKey.status,
              workspace_id: dbKey.workspaceId,
              partial_key_hint: dbKey.keyHint
            };
          }
        } catch (dbError) {
          logger.error('データベース検索中にエラーが発生しました:', dbError);
          // エラーを飲み込んで、検索結果なしとして続行
        }
      }
      
      // API検索結果をデータベースに保存・更新
      if (matchingKey) {
        try {
          // タイムアウト対策のためPromise.raceを使用
          await Promise.race([
            AnthropicApiKey.importKey({
              id: matchingKey.id,
              apiKeyFull: keyToVerify, // 完全なAPIキー値を保存
              name: matchingKey.name || ''
            }),
            // 10秒でタイムアウト
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('APIキー保存タイムアウト')), 10000)
            )
          ]);
          
          logger.debug(`APIキー ${matchingKey.id} のデータベース保存に成功しました`);
        } catch (saveError) {
          logger.warn('APIキー情報のデータベース保存中にエラー:', saveError);
          // 保存エラーは無視して続行（認証機能への影響なし）
        }
      }
      
      if (!matchingKey) {
        throw new Error('指定されたAPIキーが見つかりませんでした');
      }
      
      return {
        id: matchingKey.id,
        name: matchingKey.name || 'API Key',
        status: matchingKey.status || 'active',
        workspace_id: matchingKey.workspace_id
      };
    } catch (error) {
      logger.error('APIキー検証エラー:', error);
      throw error;
    }
  }

  /**
   * 組織のAPIキーを同期
   * @param {mongoose.Types.ObjectId} organizationId - 組織ID
   * @param {string} adminApiKey - Admin API Key
   * @returns {Promise<Array>} - 同期結果
   */
  async syncOrganizationApiKeys(organizationId, adminApiKey) {
    try {
      // 組織情報を取得
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('組織情報が見つかりません');
      }

      // Admin APIキーのチェック
      if (!adminApiKey) {
        throw new Error('Admin APIキーが指定されていません');
      }

      // AnthropicからワークスペースとそれぞれのワークスペースのAPIキーを取得
      const workspaces = await Workspace.find({ organizationId });
      const syncResults = [];

      // デフォルトワークスペースのAPIキーを同期
      const defaultApiKeys = await this.listApiKeys(adminApiKey, null);
      if (defaultApiKeys.data && defaultApiKeys.data.length > 0) {
        // 組織のデフォルトAPIキーを更新
        if (!organization.apiKey && defaultApiKeys.data[0].status === 'active') {
          organization.apiKey = defaultApiKeys.data[0].id;
          await organization.save();
          syncResults.push({
            workspace: 'default',
            apiKeyId: defaultApiKeys.data[0].id,
            name: defaultApiKeys.data[0].name,
            action: 'updated_organization'
          });
        }
      }

      // ワークスペースごとのAPIキーを同期
      for (const workspace of workspaces) {
        if (!workspace.anthropicWorkspaceId) continue;
        
        const apiKeys = await this.listApiKeys(adminApiKey, workspace.anthropicWorkspaceId);
        if (!apiKeys.data || apiKeys.data.length === 0) continue;

        // 最初のアクティブなAPIキーを使用
        const activeKey = apiKeys.data.find(k => k.status === 'active');
        if (!activeKey) continue;

        // ワークスペースのAPIキー情報を更新
        if (!workspace.apiKey || !workspace.apiKey.keyId || workspace.apiKey.keyId !== activeKey.id) {
          workspace.apiKey = {
            keyId: activeKey.id,
            name: activeKey.name,
            status: activeKey.status,
            createdAt: new Date(activeKey.created_at)
          };
          await workspace.save();
          syncResults.push({
            workspace: workspace.name,
            workspaceId: workspace._id,
            apiKeyId: activeKey.id,
            name: activeKey.name,
            action: 'updated_workspace'
          });
        }
      }

      return syncResults;
    } catch (error) {
      logger.error('APIキー同期エラー:', error);
      throw error;
    }
  }

  /**
   * ローカルデータベースのAPIキーを同期
   * @param {string} adminApiKey - Admin API Key
   * @returns {Promise<Array>} - 同期されたAPIキーの一覧
   */
  async syncDatabaseApiKeys(adminApiKey) {
    try {
      logger.info('ローカルデータベースのAPIキーを同期しています...');
      
      // API経由でAPIキーを取得
      const apiKeysResponse = await this.listApiKeys(adminApiKey);
      
      if (!apiKeysResponse.data || !Array.isArray(apiKeysResponse.data)) {
        throw new Error('APIキーのリストが取得できませんでした');
      }
      
      const apiKeys = apiKeysResponse.data;
      const results = [];
      
      // 各APIキーを処理
      for (const apiKey of apiKeys) {
        try {
          // データベースに保存または更新
          const keyData = {
            id: apiKey.id,
            apiKeyFull: null, // 実際のAPIキー値は取得できないため、nullとする
            name: apiKey.name || ''
          };
          
          const savedKey = await AnthropicApiKey.importKey(keyData);
          
          results.push({
            id: apiKey.id,
            name: apiKey.name,
            action: savedKey.isNew ? 'created' : 'updated'
          });
        } catch (err) {
          logger.error(`APIキー ${apiKey.id} の同期エラー:`, err);
          results.push({
            id: apiKey.id,
            error: err.message,
            action: 'failed'
          });
        }
      }
      
      logger.info(`APIキー同期完了: ${results.length}件処理`);
      return results;
    } catch (error) {
      logger.error('APIキーデータベース同期エラー:', error);
      throw error;
    }
  }

  /**
   * 組織のワークスペースを同期
   * @param {mongoose.Types.ObjectId} organizationId - 組織ID
   * @param {string} adminApiKey - Admin API Key
   * @returns {Promise<Array>} - 同期結果
   */
  async syncOrganizationWorkspaces(organizationId, adminApiKey) {
    try {
      // 組織情報を取得
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('組織情報が見つかりません');
      }

      // Admin APIキーのチェック
      if (!adminApiKey) {
        throw new Error('Admin APIキーが指定されていません');
      }

      // Anthropicからワークスペース一覧を取得
      const workspaces = await this.listWorkspaces(adminApiKey);
      if (!workspaces.data) {
        return [];
      }

      // データベースとAnthropicのワークスペースを同期
      const syncResults = [];
      for (const anthropicWorkspace of workspaces.data) {
        // 既存のワークスペースを検索
        let workspace = await Workspace.findOne({
          organizationId,
          anthropicWorkspaceId: anthropicWorkspace.id
        });

        if (workspace) {
          // 既存ワークスペースの更新
          workspace.name = anthropicWorkspace.name;
          workspace.isArchived = anthropicWorkspace.is_archived || false;
          await workspace.save();
          syncResults.push({
            id: workspace._id,
            anthropicId: anthropicWorkspace.id,
            name: workspace.name,
            action: 'updated'
          });
        } else {
          // 新規ワークスペースの作成
          workspace = new Workspace({
            name: anthropicWorkspace.name,
            organizationId,
            anthropicWorkspaceId: anthropicWorkspace.id,
            isArchived: anthropicWorkspace.is_archived || false,
            monthlyBudget: organization.monthlyBudget / 2, // デフォルトは組織予算の半分
            members: []
          });
          await workspace.save();
          syncResults.push({
            id: workspace._id,
            anthropicId: anthropicWorkspace.id,
            name: workspace.name,
            action: 'created'
          });
        }
      }

      return syncResults;
    } catch (error) {
      logger.error('ワークスペース同期エラー:', error);
      throw error;
    }
  }
}

module.exports = new AnthropicAdminService();