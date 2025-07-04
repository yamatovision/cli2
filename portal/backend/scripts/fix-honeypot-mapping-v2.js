/**
 * HONEYPOT_DBのoriginalPromptIdを本物のIDに修正するスクリプト（重複対応版）
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
    
    // まず現在の状態を確認
    console.log('現在の状態を確認中...\n');
    const allPrompts = await TrapPrompt.find({});
    const idUsageMap = {};
    
    // どのIDがどこで使われているか調査
    allPrompts.forEach(prompt => {
      if (!idUsageMap[prompt.originalPromptId]) {
        idUsageMap[prompt.originalPromptId] = [];
      }
      idUsageMap[prompt.originalPromptId].push(prompt.title);
    });
    
    // 重複を報告
    console.log('重複しているoriginalPromptId:');
    for (const [id, titles] of Object.entries(idUsageMap)) {
      if (titles.length > 1) {
        console.log(`  ${id}: ${titles.join(', ')}`);
      }
    }
    console.log('');
    
    // 各プロンプトを更新（重複チェック付き）
    for (const [title, correctId] of Object.entries(CORRECT_ID_MAPPING)) {
      const trapPrompt = await TrapPrompt.findOne({ title });
      
      if (trapPrompt) {
        const oldId = trapPrompt.originalPromptId;
        
        // 既に正しいIDの場合はスキップ
        if (oldId === correctId) {
          console.log(`⏭️  ${title} - 既に正しいID`);
          continue;
        }
        
        // 他のプロンプトが同じIDを使っていないか確認
        const conflicting = await TrapPrompt.findOne({ 
          originalPromptId: correctId,
          _id: { $ne: trapPrompt._id }
        });
        
        if (conflicting) {
          console.log(`⚠️  ${title}`);
          console.log(`   競合: ${conflicting.title} が既に ${correctId} を使用中`);
          console.log(`   一時的に null に設定`);
          
          // 一時的にnullに設定
          trapPrompt.originalPromptId = null;
          await trapPrompt.save();
        } else {
          trapPrompt.originalPromptId = correctId;
          await trapPrompt.save();
          
          console.log(`✅ ${title}`);
          console.log(`   旧: ${oldId}`);
          console.log(`   新: ${correctId}`);
        }
        console.log('');
      } else {
        console.log(`❌ ${title} が見つかりません\n`);
      }
    }
    
    // 第2パス: nullになっているものを修正
    console.log('\n第2パス: 一時的にnullにしたものを修正...\n');
    
    for (const [title, correctId] of Object.entries(CORRECT_ID_MAPPING)) {
      const trapPrompt = await TrapPrompt.findOne({ 
        title,
        originalPromptId: null 
      });
      
      if (trapPrompt) {
        trapPrompt.originalPromptId = correctId;
        await trapPrompt.save();
        console.log(`✅ ${title} → ${correctId}`);
      }
    }
    
    console.log('\n🎉 修正が完了しました！\n');
    
    // 修正後の確認
    console.log('修正後の状態:');
    console.log('='.repeat(80));
    const updatedPrompts = await TrapPrompt.find({})
      .select('title originalPromptId')
      .sort({ title: 1 });
    
    updatedPrompts.forEach(prompt => {
      const isCorrect = CORRECT_ID_MAPPING[prompt.title] === prompt.originalPromptId;
      const status = isCorrect ? '✅' : '❌';
      console.log(`${status} ${prompt.title} → ${prompt.originalPromptId}`);
    });
    
  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    await honeypotConnection.close();
    process.exit(0);
  }
}

// 実行
fixHoneypotMapping();