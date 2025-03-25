/**
 * AnthropicApiKeyの実際の値を確認するスクリプト
 */
require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('./portal/backend/config/db.config');

// MongoDB接続設定
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/appgenius';

// 実行関数
async function viewApiKeys() {
  try {
    console.log("MongoDBに接続しています...");
    await mongoose.connect(mongoURI, dbConfig.options);
    console.log("接続成功!");
    
    // AnthropicApiKeyスキーマ定義
    const AnthropicApiKeySchema = new mongoose.Schema({
      apiKeyId: String,
      keyHint: String,
      apiKeyFull: String,
      name: String,
      status: String,
      workspaceId: String,
      lastUsedAt: Date,
      lastSyncedAt: Date
    }, { timestamps: true });
    
    // SimpleOrganizationスキーマ定義
    const SimpleOrganizationSchema = new mongoose.Schema({
      name: String,
      description: String,
      workspaceName: String,
      workspaceId: String,
      apiKeyIds: [String],
      members: [{ userId: String, role: String }],
      active: Boolean,
      availableApiKeys: [{
        keyId: String,
        apiKey: String,
        apiKeyFull: String,
        name: String,
        description: String
      }]
    });
    
    // モデル作成
    const AnthropicApiKey = mongoose.model('AnthropicApiKey', AnthropicApiKeySchema);
    const SimpleOrganization = mongoose.model('SimpleOrganization', SimpleOrganizationSchema);
    
    // APIキーを取得
    console.log("=== AnthropicApiKey モデルから取得したAPIキー ===");
    const apiKeys = await AnthropicApiKey.find().lean();
    
    apiKeys.forEach((key, index) => {
      console.log(`[${index + 1}] Key Name: ${key.name || 'None'}`);
      console.log(`  ID: ${key.apiKeyId}`);
      console.log(`  Hint: ${key.keyHint}`);
      console.log(`  Full Key: ${key.apiKeyFull || 'Not stored'}`);
      console.log(`  Status: ${key.status}`);
      console.log('--------------------------------------');
    });
    
    // 組織からAPIキーを取得
    console.log("\n=== 組織モデルから取得したAPIキー ===");
    const organizations = await SimpleOrganization.find().lean();
    
    organizations.forEach((org, orgIndex) => {
      console.log(`\n組織 [${orgIndex + 1}]: ${org.name}`);
      
      if (org.availableApiKeys && org.availableApiKeys.length > 0) {
        console.log(`APIキープール (${org.availableApiKeys.length}件):`);
        
        org.availableApiKeys.forEach((key, keyIndex) => {
          console.log(`  [${keyIndex + 1}] Key Name: ${key.name || 'None'}`);
          console.log(`    ID: ${key.keyId}`);
          console.log(`    Full Key: ${key.apiKey || 'Not stored'}`);
          console.log(`    apiKeyFull: ${key.apiKeyFull || 'Not stored'}`);
          console.log('    ------------------------------------');
        });
      } else {
        console.log("  APIキープールは空です");
      }
    });
    
  } catch (error) {
    console.error("エラーが発生しました:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nMongoDB接続を切断しました");
  }
}

// スクリプト実行
viewApiKeys().catch(console.error);