#!/usr/bin/env node
/**
 * プロンプトデータベースチェックスクリプト
 * 実際のプロンプトIDとデータを確認
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// DB設定を読み込む
const dbConfig = require('../config/db.config');

// プロンプトモデル
const Prompt = require('../models/prompt.model');

// CLIマッピングで使用されているID
const CLI_PROMPT_IDS = {
  'refactoring_expert.j2': '6862397f1428c1efc592f6ec',
  'data_modeling_engineer.j2': '6862397f1428c1efc592f6d2',
  'feature_extension.j2': '6862397f1428c1efc592f6ea',
  'system_architect.j2': '6862397f1428c1efc592f6d4',
  'debug_detective.j2': '6862397f1428c1efc592f6e2',
  'environment_setup.j2': '6862397f1428c1efc592f6d8',
  'ui_ux_designer.j2': '6862397f1428c1efc592f6d0',
  'test_quality_verification.j2': '6862397f1428c1efc592f6de',
  'github_manager.j2': '6862397f1428c1efc592f6e6',
  'typescript_manager.j2': '6862397f1428c1efc592f6e8',
  'orchestrator.j2': '6862397f1428c1efc592f6cc',
  'backend_implementation.j2': '6862397f1428c1efc592f6dc',
  'deploy_specialist.j2': '6862397f1428c1efc592f6e4',
  'api_integration.j2': '6862397f1428c1efc592f6e0',
  'implementation_consultant.j2': '6862397f1428c1efc592f6d6',
  'prototype_implementation.j2': '6862397f1428c1efc592f6da',
  'requirements_engineer.j2': '6862397f1428c1efc592f6ce',
};

async function checkPrompts() {
  try {
    console.log('=== プロンプトデータベースチェック ===\n');
    console.log('接続先:', dbConfig.url.replace(/mongodb\+srv:\/\/[^@]+@/, 'mongodb+srv://***@'));
    
    // データベースに接続
    await mongoose.connect(dbConfig.url, dbConfig.options);
    
    console.log('✅ データベース接続成功\n');
    
    // 1. CLIマッピングのIDを確認
    console.log('=== CLIマッピングIDの確認 ===\n');
    for (const [filename, promptId] of Object.entries(CLI_PROMPT_IDS)) {
      try {
        const prompt = await Prompt.findById(promptId);
        if (prompt) {
          console.log(`✅ ${filename}: ${promptId}`);
          console.log(`   タイトル: ${prompt.title}`);
          console.log(`   公開状態: ${prompt.isPublic ? '公開' : '非公開'}`);
          console.log(`   アーカイブ: ${prompt.isArchived ? 'はい' : 'いいえ'}`);
        } else {
          console.log(`❌ ${filename}: ${promptId} - 見つかりません`);
        }
      } catch (error) {
        console.log(`❌ ${filename}: ${promptId} - エラー: ${error.message}`);
      }
    }
    
    // 2. 実際に存在する公開プロンプトを確認
    console.log('\n=== 公開プロンプト一覧 ===\n');
    const publicPrompts = await Prompt.find({
      isPublic: true,
      isArchived: false
    })
    .select('_id title description tags createdAt')
    .sort({ createdAt: -1 })
    .limit(20);
    
    console.log(`✅ ${publicPrompts.length}個の公開プロンプトが見つかりました\n`);
    
    publicPrompts.forEach((prompt, index) => {
      console.log(`${index + 1}. ID: ${prompt._id}`);
      console.log(`   タイトル: ${prompt.title}`);
      console.log(`   説明: ${prompt.description || 'なし'}`);
      console.log(`   タグ: ${prompt.tags?.join(', ') || 'なし'}`);
      console.log(`   作成日: ${prompt.createdAt}`);
      console.log('---');
    });
    
    // 3. タイトルでマッチングを試みる
    console.log('\n=== タイトルマッチング ===\n');
    const targetTitles = [
      'デバッグ探偵',
      '機能拡張プランナー',
      'テスト・品質検証',
      'オーケストレーター',
      '要件定義エンジニア',
      'UI/UXデザイナー',
      'データモデリングエンジニア',
      'システムアーキテクト',
      '実装コンサルタント',
      '環境構築',
      'プロトタイプ実装',
      'バックエンド実装',
      'API統合',
      'デバッグ探偵',
      'デプロイスペシャリスト',
      'GitHubマネージャー',
      'TypeScriptマネージャー',
      '機能拡張プランナー',
      'リファクタリングエキスパート'
    ];
    
    for (const title of targetTitles) {
      const prompt = await Prompt.findOne({
        title: { $regex: title, $options: 'i' }
      });
      
      if (prompt) {
        console.log(`✅ "${title}" → ID: ${prompt._id}`);
      }
    }
    
    // 4. プロンプト総数
    const totalCount = await Prompt.countDocuments();
    const publicCount = await Prompt.countDocuments({ isPublic: true });
    const archivedCount = await Prompt.countDocuments({ isArchived: true });
    
    console.log('\n=== 統計情報 ===\n');
    console.log(`総プロンプト数: ${totalCount}`);
    console.log(`公開プロンプト数: ${publicCount}`);
    console.log(`アーカイブ済み: ${archivedCount}`);
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ データベース接続を閉じました');
  }
}

// スクリプト実行
checkPrompts();