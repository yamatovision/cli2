/**
 * Anthropicワークスペース作成をテストするスクリプト
 * 
 * 使用方法:
 * 1. ANTHROPIC_ADMIN_KEY環境変数を設定
 * 2. node test_workspace_creation.js を実行
 */

const axios = require('axios');
require('dotenv').config(); // .env ファイルから環境変数を読み込む

// テスト用のワークスペース名
const TEST_WORKSPACE_NAME = 'バイアウトチーム'; // テストしたいワークスペース名

// Anthropic API呼び出し関数
async function createAnthropicWorkspace(workspaceName) {
  console.log(`\n--- "${workspaceName}" という名前のワークスペースを作成します ---\n`);
  
  const adminKey = process.env.ANTHROPIC_ADMIN_KEY;
  
  if (!adminKey) {
    console.error('❌ ANTHROPIC_ADMIN_KEY 環境変数が設定されていません。');
    console.error('例: ANTHROPIC_ADMIN_KEY=sk-ant-api-... node test_workspace_creation.js');
    process.exit(1);
  }
  
  console.log('✅ ANTHROPIC_ADMIN_KEY を確認しました');
  
  try {
    // リクエストデータ
    const requestData = {
      name: workspaceName
    };
    
    console.log('📡 Anthropic APIにリクエストを送信中...');
    console.log(`リクエスト内容: ${JSON.stringify(requestData)}`);
    
    // APIリクエスト
    const response = await axios.post(
      'https://api.anthropic.com/v1/organizations/workspaces',
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': adminKey
        }
      }
    );
    
    // レスポンスを表示
    console.log('\n✅ ワークスペースが正常に作成されました！');
    console.log('レスポンス:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log(`\n🔗 Anthropicコンソールで確認する: https://console.anthropic.com/workspaces`);
    
    return response.data;
  } catch (error) {
    console.error('\n❌ ワークスペース作成に失敗しました');
    
    if (error.response) {
      console.error(`ステータスコード: ${error.response.status}`);
      console.error('エラーレスポンス:', error.response.data);
    } else if (error.request) {
      console.error('レスポンスがありませんでした');
      console.error(error.request);
    } else {
      console.error('エラー:', error.message);
    }
    
    // トラブルシューティング情報
    console.log('\n🔍 トラブルシューティング:');
    console.log('1. ANTHROPIC_ADMIN_KEY が正しいか確認してください');
    console.log('2. Anthropic APIのバージョンが正しいか確認してください');
    console.log('3. ネットワーク接続を確認してください');
    
    throw error;
  }
}

// メイン関数
async function main() {
  console.log('=== Anthropicワークスペース作成テスト ===');
  
  try {
    const result = await createAnthropicWorkspace(TEST_WORKSPACE_NAME);
    
    // 成功メッセージ
    console.log('\n🎉 テスト成功! ワークスペースが作成されました');
    console.log(`ワークスペース名: ${result.name}`);
    console.log(`ワークスペースID: ${result.id}`);
    console.log(`作成日時: ${result.created_at}`);
    
  } catch (error) {
    console.error('\n❌ テスト失敗');
  }
}

// スクリプト実行
main().catch(error => {
  console.error('予期しないエラーが発生しました:', error);
  process.exit(1);
});