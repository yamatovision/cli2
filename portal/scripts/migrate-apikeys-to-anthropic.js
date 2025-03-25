/**
 * APIキー管理をSimpleUserモデルからAnthropicApiKeyモデルへ移行するスクリプト
 */
require('dotenv').config();
const mongoose = require('mongoose');
const SimpleUser = require('../backend/models/simpleUser.model');
const SimpleOrganization = require('../backend/models/simpleOrganization.model');
const AnthropicApiKey = require('../backend/models/anthropicApiKey.model');

// MongoDB接続設定
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/appgenius';

// カラー出力用関数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`
};

// APIキーのヒント形式を生成する関数
function formatApiKeyHint(keyValue) {
  if (!keyValue || keyValue.length < 12) {
    return 'sk-ant-***...***';
  }
  
  // APIキーの基本形式: sk-ant-api03-XXXXXXXXXXXXX
  const parts = keyValue.split('-');
  if (parts.length >= 4) {
    // sk-ant-api03-XXXXXXXXXXXXX の形式
    const prefix = `${parts[0]}-${parts[1]}-${parts[2]}`; // sk-ant-api03
    const lastPart = parts[parts.length - 1];
    const middle = lastPart.substring(0, 3); // 最後の部分の最初の3文字
    const end = lastPart.slice(-4); // 最後の部分の最後の4文字
    
    return `${prefix}-${middle}...${end}`;
  } else if (parts.length === 3) {
    // sk-ant-XXXXXXXXXXXXX の形式
    const prefix = `${parts[0]}-${parts[1]}`; // sk-ant
    const lastPart = parts[parts.length - 1];
    const middle = lastPart.substring(0, 3); // 最後の部分の最初の3文字
    const end = lastPart.slice(-4); // 最後の部分の最後の4文字
    
    return `${prefix}-${middle}...${end}`;
  } else {
    // その他の形式の場合は単純なマスキング
    const start = keyValue.substring(0, 8);
    const end = keyValue.slice(-4);
    return `${start}...${end}`;
  }
}

async function migrateApiKeys() {
  try {
    console.log('MongoDBに接続しています...');
    // DB設定ファイルから接続オプションを取得
    const dbConfig = require('../backend/config/db.config');
    await mongoose.connect(mongoURI, dbConfig.options);
    console.log(colors.green('MongoDBに接続しました'));

    // 1. ユーザーからAPIキー情報を収集
    console.log(colors.cyan('\n=== ユーザーからAPIキー情報を収集 ==='));
    const usersWithApiKey = await SimpleUser.find({ 
      apiKeyId: { $ne: null }, 
      apiKeyValue: { $ne: null } 
    });
    
    console.log(`${usersWithApiKey.length}人のユーザーがAPIキーを持っています`);
    
    // 2. 組織のAPIキーIDリストを収集
    console.log(colors.cyan('\n=== 組織のAPIキーIDリストを収集 ==='));
    const organizations = await SimpleOrganization.find({ 
      apiKeyIds: { $exists: true, $ne: [] } 
    });
    
    console.log(`${organizations.length}件の組織がAPIキーを持っています`);
    
    // 3. 既存のAnthropicApiKeyコレクションをクリア
    console.log(colors.cyan('\n=== 既存のAnthropicApiKeyコレクションをクリア ==='));
    await AnthropicApiKey.deleteMany({});
    console.log('AnthropicApiKeyコレクションをクリアしました');

    // 4. APIキーデータの移行処理
    console.log(colors.cyan('\n=== APIキーデータの移行処理 ==='));
    
    const migratedKeys = new Set();
    const migratedKeysData = [];
    
    // ユーザーからAPIキーを移行
    for (const user of usersWithApiKey) {
      if (user.apiKeyId && user.apiKeyValue && !migratedKeys.has(user.apiKeyId)) {
        console.log(`ユーザー ${user.name} (${user.email}) のAPIキーを移行: ${user.apiKeyId}`);
        
        const keyHint = formatApiKeyHint(user.apiKeyValue);
        const newApiKey = new AnthropicApiKey({
          apiKeyId: user.apiKeyId,
          keyHint: keyHint,
          name: `User Key - ${user.name}`,
          status: 'active',
          lastSyncedAt: new Date()
        });
        
        await newApiKey.save();
        migratedKeys.add(user.apiKeyId);
        migratedKeysData.push({
          apiKeyId: user.apiKeyId,
          keyHint: keyHint,
          user: `${user.name} (${user.email})`,
          status: 'active',
          type: 'ユーザー割り当て済み'
        });
      }
    }
    
    // 組織のAPIキーIDで未登録のものを移行
    for (const org of organizations) {
      console.log(`組織 ${org.name} のAPIキー処理中...`);
      
      for (const keyId of org.apiKeyIds) {
        if (!migratedKeys.has(keyId)) {
          console.log(`組織 ${org.name} の未割り当てAPIキーを移行: ${keyId}`);
          
          const newApiKey = new AnthropicApiKey({
            apiKeyId: keyId,
            keyHint: 'sk-ant-***...***', // ユーザー未割り当てのため実際のキーヒントはなし
            name: `Organization Key - ${org.name}`,
            status: 'inactive', // ユーザー未割り当てのためinactive
            lastSyncedAt: new Date()
          });
          
          await newApiKey.save();
          migratedKeys.add(keyId);
          migratedKeysData.push({
            apiKeyId: keyId,
            keyHint: 'sk-ant-***...***',
            organization: org.name,
            status: 'inactive',
            type: 'ユーザー未割り当て'
          });
        }
      }
    }
    
    // 5. 移行結果の表示
    console.log(colors.cyan('\n=== 移行結果 ==='));
    console.log(`合計 ${migratedKeys.size} 件のAPIキーを移行しました`);
    
    for (const keyData of migratedKeysData) {
      let infoStr = `- ${keyData.apiKeyId}: ${keyData.keyHint}, ステータス=${keyData.status}, タイプ=${keyData.type}`;
      if (keyData.user) infoStr += `, ユーザー=${keyData.user}`;
      if (keyData.organization) infoStr += `, 組織=${keyData.organization}`;
      console.log(infoStr);
    }
    
    // 6. 確認
    const migratedCount = await AnthropicApiKey.countDocuments();
    console.log(colors.green(`\nAnthropicApiKeyコレクションには ${migratedCount} 件のAPIキーが登録されました`));
    
    console.log(colors.yellow('\n注意: この移行スクリプトは、APIキーの情報のみを移行しました。'));
    console.log(colors.yellow('ユーザーモデルのapiKeyIdフィールドはそのままで有効です。'));
    console.log(colors.yellow('コントローラーの修正を実施してAnthropicApiKeyモデルを使用するように変更してください。'));

  } catch (error) {
    console.error(colors.red('エラーが発生しました:'), error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB接続を終了しました');
  }
}

// スクリプトを実行
migrateApiKeys()
  .catch(err => {
    console.error('スクリプト実行エラー:', err);
    process.exit(1);
  });