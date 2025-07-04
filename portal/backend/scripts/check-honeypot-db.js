/**
 * HONEYPOT_DBの内容を確認するスクリプト
 */
const mongoose = require('mongoose');
const TrapPrompt = require('../models/trapPrompt.model');
const honeypotConnection = require('../config/honeypot-db.config');

async function checkHoneypotDB() {
  try {
    console.log('🔍 HONEYPOT_DBの内容を確認します...\n');
    
    // 接続を待つ
    await new Promise((resolve) => {
      if (honeypotConnection.readyState === 1) {
        resolve();
      } else {
        honeypotConnection.once('connected', resolve);
      }
    });
    
    // 全てのトラッププロンプトを取得
    const trapPrompts = await TrapPrompt.find({})
      .select('_id originalPromptId title decoyFileName')
      .sort({ title: 1 });
    
    console.log(`📊 総トラッププロンプト数: ${trapPrompts.length}\n`);
    
    console.log('現在のマッピング状況:');
    console.log('='.repeat(80));
    console.log('偽ID（_id） | originalPromptId（現在） | タイトル');
    console.log('='.repeat(80));
    
    trapPrompts.forEach(prompt => {
      console.log(`${prompt._id} | ${prompt.originalPromptId} | ${prompt.title}`);
    });
    
    console.log('\n問題点:');
    console.log('- originalPromptIdに偽のIDが入っている');
    console.log('- 本来はoriginalPromptIdに本物のプロンプトIDが入るべき');
    
    // 本物のIDとの対応表
    console.log('\n正しいマッピング（本物のID）:');
    console.log('='.repeat(80));
    const CORRECT_MAPPING = {
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
    
    for (const [title, correctId] of Object.entries(CORRECT_MAPPING)) {
      console.log(`${title} → ${correctId}`);
    }
    
  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    await honeypotConnection.close();
    process.exit(0);
  }
}

checkHoneypotDB();