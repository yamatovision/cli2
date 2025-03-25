/**
 * APIキー追加処理をシミュレートするテストスクリプト
 * simpleOrganization.controller.jsと同じロジックでAPIキー名の取得と保存をテスト
 */
require('dotenv').config();
const mongoose = require('mongoose');
const dbConfig = require('./portal/backend/config/db.config');
const anthropicAdminService = require('./portal/backend/services/anthropicAdminService');

// テスト用APIキー（実際のキーに置き換えてください）
const TEST_API_KEY = 'sk-ant-api03-XXXXX'; // ダミー値に置き換え

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
  keyHint: String,
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
}, { 
  timestamps: true,
  collection: 'anthropicapikeys'
});

// APIキー値を処理する関数 (simpleOrganization.controller.jsから抽出)
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

// テスト実行関数
async function testApiKeySave() {
  try {
    console.log("=== APIキーの名前取得・保存テスト ===");
    
    // データベースに接続
    console.log("MongoDBに接続しています...");
    await mongoose.connect(dbConfig.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("接続成功!");
    
    // モデルを作成
    const AnthropicApiKey = mongoose.model('AnthropicApiKey', AnthropicApiKeySchema);
    
    // 入力されたAPIキー値
    const keyValue = TEST_API_KEY;
    
    // デバッグ - 入力値の確認
    console.log(`\n1. 入力APIキー値: 長さ=${keyValue.length}, 先頭=${keyValue.substring(0, 10)}...`);
    
    // APIキーのヒントと完全なキー値を生成
    const keyInfo = formatApiKeyHint(keyValue);
    let apiKeyId;
    let keyName = 'API Key'; // デフォルト名
    
    // === ここからsimpleOrganization.controller.jsと同じロジック ===
    
    // Admin API Keyが設定されているか確認
    const adminApiKey = process.env.ANTHROPIC_ADMIN_KEY;
    
    console.log(`\n2. Admin API Key: ${adminApiKey ? '設定あり' : '設定なし'}`);
    
    if (adminApiKey) {
      try {
        // Anthropic Admin APIを使用してAPIキー情報を取得
        console.log('Anthropic Admin APIを使用してAPIキー情報を取得します');
        const apiKeyInfo = await anthropicAdminService.verifyApiKey(adminApiKey, keyValue);
        
        // APIキーIDと名前を設定
        apiKeyId = apiKeyInfo.id;
        keyName = apiKeyInfo.name;
        
        console.log(`✅ Anthropic APIから取得成功: ID=${apiKeyId}, 名前=${keyName}`);
      } catch (apiError) {
        console.error('❌ Anthropic API呼び出しエラー:', apiError.message);
        // エラーの場合はユニークなIDを生成
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        apiKeyId = `apikey_${timestamp}_${randomStr}`;
        
        // APIキー名を生成
        keyName = `APIKey_${new Date().toISOString().slice(0, 10)}`;
        console.log(`APIキー情報の取得に失敗しました。生成されたID: ${apiKeyId}`);
      }
    } else {
      // Admin API Keyが設定されていない場合はユニークなIDを生成
      console.log('ANTHROPIC_ADMIN_KEYが設定されていないため、APIキー検証をスキップします');
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      apiKeyId = `apikey_${timestamp}_${randomStr}`;
      
      // APIキー名に入力されたキー値の一部を使用
      const keyParts = keyValue.split('-');
      if (keyParts.length > 3 && keyParts[3]) {
        keyName = keyParts[3]; // 4番目のパート（ユーザー指定部分）を名前として使用
      } else {
        keyName = `APIKey_${new Date().toISOString().slice(0, 10)}`;
      }
    }
    
    console.log(`\n3. 生成したAPIキーID: ${apiKeyId}`);
    console.log(`設定したキー名: ${keyName}`);
    
    // キー情報の確認とデバッグ
    if (!keyInfo || !keyInfo.full) {
      console.error('⚠️ 警告: keyInfo.fullが設定されていません');
      // 緊急対応: keyInfoが正しく設定されていない場合は直接代入
      keyInfo = {
        hint: keyValue,
        full: keyValue // 完全なAPIキー値を確実に設定
      };
    }
    
    // デバッグ - keyInfo確認
    debugApiKey(keyInfo.full, apiKeyId, '処理前');
    
    // 既存のキーを確認
    try {
      let apiKeyDoc = await AnthropicApiKey.findOne({ apiKeyId });
      
      if (apiKeyDoc) {
        // 既存のキーがあれば名前と完全なキー値を更新
        console.log(`\n4. 既存のキーを更新します: ${apiKeyId}`);
        apiKeyDoc.name = keyName;
        apiKeyDoc.apiKeyFull = keyInfo.full; // 完全なAPIキー値を保存
        apiKeyDoc.lastSyncedAt = new Date();
        debugApiKey(apiKeyDoc.apiKeyFull, apiKeyId, '既存キー更新');
        await apiKeyDoc.save();
      } else {
        // 新規キーを作成
        console.log(`\n4. 新規キーを作成します: ${apiKeyId}`);
        apiKeyDoc = new AnthropicApiKey({
          apiKeyId: apiKeyId,
          apiKeyFull: keyInfo.full, // 完全なAPIキー値を保存
          name: keyName,
          status: 'active',
          lastSyncedAt: new Date()
        });
        debugApiKey(apiKeyDoc.apiKeyFull, apiKeyId, '新規キー作成');
        await apiKeyDoc.save();
      }
      
      // 保存後の確認
      const savedKey = await AnthropicApiKey.findOne({ apiKeyId });
      debugApiKey(savedKey.apiKeyFull, apiKeyId, '保存後確認');
      
      console.log(`\n=== 保存結果 ===`);
      console.log(`APIキーID: ${savedKey.apiKeyId}`);
      console.log(`APIキー名: ${savedKey.name}`);
      console.log(`apiKeyFull: ${savedKey.apiKeyFull ? '設定あり' : '設定なし'}`);
      console.log(`apiKeyFull値の長さ: ${savedKey.apiKeyFull ? savedKey.apiKeyFull.length : 0}文字`);
      console.log(`入力APIキー長さ: ${keyValue.length}文字`);
      
      // テスト成功条件チェック
      if (savedKey.apiKeyFull === keyValue) {
        console.log(`\n✅ テスト成功: APIキー値が正常に保存されました`);
      } else {
        console.log(`\n❌ テスト失敗: 保存されたAPIキー値が入力値と一致しません`);
      }
      
      // テスト後のクリーンアップ - 保存したテストデータを削除
      console.log(`\n=== テスト後クリーンアップ ===`);
      await AnthropicApiKey.deleteOne({ apiKeyId });
      console.log(`✓ テストで作成したAPIキーを削除しました`);
      
    } catch (error) {
      console.error('APIキー保存中にエラーが発生しました:', error);
    }
    
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
  } finally {
    console.log("\nテスト完了");
    await mongoose.disconnect();
    console.log("MongoDB接続を切断しました");
  }
}

// テスト実行
testApiKeySave().catch(console.error);