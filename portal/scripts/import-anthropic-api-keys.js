/**
 * Anthropic API キーをインポートするスクリプト
 * 
 * 使用方法:
 * node import-anthropic-api-keys.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// モデル読み込み
const AnthropicApiKey = require('../backend/models/anthropicApiKey.model');

// MongoDB接続設定
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/appgenius';

// APIキーデータのファイルパス
const API_KEYS_DATA_FILE = path.join(__dirname, 'data', 'api_keys.json');

// カラー出力用関数
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`
};

/**
 * APIキーをインポートする関数
 */
async function importApiKeys() {
  console.log(colors.cyan('=== Anthropic API キーのインポート開始 ==='));
  
  try {
    // APIキーデータを読み込む
    console.log(`APIキーデータを${API_KEYS_DATA_FILE}から読み込んでいます...`);
    const apiKeysData = JSON.parse(fs.readFileSync(API_KEYS_DATA_FILE, 'utf8'));
    
    console.log(colors.green(`${apiKeysData.length}個のAPIキーデータを読み込みました`));
    
    // データベースへの接続
    console.log('MongoDBに接続しています...');
    // DB設定ファイルから接続オプションを取得
    const dbConfig = require('../backend/config/db.config');
    await mongoose.connect(mongoURI, dbConfig.options);
    
    console.log(colors.green('MongoDBに接続しました'));
    
    // APIキーをインポート
    console.log('APIキーをインポートしています...');
    
    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const apiKey of apiKeysData) {
      try {
        // APIキーデータをチェック
        if (!apiKey.id || !apiKey.hint) {
          console.log(colors.yellow(`警告: 不完全なAPIキーデータをスキップしました: ${apiKey.name || 'Unknown'}`));
          errorCount++;
          continue;
        }
        
        // モデルに必要なフィールドにマッピング
        const keyData = {
          id: apiKey.id,
          hint: apiKey.hint,
          name: apiKey.name || '',
          status: apiKey.status || 'active',
          workspace_id: apiKey.workspace_id || null
        };
        
        console.log(`処理中のキー: ${keyData.id} / ${keyData.hint}`);
        
        // データベースに既存のキーがあるか確認
        try {
          const existingKey = await AnthropicApiKey.findOne({ apiKeyId: keyData.id });
          
          if (existingKey) {
            // 既存キーを更新
            console.log(`  既存のキーを見つけました: ${existingKey.apiKeyId}`);
            existingKey.keyHint = keyData.hint;
            existingKey.apiKeyFull = process.env.ANTHROPIC_API_KEY || "sk-ant-api03-YPL...nwAA"; // 実際のキー値を設定
            existingKey.name = keyData.name;
            existingKey.status = keyData.status;
            existingKey.workspaceId = keyData.workspace_id;
            existingKey.lastSyncedAt = new Date();
            
            const result = await existingKey.save();
            console.log(`  保存結果: ${result ? '成功' : '失敗'}`);
            updatedCount++;
            
            console.log(colors.gray(`更新: ${keyData.id.substring(0, 10)}... (${keyData.name})`));
          } else {
            // 新規APIキーを作成
            console.log(`  新規作成: ${keyData.id}`);
            try {
              const newKey = new AnthropicApiKey({
                apiKeyId: keyData.id,
                keyHint: keyData.hint,
                apiKeyFull: process.env.ANTHROPIC_API_KEY || "sk-ant-api03-YPL...nwAA", // 実際のキー値を設定（環境変数から取得）
                name: keyData.name,
                status: keyData.status,
                workspaceId: keyData.workspace_id,
                lastSyncedAt: new Date()
              });
              
              const result = await newKey.save();
              console.log(`  保存結果: ${result ? '成功' : '失敗'}`);
              
              importedCount++;
              console.log(colors.green(`インポート: ${keyData.id.substring(0, 10)}... (${keyData.name})`));
            } catch (saveErr) {
              console.error(`  保存エラー:`, saveErr);
              errorCount++;
            }
          }
        } catch (findErr) {
          console.error(`  検索エラー:`, findErr);
          errorCount++;
        }
      } catch (err) {
        console.log(colors.red(`エラー: APIキー ${apiKey.id || 'Unknown'} の処理中にエラーが発生しました`));
        console.error(err);
        errorCount++;
      }
    }
    
    // 結果の表示
    console.log(colors.cyan('\n=== インポート結果 ==='));
    console.log(`新規インポート: ${colors.green(importedCount)}件`);
    console.log(`更新: ${colors.yellow(updatedCount)}件`);
    console.log(`エラー: ${colors.red(errorCount)}件`);
    console.log(`合計: ${apiKeysData.length}件`);
    
    // 全APIキーの一覧を表示
    const allKeys = await AnthropicApiKey.find().sort({ name: 1 });
    
    console.log(colors.cyan('\n=== データベース内のAPIキー一覧 ==='));
    console.log(`合計: ${allKeys.length}件\n`);
    
    allKeys.forEach(key => {
      console.log(`${colors.green(key.apiKeyId.substring(0, 15) + '...')} | ${key.keyHint} | ${key.name || 'No name'}`);
    });
    
    console.log(colors.cyan('\n=== インポート完了 ==='));
  } catch (error) {
    console.error(colors.red('エラー:'), error);
  } finally {
    // 接続を閉じる
    await mongoose.disconnect();
    console.log('MongoDBの接続を閉じました');
  }
}

// スクリプトを実行
importApiKeys()
  .catch(err => {
    console.error('スクリプト実行エラー:', err);
    process.exit(1);
  });