/**
 * HONEYPOT_DBのoriginalPromptIdを本物のIDに修正するスクリプト
 */
const mongoose = require('mongoose');
const TrapPrompt = require('../models/trapPrompt.model');
const honeypotConnection = require('../config/honeypot-db.config');

// 正しいマッピング（本物のプロンプトID）
const CORRECT_ID_MAPPING = {
  '#0 オーケストレーター': '6862397f1428c1efc592f6cc',
  '#1 要件定義エンジニア': '6862397f1428c1efc592f6ce',
  '#2 UI/UXデザイナー': '6862397f1428c1efc592f6d0',
  '#3 データモデリングエンジニア': '6862397f1428c1efc592f6d2',
  '#4 システムアーキテクト': '6862397f1428c1efc592f6d4',
  '#5 実装コンサルタント': '6862397f1428c1efc592f6d6',
  '#6 環境セットアップ': '6862397f1428c1efc592f6d8',
  '#7 プロトタイプ実装': '6862397f1428c1efc592f6da',
  '#8 バックエンド実装': '6862397f1428c1efc592f6dc',
  '#9 テスト・品質検証': '6862397f1428c1efc592f6de',
  '#10 API統合': '6862397f1428c1efc592f6e0',
  '#11 デバッグ探偵': '6862397f1428c1efc592f6e2',
  '#12 デプロイスペシャリスト': '6862397f1428c1efc592f6e4',
  '#13 GitHubマネージャー': '6862397f1428c1efc592f6e6',
  '#14 TypeScriptマネージャー': '6862397f1428c1efc592f6e8',
  '#15 機能拡張': '6862397f1428c1efc592f6ea',
  '#16 リファクタリングエキスパート': '6862397f1428c1efc592f6ec'
};

async function fixHoneypotMapping() {
  try {
    console.log('🔧 HONEYPOT_DBのマッピングを修正します...\n');
    
    // 接続を待つ
    await new Promise((resolve) => {
      if (honeypotConnection.readyState === 1) {
        resolve();
      } else {
        honeypotConnection.once('connected', resolve);
      }
    });
    
    // 各プロンプトを更新
    for (const [title, correctId] of Object.entries(CORRECT_ID_MAPPING)) {
      const trapPrompt = await TrapPrompt.findOne({ title });
      
      if (trapPrompt) {
        const oldId = trapPrompt.originalPromptId;
        trapPrompt.originalPromptId = correctId;
        await trapPrompt.save();
        
        console.log(`✅ ${title}`);
        console.log(`   旧: ${oldId}`);
        console.log(`   新: ${correctId}\n`);
      } else {
        console.log(`❌ ${title} が見つかりません\n`);
      }
    }
    
    console.log('🎉 修正が完了しました！\n');
    
    // 修正後の確認
    console.log('修正後の状態:');
    console.log('='.repeat(80));
    const updatedPrompts = await TrapPrompt.find({})
      .select('title originalPromptId')
      .sort({ title: 1 });
    
    updatedPrompts.forEach(prompt => {
      console.log(`${prompt.title} → ${prompt.originalPromptId}`);
    });
    
  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    await honeypotConnection.close();
    process.exit(0);
  }
}

// 実行確認
console.log('⚠️  このスクリプトはHONEYPOT_DBのデータを直接更新します。');
console.log('続行しますか？ (yes/no)');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('> ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    rl.close();
    fixHoneypotMapping();
  } else {
    console.log('キャンセルされました。');
    rl.close();
    process.exit(0);
  }
});