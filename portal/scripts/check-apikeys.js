/**
 * MongoDB内のAnthropicApiKeysとSimpleUserのAPIキーデータをチェックするスクリプト
 */
require('dotenv').config();
const mongoose = require('mongoose');
const AnthropicApiKey = require('../backend/models/anthropicApiKey.model');
const SimpleUser = require('../backend/models/simpleUser.model');
const SimpleOrganization = require('../backend/models/simpleOrganization.model');
const dbConfig = require('../backend/config/db.config');

// カラー出力用関数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`
};

async function checkApiKeys() {
  try {
    console.log('MongoDBに接続しています...');
    await mongoose.connect(dbConfig.url, dbConfig.options);
    console.log(colors.green('MongoDBに接続しました'));

    // 利用可能なコレクション一覧を取得
    console.log(colors.cyan('\n=== MongoDB コレクション一覧 ==='));
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('利用可能なコレクション:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    // AnthropicApiKeyモデルのデータを取得
    console.log(colors.cyan('\n=== AnthropicApiKeys コレクション ==='));
    
    try {
      // 直接コレクションにアクセスする方法を試す
      const collection = mongoose.connection.db.collection('anthropicapikeys');
      const apiKeysRaw = await collection.find({}).toArray();
      
      if (apiKeysRaw.length === 0) {
        console.log(colors.yellow('anthropicapikeysコレクションにデータがありません'));
      } else {
        console.log(`${apiKeysRaw.length}件のデータが見つかりました (直接コレクションアクセス)`);
        apiKeysRaw.forEach(key => {
          console.log(`- ${key.apiKeyId || 'N/A'} | ${key.keyHint || 'N/A'} | ${key.name || 'N/A'}`);
        });
      }
    } catch (err) {
      console.error('直接コレクションアクセスエラー:', err);
    }
    
    // モデル経由のアクセスも試す
    const apiKeys = await AnthropicApiKey.find({});
    
    if (apiKeys.length === 0) {
      console.log(colors.yellow('AnthropicApiKeyモデル経由では、データが見つかりません'));
    } else {
      console.log(`${apiKeys.length}件のデータが見つかりました (モデル経由)`);
      apiKeys.forEach(key => {
        console.log(`- ${key.apiKeyId} | ${key.keyHint} | ${key.name}`);
      });
    }

    // SimpleUserモデルのAPIキーデータを取得
    console.log(colors.cyan('\n=== SimpleUser APIキー情報 ==='));
    const usersWithApiKey = await SimpleUser.find({ 
      apiKeyId: { $ne: null }, 
      apiKeyValue: { $ne: null } 
    });
    
    if (usersWithApiKey.length === 0) {
      console.log(colors.yellow('APIキーを持つユーザーは見つかりませんでした'));
    } else {
      console.log(`${usersWithApiKey.length}人のユーザーがAPIキーを持っています`);
      usersWithApiKey.forEach(user => {
        console.log(`- ユーザー: ${user.name} (${user.email})`);
        console.log(`  APIキーID: ${user.apiKeyId}`);
        console.log(`  APIキー値: ${user.apiKeyValue.substring(0, 15)}...`);
      });
    }

    // 組織のAPIキーIDリストを取得
    console.log(colors.cyan('\n=== SimpleOrganization APIキーリスト ==='));
    const organizations = await SimpleOrganization.find({ 
      apiKeyIds: { $exists: true, $ne: [] } 
    });
    
    if (organizations.length === 0) {
      console.log(colors.yellow('APIキーを持つ組織は見つかりませんでした'));
    } else {
      console.log(`${organizations.length}件の組織がAPIキーを持っています`);
      for (const org of organizations) {
        console.log(`- 組織: ${org.name}`);
        console.log(`  APIキーID一覧 (${org.apiKeyIds.length}件):`);
        
        for (const keyId of org.apiKeyIds) {
          // このAPIキーIDを持つユーザーを検索
          const userWithKey = await SimpleUser.findOne({ apiKeyId: keyId });
          
          if (userWithKey) {
            console.log(`  - ${keyId} (ユーザー: ${userWithKey.name})`);
          } else {
            console.log(`  - ${keyId} (ユーザー未割り当て)`);
          }
        }
      }
    }

  } catch (error) {
    console.error(colors.red('エラーが発生しました:'), error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB接続を終了しました');
  }
}

// スクリプトを実行
checkApiKeys();