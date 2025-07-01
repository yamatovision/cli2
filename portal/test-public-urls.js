/**
 * 公開URLテストスクリプト
 */
const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

// BlueLampプロンプトの公開トークン一覧
const blueLampTokens = [
  { title: '🎯 BlueLamp オーケストレーター', token: 'a01c31cd5fae25ce6f9e932ab624a6c1' },
  { title: '★1 要件定義エンジニア', token: 'f22f9af6fa134d3c550cd0b196460d44' },
  { title: '★2 UI/UXデザイナー', token: '491aca0243b594df870ff2a0e2c55acf' },
  { title: '★3 データモデリングエンジニア', token: '322b217089692b7094296d1e7e8c8f04' },
  { title: '★4 システムアーキテクト', token: '34fa3d00f36bfab18f792df8afa740ac' },
  { title: '★5 実装コンサルタント', token: 'de801246ded4432b2a7dc6f42efb77e3' },
  { title: '★6 環境構築', token: '414e4d38adc1e2478ef58dfd76cd85c9' },
  { title: '★7 プロトタイプ実装', token: 'eb05b8a6413e66106b4b119c70c5999e' },
  { title: '★8 バックエンド実装', token: 'bde348d5df3305bf8fb1182725aab9ec' },
  { title: '★9 テスト・品質検証', token: '6a3df9f87fe84a693fce679215e4ccdc' },
  { title: '★10 API統合', token: 'ddf8c3f5fad4b124e88616c213bfeabf' },
  { title: '★11 デバッグ探偵', token: '3900bf2028a173fd6a80cc49f30ea7fe' },
  { title: '★12 デプロイスペシャリスト', token: 'cc66782acd2a10e4e759b26ac38657bc' },
  { title: '★13 GitHubマネージャー', token: '895feeaf0cae8c341d89822f57f8b462' },
  { title: '★14 TypeScriptマネージャー', token: '8fd2ed68b40276130ae5bca636bfe806' },
  { title: '★15 機能拡張プランナー', token: '32c3492101ad9450d4e0243423e42c1a' },
  { title: '★16 リファクタリングエキスパート', token: '28108a79bffb777b147af6dfa002fdfd' }
];

async function testPublicURLs() {
  console.log('=== BlueLamp公開URLテスト開始 ===');
  console.log(`総テスト対象: ${blueLampTokens.length}個のプロンプト\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const prompt of blueLampTokens) {
    try {
      const response = await axios.get(`${BASE_URL}/api/prompts/public/${prompt.token}`);
      console.log(`✅ ${prompt.title}`);
      console.log(`   URL: ${BASE_URL}/api/prompts/public/${prompt.token}`);
      console.log(`   実際のタイトル: ${response.data.title}`);
      console.log('');
      successCount++;
    } catch (error) {
      console.log(`❌ ${prompt.title}`);
      console.log(`   エラー: ${error.response?.status} ${error.response?.data?.message || error.message}`);
      console.log('');
      failCount++;
    }
  }
  
  console.log('=== テスト結果サマリー ===');
  console.log(`成功: ${successCount}個`);
  console.log(`失敗: ${failCount}個`);
  console.log(`成功率: ${((successCount / blueLampTokens.length) * 100).toFixed(1)}%`);
  
  if (successCount > 0) {
    console.log('\n=== 利用可能な公開URL例 ===');
    console.log(`${BASE_URL}/api/prompts/public/${blueLampTokens[0].token}`);
    console.log(`${BASE_URL}/api/prompts/public/${blueLampTokens[11].token} (★11 デバッグ探偵)`);
  }
  
  console.log('\n=== BlueLamp公開URLテスト完了 ===');
}

testPublicURLs().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('テスト実行エラー:', error);
  process.exit(1);
});