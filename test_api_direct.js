/**
 * APIキー保存問題を再現するテストスクリプト
 * フロントエンドから送信されるAPIキー追加処理をシミュレートする
 */
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const dbConfig = require('./portal/backend/config/db.config');

// AnthropicApiKeyモデルのスキーマを定義
const AnthropicApiKeySchema = new mongoose.Schema({
  apiKeyId: String,
  apiKeyFull: String,
  name: String,
  status: String,
  workspaceId: String,
  lastUsedAt: Date,
  lastSyncedAt: Date
}, { 
  timestamps: true,
  collection: 'anthropicapikeys'
});

// SimpleUserモデルのスキーマを定義
const SimpleUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  organizationId: mongoose.Schema.Types.ObjectId,
  apiKeyId: String,
  apiKeyValue: String,
  status: String,
  refreshToken: String
}, { 
  timestamps: true,
  collection: 'simpleusers'
});

// SimpleOrganizationモデルのスキーマを定義
const SimpleOrganizationSchema = new mongoose.Schema({
  name: String,
  description: String,
  workspaceName: String,
  workspaceId: String,
  createdBy: mongoose.Schema.Types.ObjectId,
  apiKeyIds: [String],
  status: String
}, {
  timestamps: true,
  collection: 'simpleorganizations'
});

// 問題を再現: フロントエンドからAPIキーを追加する処理をシミュレート
async function simulateApiKeyAdditionFromFrontend(apiKey) {
  try {
    console.log("MongoDBに接続しています...");
    await mongoose.connect(dbConfig.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("接続成功!");
    
    // モデルを作成
    const AnthropicApiKey = mongoose.model('AnthropicApiKey', AnthropicApiKeySchema);
    const SimpleUser = mongoose.model('SimpleUser', SimpleUserSchema);
    const SimpleOrganization = mongoose.model('SimpleOrganization', SimpleOrganizationSchema);
    
    // テスト用の管理者ユーザーを取得 (最初の一人を使用)
    const adminUser = await SimpleUser.findOne({ role: "Admin" });
    if (!adminUser) {
      console.log("管理者ユーザーが見つかりません。テストを終了します。");
      return;
    }
    
    console.log(`管理者ユーザー: ${adminUser.name} (${adminUser.email})`);
    
    // ユーザーが所属する組織を取得
    const organization = await SimpleOrganization.findOne({ 
      $or: [
        { _id: adminUser.organizationId },
        { createdBy: adminUser._id }
      ]
    });
    
    if (!organization) {
      console.log("組織が見つかりません。テストを終了します。");
      return;
    }
    
    console.log(`組織: ${organization.name} (ID: ${organization._id})`);
    
    // ステップ1: フロントエンド処理をシミュレート
    console.log("\n=== フロントエンド処理のシミュレーション ===");
    console.log(`新しいAPIキーを追加: ${apiKey}`);
    
    // バックエンドコントローラの addApiKey 関数をシミュレート
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const apiKeyId = `apikey_${timestamp}_${randomStr}`;
    const keyName = apiKey.split('-')[3] || `APIKey_${new Date().toISOString().slice(0, 10)}`;
    
    console.log(`生成したAPIキーID: ${apiKeyId}`);
    console.log(`設定したキー名: ${keyName}`);
    
    // ステップ2: バックエンドの処理をシミュレート
    console.log("\n=== バックエンド処理のシミュレーション ===");
    
    // apiKeyFull の存在を確認するためのフラグ
    let useApiKeyFull = false;  // 問題を再現するためにfalseに設定
    
    // APIキー情報をデータベースに保存
    let newApiKey;
    if (useApiKeyFull) {
      // apiKeyFull フィールドを使用する場合
      newApiKey = new AnthropicApiKey({
        apiKeyId: apiKeyId,
        apiKeyFull: apiKey, // 完全なAPIキー値を保存
        name: keyName,
        status: 'active',
        lastSyncedAt: new Date()
      });
    } else {
      // 不完全な保存 (問題の再現用)
      newApiKey = new AnthropicApiKey({
        apiKeyId: apiKeyId,
        // apiKeyFull フィールドを省略
        name: keyName,
        status: 'active',
        lastSyncedAt: new Date()
      });
    }
    
    // 保存して結果を確認
    await newApiKey.save();
    console.log("AnthropicApiKeyモデルにデータを保存しました");
    
    // 組織のAPIキーリストにAPIキーIDを追加
    organization.apiKeyIds.push(apiKeyId);
    await organization.save();
    console.log("組織のAPIキーリストにAPIキーIDを追加しました");
    
    // 保存されたデータを確認
    const savedApiKey = await AnthropicApiKey.findOne({ apiKeyId });
    
    console.log("\n=== 保存されたデータの確認 ===");
    console.log(`ID: ${savedApiKey.apiKeyId}`);
    console.log(`名前: ${savedApiKey.name}`);
    console.log(`apiKeyFull: ${savedApiKey.apiKeyFull ? "設定済み" : "未設定"}`);
    if (savedApiKey.apiKeyFull) {
      console.log(`apiKeyFull値の長さ: ${savedApiKey.apiKeyFull.length}`);
    }
    console.log(`ステータス: ${savedApiKey.status}`);
    
    // 問題の検証
    if (!savedApiKey.apiKeyFull) {
      console.log("\n⚠️ 問題検出: apiKeyFullフィールドが設定されていません");
      console.log("これがAPIキーが正常に動作しない原因と考えられます");
    } else if (savedApiKey.apiKeyFull !== apiKey) {
      console.log("\n⚠️ 問題検出: apiKeyFull値が元の値と一致しません");
      console.log(`元の値: ${apiKey}`);
      console.log(`保存値: ${savedApiKey.apiKeyFull}`);
    } else {
      console.log("\n✅ 正常に動作しています: apiKeyFullフィールドに完全なAPIキー値が保存されました");
    }
    
    // APIキーの長さを確認
    console.log("\nAPIキーの長さ検証:");
    console.log(`指定されたAPIキー値の長さ: ${apiKey.length}`);
    console.log(`保存されたapiKeyFull値の長さ: ${savedApiKey.apiKeyFull ? savedApiKey.apiKeyFull.length : 0}`);
    
    // テスト用に作成したデータを削除 (コメントアウトすると保存されたままになる)
    await AnthropicApiKey.deleteOne({ apiKeyId });
    organization.apiKeyIds = organization.apiKeyIds.filter(id => id !== apiKeyId);
    await organization.save();
    console.log("\n✅ テスト用データの削除が完了しました");
    
  } catch (error) {
    console.error("エラーが発生しました:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB接続を切断しました");
  }
}

// メイン処理を実行
const testApiKey = 'sk-ant-api03-XXXXX'; // ダミー値に置き換え
simulateApiKeyAdditionFromFrontend(testApiKey).catch(console.error);