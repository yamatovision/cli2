/**
 * データベース内のAPIキーを確認するスクリプト
 */
require('dotenv').config();
const mongoose = require('mongoose');

// コマンドラインカラー定義
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`
};

// MongoDB接続設定
const dbConfig = require('./portal/backend/config/db.config');
const mongoURI = process.env.MONGODB_URI || dbConfig.url;

// AnthropicApiKeyモデルのインポート
const AnthropicApiKey = require('./portal/backend/models/anthropicApiKey.model');
const SimpleUser = require('./portal/backend/models/simpleUser.model');

/**
 * 秘密鍵の一部をマスクする
 * @param {string} key - 秘密鍵
 * @returns {string} - マスクされた秘密鍵
 */
function maskKey(key) {
  if (!key) return 'undefined';
  if (typeof key !== 'string') return `${typeof key}:${key}`;
  
  // 長さが10未満なら完全にマスク
  if (key.length < 10) return '********';
  
  // 先頭12文字と最後4文字を保持し、それ以外をマスク
  const prefix = key.substring(0, 12);
  const suffix = key.substring(key.length - 4);
  return `${prefix}...${suffix}`;
}

/**
 * ファイル内のAPIキーとデータベース内のキーを比較
 * @param {string} fileKey - ファイル内のAPIキー
 * @param {Array} dbKeys - データベース内のAPIキー
 * @returns {object} - 比較結果
 */
function compareKeys(fileKey, dbKeys) {
  if (!fileKey || !dbKeys || dbKeys.length === 0) {
    return { match: false, reason: 'データ不足で比較できません' };
  }
  
  let matchingKey = null;
  
  // 完全一致を検索
  const exactMatch = dbKeys.find(k => k.key === fileKey);
  if (exactMatch) {
    return { 
      match: true, 
      matchType: '完全一致',
      keyId: exactMatch.apiKeyId,
      keyHint: exactMatch.keyHint,
      key: maskKey(exactMatch.key)
    };
  }
  
  // ヒント部分が一致するか確認
  if (fileKey.length >= 4) {
    const keySuffix = fileKey.substring(fileKey.length - 4);
    const hintMatch = dbKeys.find(k => k.keyHint && k.keyHint.endsWith(keySuffix));
    
    if (hintMatch) {
      return { 
        match: true, 
        matchType: 'ヒント一致',
        keyId: hintMatch.apiKeyId,
        keyHint: hintMatch.keyHint,
        key: maskKey(hintMatch.key)
      };
    }
  }
  
  return { match: false, reason: '一致するキーが見つかりません' };
}

/**
 * APIキーとユーザーの関連づけを確認
 */
async function checkUserKeyRelations() {
  console.log(colors.cyan('\nAPIキーとユーザーの関連づけを確認中...\n'));
  
  try {
    // ユーザー情報を取得
    const users = await SimpleUser.find({}).lean();
    console.log(`${users.length}人のユーザーが見つかりました`);
    
    // APIキーを持つユーザーを確認
    const usersWithKeys = users.filter(u => u.apiKeyId);
    console.log(`APIキーIDを持つユーザー: ${usersWithKeys.length}人\n`);
    
    // 詳細表示
    if (usersWithKeys.length > 0) {
      usersWithKeys.forEach(user => {
        console.log(`ユーザー: ${user.name || 'No Name'} (${user.email})`);
        console.log(`ロール: ${user.role || 'Not specified'}`);
        console.log(`APIキーID: ${user.apiKeyId}`);
        console.log('---');
      });
    } else {
      console.log(colors.yellow('APIキーを持つユーザーがいません'));
    }
  } catch (error) {
    console.log(colors.red(`ユーザー確認エラー: ${error.message}`));
  }
}

/**
 * メイン関数
 */
async function main() {
  console.log(colors.cyan('=== データベース内のAPIキー確認ツール ===\n'));
  
  try {
    // MongoDBに接続
    console.log(`MongoDB接続先: ${mongoURI}`);
    await mongoose.connect(mongoURI);
    console.log(colors.green('MongoDBに接続しました\n'));
    
    // .appgenius/auth.jsonからキーを読み込む
    const fs = require('fs');
    const path = require('path');
    const appgeniusAuthFile = path.join(process.env.HOME || process.env.USERPROFILE, '.appgenius', 'auth.json');
    
    let fileApiKey = null;
    try {
      if (fs.existsSync(appgeniusAuthFile)) {
        const data = JSON.parse(fs.readFileSync(appgeniusAuthFile, 'utf8'));
        fileApiKey = data.accessToken;
        console.log(`ファイル内のAPIキー: ${maskKey(fileApiKey)}`);
      }
    } catch (error) {
      console.log(colors.yellow(`ファイル読み込みエラー: ${error.message}`));
    }
    
    // APIキーを全件取得
    const apiKeys = await AnthropicApiKey.find({}).lean();
    console.log(`データベース内のAPIキー数: ${apiKeys.length}`);
    
    if (apiKeys.length > 0) {
      console.log('\nAPIキー一覧:');
      apiKeys.forEach((key, index) => {
        console.log(`${index + 1}. ID: ${key.apiKeyId}`);
        console.log(`   ヒント: ${key.keyHint || 'なし'}`);
        console.log(`   キー: ${maskKey(key.key)}`);
        console.log(`   名前: ${key.name || 'なし'}`);
        console.log(`   ステータス: ${key.status || 'unknown'}`);
        console.log('---');
      });
      
      // ファイル内のキーとデータベース内のキーを比較
      if (fileApiKey) {
        console.log(colors.cyan('\nファイル内のAPIキーとデータベース内のキーを比較:'));
        const comparison = compareKeys(fileApiKey, apiKeys);
        
        if (comparison.match) {
          console.log(colors.green(`一致しました (${comparison.matchType}):`));
          console.log(`APIキーID: ${comparison.keyId}`);
          console.log(`ヒント: ${comparison.keyHint}`);
          console.log(`キー: ${comparison.key}`);
        } else {
          console.log(colors.red(`一致しませんでした: ${comparison.reason}`));
        }
      }
    } else {
      console.log(colors.yellow('データベース内にAPIキーがありません'));
    }
    
    // APIキーとユーザーの関連づけを確認
    await checkUserKeyRelations();
    
  } catch (error) {
    console.log(colors.red(`エラー: ${error.message}`));
  } finally {
    // データベース接続を閉じる
    await mongoose.disconnect();
    console.log(colors.cyan('\nデータベース接続を閉じました'));
    console.log(colors.cyan('=== 確認完了 ==='));
  }
}

// スクリプトを実行
main();