/**
 * AnthropicApiKeyと関連する組織情報を取得するスクリプト
 */
require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('./portal/backend/config/db.config');

// APIキーモデルのスキーマを定義
const AnthropicApiKeySchema = new mongoose.Schema({
  apiKeyId: String,
  keyHint: String,
  name: String,
  status: String,
  workspaceId: String,
  lastUsedAt: Date,
  lastSyncedAt: Date
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
  active: Boolean
}, { timestamps: true });

// SimpleUserモデルのスキーマを定義
const SimpleUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  organizationIds: [String],
  apiKeyId: String
}, { timestamps: true });

async function main() {
  try {
    console.log("MongoDBに接続しています...");
    await mongoose.connect(dbConfig.url, dbConfig.options);
    console.log("接続成功!");
    
    // モデルを作成
    const AnthropicApiKey = mongoose.model('AnthropicApiKey', AnthropicApiKeySchema);
    const SimpleOrganization = mongoose.model('SimpleOrganization', SimpleOrganizationSchema);
    const SimpleUser = mongoose.model('SimpleUser', SimpleUserSchema);
    
    // すべてのAPIキーを取得
    const apiKeys = await AnthropicApiKey.find().lean();
    console.log(`=== 合計 ${apiKeys.length} 件のAPIキーが見つかりました ===\n`);
    
    // すべての組織を取得
    const organizations = await SimpleOrganization.find().lean();
    console.log(`=== 合計 ${organizations.length} 件の組織が見つかりました ===\n`);
    
    // すべてのユーザーを取得
    const users = await SimpleUser.find().lean();
    console.log(`=== 合計 ${users.length} 件のユーザーが見つかりました ===\n`);
    
    console.log('=== APIキーが関連付けられている組織 ===');
    organizations.forEach((org, index) => {
      if (org.apiKeyIds && org.apiKeyIds.length > 0) {
        console.log(`[${index + 1}] 組織: ${org.name}`);
        console.log(`  - ワークスペース: ${org.workspaceName || 'なし'} (ID: ${org.workspaceId || 'なし'})`);
        console.log(`  - APIキーID: ${org.apiKeyIds.join(', ')}`);
        
        // APIキーの詳細を表示
        org.apiKeyIds.forEach(keyId => {
          const key = apiKeys.find(k => k.apiKeyId === keyId);
          if (key) {
            console.log(`    • APIキー: ${key.name || '名前なし'}`);
            console.log(`      - Hint: ${key.keyHint}`);
            console.log(`      - Status: ${key.status}`);
          } else {
            console.log(`    • APIキー: ID ${keyId} (データが見つかりません)`);
          }
        });
        
        // 組織のメンバーを表示
        if (org.members && org.members.length > 0) {
          console.log(`  - メンバー数: ${org.members.length}`);
          org.members.forEach(member => {
            const user = users.find(u => u._id.toString() === member.userId.toString());
            if (user) {
              console.log(`    • ${user.name} (${user.email}) - 役割: ${member.role}`);
              if (user.apiKeyId) {
                const userKey = apiKeys.find(k => k.apiKeyId === user.apiKeyId);
                console.log(`      - 個人APIキー: ${userKey ? userKey.keyHint : 'データなし'}`);
              }
            } else {
              console.log(`    • ユーザーID: ${member.userId} (データが見つかりません) - 役割: ${member.role}`);
            }
          });
        }
        
        console.log('---------------------------------------------');
      }
    });
    
    console.log('\n=== APIキーを持つユーザー ===');
    users.forEach((user, index) => {
      if (user.apiKeyId) {
        const key = apiKeys.find(k => k.apiKeyId === user.apiKeyId);
        console.log(`[${index + 1}] ユーザー: ${user.name} (${user.email})`);
        console.log(`  - 役割: ${user.role}`);
        console.log(`  - APIキーID: ${user.apiKeyId}`);
        if (key) {
          console.log(`  - APIキー詳細: ${key.name || '名前なし'} (${key.keyHint})`);
          console.log(`  - ステータス: ${key.status}`);
        } else {
          console.log(`  - APIキー詳細: データが見つかりません`);
        }
        
        // 所属組織を表示
        if (user.organizationIds && user.organizationIds.length > 0) {
          console.log(`  - 所属組織:`);
          user.organizationIds.forEach(orgId => {
            const org = organizations.find(o => o._id.toString() === orgId.toString());
            if (org) {
              console.log(`    • ${org.name} (ワークスペース: ${org.workspaceName || 'なし'})`);
            } else {
              console.log(`    • 組織ID: ${orgId} (データが見つかりません)`);
            }
          });
        }
        
        console.log('---------------------------------------------');
      }
    });
    
  } catch (error) {
    console.error("エラーが発生しました:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB接続を切断しました");
  }
}

main().catch(console.error);