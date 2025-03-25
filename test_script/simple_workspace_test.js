/**
 * シンプルなワークスペース作成テスト
 * 直接APIを呼び出さずにAPI形式だけをテストします
 */

require('dotenv').config();
const axios = require('axios');

// Anthropic APIのエンドポイント
const API_ENDPOINT = 'https://api.anthropic.com/v1/organizations/workspaces';

// テストデータ
const WORKSPACE_NAME = 'バイアウトチーム';

// APIキーを取得
const adminKey = process.env.ANTHROPIC_ADMIN_KEY;

// APIリクエスト構築のみ行い、実際には送信しない関数
async function buildWorkspaceCreationRequest() {
  console.log('=== ワークスペース作成リクエスト構築テスト ===');
  
  if (!adminKey) {
    console.error('❌ ANTHROPIC_ADMIN_KEY 環境変数が設定されていません');
    return null;
  }
  
  console.log(`✅ APIキーが設定されています: ${adminKey.substring(0, 10)}...`);
  
  // リクエストデータ
  const requestData = {
    name: WORKSPACE_NAME
  };
  
  // リクエスト設定
  const requestConfig = {
    method: 'post',
    url: API_ENDPOINT,
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': adminKey
    },
    data: requestData
  };
  
  console.log('\n--- リクエスト構築結果 ---');
  console.log('エンドポイント:', API_ENDPOINT);
  console.log('メソッド:', requestConfig.method);
  console.log('ヘッダー:');
  console.log('  Content-Type:', requestConfig.headers['Content-Type']);
  console.log('  anthropic-version:', requestConfig.headers['anthropic-version']);
  console.log('  x-api-key:', `${requestConfig.headers['x-api-key'].substring(0, 10)}...`);
  console.log('リクエストデータ:', JSON.stringify(requestData, null, 2));
  
  console.log('\n✅ リクエスト構築テスト完了');
  console.log('注意: 実際のAPIリクエストは送信されていません。');
  
  return requestConfig;
}

// 実行
buildWorkspaceCreationRequest().catch(error => {
  console.error('予期しないエラーが発生しました:', error);
});