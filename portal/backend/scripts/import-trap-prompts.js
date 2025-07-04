/**
 * トラッププロンプトインポートスクリプト
 * /cli/decoy ディレクトリから偽プロンプトをHONEYPOT_DBに格納
 */
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const TrapPrompt = require('../models/trapPrompt.model');
const Prompt = require('../models/prompt.model');
require('../config/db.config').connect(mongoose);

// プロンプトIDマッピング（実際のプロンプトIDと対応）
const PROMPT_ID_MAPPING = {
  '00-orchestrator.md': '6862397f1428c1efc592f6cc',           // #0 オーケストレーター（本物のID）
  '01-requirements-engineer.md': '6862397f1428c1efc592f6ce',   // #1 要件定義エンジニア（本物のID）
  '02-uiux-designer.md': '6862397f1428c1efc592f6d0',          // #2 UI/UXデザイナー（本物のID）
  '03-data-modeling-engineer.md': '6862397f1428c1efc592f6d2',  // #3 データモデリングエンジニア（本物のID）
  '04-system-architect.md': '6862397f1428c1efc592f6d4',        // #4 システムアーキテクト（本物のID）
  '05-implementation-consultant.md': '6862397f1428c1efc592f6d6', // #5 実装コンサルタント（本物のID）
  '06-environment-setup.md': '6862397f1428c1efc592f6d8',       // #6 環境セットアップ（本物のID）
  '07-prototype-implementation.md': '6862397f1428c1efc592f6da', // #7 プロトタイプ実装（本物のID）
  '08-backend-implementation.md': '6862397f1428c1efc592f6dc',  // #8 バックエンド実装（本物のID）
  '09-test-quality-verification.md': '6862397f1428c1efc592f6de', // #9 テスト・品質検証（本物のID）
  '10-api-integration.md': '6862397f1428c1efc592f6e0',         // #10 API統合（本物のID）
  '11-debug-detective.md': '6862397f1428c1efc592f6e2',         // #11 デバッグ探偵（本物のID）
  '12-deploy-specialist.md': '6862397f1428c1efc592f6e4',       // #12 デプロイスペシャリスト（本物のID）
  '13-github-manager.md': '6862397f1428c1efc592f6e6',          // #13 GitHubマネージャー（本物のID）
  '14-typescript-manager.md': '6862397f1428c1efc592f6e8',      // #14 TypeScriptマネージャー（本物のID）
  '15-feature-expansion.md': '6862397f1428c1efc592f6ea',       // #15 機能拡張（本物のID）
  '16-refactoring-expert.md': '6862397f1428c1efc592f6ec'       // #16 リファクタリングエキスパート（本物のID）
};

// タイトルマッピング
const TITLE_MAPPING = {
  '00-orchestrator.md': '#0 オーケストレーター',
  '01-requirements-engineer.md': '#1 要件定義エンジニア',
  '02-uiux-designer.md': '#2 UI/UXデザイナー',
  '03-data-modeling-engineer.md': '#3 データモデリングエンジニア',
  '04-system-architect.md': '#4 システムアーキテクト',
  '05-implementation-consultant.md': '#5 実装コンサルタント',
  '06-environment-setup.md': '#6 環境セットアップ',
  '07-prototype-implementation.md': '#7 プロトタイプ実装',
  '08-backend-implementation.md': '#8 バックエンド実装',
  '09-test-quality-verification.md': '#9 テスト・品質検証',
  '10-api-integration.md': '#10 API統合',
  '11-debug-detective.md': '#11 デバッグ探偵',
  '12-deploy-specialist.md': '#12 デプロイスペシャリスト',
  '13-github-manager.md': '#13 GitHubマネージャー',
  '14-typescript-manager.md': '#14 TypeScriptマネージャー',
  '15-feature-expansion.md': '#15 機能拡張',
  '16-refactoring-expert.md': '#16 リファクタリングエキスパート'
};

// 説明マッピング
const DESCRIPTION_MAPPING = {
  '00-orchestrator.md': 'プロジェクト全体を統括し、適切なエージェントに作業を委譲する',
  '01-requirements-engineer.md': '要件定義と仕様書作成の専門家',
  '02-uiux-designer.md': 'ユーザー体験とインターフェースデザインの専門家',
  '03-data-modeling-engineer.md': 'データベース設計とデータモデリングの専門家',
  '04-system-architect.md': 'システム全体の設計と技術選定の専門家',
  '05-implementation-consultant.md': '実装方針と技術的アドバイスを提供',
  '06-environment-setup.md': '開発環境のセットアップと設定',
  '07-prototype-implementation.md': 'プロトタイプとMVPの実装',
  '08-backend-implementation.md': 'バックエンドAPIとサーバーサイド実装',
  '09-test-quality-verification.md': 'テスト戦略と品質保証',
  '10-api-integration.md': 'API連携と外部サービス統合',
  '11-debug-detective.md': 'バグ調査と問題解決',
  '12-deploy-specialist.md': 'デプロイメントとインフラ管理',
  '13-github-manager.md': 'Gitワークフローとリポジトリ管理',
  '14-typescript-manager.md': 'TypeScriptの型定義と設定管理',
  '15-feature-expansion.md': '新機能の設計と実装',
  '16-refactoring-expert.md': 'コードのリファクタリングと最適化'
};

async function importTrapPrompts() {
  try {
    console.log('🚀 トラッププロンプトのインポートを開始します...');
    
    // デコイディレクトリのパス
    const decoyDir = path.join(__dirname, '../../../cli/decoy');
    
    // ディレクトリ内のファイルを読み込み
    const files = await fs.readdir(decoyDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    console.log(`📁 ${mdFiles.length}個のデコイファイルを発見しました`);
    
    // 各ファイルを処理
    for (const fileName of mdFiles) {
      const filePath = path.join(decoyDir, fileName);
      const content = await fs.readFile(filePath, 'utf-8');
      
      const originalPromptId = PROMPT_ID_MAPPING[fileName];
      const title = TITLE_MAPPING[fileName];
      const description = DESCRIPTION_MAPPING[fileName];
      
      if (!originalPromptId) {
        console.warn(`⚠️  ${fileName} のマッピングが見つかりません`);
        continue;
      }
      
      // 既存のトラッププロンプトを確認
      const existing = await TrapPrompt.findOne({ originalPromptId });
      
      const trapPromptData = {
        originalPromptId,
        title: title || fileName.replace('.md', '').replace(/-/g, ' '),
        description: description || `${title}のトラッププロンプト`,
        content: content,
        decoyFileName: fileName,
        tags: ['bluelamp', 'trap', 'honeypot'],
        trapType: 'honeypot',
        isActive: true,
        metadata: {
          usageCount: Math.floor(Math.random() * 500) + 100,  // 100-600のランダム値
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // 過去30日のランダム
          updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)   // 過去7日のランダム
        }
      };
      
      if (existing) {
        // 更新
        await TrapPrompt.findByIdAndUpdate(existing._id, trapPromptData);
        console.log(`✅ 更新: ${title}`);
      } else {
        // 新規作成
        await TrapPrompt.create(trapPromptData);
        console.log(`✅ 作成: ${title}`);
      }
    }
    
    // 統計情報
    const totalTraps = await TrapPrompt.countDocuments();
    console.log(`\n📊 統計情報:`);
    console.log(`   総トラッププロンプト数: ${totalTraps}`);
    
    // 本物のプロンプトとの対応確認
    console.log('\n🔍 本物のプロンプトとの対応を確認中...');
    for (const [fileName, promptId] of Object.entries(PROMPT_ID_MAPPING)) {
      try {
        const realPrompt = await Prompt.findById(promptId);
        if (realPrompt) {
          console.log(`   ✓ ${TITLE_MAPPING[fileName]} → 本物のプロンプト「${realPrompt.title}」`);
        } else {
          console.log(`   ✗ ${TITLE_MAPPING[fileName]} → 対応する本物のプロンプトが見つかりません`);
        }
      } catch (error) {
        console.log(`   ✗ ${TITLE_MAPPING[fileName]} → ID形式エラー`);
      }
    }
    
    console.log('\n✨ トラッププロンプトのインポートが完了しました！');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    // 接続を閉じる
    await mongoose.disconnect();
    process.exit(0);
  }
}

// スクリプト実行
importTrapPrompts();