/**
 * ユーザーとAnthropicApiKeyの関係をテストするスクリプト
 * 
 * このスクリプトは、SimpleUserモデルとAnthropicApiKeyモデルの関連性をテストし、
 * APIキー情報が正しく取得できることを確認します。
 * 
 * 実行方法:
 * node test_anthropic_key_relation.js
 */

// MongoDBに接続
const mongoose = require('mongoose');
const dbConfig = require('./portal/backend/config/db.config');

// カラー出力用
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// MongoDB接続文字列
const DB_URI = dbConfig.url;

// モデルのインポート
let SimpleUser, AnthropicApiKey;

/**
 * MongoDB接続
 */
async function connectToMongoDB() {
  try {
    console.log(`${colors.blue}MongoDB接続中...${colors.reset}`);
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`${colors.green}MongoDB接続成功${colors.reset}`);
    
    // モデルの読み込み
    SimpleUser = require('./portal/backend/models/simpleUser.model');
    AnthropicApiKey = require('./portal/backend/models/anthropicApiKey.model');
  } catch (error) {
    console.error(`${colors.red}MongoDB接続エラー:${colors.reset}`, error);
    process.exit(1);
  }
}

/**
 * ユーザー情報の取得
 */
async function getUserWithApiKey() {
  try {
    console.log(`\n${colors.magenta}=== APIキーを持つユーザーの検索 ===${colors.reset}`);
    // APIキーIDを持つユーザーを検索
    const users = await SimpleUser.find({
      apiKeyId: { $exists: true, $ne: null }
    }).limit(5);
    
    if (users.length === 0) {
      console.error(`${colors.red}APIキーIDを持つユーザーが見つかりません${colors.reset}`);
      return null;
    }
    
    console.log(`${colors.green}APIキーIDを持つユーザー: ${users.length}件${colors.reset}`);
    
    // 最初のユーザーを使用
    const user = users[0];
    console.log(`${colors.cyan}ユーザー情報:${colors.reset} ${user.name} (ID: ${user._id})`);
    console.log(`${colors.cyan}APIキーID:${colors.reset} ${user.apiKeyId}`);
    console.log(`${colors.cyan}APIキー値の存在:${colors.reset} ${user.apiKeyValue ? 'あり' : 'なし'}`);
    
    if (user.apiKeyValue) {
      console.log(`${colors.cyan}APIキー値:${colors.reset} ${user.apiKeyValue.substring(0, 5)}...`);
    }
    
    return user;
  } catch (error) {
    console.error(`${colors.red}ユーザー情報取得エラー:${colors.reset}`, error);
    return null;
  }
}

/**
 * AnthropicApiKeyモデルからAPIキーを取得
 */
async function getAnthropicApiKey(apiKeyId) {
  try {
    console.log(`\n${colors.magenta}=== AnthropicApiKeyモデルからの検索 ===${colors.reset}`);
    if (!apiKeyId) {
      console.error(`${colors.red}APIキーIDが指定されていません${colors.reset}`);
      return null;
    }
    
    // APIキーIDに一致するAPIキーを検索
    const apiKey = await AnthropicApiKey.findOne({ apiKeyId });
    
    if (!apiKey) {
      console.error(`${colors.red}該当するAPIキーが見つかりません${colors.reset}`);
      return null;
    }
    
    console.log(`${colors.green}AnthropicApiKey検索成功${colors.reset}`);
    console.log(`${colors.cyan}APIキーID:${colors.reset} ${apiKey.apiKeyId}`);
    console.log(`${colors.cyan}キーヒント:${colors.reset} ${apiKey.keyHint}`);
    console.log(`${colors.cyan}ステータス:${colors.reset} ${apiKey.status}`);
    console.log(`${colors.cyan}APIキー値の存在:${colors.reset} ${apiKey.apiKeyFull ? 'あり' : 'なし'}`);
    
    if (apiKey.apiKeyFull) {
      console.log(`${colors.cyan}APIキー値:${colors.reset} ${apiKey.apiKeyFull.substring(0, 5)}...`);
    }
    
    return apiKey;
  } catch (error) {
    console.error(`${colors.red}AnthropicApiKey取得エラー:${colors.reset}`, error);
    return null;
  }
}

/**
 * APIキーの関連性テスト
 */
async function testApiKeyRelation() {
  try {
    console.log(`\n${colors.magenta}=== APIキー関連性テスト ===${colors.reset}`);
    
    // APIキーを持つユーザーを検索
    const user = await getUserWithApiKey();
    if (!user) return false;
    
    // AnthropicApiKeyモデルからAPIキーを検索
    const apiKey = await getAnthropicApiKey(user.apiKeyId);
    
    // 関連性の確認
    if (apiKey) {
      console.log(`\n${colors.green}=== テスト結果: 成功 ===${colors.reset}`);
      console.log(`${colors.cyan}ユーザーとAPIキーの関連性が正しく設定されています${colors.reset}`);
      
      // ユーザーにAPIキー値がある場合は一致するか確認
      if (user.apiKeyValue && apiKey.apiKeyFull) {
        const match = user.apiKeyValue === apiKey.apiKeyFull;
        console.log(`${colors.cyan}ユーザーのAPIキー値とAnthropicApiKeyの値が一致:${colors.reset} ${match ? '一致します' : '一致しません'}`);
      }
      
      return true;
    } else {
      console.log(`\n${colors.red}=== テスト結果: 失敗 ===${colors.reset}`);
      console.log(`${colors.red}ユーザーのAPIキーIDに対応するAPIキーが見つかりません${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}関連性テストエラー:${colors.reset}`, error);
    return false;
  }
}

/**
 * AnthropicApiKeyモデルからすべてのAPIキーを取得
 */
async function listAllAnthropicApiKeys() {
  try {
    console.log(`\n${colors.magenta}=== すべてのAnthropicApiKeyの一覧 ===${colors.reset}`);
    
    // すべてのAPIキーを取得
    const apiKeys = await AnthropicApiKey.find().limit(10);
    
    if (apiKeys.length === 0) {
      console.log(`${colors.yellow}AnthropicApiKeyデータが存在しません${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}AnthropicApiKey件数: ${apiKeys.length}件${colors.reset}`);
    
    // すべてのAPIキーを表示
    apiKeys.forEach((key, index) => {
      console.log(`\n${colors.cyan}APIキー ${index + 1}:${colors.reset}`);
      console.log(`  ${colors.cyan}ID:${colors.reset} ${key.apiKeyId}`);
      console.log(`  ${colors.cyan}ヒント:${colors.reset} ${key.keyHint}`);
      console.log(`  ${colors.cyan}名前:${colors.reset} ${key.name || 'なし'}`);
      console.log(`  ${colors.cyan}ステータス:${colors.reset} ${key.status}`);
      console.log(`  ${colors.cyan}値の存在:${colors.reset} ${key.apiKeyFull ? 'あり' : 'なし'}`);
      
      if (key.apiKeyFull) {
        console.log(`  ${colors.cyan}値:${colors.reset} ${key.apiKeyFull.substring(0, 5)}...`);
      }
    });
  } catch (error) {
    console.error(`${colors.red}APIキー一覧取得エラー:${colors.reset}`, error);
  }
}

/**
 * 新エンドポイントの動作をシミュレーション
 */
async function simulateEndpoint(userId) {
  try {
    console.log(`\n${colors.magenta}=== 新しいエンドポイントのシミュレーション ===${colors.reset}`);
    
    if (!userId) {
      console.error(`${colors.red}ユーザーIDが指定されていません${colors.reset}`);
      return;
    }
    
    // ユーザー情報を取得
    const user = await SimpleUser.findById(userId);
    
    if (!user) {
      console.error(`${colors.red}ユーザーが見つかりません${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}ユーザー情報:${colors.reset} ${user.name} (ID: ${user._id})`);
    
    // APIキー情報を取得
    let apiKeyData = null;
    
    // 新方式：AnthropicApiKeyモデルからAPIキーを取得
    if (user.apiKeyId) {
      try {
        // APIキーIDと一致するAnthropicApiKeyを検索
        const anthropicApiKey = await AnthropicApiKey.findOne({ apiKeyId: user.apiKeyId });
        
        if (anthropicApiKey && anthropicApiKey.apiKeyFull) {
          apiKeyData = {
            id: anthropicApiKey.apiKeyId,
            apiKeyFull: anthropicApiKey.apiKeyFull,
            keyHint: anthropicApiKey.keyHint,
            status: anthropicApiKey.status
          };
          console.log(`${colors.green}AnthropicApiKeyモデルからAPIキーを取得しました${colors.reset}`);
        }
      } catch (apiKeyError) {
        console.error(`${colors.red}AnthropicApiKeyモデルからの取得失敗:${colors.reset}`, apiKeyError);
      }
    }
    
    // フォールバック: ユーザーに直接保存されているAPIキー値を使用
    if (!apiKeyData && user.apiKeyValue) {
      apiKeyData = {
        id: user.apiKeyId || 'direct_key',
        apiKeyFull: user.apiKeyValue,
        keyHint: user.apiKeyValue ? user.apiKeyValue.substring(0, 5) + '...' : '',
        status: 'active'
      };
      console.log(`${colors.yellow}ユーザーモデルから直接APIキーを取得しました（フォールバック）${colors.reset}`);
    }
    
    // APIキーが見つからない場合
    if (!apiKeyData) {
      console.error(`${colors.red}ユーザーにAPIキーが設定されていません${colors.reset}`);
      return;
    }
    
    // 成功レスポンスをシミュレーション
    console.log(`\n${colors.green}=== シミュレーションレスポンス ===${colors.reset}`);
    console.log(JSON.stringify({
      success: true,
      data: apiKeyData
    }, null, 2));
    
    console.log(`\n${colors.green}エンドポイントシミュレーション成功${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}エンドポイントシミュレーションエラー:${colors.reset}`, error);
  }
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    // MongoDBに接続
    await connectToMongoDB();
    
    // AnthropicApiKeyの一覧を表示
    await listAllAnthropicApiKeys();
    
    // APIキーの関連性テスト
    const user = await getUserWithApiKey();
    await testApiKeyRelation();
    
    // 新エンドポイントのシミュレーション
    if (user) {
      await simulateEndpoint(user._id);
    }
    
    console.log(`\n${colors.green}===== テスト完了 =====${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}テスト実行エラー:${colors.reset}`, error);
  } finally {
    // MongoDB接続を閉じる
    mongoose.connection.close();
    console.log(`${colors.blue}MongoDB接続を閉じました${colors.reset}`);
  }
}

// メイン処理を実行
main();