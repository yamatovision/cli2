/**
 * プロンプトインポートスクリプト
 * 既存の公開URLからプロンプトを取得してデータベースに登録する
 */
const mongoose = require('mongoose');
const axios = require('axios');
const Prompt = require('../models/prompt.model');
const SimpleUser = require('../models/simpleUser.model');

// 既存のプロンプトURL情報
const PROMPT_URLS = [
  {
    id: 0,
    title: 'オーケストレーター',
    localFile: 'orchestrator.j2',
    url: 'http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/a01c31cd5fae25ce6f9e932ab624a6c1',
    publicToken: 'a01c31cd5fae25ce6f9e932ab624a6c1'
  },
  {
    id: 1,
    title: '要件定義エンジニア',
    localFile: 'requirements_engineer.j2',
    url: 'http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/f22f9af6fa134d3c550cd0b196460d44',
    publicToken: 'f22f9af6fa134d3c550cd0b196460d44'
  },
  {
    id: 2,
    title: 'UI/UXデザイナー',
    localFile: 'ui_ux_designer.j2',
    url: 'http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/491aca0243b594df870ff2a0e2c55acf',
    publicToken: '491aca0243b594df870ff2a0e2c55acf'
  },
  {
    id: 3,
    title: 'データモデリングエンジニア',
    localFile: 'data_modeling_engineer.j2',
    url: 'http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/322b217089692b7094296d1e7e8c8f04',
    publicToken: '322b217089692b7094296d1e7e8c8f04'
  },
  {
    id: 4,
    title: 'システムアーキテクト',
    localFile: 'system_architect.j2',
    url: 'http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/34fa3d00f36bfab18f792df8afa740ac',
    publicToken: '34fa3d00f36bfab18f792df8afa740ac'
  },
  {
    id: 5,
    title: '実装コンサルタント',
    localFile: 'implementation_consultant.j2',
    url: 'http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/de801246ded4432b2a7dc6f42efb77e3',
    publicToken: 'de801246ded4432b2a7dc6f42efb77e3'
  },
  {
    id: 6,
    title: '環境構築',
    localFile: 'environment_setup.j2',
    url: 'http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/414e4d38adc1e2478ef58dfd76cd85c9',
    publicToken: '414e4d38adc1e2478ef58dfd76cd85c9'
  },
  {
    id: 7,
    title: 'プロトタイプ実装',
    localFile: 'prototype_implementation.j2',
    url: 'http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/eb05b8a6413e66106b4b119c70c5999e',
    publicToken: 'eb05b8a6413e66106b4b119c70c5999e'
  },
  {
    id: 8,
    title: 'バックエンド実装',
    localFile: 'backend_implementation.j2',
    url: 'http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/bde348d5df3305bf8fb1182725aab9ec',
    publicToken: 'bde348d5df3305bf8fb1182725aab9ec'
  },
  {
    id: 9,
    title: 'テスト・品質検証',
    localFile: 'test_quality_verification.j2',
    url: 'http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/6a3df9f87fe84a693fce679215e4ccdc',
    publicToken: '6a3df9f87fe84a693fce679215e4ccdc'
  },
  {
    id: 10,
    title: 'API統合',
    localFile: 'api_integration.j2',
    url: 'http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/ddf8c3f5fad4b124e88616c213bfeabf',
    publicToken: 'ddf8c3f5fad4b124e88616c213bfeabf'
  },
  {
    id: 11,
    title: 'デバッグ探偵',
    localFile: 'debug_detective.j2',
    url: 'http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/3900bf2028a173fd6a80cc49f30ea7fe',
    publicToken: '3900bf2028a173fd6a80cc49f30ea7fe'
  },
  {
    id: 12,
    title: 'デプロイスペシャリスト',
    localFile: 'deploy_specialist.j2',
    url: 'http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/cc66782acd2a10e4e759b26ac38657bc',
    publicToken: 'cc66782acd2a10e4e759b26ac38657bc'
  },
  {
    id: 13,
    title: 'GitHubマネージャー',
    localFile: 'github_manager.j2',
    url: 'http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/895feeaf0cae8c341d89822f57f8b462',
    publicToken: '895feeaf0cae8c341d89822f57f8b462'
  },
  {
    id: 14,
    title: 'TypeScriptマネージャー',
    localFile: 'typescript_manager.j2',
    url: 'http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/8fd2ed68b40276130ae5bca636bfe806',
    publicToken: '8fd2ed68b40276130ae5bca636bfe806'
  },
  {
    id: 15,
    title: '機能拡張プランナー',
    localFile: 'feature_extension.j2',
    url: 'http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/32c3492101ad9450d4e0243423e42c1a',
    publicToken: '32c3492101ad9450d4e0243423e42c1a'
  },
  {
    id: 16,
    title: 'リファクタリングエキスパート',
    localFile: 'refactoring_expert.j2',
    url: 'http://bluelamp-235426778039.asia-northeast1.run.app/api/prompts/public/28108a79bffb777b147af6dfa002fdfd',
    publicToken: '28108a79bffb777b147af6dfa002fdfd'
  }
];

async function fetchPromptContent(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'BlueLamp-CLI-Import/1.0'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`プロンプト取得エラー (${url}):`, error.message);
    return null;
  }
}

async function createSystemUser() {
  try {
    // システムユーザーを作成または取得
    let systemUser = await SimpleUser.findOne({ email: 'system@bluelamp.dev' });
    
    if (!systemUser) {
      systemUser = new SimpleUser({
        name: 'System User',
        email: 'system@bluelamp.dev',
        password: 'system-user-no-login', // ログイン不可
        isActive: true
      });
      await systemUser.save();
      console.log('システムユーザーを作成しました');
    }
    
    return systemUser;
  } catch (error) {
    console.error('システムユーザー作成エラー:', error);
    throw error;
  }
}

async function importPrompts() {
  try {
    // MongoDB接続 - 設定ファイルと同じ接続文字列を使用
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/GENIEMON?retryWrites=true&w=majority&appName=MotherPrompt-Cluster';
    await mongoose.connect(mongoUri);
    console.log('MongoDB接続成功');
    
    // システムユーザーを作成
    const systemUser = await createSystemUser();
    
    console.log(`\\n=== プロンプトインポート開始 ===`);
    console.log(`対象プロンプト数: ${PROMPT_URLS.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const promptInfo of PROMPT_URLS) {
      try {
        console.log(`\\n[${promptInfo.id}] ${promptInfo.title} をインポート中...`);
        
        // 既存チェック
        const existing = await Prompt.findOne({ publicToken: promptInfo.publicToken });
        if (existing) {
          console.log(`  → スキップ（既存）: ${existing._id}`);
          continue;
        }
        
        // プロンプト内容を取得
        const content = await fetchPromptContent(promptInfo.url);
        if (!content) {
          console.log(`  → エラー: プロンプト内容の取得に失敗`);
          errorCount++;
          continue;
        }
        
        // プロンプトを作成
        const prompt = new Prompt({
          title: promptInfo.title,
          description: `BlueLamp専門エージェント: ${promptInfo.title}`,
          content: content,
          tags: ['bluelamp', 'agent', 'system'],
          ownerId: systemUser._id,
          isPublic: true,
          isArchived: false,
          publicToken: promptInfo.publicToken,
          usageCount: 0
        });
        
        await prompt.save();
        console.log(`  → 成功: ${prompt._id}`);
        successCount++;
        
      } catch (error) {
        console.error(`  → エラー: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\\n=== インポート完了 ===`);
    console.log(`成功: ${successCount}件`);
    console.log(`エラー: ${errorCount}件`);
    
    // 結果確認
    const totalPrompts = await Prompt.countDocuments();
    const publicPrompts = await Prompt.countDocuments({ isPublic: true });
    console.log(`\\n現在のプロンプト数: ${totalPrompts} (公開: ${publicPrompts})`);
    
  } catch (error) {
    console.error('インポートエラー:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\\nMongoDB接続終了');
  }
}

// スクリプト実行
if (require.main === module) {
  importPrompts();
}

module.exports = { importPrompts };