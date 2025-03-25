/**
 * 実際のAPIキー値を直接MongoDB保存して検証するスクリプト
 */
require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('./portal/backend/config/db.config');

// APIキー情報 (実際のキーはここに設定してください)
const REAL_API_KEY = 'sk-ant-api03-XXXXX'; // ダミー値に置き換え
const API_KEY_NAME = 'Direct_Test_Key';
const USER_EMAIL = 'shiraishi.tatsuya@mikoto.co.jp';

// AnthropicApiKeyモデルのスキーマを定義
const AnthropicApiKeySchema = new mongoose.Schema({
  apiKeyId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  apiKeyFull: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  workspaceId: {
    type: String,
    default: null
  },
  lastUsedAt: {
    type: Date,
    default: null
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// SimpleUserモデルのスキーマを定義
const SimpleUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  organizationId: mongoose.Schema.Types.ObjectId,
  organizationIds: [String],
  apiKeyId: String,
  apiKeyValue: String,
  status: String,
  refreshToken: String
}, { timestamps: true });

// SimpleOrganizationモデルのスキーマを定義
const SimpleOrganizationSchema = new mongoose.Schema({
  name: String,
  description: String,
  workspaceName: String,
  workspaceId: String,
  apiKeyIds: [String],
  members: [{ 
    userId: String, 
    role: String 
  }],
  active: Boolean,
  status: String
}, { timestamps: true });

async function main() {
  try {
    console.log("MongoDBに接続しています...");
    await mongoose.connect(dbConfig.url, dbConfig.options);
    console.log("接続成功!");
    
    // モデルを作成
    const AnthropicApiKey = mongoose.model('AnthropicApiKey', AnthropicApiKeySchema);
    const SimpleUser = mongoose.model('SimpleUser', SimpleUserSchema);
    const SimpleOrganization = mongoose.model('SimpleOrganization', SimpleOrganizationSchema);
    
    // ユーザーを取得
    const user = await SimpleUser.findOne({ email: USER_EMAIL });
    if (!user) {
      console.log(`ユーザー ${USER_EMAIL} が見つかりません`);
      return;
    }
    
    console.log(`\n=== ユーザー情報 ===`);
    console.log(`名前: ${user.name}`);
    console.log(`ID: ${user._id}`);
    console.log(`現在のAPIキーID: ${user.apiKeyId || 'なし'}`);
    
    // ユーザーの組織を取得
    const organization = await SimpleOrganization.findById(user.organizationId);
    if (!organization) {
      console.log(`ユーザーの組織が見つかりません`);
      return;
    }
    
    console.log(`\n=== 組織情報 ===`);
    console.log(`名前: ${organization.name}`);
    console.log(`ID: ${organization._id}`);
    console.log(`APIキー数: ${organization.apiKeyIds?.length || 0}`);
    
    // 新しいAPIキーIDを生成
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const newApiKeyId = `apikey_direct_${timestamp}_${randomStr}`;
    
    console.log(`\n=== APIキー直接保存テスト ===`);
    console.log(`新規APIキーID: ${newApiKeyId}`);
    console.log(`APIキー値: ${REAL_API_KEY.substring(0, 15)}...`);
    
    // 1. APIキーをAnthropicApiKeyモデルに保存
    try {
      console.log('\n1. AnthropicApiKeyモデルにAPIキーを保存します...');
      const apiKeyDoc = new AnthropicApiKey({
        apiKeyId: newApiKeyId,
        apiKeyFull: REAL_API_KEY,
        name: API_KEY_NAME,
        status: 'active',
        lastSyncedAt: new Date()
      });
      await apiKeyDoc.save();
      console.log('✅ APIキーが保存されました');
      
      // 1-1. 保存されたキーを読み込んで確認
      const savedKey = await AnthropicApiKey.findOne({ apiKeyId: newApiKeyId }).lean();
      console.log('\n保存されたAPIキー:');
      console.log(`APIキーID: ${savedKey.apiKeyId}`);
      console.log(`APIキー名: ${savedKey.name}`);
      console.log(`APIキー値: ${savedKey.apiKeyFull ? savedKey.apiKeyFull.substring(0, 15) + '...' : 'なし'}`);
      console.log(`APIキー値の長さ: ${savedKey.apiKeyFull ? savedKey.apiKeyFull.length : 0}文字`);
      console.log(`実際のAPIキー長: ${REAL_API_KEY.length}文字`);
      
      if (savedKey.apiKeyFull !== REAL_API_KEY) {
        console.log('⚠️ 警告: 保存されたAPIキー値が元の値と一致しません!');
        console.log(`保存値: ${savedKey.apiKeyFull}`);
        console.log(`元の値: ${REAL_API_KEY}`);
      }
    } catch (error) {
      console.error('APIキー保存エラー:', error);
    }
    
    // 2. 組織のAPIキーIdsリストを更新
    try {
      console.log('\n2. 組織のAPIキーリストを更新します...');
      if (!organization.apiKeyIds.includes(newApiKeyId)) {
        organization.apiKeyIds.push(newApiKeyId);
        await organization.save();
        console.log('✅ 組織のAPIキーリストが更新されました');
      } else {
        console.log('組織のAPIキーリストに既に含まれています');
      }
    } catch (error) {
      console.error('組織更新エラー:', error);
    }
    
    // 3. ユーザーのAPIキー情報を更新
    try {
      console.log('\n3. ユーザーのAPIキー情報を更新します...');
      user.apiKeyId = newApiKeyId;
      user.apiKeyValue = REAL_API_KEY;
      await user.save();
      console.log('✅ ユーザーのAPIキー情報が更新されました');
    } catch (error) {
      console.error('ユーザー更新エラー:', error);
    }
    
    // 4. 最終的な確認
    console.log('\n=== 最終確認 ===');
    const finalApiKey = await AnthropicApiKey.findOne({ apiKeyId: newApiKeyId }).lean();
    const finalUser = await SimpleUser.findOne({ email: USER_EMAIL }).lean();
    
    console.log('\nAnthropicApiKeyモデルの情報:');
    console.log(`APIキーID: ${finalApiKey.apiKeyId}`);
    console.log(`APIキー名: ${finalApiKey.name}`);
    console.log(`APIキー値: ${finalApiKey.apiKeyFull ? finalApiKey.apiKeyFull.substring(0, 15) + '...' : 'なし'}`);
    console.log(`APIキー値の長さ: ${finalApiKey.apiKeyFull ? finalApiKey.apiKeyFull.length : 0}文字`);
    
    console.log('\nユーザーモデルの情報:');
    console.log(`APIキーID: ${finalUser.apiKeyId}`);
    console.log(`APIキー値: ${finalUser.apiKeyValue ? finalUser.apiKeyValue.substring(0, 15) + '...' : 'なし'}`);
    console.log(`APIキー値の長さ: ${finalUser.apiKeyValue ? finalUser.apiKeyValue.length : 0}文字`);
    
    // 5. APIキーにアクセスするクエリのテスト
    console.log('\n=== APIキー取得クエリのテスト ===');
    const apiKeyByFullValue = await AnthropicApiKey.findOne({ 
      apiKeyFull: REAL_API_KEY 
    }).lean();
    
    if (apiKeyByFullValue) {
      console.log('✅ apiKeyFullフィールドで検索成功しました');
    } else {
      console.log('❌ apiKeyFullフィールドでの検索に失敗しました');
      
      // 部分一致で検索を試みる
      const apiKeyByPartialValue = await AnthropicApiKey.findOne({
        apiKeyFull: { $regex: REAL_API_KEY.substring(0, 30), $options: 'i' }
      }).lean();
      
      if (apiKeyByPartialValue) {
        console.log('✅ 部分一致での検索は成功しました');
      } else {
        console.log('❌ 部分一致での検索も失敗しました');
      }
    }
    
    // モデルの詳細情報を取得
    console.log('\n=== モデルのバリデーション情報 ===');
    console.log('AnthropicApiKeySchema.obj:');
    console.log(AnthropicApiKeySchema.obj);
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB接続を切断しました');
  }
}

main().catch(console.error);