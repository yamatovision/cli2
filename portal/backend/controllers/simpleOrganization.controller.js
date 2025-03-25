/**
 * シンプルな組織管理コントローラー
 * 組織の作成、取得、更新、削除を行います
 */
const SimpleOrganization = require('../models/simpleOrganization.model');
const SimpleUser = require('../models/simpleUser.model');
const axios = require('axios');
const anthropicAdminService = require('../services/anthropicAdminService');

// APIキー値をそのまま使用する単純な関数
function formatApiKeyHint(keyValue) {
  return keyValue || '';
}

/**
 * 組織一覧を取得
 * @route GET /api/simple/organizations
 */
exports.getOrganizations = async (req, res) => {
  try {
    const userId = req.userId;
    
    // ユーザーのロールを確認
    const user = await SimpleUser.findById(userId);
    
    let organizations;
    
    // SuperAdminはすべての組織を取得可能
    if (user && user.isSuperAdmin()) {
      organizations = await SimpleOrganization.find({ status: 'active' });
    } else {
      // 一般ユーザーは自分が作成した組織または所属している組織のみ取得可能
      let query = { createdBy: userId, status: 'active' };
      
      // ユーザーが組織に所属している場合は、その組織も取得対象に含める
      if (user && user.organizationId) {
        query = {
          $or: [
            { createdBy: userId },
            { _id: user.organizationId }
          ],
          status: 'active'
        };
      }
      
      organizations = await SimpleOrganization.find(query);
    }
    
    return res.status(200).json({
      success: true,
      data: organizations
    });
  } catch (error) {
    console.error('組織一覧取得エラー:', error);
    return res.status(500).json({
      success: false,
      message: '組織一覧の取得中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * 特定の組織を取得
 * @route GET /api/simple/organizations/:id
 */
exports.getOrganization = async (req, res) => {
  try {
    const userId = req.userId;
    const organizationId = req.params.id;
    
    // 組織データを取得
    const organization = await SimpleOrganization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: '組織が見つかりません'
      });
    }
    
    // ユーザーのロールと権限を確認
    const user = await SimpleUser.findById(userId);
    
    // アクセス権があるかチェック（SuperAdmin、作成者、または所属メンバー）
    if (!user.isSuperAdmin() && 
        organization.createdBy.toString() !== userId.toString() && 
        user.organizationId?.toString() !== organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'この組織へのアクセス権限がありません'
      });
    }
    
    // APIキー情報を取得（ユーザーモデルから）
    // SimpleApiKeyモデルは削除されたため、ユーザーから情報を取得
    const usersWithApiKeys = await SimpleUser.find({
      apiKeyId: { $in: organization.apiKeyIds },
      apiKeyValue: { $ne: null }
    }, 'apiKeyId apiKeyValue');
    
    // APIキー情報をユーザーから収集
    const apiKeys = [];
    const processedKeyIds = new Set();
    
    // ユーザーからAPIキー情報を収集
    for (const userWithKey of usersWithApiKeys) {
      if (!processedKeyIds.has(userWithKey.apiKeyId)) {
        // 実際のAPIキー値が存在する場合のみ追加
        if (userWithKey.apiKeyValue) {
          apiKeys.push({
            _id: userWithKey.apiKeyId,
            id: userWithKey.apiKeyId,
            keyValue: userWithKey.apiKeyValue, // そのままの値を送信
            organizationId: organization._id,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          processedKeyIds.add(userWithKey.apiKeyId);
        }
      }
    }
    
    // 存在しないキーやダミーデータは追加しない
    
    // 組織に所属するユーザー一覧を取得
    const members = await SimpleUser.find({
      organizationId: organization._id
    }, '-password -refreshToken');
    
    return res.status(200).json({
      success: true,
      data: {
        organization,
        apiKeys,
        members
      }
    });
  } catch (error) {
    console.error('組織取得エラー:', error);
    return res.status(500).json({
      success: false,
      message: '組織の取得中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * 新しい組織を作成
 * @route POST /api/simple/organizations
 */
exports.createOrganization = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, description, workspaceName } = req.body;
    
    // 必須フィールドの検証
    if (!name || !workspaceName) {
      return res.status(400).json({
        success: false,
        message: '組織名とワークスペース名は必須です'
      });
    }
    
    // ユーザーがアクティブかどうか確認
    const user = await SimpleUser.findById(userId);
    
    if (!user || user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'アクティブなユーザーアカウントが必要です'
      });
    }
    
    // 組織名の重複チェック
    const existingOrg = await SimpleOrganization.findOne({ name });
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: 'この組織名は既に使用されています'
      });
    }
    
    // 新しい組織を作成
    const newOrganization = new SimpleOrganization({
      name,
      description,
      workspaceName,
      createdBy: userId,
      apiKeyIds: [],
      status: 'active'
    });
    
    // 保存
    await newOrganization.save();
    
    // 組織を作成したユーザーの組織IDを更新
    user.organizationId = newOrganization._id;
    if (!user.isAdmin()) {
      user.role = 'Admin'; // 組織作成者は自動的に管理者に
    }
    await user.save();
    
    return res.status(201).json({
      success: true,
      message: '組織が正常に作成されました',
      data: newOrganization
    });
  } catch (error) {
    console.error('組織作成エラー:', error);
    return res.status(500).json({
      success: false,
      message: '組織の作成中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * 組織を更新
 * @route PUT /api/simple/organizations/:id
 */
exports.updateOrganization = async (req, res) => {
  try {
    const userId = req.userId;
    const organizationId = req.params.id;
    const { name, description, workspaceName, status } = req.body;
    
    // 更新対象の組織を取得
    const organization = await SimpleOrganization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: '組織が見つかりません'
      });
    }
    
    // ユーザーの権限チェック
    const user = await SimpleUser.findById(userId);
    
    // SuperAdminまたは組織の作成者のみ更新可能
    if (!user.isSuperAdmin() && organization.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'この組織を更新する権限がありません'
      });
    }
    
    // 組織名の重複チェック（異なる組織で同じ名前を使用していないか）
    if (name && name !== organization.name) {
      const existingOrg = await SimpleOrganization.findOne({ name });
      if (existingOrg && existingOrg._id.toString() !== organizationId) {
        return res.status(400).json({
          success: false,
          message: 'この組織名は既に使用されています'
        });
      }
    }
    
    // フィールドを更新
    if (name) organization.name = name;
    if (description !== undefined) organization.description = description;
    if (workspaceName) organization.workspaceName = workspaceName;
    
    // ステータス更新はSuperAdminのみ可能
    if (status && user.isSuperAdmin()) {
      organization.status = status;
    }
    
    // 保存
    await organization.save();
    
    return res.status(200).json({
      success: true,
      message: '組織が正常に更新されました',
      data: organization
    });
  } catch (error) {
    console.error('組織更新エラー:', error);
    return res.status(500).json({
      success: false,
      message: '組織の更新中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * 組織にAPIキーを追加
 * @route POST /api/simple/organizations/:id/apikeys
 */
exports.addApiKey = async (req, res) => {
  try {
    const userId = req.userId;
    const organizationId = req.params.id;
    const { keyValue } = req.body;
    
    if (!keyValue) {
      return res.status(400).json({
        success: false,
        message: 'APIキー値は必須です'
      });
    }
    
    // APIキーの検証 (sk-ant-で始まるかなど)
    if (!keyValue.startsWith('sk-ant-')) {
      return res.status(400).json({
        success: false,
        message: '無効なAPIキー形式です。Anthropic APIキーは「sk-ant-」で始まります'
      });
    }
    
    // 組織を取得
    const organization = await SimpleOrganization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: '組織が見つかりません'
      });
    }
    
    // ユーザーの権限チェック
    const user = await SimpleUser.findById(userId);
    
    // SuperAdminまたは組織の作成者のみAPIキー追加可能
    if (!user.isSuperAdmin() && organization.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'この組織にAPIキーを追加する権限がありません'
      });
    }

    // AnthropicApiKeyモデルを動的に読み込み
    const AnthropicApiKey = require('../models/anthropicApiKey.model');

    // APIキーのヒントを生成
    const keyHint = formatApiKeyHint(keyValue);
    let apiKeyId;
    let keyName = 'API Key'; // デフォルト名

    try {
      // Anthropic APIを使用してAPIキー情報を検証または取得
      const adminKey = process.env.ANTHROPIC_ADMIN_KEY;
      
      if (adminKey) {
        try {
          // APIキーの検証を行い、IDを取得
          const apiKeyInfoResponse = await anthropicAdminService.verifyApiKey(adminKey, keyValue);
          
          if (apiKeyInfoResponse && apiKeyInfoResponse.id) {
            // APIキーIDとして実際のAnthropicのIDを使用
            apiKeyId = apiKeyInfoResponse.id;
            
            // APIキーの名前を取得 (Anthropicで設定されているキー名を使用)
            keyName = apiKeyInfoResponse.name || `API Key`;
            console.log(`Anthropicから取得したキー名: ${keyName}`);
          }
        } catch (apiError) {
          console.error('Anthropic APIキー検証エラー:', apiError);
          return res.status(400).json({
            success: false,
            message: apiError.message || 'APIキーの検証中にエラーが発生しました'
          });
        }
      }
      
      // Anthropic APIでの検証に失敗した場合はエラーを返す
      if (!apiKeyId) {
        return res.status(400).json({
          success: false,
          message: 'APIキーの検証に失敗しました。Anthropic API からキー情報を取得できませんでした。'
        });
      }
      
      try {
        // 組織のAPIキーリストに追加 - ユニークにする
        if (!organization.apiKeyIds.includes(apiKeyId)) {
          organization.apiKeyIds.push(apiKeyId);
          await organization.save();
        }
        
        // APIキー情報をAnthropicApiKeyモデルに保存
        // keyNameはスコープ上部で宣言済み
        
        // 既存のキーを確認
        let apiKeyDoc = await AnthropicApiKey.findOne({ apiKeyId });
        
        if (apiKeyDoc) {
          // 既存のキーがあれば名前だけ更新
          apiKeyDoc.name = keyName;
          apiKeyDoc.lastSyncedAt = new Date();
          await apiKeyDoc.save();
        } else {
          // 新規キーを作成
          apiKeyDoc = new AnthropicApiKey({
            apiKeyId: apiKeyId,
            keyHint: keyHint,
            name: keyName,
            status: 'active',
            lastSyncedAt: new Date()
          });
          await apiKeyDoc.save();
        }
        
        // 自動的にユーザーに紐づけない - 後でユーザーを作成する際に選択できるようにする
        
        return res.status(201).json({
          success: true,
          message: 'APIキーが正常に追加されました',
          data: {
            apiKey: {
              id: apiKeyId,
              // keyValueは返さない
              organizationId: organization._id,
              status: 'active',
              name: keyName
          },
          organization
        }
        });
      } catch (err) {
        console.error('APIキー保存エラー:', err);
        return res.status(500).json({
          success: false,
          message: 'APIキーの保存中にエラーが発生しました',
          error: err.message
        });
      }
    } catch (verifyError) {
      console.error('APIキー検証/追加エラー:', verifyError);
      return res.status(500).json({
        success: false,
        message: 'APIキーの追加中にエラーが発生しました',
        error: verifyError.message
      });
    }
  } catch (error) {
    console.error('APIキー追加エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'APIキーの追加中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * 組織のAPIキーを削除
 * @route DELETE /api/simple/organizations/:id/apikeys/:keyId
 */
exports.removeApiKey = async (req, res) => {
  try {
    const userId = req.userId;
    const organizationId = req.params.id;
    const keyId = req.params.keyId;
    
    // 組織を取得
    const organization = await SimpleOrganization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: '組織が見つかりません'
      });
    }
    
    // ユーザーの権限チェック
    const user = await SimpleUser.findById(userId);
    
    // SuperAdminまたは組織の作成者のみAPIキー削除可能
    if (!user.isSuperAdmin() && organization.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'この組織からAPIキーを削除する権限がありません'
      });
    }
    
    // APIキーが組織に属しているか確認
    if (!organization.apiKeyIds.includes(keyId)) {
      return res.status(404).json({
        success: false,
        message: '指定されたAPIキーがこの組織に見つかりません'
      });
    }
    
    // 組織のAPIキーリストから削除
    organization.apiKeyIds = organization.apiKeyIds.filter(id => id !== keyId);
    await organization.save();
    
    // AnthropicApiKeyモデルを動的に読み込み
    const AnthropicApiKey = require('../models/anthropicApiKey.model');
    
    // AnthropicApiKeyモデルからAPIキーを削除（または非アクティブに設定）
    const apiKey = await AnthropicApiKey.findOne({ apiKeyId: keyId });
    if (apiKey) {
      // 完全に削除せず、ステータスを変更して履歴として残す
      apiKey.status = 'archived';
      await apiKey.save();
      console.log(`APIキー ${keyId} をアーカイブしました`);
    } else {
      console.log(`APIキー ${keyId} はAnthropicApiKeyモデルに見つかりませんでした`);
    }
    
    // このAPIキーを使用していたユーザーのAPIキー参照をクリア
    await SimpleUser.updateMany(
      { apiKeyId: keyId },
      { $set: { apiKeyId: null, apiKeyValue: null } }
    );
    
    return res.status(200).json({
      success: true,
      message: 'APIキーが正常に削除されました',
      data: organization
    });
  } catch (error) {
    console.error('APIキー削除エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'APIキーの削除中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * 組織のAPIキー一覧を取得
 * @route GET /api/simple/organizations/:id/apikeys
 */
exports.getApiKeys = async (req, res) => {
  try {
    const userId = req.userId;
    const organizationId = req.params.id;
    
    // 組織を取得
    const organization = await SimpleOrganization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: '組織が見つかりません'
      });
    }
    
    // ユーザーの権限チェック
    const user = await SimpleUser.findById(userId);
    
    // アクセス権があるかチェック（SuperAdmin、作成者、または所属メンバー）
    if (!user.isSuperAdmin() && 
        organization.createdBy.toString() !== userId.toString() && 
        user.organizationId?.toString() !== organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'この組織へのアクセス権限がありません'
      });
    }
    
    // AnthropicApiKeyモデルを動的に読み込み
    const AnthropicApiKey = require('../models/anthropicApiKey.model');
    
    const apiKeys = [];
    const processedKeyIds = new Set();
    
    // まず、AnthropicApiKeyモデルからAPIキー情報を取得
    if (organization.apiKeyIds && organization.apiKeyIds.length > 0) {
      const anthApiKeys = await AnthropicApiKey.find({
        apiKeyId: { $in: organization.apiKeyIds }
      });
      
      // AnthropicApiKeyからの情報を処理
      for (const apiKey of anthApiKeys) {
        // このAPIキーに紐づくユーザーを検索
        const usersWithThisKey = await SimpleUser.find({
          organizationId: organization._id,
          apiKeyId: apiKey.apiKeyId
        }, 'name email');
        
        apiKeys.push({
          _id: apiKey.apiKeyId,
          id: apiKey.apiKeyId,
          organizationId: organization._id,
          status: apiKey.status,
          name: apiKey.name || `API Key`,
          createdAt: apiKey.createdAt,
          updatedAt: apiKey.updatedAt,
          assignedToUser: usersWithThisKey.length > 0,
          assignedUsers: usersWithThisKey.map(u => ({ id: u._id, name: u.name, email: u.email }))
        });
        
        processedKeyIds.add(apiKey.apiKeyId);
      }
    }
    
    // SimpleUserモデルから紐づいているキーを検索（AnthropicApiKeyモデルに存在しない場合）
    const usersWithApiKeys = await SimpleUser.find({
      organizationId: organization._id,
      apiKeyId: { $in: organization.apiKeyIds },
      apiKeyId: { $ne: null }
    }, 'apiKeyId name email');
    
    // ユーザーモデルに紐づいているキーを処理
    for (const userWithKey of usersWithApiKeys) {
      if (userWithKey.apiKeyId && !processedKeyIds.has(userWithKey.apiKeyId)) {
        // このAPIキーIDを持つすべてのユーザーを収集
        const allUsersWithThisKey = usersWithApiKeys.filter(u => 
          u.apiKeyId === userWithKey.apiKeyId
        );
        
        apiKeys.push({
          _id: userWithKey.apiKeyId,
          id: userWithKey.apiKeyId,
          organizationId: organization._id,
          status: 'active', // ユーザーに割り当てられているのでアクティブと仮定
          name: `User Key (${userWithKey.apiKeyId.substring(0, 8)}...)`,
          createdAt: new Date(),
          updatedAt: new Date(),
          assignedToUser: true,
          assignedUsers: allUsersWithThisKey.map(u => ({ id: u._id, name: u.name, email: u.email }))
        });
        
        processedKeyIds.add(userWithKey.apiKeyId);
      }
    }
    
    // 組織に紐づいているが、どこにも存在しないAPIキーIDの処理
    for (const keyId of organization.apiKeyIds) {
      if (!processedKeyIds.has(keyId)) {
        apiKeys.push({
          _id: keyId,
          id: keyId,
          organizationId: organization._id,
          status: 'unknown',
          name: `Unknown Key (${keyId.substring(0, 8)}...)`,
          createdAt: new Date(),
          updatedAt: new Date(),
          assignedToUser: false,
          assignedUsers: []
        });
        
        processedKeyIds.add(keyId);
      }
    }
    
    console.log('APIキー一覧レスポンス:', JSON.stringify(apiKeys, null, 2));
    
    return res.status(200).json({
      success: true,
      data: apiKeys
    });
  } catch (error) {
    console.error('APIキー一覧取得エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'APIキー一覧の取得中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * 組織を削除（無効化）
 * @route DELETE /api/simple/organizations/:id
 */
exports.deleteOrganization = async (req, res) => {
  try {
    const userId = req.userId;
    const organizationId = req.params.id;
    
    // 組織を取得
    const organization = await SimpleOrganization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: '組織が見つかりません'
      });
    }
    
    // ユーザーの権限チェック
    const user = await SimpleUser.findById(userId);
    
    // SuperAdminまたは組織の作成者のみ削除可能
    if (!user.isSuperAdmin() && organization.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'この組織を削除する権限がありません'
      });
    }
    
    // 組織を無効化（完全削除ではなく）
    organization.status = 'disabled';
    await organization.save();
    
    // 関連するAPIキーも無効化
    await SimpleApiKey.updateMany(
      { organizationId: organization._id },
      { $set: { status: 'disabled' } }
    );
    
    // この組織に属するユーザーの組織参照をクリア
    await SimpleUser.updateMany(
      { organizationId: organization._id },
      { $set: { organizationId: null, apiKeyId: null } }
    );
    
    return res.status(200).json({
      success: true,
      message: '組織が正常に削除されました'
    });
  } catch (error) {
    console.error('組織削除エラー:', error);
    return res.status(500).json({
      success: false,
      message: '組織の削除中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * ワークスペースIDを生成（モック関数）
 * @returns {string} ワークスペースID
 */
function generateWorkspaceId() {
  return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * ワークスペースを作成（Anthropic APIを使用）
 * @route POST /api/simple/organizations/:id/create-workspace
 */
exports.createWorkspace = async (req, res) => {
  try {
    const userId = req.userId;
    const organizationId = req.params.id;
    
    // 組織を取得
    const organization = await SimpleOrganization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: '組織が見つかりません'
      });
    }
    
    // ユーザーの権限チェック
    const user = await SimpleUser.findById(userId);
    
    // SuperAdminまたは組織の作成者、または管理者のみワークスペース作成可能
    if (!user.isSuperAdmin() && 
        organization.createdBy.toString() !== userId.toString() && 
        !user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'ワークスペースを作成する権限がありません'
      });
    }
    
    // ワークスペース名が設定されているか確認
    if (!organization.workspaceName) {
      return res.status(400).json({
        success: false,
        message: 'ワークスペース名が設定されていません'
      });
    }

    // APIキーが設定されているか確認
    const adminKey = process.env.ANTHROPIC_ADMIN_KEY;
    
    if (!adminKey) {
      return res.status(400).json({
        success: false,
        message: 'ANTHROPIC_ADMIN_KEY が設定されていません。ワークスペースを作成できません。',
        error: 'API_KEY_MISSING'
      });
    }
    
    // リクエストデータ - シンプルにワークスペース名のみ送信
    const requestData = {
      name: organization.workspaceName
    };
    
    try {
      // Anthropic API を呼び出す
      const anthropicResponse = await axios.post(
        'https://api.anthropic.com/v1/organizations/workspaces',
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
            'x-api-key': adminKey
          },
          timeout: 15000 // 15秒タイムアウト
        }
      );
      
      // 組織オブジェクトにワークスペースIDを保存
      organization.workspaceId = anthropicResponse.data.id;
      await organization.save();
      
      // ワークスペースの詳細をレスポンスに含める
      return res.status(201).json({
        success: true,
        message: 'ワークスペースが正常に作成されました',
        data: {
          workspaceId: anthropicResponse.data.id,
          workspaceName: anthropicResponse.data.name,
          organization: organization.name,
          createdAt: anthropicResponse.data.created_at
        }
      });
    } catch (apiError) {
      // エラーの種類によって異なる処理
      if (apiError.response) {
        // レスポンスありのエラー (HTTPエラーなど)
        const statusCode = apiError.response.status;
        const errorMessage = apiError.response.data?.error?.message || apiError.response.statusText;
        
        return res.status(statusCode).json({
          success: false,
          message: 'Anthropic APIでのワークスペース作成に失敗しました',
          error: errorMessage
        });
      } else if (apiError.request) {
        // リクエストは送信されたがレスポンスがない場合
        return res.status(504).json({
          success: false,
          message: 'Anthropic APIへの接続がタイムアウトしました',
          error: 'NETWORK_TIMEOUT'
        });
      } else {
        // リクエスト設定時のエラー
        return res.status(500).json({
          success: false,
          message: 'ワークスペース作成リクエストの設定中にエラーが発生しました',
          error: apiError.message
        });
      }
    }
  } catch (error) {
    console.error('ワークスペース作成エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'ワークスペースの作成中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * 組織に所属するユーザー一覧を取得
 * @route GET /api/simple/organizations/:id/users
 */
exports.getOrganizationUsers = async (req, res) => {
  try {
    const userId = req.userId;
    const organizationId = req.params.id;
    
    // 組織データを取得
    const organization = await SimpleOrganization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: '組織が見つかりません'
      });
    }
    
    // ユーザーのロールと権限を確認
    const user = await SimpleUser.findById(userId);
    
    // アクセス権があるかチェック（SuperAdmin、作成者、または所属メンバー）
    if (!user.isSuperAdmin() && 
        organization.createdBy.toString() !== userId.toString() && 
        user.organizationId?.toString() !== organizationId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'この組織へのアクセス権限がありません'
      });
    }
    
    // Admin以上のロールのみユーザーリストにアクセス可能
    if (!user.isAdmin() && !user.isSuperAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'この組織のユーザーリストにアクセスする権限がありません'
      });
    }
    
    // 組織に所属するユーザー一覧を取得
    const members = await SimpleUser.find({
      organizationId: organization._id
    }, '-password -refreshToken');
    
    return res.status(200).json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('組織ユーザー一覧取得エラー:', error);
    return res.status(500).json({
      success: false,
      message: '組織ユーザー一覧の取得中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * 組織にユーザーを追加
 * @route POST /api/simple/organizations/:id/users
 */
exports.addOrganizationUser = async (req, res) => {
  try {
    const userId = req.userId;
    const organizationId = req.params.id;
    const { name, email, password, role, apiKeyId } = req.body;
    
    // 必須フィールドの検証
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'ユーザー名、メールアドレス、パスワードは必須です'
      });
    }
    
    // 組織データを取得
    const organization = await SimpleOrganization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: '組織が見つかりません'
      });
    }
    
    // ユーザーのロールと権限を確認
    const user = await SimpleUser.findById(userId);
    
    // アクセス権があるかチェック（SuperAdmin、作成者、または組織の管理者）
    const hasAccess = user.isSuperAdmin() || 
                      organization.createdBy.toString() === userId.toString() || 
                      (user.isAdmin() && user.organizationId?.toString() === organizationId.toString());
                      
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'この組織にユーザーを追加する権限がありません'
      });
    }
    
    // SuperAdminのみが他のSuperAdminを作成可能
    if (role === 'SuperAdmin' && !user.isSuperAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'SuperAdminユーザーを作成する権限がありません'
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
    
    // APIキーの処理
    let finalApiKeyId = null;
    
    // リクエストでAPIキーIDが指定されている場合、それを使用
    if (apiKeyId && organization.apiKeyIds.includes(apiKeyId)) {
      // AnthropicApiKeyモデルからキー情報を確認
      const AnthropicApiKey = require('../models/anthropicApiKey.model');
      const apiKeyInfo = await AnthropicApiKey.findOne({ apiKeyId: apiKeyId });
      
      if (apiKeyInfo) {
        // 有効なキーのみ割り当て可能
        if (apiKeyInfo.status === 'active') {
          finalApiKeyId = apiKeyId;
        } else {
          return res.status(400).json({
            success: false,
            message: `選択されたAPIキー(${apiKeyId})は${apiKeyInfo.status}状態のため使用できません`
          });
        }
      } else {
        console.warn(`APIキー ${apiKeyId} がAnthropicApiKeyモデルに見つかりませんでした`);
        finalApiKeyId = apiKeyId; // 念のため割り当て
      }
    } 
    // 指定がない場合でも自動割り当てはしない
    // - 以前は自動割り当てしていたが、明示的に指定する方針に変更
    
    // 新しいユーザーを作成
    const newUser = new SimpleUser({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'User',
      organizationId,
      apiKeyId: finalApiKeyId, // キーIDのみ保存
      status: 'active'
    });
    
    // 保存
    await newUser.save();
    
    // パスワードを含まない形で返す
    const userResponse = newUser.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;
    
    return res.status(201).json({
      success: true,
      message: 'ユーザーが正常に追加されました',
      data: userResponse
    });
  } catch (error) {
    console.error('組織ユーザー追加エラー:', error);
    return res.status(500).json({
      success: false,
      message: '組織へのユーザー追加中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * 組織からユーザーを削除
 * @route DELETE /api/simple/organizations/:id/users/:userId
 */
exports.removeOrganizationUser = async (req, res) => {
  try {
    const requesterId = req.userId;
    const organizationId = req.params.id;
    const targetUserId = req.params.userId;
    
    // 組織データを取得
    const organization = await SimpleOrganization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: '組織が見つかりません'
      });
    }
    
    // 削除対象のユーザーを取得
    const targetUser = await SimpleUser.findById(targetUserId);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: '対象ユーザーが見つかりません'
      });
    }
    
    // ユーザーが指定された組織に所属しているか確認
    if (!targetUser.organizationId || targetUser.organizationId.toString() !== organizationId) {
      return res.status(400).json({
        success: false,
        message: '指定されたユーザーはこの組織に所属していません'
      });
    }
    
    // リクエスト実行者の権限チェック
    const requester = await SimpleUser.findById(requesterId);
    
    // アクセス権があるかチェック（SuperAdmin、作成者、または組織の管理者）
    const hasSuperAdminAccess = requester.isSuperAdmin();
    const isCreator = organization.createdBy.toString() === requesterId.toString();
    const hasAdminAccess = requester.isAdmin() && 
                           requester.organizationId && 
                           requester.organizationId.toString() === organizationId;
    
    if (!hasSuperAdminAccess && !isCreator && !hasAdminAccess) {
      return res.status(403).json({
        success: false,
        message: 'この組織からユーザーを削除する権限がありません'
      });
    }
    
    // SuperAdminの削除は他のSuperAdminのみが可能
    if (targetUser.isSuperAdmin && targetUser.isSuperAdmin() && !requester.isSuperAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'SuperAdminユーザーを削除する権限がありません'
      });
    }
    
    // 自分自身を削除することはできない
    if (targetUserId === requesterId) {
      return res.status(400).json({
        success: false,
        message: '自分自身を組織から削除することはできません'
      });
    }
    
    // 組織からユーザーを削除（組織IDをnullに設定）
    targetUser.organizationId = null;
    targetUser.apiKeyId = null; // 組織のAPIキーも解除
    await targetUser.save();
    
    return res.status(200).json({
      success: true,
      message: 'ユーザーが正常に組織から削除されました'
    });
  } catch (error) {
    console.error('組織ユーザー削除エラー:', error);
    return res.status(500).json({
      success: false,
      message: '組織からのユーザー削除中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * 組織内のユーザーの役割を更新
 * @route PUT /api/simple/organizations/:id/users/:userId/role
 */
exports.updateUserRole = async (req, res) => {
  try {
    const requesterId = req.userId;
    const organizationId = req.params.id;
    const targetUserId = req.params.userId;
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({
        success: false,
        message: '役割は必須です'
      });
    }
    
    // 有効な役割かチェック
    const validRoles = ['User', 'Admin', 'SuperAdmin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: '無効な役割です'
      });
    }
    
    // 組織データを取得
    const organization = await SimpleOrganization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: '組織が見つかりません'
      });
    }
    
    // 対象ユーザーを取得
    const targetUser = await SimpleUser.findById(targetUserId);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: '対象ユーザーが見つかりません'
      });
    }
    
    // ユーザーが指定された組織に所属しているか確認
    if (!targetUser.organizationId || targetUser.organizationId.toString() !== organizationId) {
      return res.status(400).json({
        success: false,
        message: '指定されたユーザーはこの組織に所属していません'
      });
    }
    
    // リクエスト実行者の権限チェック
    const requester = await SimpleUser.findById(requesterId);
    
    // アクセス権があるかチェック（SuperAdmin、作成者、または組織の管理者）
    const hasSuperAdminAccess = requester.isSuperAdmin();
    const isCreator = organization.createdBy.toString() === requesterId.toString();
    const hasAdminAccess = requester.isAdmin() && 
                           requester.organizationId && 
                           requester.organizationId.toString() === organizationId;
    
    if (!hasSuperAdminAccess && !isCreator && !hasAdminAccess) {
      return res.status(403).json({
        success: false,
        message: 'このユーザーの役割を変更する権限がありません'
      });
    }
    
    // SuperAdminのみがSuperAdmin役割を付与可能
    if (role === 'SuperAdmin' && !requester.isSuperAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'SuperAdmin役割を付与する権限がありません'
      });
    }
    
    // SuperAdminユーザーの役割変更はSuperAdminのみが可能
    if (targetUser.role === 'SuperAdmin' && !requester.isSuperAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'SuperAdminユーザーの役割を変更する権限がありません'
      });
    }
    
    // 自分自身の役割を下げることはできない
    if (targetUserId === requesterId && 
        ((targetUser.role === 'SuperAdmin' && role !== 'SuperAdmin') || 
         (targetUser.role === 'Admin' && role === 'User'))) {
      return res.status(400).json({
        success: false,
        message: '自分自身の役割を下げることはできません'
      });
    }
    
    // 役割を更新
    targetUser.role = role;
    await targetUser.save();
    
    return res.status(200).json({
      success: true,
      message: 'ユーザーの役割が正常に更新されました',
      data: {
        userId: targetUser._id,
        role: targetUser.role
      }
    });
  } catch (error) {
    console.error('ユーザー役割更新エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'ユーザーの役割更新中にエラーが発生しました',
      error: error.message
    });
  }
};