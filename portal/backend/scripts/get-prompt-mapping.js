/**
 * プロンプトマッピング取得スクリプト
 * 既存の公開プロンプトのIDとpublicTokenを取得し、
 * CLI側で使用するマッピングテーブルを生成する
 */
const mongoose = require('mongoose');
const Prompt = require('../models/prompt.model');

// 既存のpublicTokenリスト（bluelamp-prompt-urls.mdから）
const EXISTING_TOKENS = [
  'a01c31cd5fae25ce6f9e932ab624a6c1',  // #0 オーケストレーター
  'f22f9af6fa134d3c550cd0b196460d44',  // #1 要件定義エンジニア
  '491aca0243b594df870ff2a0e2c55acf',  // #2 UI/UXデザイナー
  '322b217089692b7094296d1e7e8c8f04',  // #3 データモデリングエンジニア
  '34fa3d00f36bfab18f792df8afa740ac',  // #4 システムアーキテクト
  'de801246ded4432b2a7dc6f42efb77e3',  // #5 実装コンサルタント
  '414e4d38adc1e2478ef58dfd76cd85c9',  // #6 環境構築
  'eb05b8a6413e66106b4b119c70c5999e',  // #7 プロトタイプ実装
  'bde348d5df3305bf8fb1182725aab9ec',  // #8 バックエンド実装
  '6a3df9f87fe84a693fce679215e4ccdc',  // #9 テスト・品質検証
  'ddf8c3f5fad4b124e88616c213bfeabf',  // #10 API統合
  '3900bf2028a173fd6a80cc49f30ea7fe',  // #11 デバッグ探偵
  'cc66782acd2a10e4e759b26ac38657bc',  // #12 デプロイスペシャリスト
  '895feeaf0cae8c341d89822f57f8b462',  // #13 GitHubマネージャー
  '8fd2ed68b40276130ae5bca636bfe806',  // #14 TypeScriptマネージャー
  '32c3492101ad9450d4e0243423e42c1a',  // #15 機能拡張プランナー
  '28108a79bffb777b147af6dfa002fdfd',  // #16 リファクタリングエキスパート
];

// ローカルファイル名のマッピング（推測）
const LOCAL_FILE_MAPPING = {
  'a01c31cd5fae25ce6f9e932ab624a6c1': 'orchestrator.j2',
  'f22f9af6fa134d3c550cd0b196460d44': 'requirements_engineer.j2',
  '491aca0243b594df870ff2a0e2c55acf': 'ui_ux_designer.j2',
  '322b217089692b7094296d1e7e8c8f04': 'data_modeling_engineer.j2',
  '34fa3d00f36bfab18f792df8afa740ac': 'system_architect.j2',
  'de801246ded4432b2a7dc6f42efb77e3': 'implementation_consultant.j2',
  '414e4d38adc1e2478ef58dfd76cd85c9': 'environment_setup.j2',
  'eb05b8a6413e66106b4b119c70c5999e': 'prototype_implementation.j2',
  'bde348d5df3305bf8fb1182725aab9ec': 'backend_implementation.j2',
  '6a3df9f87fe84a693fce679215e4ccdc': 'test_quality_verification.j2',
  'ddf8c3f5fad4b124e88616c213bfeabf': 'api_integration.j2',
  '3900bf2028a173fd6a80cc49f30ea7fe': 'debug_detective.j2',
  'cc66782acd2a10e4e759b26ac38657bc': 'deploy_specialist.j2',
  '895feeaf0cae8c341d89822f57f8b462': 'github_manager.j2',
  '8fd2ed68b40276130ae5bca636bfe806': 'typescript_manager.j2',
  '32c3492101ad9450d4e0243423e42c1a': 'feature_extension.j2',
  '28108a79bffb777b147af6dfa002fdfd': 'refactoring_expert.j2',
};

async function getPromptMapping() {
  try {
    // MongoDB接続 - 設定ファイルと同じ接続文字列を使用
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/GENIEMON?retryWrites=true&w=majority&appName=MotherPrompt-Cluster';
    await mongoose.connect(mongoUri);
    console.log('MongoDB接続成功');
    
    // 既存のプロンプトを取得
    const prompts = await Prompt.find({
      publicToken: { $in: EXISTING_TOKENS },
      isPublic: true,
      isArchived: false
    }).select('_id title publicToken createdAt');
    
    console.log(`\n=== プロンプトマッピング情報 ===`);
    console.log(`見つかったプロンプト数: ${prompts.length}/${EXISTING_TOKENS.length}`);
    
    // マッピングテーブル生成
    const mapping = {};
    const idMapping = {};
    
    prompts.forEach(prompt => {
      const localFile = LOCAL_FILE_MAPPING[prompt.publicToken];
      if (localFile) {
        mapping[localFile] = prompt._id.toString();
        idMapping[prompt._id.toString()] = {
          localFile,
          title: prompt.title,
          publicToken: prompt.publicToken,
          createdAt: prompt.createdAt
        };
      }
    });
    
    console.log('\n=== CLI側マッピングテーブル ===');
    console.log('// /cli/openhands/portal/prompt_mapping.py');
    console.log('PROMPT_MAPPING = {');
    Object.entries(mapping).forEach(([localFile, promptId]) => {
      console.log(`    '${localFile}': '${promptId}',`);
    });
    console.log('}');
    
    console.log('\n=== 逆マッピング（デバッグ用） ===');
    console.log('ID_TO_LOCAL = {');
    Object.entries(idMapping).forEach(([promptId, info]) => {
      console.log(`    '${promptId}': '${info.localFile}',  # ${info.title}`);
    });
    console.log('}');
    
    console.log('\n=== 詳細情報 ===');
    prompts.forEach(prompt => {
      const localFile = LOCAL_FILE_MAPPING[prompt.publicToken];
      console.log(`${prompt.title}:`);
      console.log(`  ID: ${prompt._id}`);
      console.log(`  PublicToken: ${prompt.publicToken}`);
      console.log(`  LocalFile: ${localFile || 'UNKNOWN'}`);
      console.log(`  Created: ${prompt.createdAt}`);
      console.log('');
    });
    
    // 見つからないトークンをチェック
    const foundTokens = prompts.map(p => p.publicToken);
    const missingTokens = EXISTING_TOKENS.filter(token => !foundTokens.includes(token));
    
    if (missingTokens.length > 0) {
      console.log('\n=== 見つからないトークン ===');
      missingTokens.forEach(token => {
        console.log(`Missing: ${token} (${LOCAL_FILE_MAPPING[token] || 'UNKNOWN'})`);
      });
    }
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB接続終了');
  }
}

// スクリプト実行
if (require.main === module) {
  getPromptMapping();
}

module.exports = { getPromptMapping };