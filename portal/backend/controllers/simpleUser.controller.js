/**
 * シンプルなユーザー管理コントローラー
 * ユーザーの作成、取得、更新、削除を行います
 */
const SimpleUser = require('../models/simpleUser.model');
const SimpleOrganization = require('../models/simpleOrganization.model');

/**
 * APIキー値を処理する関数
 * @param {string} keyValue - オリジナルのAPIキー
 * @returns {Object} - APIキー情報
 */
function formatApiKeyHint(keyValue) {
  if (!keyValue) return { hint: '', full: '' };
  
  // 完全なキー値を返す
  return {
    hint: keyValue, // キー値をそのまま保存
    full: keyValue  // 完全なAPIキー値を保持
  };
}
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.config');

/**
 * ユーザー一覧を取得
 * @route GET /api/simple/users
 */
exports.getUsers = async (req, res) => {
  try {
    const userId = req.userId;
    
    // ユーザーのロールを確認
    const currentUser = await SimpleUser.findById(userId);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }
    
    let users;
    
    // SuperAdminは全てのユーザーを取得可能
    if (currentUser.isSuperAdmin()) {
      users = await SimpleUser.find({}, '-password -refreshToken');
    }
    // Adminは自分とSuperAdmin以外のユーザーを取得可能
    else if (currentUser.isAdmin()) {
      users = await SimpleUser.find({ role: { $ne: 'SuperAdmin' } }, '-password -refreshToken');
    } 
    // 一般ユーザーは自分の情報のみ取得可能
    else {
      users = [await SimpleUser.findById(userId, '-password -refreshToken')];
    }
    
    // 管理者の場合、各ユーザーのCLI APIキー情報を含める
    if (currentUser.isAdmin()) {
      users = users.map(user => {
        const userObj = user.toObject();
        // アクティブなCLI APIキーのみ含める
        userObj.cliApiKeys = userObj.cliApiKeys ? userObj.cliApiKeys.filter(key => key.isActive) : [];
        return userObj;
      });
    } else {
      // 一般ユーザーにはCLI APIキー情報を含めない
      users = users.map(user => {
        const userObj = user.toObject();
        delete userObj.cliApiKeys;
        return userObj;
      });
    }
    
    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'ユーザー一覧の取得中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * 特定のユーザーを取得
 * @route GET /api/simple/users/:id
 */
exports.getUser = async (req, res) => {
  try {
    const requesterId = req.userId;
    const targetId = req.params.id;
    
    // リクエスト実行者の情報を取得
    const requester = await SimpleUser.findById(requesterId);
    
    if (!requester) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }
    
    // 対象ユーザーの情報を取得
    const targetUser = await SimpleUser.findById(targetId, '-password -refreshToken');
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: '対象ユーザーが見つかりません'
      });
    }
    
    // アクセス権チェック
    // 1. SuperAdminは全てのユーザー情報にアクセス可能
    // 2. Adminは組織に関係なく、SuperAdmin以外の全ユーザー情報にアクセス可能
    // 3. 一般ユーザーは自分の情報のみアクセス可能
    const hasSuperAdminAccess = requester.isSuperAdmin();
    const hasAdminAccess = requester.isAdmin() && targetUser.role !== 'SuperAdmin';
    const hasSelfAccess = requesterId === targetId;
    
    if (!hasSuperAdminAccess && !hasAdminAccess && !hasSelfAccess) {
      return res.status(403).json({
        success: false,
        message: 'このユーザー情報へのアクセス権限がありません'
      });
    }
    
    // 組織情報を取得（必要に応じて）
    let organization = null;
    if (targetUser.organizationId) {
      organization = await SimpleOrganization.findById(targetUser.organizationId);
    }
    
    // APIキー情報を取得（直接ユーザーモデルから）
    let apiKey = null;
    if (targetUser.apiKeyId && targetUser.apiKeyValue) {
      apiKey = {
        id: targetUser.apiKeyId,
        status: 'active',
        organizationId: targetUser.organizationId,
        keyValue: targetUser.apiKeyValue.substring(0, 8) + '...' + targetUser.apiKeyValue.substring(targetUser.apiKeyValue.length - 4) // マスク処理
      };
    }
    
    return res.status(200).json({
      success: true,
      data: {
        user: targetUser,
        organization,
        apiKey: apiKey
      }
    });
  } catch (error) {
    console.error('ユーザー取得エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'ユーザーの取得中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * 新しいユーザーを作成
 * @route POST /api/simple/users
 */
exports.createUser = async (req, res) => {
  try {
    const requesterId = req.userId;
    const { name, email, password, role, organizationId, apiKeyId } = req.body;
    
    // 必須フィールドの検証
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'ユーザー名、メールアドレス、パスワードは必須です'
      });
    }
    
    // リクエスト実行者の権限チェック
    const requester = await SimpleUser.findById(requesterId);
    
    if (!requester) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }
    
    // SuperAdminのみが他のSuperAdminを作成可能
    if (role === 'SuperAdmin' && !requester.isSuperAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'SuperAdminユーザーを作成する権限がありません'
      });
    }
    
    // 組織管理者のみが自分の組織にユーザーを追加可能
    if (organizationId && !requester.isSuperAdmin()) {
      const organization = await SimpleOrganization.findById(organizationId);
      
      if (!organization) {
        return res.status(404).json({
          success: false,
          message: '指定された組織が見つかりません'
        });
      }
      
      // 管理者で、かつ同じ組織に所属しているか確認
      if (!requester.isAdmin() || 
          requester.organizationId?.toString() !== organizationId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'この組織にユーザーを追加する権限がありません'
        });
      }
    }
    
    // メールアドレスの重複チェック
    const existingUser = await SimpleUser.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'このメールアドレスは既に使用されています'
      });
    }
    
    // APIキーの存在確認（組織のAPIキーリストにあるか）
    if (apiKeyId && organizationId) {
      const organization = await SimpleOrganization.findById(organizationId);
      
      if (!organization) {
        return res.status(404).json({
          success: false,
          message: '指定された組織が見つかりません'
        });
      }
      
      if (!organization.apiKeyIds.includes(apiKeyId)) {
        return res.status(404).json({
          success: false,
          message: '指定されたAPIキーが組織に見つかりません'
        });
      }
      
      // APIキー関連のレガシーコードを削除（ユーザーが直接設定する方式に変更）
    }
    
    // 新しいユーザーを作成
    const newUser = new SimpleUser({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'User',
      organizationId: organizationId || null,
      apiKeyId: apiKeyId || null,
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
      message: 'ユーザーが正常に作成されました',
      data: userResponse
    });
  } catch (error) {
    console.error('ユーザー作成エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'ユーザーの作成中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * ユーザーを更新
 * @route PUT /api/simple/users/:id
 */
exports.updateUser = async (req, res) => {
  try {
    const requesterId = req.userId;
    const targetId = req.params.id;
    const { name, email, password, role, organizationId, apiKeyId, status } = req.body;
    
    // 更新対象のユーザーを取得
    const targetUser = await SimpleUser.findById(targetId);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }
    
    // リクエスト実行者の権限チェック
    const requester = await SimpleUser.findById(requesterId);
    
    // アクセス権チェック
    const hasSuperAdminAccess = requester.isSuperAdmin();
    // 管理者は組織に関係なく、SuperAdmin以外の全ユーザーを操作可能
    const hasAdminAccess = requester.isAdmin() && targetUser.role !== 'SuperAdmin';
    const hasSelfAccess = requesterId === targetId;
    
    if (!hasSuperAdminAccess && !hasAdminAccess && !hasSelfAccess) {
      return res.status(403).json({
        success: false,
        message: 'このユーザーを更新する権限がありません'
      });
    }
    
    // SuperAdminのみが他のSuperAdminを更新可能
    if (role === 'SuperAdmin' && !requester.isSuperAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'SuperAdminユーザーを更新する権限がありません'
      });
    }
    
    // ユーザーのロールをSuperAdmin以外に変更するには、自身がSuperAdminである必要がある
    if (targetUser.role === 'SuperAdmin' && role !== 'SuperAdmin' && !requester.isSuperAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'SuperAdminユーザーのロールを変更する権限がありません'
      });
    }
    
    // 組織IDを変更する場合
    if (organizationId && organizationId !== targetUser.organizationId?.toString()) {
      // SuperAdminまたは管理者のみが組織を変更可能
      if (!hasSuperAdminAccess && !hasAdminAccess) {
        return res.status(403).json({
          success: false,
          message: 'ユーザーの組織を変更する権限がありません'
        });
      }
      
      // 組織の存在チェック
      const organization = await SimpleOrganization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({
          success: false,
          message: '指定された組織が見つかりません'
        });
      }
    }
    
    // APIキーを変更する場合
    if (apiKeyId && apiKeyId !== targetUser.apiKeyId) {
      // SuperAdminまたは管理者のみがAPIキーを変更可能
      if (!hasSuperAdminAccess && !hasAdminAccess) {
        return res.status(403).json({
          success: false,
          message: 'ユーザーのAPIキーを変更する権限がありません'
        });
      }
      
      // APIキーの存在確認（組織のAPIキーリストにあるか）
      const orgId = organizationId || targetUser.organizationId;
      if (orgId) {
        const organization = await SimpleOrganization.findById(orgId);
        
        if (!organization) {
          return res.status(404).json({
            success: false,
            message: '指定された組織が見つかりません'
          });
        }
        
        if (!organization.apiKeyIds.includes(apiKeyId)) {
          return res.status(404).json({
            success: false,
            message: '指定されたAPIキーが組織に見つかりません'
          });
        }
      }
      
      // AnthropicApiKeyモデル関連のレガシーコードを削除（ユーザーが直接設定する方式に変更）
    }
    
    // メールアドレスの重複チェック
    if (email && email.toLowerCase() !== targetUser.email) {
      const existingUser = await SimpleUser.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'このメールアドレスは既に使用されています'
        });
      }
    }
    
    // フィールドを更新
    if (name) targetUser.name = name;
    if (email) targetUser.email = email.toLowerCase();
    if (password) targetUser.password = password;
    if (role && (hasSuperAdminAccess || (hasAdminAccess && role !== 'SuperAdmin'))) {
      targetUser.role = role;
    }
    if (organizationId && (hasSuperAdminAccess || hasAdminAccess)) {
      targetUser.organizationId = organizationId;
    }
    if (apiKeyId && (hasSuperAdminAccess || hasAdminAccess)) {
      targetUser.apiKeyId = apiKeyId;
      
      if (req.body.apiKeyValue) {
        targetUser.apiKeyValue = req.body.apiKeyValue;
      }
    }
    if (status && (hasSuperAdminAccess || hasAdminAccess)) {
      targetUser.status = status;
    }
    
    // 保存
    await targetUser.save();
    
    // パスワードを含まない形で返す
    const userResponse = targetUser.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;
    
    return res.status(200).json({
      success: true,
      message: 'ユーザーが正常に更新されました',
      data: userResponse
    });
  } catch (error) {
    console.error('ユーザー更新エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'ユーザーの更新中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * ユーザーを完全に削除
 * @route DELETE /api/simple/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const requesterId = req.userId;
    const targetId = req.params.id;

    // 削除対象のユーザーを取得
    const targetUser = await SimpleUser.findById(targetId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }

    // リクエスト実行者の権限チェック
    const requester = await SimpleUser.findById(requesterId);

    // アクセス権チェック
    const hasSuperAdminAccess = requester.isSuperAdmin();
    // 管理者は組織に関係なく、SuperAdmin以外の全ユーザーを削除可能
    const hasAdminAccess = requester.isAdmin() && targetUser.role !== 'SuperAdmin';

    if (!hasSuperAdminAccess && !hasAdminAccess) {
      return res.status(403).json({
        success: false,
        message: 'このユーザーを削除する権限がありません'
      });
    }

    // SuperAdminの削除は他のSuperAdminのみが可能
    if (targetUser.role === 'SuperAdmin' && !requester.isSuperAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'SuperAdminユーザーを削除する権限がありません'
      });
    }

    // 自分自身を削除することはできない
    if (targetId === requesterId) {
      return res.status(400).json({
        success: false,
        message: '自分自身を削除することはできません'
      });
    }

    // シンプルな論理削除 - JWT認証との整合性のため
    console.log(`ユーザー論理削除実行: ID=${targetId}, 名前=${targetUser.name}, メール=${targetUser.email}`);

    // ユーザーを論理削除としてマーク
    targetUser.status = 'disabled';
    targetUser.deleted = true;
    targetUser.deletedAt = new Date();

    // 認証情報を無効化
    targetUser.refreshToken = null;
    targetUser.apiKeyValue = null;  // APIキー情報は削除（セキュリティ対策）

    // 変更を保存
    await targetUser.save();

    console.log(`ユーザーを論理削除しました: ${targetId}`);

    return res.status(200).json({
      success: true,
      message: 'ユーザーが削除されました',
      userStatus: 'deleted'
    });
  } catch (error) {
    console.error('ユーザー削除エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'ユーザーの削除中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * ユーザープロフィールを取得
 * @route GET /api/simple/users/profile
 */
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;
    
    // ユーザー情報を取得
    const user = await SimpleUser.findById(userId, '-password -refreshToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }
    
    // 組織情報を取得（必要に応じて）
    let organization = null;
    if (user.organizationId) {
      organization = await SimpleOrganization.findById(user.organizationId);
    }
    
    // Portal側では基本的にAPIキー情報は不要
    // 必要に応じてユーザー自身のAPIキー情報のみ返す
    let apiKeyInfo = null;
    
    // ユーザーに直接保存されているAPIキー値があれば、それを使用
    if (user.apiKeyValue) {
      apiKeyInfo = {
        id: user.apiKeyId || 'direct_key',
        key: user.apiKeyValue,  // 直接保存されているAPIキー値
        status: 'active'
      };
    }
    
    return res.status(200).json({
      success: true,
      data: {
        user,
        organization,
        apiKey: apiKeyInfo
      }
    });
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'プロフィールの取得中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * ユーザーのAPIキーを取得
 * @route GET /api/simple/user/apikey
 */
exports.getUserApiKey = async (req, res) => {
  try {
    const userId = req.userId;
    
    // ユーザー情報を取得
    const user = await SimpleUser.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }
    
    // まずユーザー自身にAPIキー値があるか確認
    if (user.apiKeyValue) {
      return res.status(200).json({
        success: true,
        data: {
          id: user.apiKeyId || 'direct_key',
          key: user.apiKeyValue,  // ユーザーに直接保存されているAPIキー値
          status: 'active',
          organizationId: user.organizationId
        }
      });
    }
    
    // ユーザーにAPIキーIDがある場合
    if (user.apiKeyId) {
      // 1. まず他のユーザーから探す
      const userWithKey = await SimpleUser.findOne({
        apiKeyId: user.apiKeyId,
        apiKeyValue: { $ne: null }
      });
      
      if (userWithKey && userWithKey.apiKeyValue) {
        // 見つかったAPIキー値をこのユーザーにも保存
        user.apiKeyValue = userWithKey.apiKeyValue;
        await user.save();
        console.log(`ユーザー ${user.name} (${user._id}) のAPIキー値を他のユーザーからコピーしました`);
        
        return res.status(200).json({
          success: true,
          data: {
            id: user.apiKeyId,
            key: user.apiKeyValue,
            status: 'active',
            organizationId: user.organizationId
          }
        });
      }
      
      // AnthropicApiKeyモデル関連のレガシーコードを削除
    }
    
    // APIキーが見つからない場合は、ユーザーが入力した値を直接保存して返す
    // これにより、フロントエンドやVS Code拡張からの任意のキー値が使用可能になる
    if (req.query.direct_key) {
      const directKey = req.query.direct_key;
      if (directKey.startsWith('sk-ant-')) {
        console.log(`ユーザー ${user.name} に直接APIキー値を設定します`);
        
        // ユニークなIDを生成
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const newApiKeyId = `apikey_${timestamp}_${randomStr}`;
        
        // ユーザーに保存
        user.apiKeyId = newApiKeyId;
        user.apiKeyValue = directKey;
        await user.save();
        
        // AnthropicApiKeyモデル関連のレガシーコードを削除
        
        return res.status(200).json({
          success: true,
          data: {
            id: newApiKeyId,
            key: directKey,
            status: 'active',
            organizationId: user.organizationId
          }
        });
      }
    }
    
    // 最終的にAPIキーが見つからない場合
    return res.status(404).json({
      success: false,
      message: 'ユーザーにAPIキーが設定されていません'
    });
  } catch (error) {
    console.error('APIキー取得エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'APIキーの取得中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * パスワード変更
 * @route PUT /api/simple/users/change-password
 */
exports.changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '現在のパスワードと新しいパスワードは必須です'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: '新しいパスワードは8文字以上である必要があります'
      });
    }
    
    // ユーザー情報を取得
    const user = await SimpleUser.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }
    
    // 現在のパスワードを検証
    const isPasswordValid = await user.validatePassword(currentPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '現在のパスワードが正しくありません'
      });
    }
    
    // 新しいパスワードを設定
    user.password = newPassword;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'パスワードが正常に変更されました'
    });
  } catch (error) {
    console.error('パスワード変更エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'パスワードの変更中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * ClaudeCode起動カウンターをインクリメント
 * @route POST /api/simple/users/:id/increment-claude-code-launch
 */
exports.incrementClaudeCodeLaunchCount = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // ユーザー情報を取得
    const user = await SimpleUser.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }
    
    // カウンターをインクリメント
    if (typeof user.claudeCodeLaunchCount !== 'number') {
      user.claudeCodeLaunchCount = 1;
    } else {
      user.claudeCodeLaunchCount++;
    }
    
    // 保存
    await user.save();
    
    return res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        claudeCodeLaunchCount: user.claudeCodeLaunchCount
      }
    });
  } catch (error) {
    console.error('ClaudeCode起動カウンター更新エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'ClaudeCode起動カウンターの更新中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * CLI APIキー発行
 * @route POST /api/simple/users/:userId/cli-api-key
 */
exports.generateCliApiKey = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // 管理者権限チェック
    if (!req.user.isAdmin() && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '権限がありません'
      });
    }
    
    // ユーザーを取得
    const user = await SimpleUser.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }
    
    // 新しいAPIキーを生成
    const newKey = await user.generateCliApiKey();
    
    console.log(`CLI APIキー発行: ユーザー=${user.name}, キー=${newKey}`);
    
    return res.status(200).json({
      success: true,
      data: {
        key: newKey,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('CLI APIキー発行エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'APIキーの発行中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * CLI APIキー一覧取得
 * @route GET /api/simple/users/:userId/cli-api-key
 */
exports.getCliApiKeys = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // 管理者権限チェック
    if (!req.user.isAdmin() && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '権限がありません'
      });
    }
    
    // ユーザーを取得
    const user = await SimpleUser.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }
    
    // アクティブなキーのみ返す
    const activeKeys = user.cliApiKeys.filter(key => key.isActive);
    
    return res.status(200).json({
      success: true,
      data: {
        keys: activeKeys
      }
    });
  } catch (error) {
    console.error('CLI APIキー取得エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'APIキーの取得中にエラーが発生しました',
      error: error.message
    });
  }
};

/**
 * CLI APIキー無効化
 * @route DELETE /api/simple/users/:userId/cli-api-key/:key
 */
exports.deactivateCliApiKey = async (req, res) => {
  try {
    const userId = req.params.userId;
    const apiKey = req.params.key;
    
    // 管理者権限チェック
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: '権限がありません'
      });
    }
    
    // ユーザーを取得
    const user = await SimpleUser.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }
    
    // APIキーを無効化
    await user.deactivateCliApiKey(apiKey);
    
    console.log(`CLI APIキー無効化: ユーザー=${user.name}, キー=${apiKey}`);
    
    return res.status(200).json({
      success: true,
      message: 'APIキーを無効化しました'
    });
  } catch (error) {
    console.error('CLI APIキー無効化エラー:', error);
    return res.status(500).json({
      success: false,
      message: 'APIキーの無効化中にエラーが発生しました',
      error: error.message
    });
  }
};