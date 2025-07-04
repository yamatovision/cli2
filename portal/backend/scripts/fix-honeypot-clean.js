/**
 * HONEYPOT_DBをクリーンアップして再インポート
 */
const mongoose = require('mongoose');
const TrapPrompt = require('../models/trapPrompt.model');
const honeypotConnection = require('../config/honeypot-db.config');

async function cleanAndReimport() {
  try {
    console.log('🧹 HONEYPOT_DBをクリーンアップします...\n');
    
    // 接続を待つ
    await new Promise((resolve) => {
      if (honeypotConnection.readyState === 1) {
        resolve();
      } else {
        honeypotConnection.once('connected', resolve);
      }
    });
    
    // 全てのトラッププロンプトを削除
    const deleteResult = await TrapPrompt.deleteMany({});
    console.log(`✅ ${deleteResult.deletedCount}個のトラッププロンプトを削除しました\n`);
    
    console.log('データベースがクリーンになりました。');
    console.log('次のコマンドで正しいマッピングでインポートしてください:\n');
    console.log('1. まず import-trap-prompts.js を修正');
    console.log('2. node scripts/import-trap-prompts.js を実行\n');
    
  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    await honeypotConnection.close();
    process.exit(0);
  }
}

// 実行確認
console.log('⚠️  このスクリプトはHONEYPOT_DBの全データを削除します。');
console.log('続行しますか？ (yes/no)');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('> ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    rl.close();
    cleanAndReimport();
  } else {
    console.log('キャンセルされました。');
    rl.close();
    process.exit(0);
  }
});