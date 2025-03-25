/**
 * 本番環境用ワークスペース作成テストスクリプト
 * 
 * 実際の本番環境に近い条件でワークスペース作成をテストします。
 * NODE_ENV=production に設定して実行します。
 */

require('dotenv').config();
const axios = require('axios');

// 本番環境モードを強制設定
process.env.NODE_ENV = 'production';

// テスト設定
const WORKSPACE_NAME = 'バイアウトチーム';

// Anthropic APIテスト
async function testAnthropicWorkspaceCreation() {
  console.log('=== 本番環境ワークスペース作成テスト ===');
  console.log('環境:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- ANTHROPIC_ADMIN_KEY:', process.env.ANTHROPIC_ADMIN_KEY ? '設定済み' : '未設定');
  
  if (!process.env.ANTHROPIC_ADMIN_KEY) {
    console.error('❌ テストを続行できません: ANTHROPIC_ADMIN_KEY が設定されていません');
    console.log('ANTHROPIC_ADMIN_KEY=<APIキー> node prod_workspace_test.js のように実行してください');
    process.exit(1);
  }
  
  // リクエストデータ
  const requestData = {
    name: WORKSPACE_NAME
  };
  
  try {
    console.log('\n--- Anthropic API 直接呼び出しテスト ---');
    console.log('リクエスト送信先: https://api.anthropic.com/v1/organizations/workspaces');
    console.log('リクエストボディ:', JSON.stringify(requestData));
    
    // APIリクエスト送信
    const apiResponse = await axios.post(
      'https://api.anthropic.com/v1/organizations/workspaces',
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': process.env.ANTHROPIC_ADMIN_KEY
        },
        timeout: 10000 // 10秒タイムアウト
      }
    );
    
    console.log('\n✅ API呼び出し成功:');
    console.log('ステータスコード:', apiResponse.status);
    console.log('レスポンスデータ:', JSON.stringify(apiResponse.data, null, 2));
    
    // 追加情報
    console.log('\n--- 正常動作確認 ---');
    console.log('1. ワークスペースが作成されました');
    console.log('2. この結果から、APIキーが正常に動作していることが確認できました');
    console.log('3. 本番環境でも同様の設定で動作するはずです');
    console.log('\n🔗 Anthropicコンソールで確認: https://console.anthropic.com/workspaces');
    
    return true;
  } catch (error) {
    console.error('\n❌ API呼び出しエラー:');
    
    if (error.response) {
      // API応答エラー
      console.error('ステータスコード:', error.response.status);
      console.error('レスポンスデータ:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('\n--- 認証エラー診断 ---');
        console.error('1. APIキーが有効であることを確認してください');
        console.error('2. APIキーに必要な権限（Admin権限）があることを確認してください');
        console.error('3. キーの先頭が "sk-ant-admin" で始まるAdminキーであることを確認してください');
      }
    } else if (error.request) {
      // リクエストは送信されたがレスポンスがない
      console.error('リクエストエラー: レスポンスがありません');
      console.error('ネットワーク接続またはタイムアウトの問題が考えられます');
    } else {
      // リクエスト設定エラー
      console.error('エラーメッセージ:', error.message);
    }
    
    console.error('\n--- 本番環境の問題解決ガイド ---');
    console.error('1. 本番環境で NODE_ENV=production が設定されていることを確認してください');
    console.error('2. 本番環境で ANTHROPIC_ADMIN_KEY が正しく設定されていることを確認してください');
    console.error('3. ネットワーク制限がなく、APIエンドポイントに接続できることを確認してください');
    
    return false;
  }
}

// 実行
testAnthropicWorkspaceCreation().catch(error => {
  console.error('予期しないエラー:', error);
});