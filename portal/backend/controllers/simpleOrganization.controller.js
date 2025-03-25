/**
 * シンプルな組織管理コントローラー
 * 組織の作成、取得、更新、削除を行います
 */
const SimpleOrganization = require('../models/simpleOrganization.model');
const SimpleUser = require('../models/simpleUser.model');
const axios = require('axios');
const anthropicAdminService = require('../services/anthropicAdminService');

// APIキー値を処理する関数
function formatApiKeyHint(keyValue) {
  if (!keyValue) return { hint: '', full: '' };
  
  // 完全なキー値を返す
  return {
    hint: keyValue, // キー値をそのまま保存
    full: keyValue  // 完全なAPIキー値を保持
  };
}

// デバッグ用の関数 - APIキー値のログ出力
function debugApiKey(keyValue, apiKeyId, context) {
  const length = keyValue ? keyValue.length : 0;
  console.log(`[APIキーデバッグ] ${context}: API Key ID=${apiKeyId}, 値の長さ=${length}文字, 先頭=${keyValue ? keyValue.substring(0, 10) : 'なし'}...`);
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

    // 詳細なデバッグ情報を出力 - コントローラー内での処理を追跡
    console.log(`[DEBUG-API-KEY-FLOW] 開始: APIキー追加処理を開始します`);
    console.log(`[DEBUG-API-KEY-FLOW] 入力: APIキー長=${keyValue ? keyValue.length : 0}, 先頭=${keyValue ? keyValue.substring(0, 10) : '不明'}...`);
    console.log(`[DEBUG-API-KEY-FLOW] ENV変数: ANTHROPIC_ADMIN_KEY=${process.env.ANTHROPIC_ADMIN_KEY ? '設定あり' : '設定なし'}`);
    
    // APIキーのヒントと完全なキー値を生成
    const keyInfo = formatApiKeyHint(keyValue);
    console.log(`[DEBUG-API-KEY-FLOW] keyInfo生成: full=${keyInfo.full ? '設定済み' : '未設定'}, hint=${keyInfo.hint ? '設定済み' : '未設定'}`);
    
    let apiKeyId;
    let keyName = 'API Key'; // デフォルト名

    try {
      // デバッグ - 入力値の確認
      console.log(`受信したAPIキー値: 長さ=${keyValue.length}, 先頭=${keyValue.substring(0, 10)}...`);
      
      // Admin API Keyが設定されているか確認
      const adminApiKey = process.env.ANTHROPIC_ADMIN_KEY;
      console.log(`[DEBUG-API-KEY-FLOW] adminApiKey: ${adminApiKey ? '設定済み' : '未設定'}`);
      
      if (adminApiKey) {
        try {
          // Anthropic Admin APIを使用してAPIキー情報を取得
          console.log(`[DEBUG-API-KEY-FLOW] Anthropic API呼び出し開始: keyLength=${keyValue.length}`);
          console.log('Anthropic Admin APIを使用してAPIキー情報を取得します');
          
          // API呼び出し開始時間を記録
          const apiStartTime = Date.now();
          const keyInfo = await anthropicAdminService.verifyApiKey(adminApiKey, keyValue);
          const apiEndTime = Date.now();
          console.log(`[DEBUG-API-KEY-FLOW] API呼び出し完了: 所要時間=${apiEndTime - apiStartTime}ms`);
          
          // APIキーIDと名前を設定
          apiKeyId = keyInfo.id;
          keyName = keyInfo.name;
          
          console.log(`[DEBUG-API-KEY-FLOW] API結果: ID=${apiKeyId}, 名前=${keyName}`);
          console.log(`Anthropic APIから取得: ID=${apiKeyId}, 名前=${keyName}`);
        } catch (apiError) {
          console.log(`[DEBUG-API-KEY-FLOW] API呼び出しエラー: ${apiError.message}`);
          console.log(`[DEBUG-API-KEY-FLOW] エラースタック: ${apiError.stack}`);
          console.error('Anthropic API呼び出しエラー:', apiError);
          
          // エラーの場合はユニークなIDを生成
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 8);
          apiKeyId = `apikey_${timestamp}_${randomStr}`;
          
          // APIキー名を生成
          keyName = `APIKey_${new Date().toISOString().slice(0, 10)}`;
          console.log(`[DEBUG-API-KEY-FLOW] 生成されたID: ${apiKeyId}, 名前: ${keyName}`);
          console.log(`APIキー情報の取得に失敗しました。生成されたID: ${apiKeyId}`);
        }
      } else {
        // Admin API Keyが設定されていない場合はユニークなIDを生成
        console.log('[DEBUG-API-KEY-FLOW] ANTHROPIC_ADMIN_KEYが未設定のため、スキップします');
        console.log('ANTHROPIC_ADMIN_KEYが設定されていないため、APIキー検証をスキップします');
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        apiKeyId = `apikey_${timestamp}_${randomStr}`;
        
        // APIキー名に入力されたキー値の一部を使用
        const keyParts = keyValue.split('-');
        console.log(`[DEBUG-API-KEY-FLOW] キー分割: パート数=${keyParts.length}`);
        if (keyParts.length > 3 && keyParts[3]) {
          keyName = keyParts[3]; // 4番目のパート（ユーザー指定部分）を名前として使用
          console.log(`[DEBUG-API-KEY-FLOW] パートから名前生成: ${keyName}`);
        } else {
          keyName = `APIKey_${new Date().toISOString().slice(0, 10)}`;
          console.log(`[DEBUG-API-KEY-FLOW] デフォルト名前生成: ${keyName}`);
        }
      }
      
      console.log(`生成したAPIキーID: ${apiKeyId}`);
      console.log(`設定したキー名: ${keyName}`);
      
      // キー情報の確認とデバッグ
      if (!keyInfo || !keyInfo.full) {
        console.log(`[DEBUG-API-KEY-FLOW] 警告: keyInfo.fullが未設定`);
        console.error('⚠️ 警告: keyInfo.fullが設定されていません');
        // 緊急対応: keyInfoが正しく設定されていない場合は直接代入
        keyInfo = {
          hint: keyValue,
          full: keyValue // 完全なAPIキー値を確実に設定
        };
        console.log(`[DEBUG-API-KEY-FLOW] keyInfo再設定: full=${keyInfo.full ? '設定済み' : '未設定'}, hint=${keyInfo.hint ? '設定済み' : '未設定'}`);
      }
      
      // デバッグ - keyInfo確認
      debugApiKey(keyInfo.full, apiKeyId, '処理前');
      
      try {
        console.log(`[DEBUG-API-KEY-FLOW] 組織にAPIキー追加: orgId=${organization._id}, apiKeyId=${apiKeyId}`);
        // 組織のAPIキーリストに追加 - ユニークにする
        if (!organization.apiKeyIds.includes(apiKeyId)) {
          organization.apiKeyIds.push(apiKeyId);
          await organization.save();
          console.log(`[DEBUG-API-KEY-FLOW] 組織のAPIキーリスト更新成功`);
        } else {
          console.log(`[DEBUG-API-KEY-FLOW] 組織のAPIキーリストには既に含まれています`);
        }
        
        // APIキー情報をAnthropicApiKeyモデルに保存
        // keyNameはスコープ上部で宣言済み
        console.log(`[DEBUG-API-KEY-FLOW] DB検索: apiKeyId=${apiKeyId}`);
        
        // 既存のキーを確認
        let apiKeyDoc = await AnthropicApiKey.findOne({ apiKeyId });
        console.log(`[DEBUG-API-KEY-FLOW] DB検索結果: ${apiKeyDoc ? '既存データあり' : '新規データ'}`);
        
        if (apiKeyDoc) {
          // 既存のキーがあれば名前と完全なキー値を更新
          console.log(`[DEBUG-API-KEY-FLOW] 既存キー更新: id=${apiKeyDoc._id}, name=${keyName}`);
          apiKeyDoc.name = keyName;
          apiKeyDoc.apiKeyFull = keyInfo.full; // 完全なAPIキー値を保存
          apiKeyDoc.lastSyncedAt = new Date();
          debugApiKey(apiKeyDoc.apiKeyFull, apiKeyId, '既存キー更新');
          
          try {
            const saveStart = Date.now();
            await apiKeyDoc.save();
            const saveEnd = Date.now();
            console.log(`[DEBUG-API-KEY-FLOW] 既存キー保存完了: 所要時間=${saveEnd - saveStart}ms`);
          } catch (saveError) {
            console.log(`[DEBUG-API-KEY-FLOW] 既存キー保存エラー: ${saveError.message}`);
            console.log(`[DEBUG-API-KEY-FLOW] エラースタック: ${saveError.stack}`);
            throw saveError;
          }
        } else {
          // 新規キーを作成
          console.log(`[DEBUG-API-KEY-FLOW] 新規キー作成: id=${apiKeyId}, name=${keyName}, apiKeyFull長=${keyInfo.full ? keyInfo.full.length : 0}文字`);
          
          try {
            apiKeyDoc = new AnthropicApiKey({
              apiKeyId: apiKeyId,
              apiKeyFull: keyInfo.full, // 完全なAPIキー値を保存
              name: keyName,
              status: 'active',
              lastSyncedAt: new Date()
            });
            
            console.log(`[DEBUG-API-KEY-FLOW] 作成したドキュメント: ${apiKeyDoc ? 'OK' : 'NULL'}, apiKeyFull=${apiKeyDoc.apiKeyFull ? '設定済み' : '未設定'}`);
            
            debugApiKey(apiKeyDoc.apiKeyFull, apiKeyId, '新規キー作成');
            
            const saveStart = Date.now();
            await apiKeyDoc.save();
            const saveEnd = Date.now();
            console.log(`[DEBUG-API-KEY-FLOW] 新規キー保存完了: 所要時間=${saveEnd - saveStart}ms`);
          } catch (saveError) {
            console.log(`[DEBUG-API-KEY-FLOW] 新規キー保存エラー: ${saveError.message}`);
            console.log(`[DEBUG-API-KEY-FLOW] エラースタック: ${saveError.stack}`);
            console.log(`[DEBUG-API-KEY-FLOW] バリデーションエラー: ${JSON.stringify(saveError.errors || {})}`);
            throw saveError;
          }
        }
        
        // 保存後の確認
        console.log(`[DEBUG-API-KEY-FLOW] 保存確認開始: apiKeyId=${apiKeyId}`);
        const savedKey = await AnthropicApiKey.findOne({ apiKeyId });
        console.log(`[DEBUG-API-KEY-FLOW] 保存確認結果: ${savedKey ? 'データあり' : 'データなし'}`);
        
        if (savedKey) {
          console.log(`[DEBUG-API-KEY-FLOW] 保存確認詳細: name=${savedKey.name}, apiKeyFull=${savedKey.apiKeyFull ? '設定済み' : '未設定'}, 長さ=${savedKey.apiKeyFull ? savedKey.apiKeyFull.length : 0}文字`);
          debugApiKey(savedKey.apiKeyFull, apiKeyId, '保存後確認');
        } else {
          console.log(`[DEBUG-API-KEY-FLOW] 警告: 保存確認でデータが見つかりません`);
        }
        
        // 自動的にユーザーに紐づけない - 後でユーザーを作成する際に選択できるようにする
        console.log(`[DEBUG-API-KEY-FLOW] 処理完了: 正常終了`);
        
        // 最終確認 - apiKeyFullがちゃんと保存されているか
        const finalCheck = await AnthropicApiKey.findOne({ apiKeyId }).lean();
        console.log(`[DEBUG-API-KEY-FLOW] 最終確認: apiKeyFull=${finalCheck && finalCheck.apiKeyFull ? '設定済み' : '未設定'}, 長さ=${finalCheck && finalCheck.apiKeyFull ? finalCheck.apiKeyFull.length : 0}文字`);
        
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
        console.log(`[DEBUG-API-KEY-FLOW] データ保存エラー: ${err.message}`);
        console.log(`[DEBUG-API-KEY-FLOW] エラースタック: ${err.stack}`);
        console.error('APIキー保存エラー:', err);
        return res.status(500).json({
          success: false,
          message: 'APIキーの保存中にエラーが発生しました',
          error: err.message
        });
      }
    } catch (verifyError) {
      console.log(`[DEBUG-API-KEY-FLOW] 処理エラー: ${verifyError.message}`);
      console.log(`[DEBUG-API-KEY-FLOW] エラースタック: ${verifyError.stack}`);
      console.error('APIキー検証/追加エラー:', verifyError);
      return res.status(500).json({
        success: false,
        message: 'APIキーの追加中にエラーが発生しました',
        error: verifyError.message
      });
    }
    
    console.log(`[DEBUG-API-KEY-FLOW] 追加処理終了`); // 最終ログ（どのパスで終了したか確認用）
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