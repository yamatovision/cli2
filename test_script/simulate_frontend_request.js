/**
 * フロントエンドからのリクエストをシミュレートするテストスクリプト
 * 実際のUIからAPIを呼び出す過程を再現します
 */
require('dotenv').config();
const axios = require('axios');

// テスト設定
const API_BASE_URL = 'http://localhost:5000/api'; // バックエンドサーバーURL
const TEST_ORG_ID = 'mock-org-id'; // テスト用組織ID (実際には実在する組織IDに置き換える)
const TEST_WORKSPACE_NAME = 'バイアウトチーム';

// シミュレーション用関数
async function simulateFrontendFlow() {
  console.log('=== フロントエンドリクエストシミュレーション ===');
  
  try {
    console.log('\n--- 1. フロントエンドでフォームに入力 ---');
    console.log('ワークスペース名:', TEST_WORKSPACE_NAME);
    
    console.log('\n--- 2. 組織データを取得（実際のUIでは自動で行われる） ---');
    console.log('GET', `/simple/organizations/${TEST_ORG_ID}`);
    console.log('組織データを取得しました（シミュレーション）');
    
    console.log('\n--- 3. ワークスペース名を更新 ---');
    console.log('PUT', `/simple/organizations/${TEST_ORG_ID}`);
    console.log('リクエストボディ:');
    console.log(JSON.stringify({
      name: 'テスト組織',
      description: 'テスト用組織',
      workspaceName: TEST_WORKSPACE_NAME
    }, null, 2));
    console.log('組織を更新しました（シミュレーション）');
    
    console.log('\n--- 4. ワークスペース作成APIを呼び出し ---');
    console.log('POST', `/simple/organizations/${TEST_ORG_ID}/create-workspace`);
    
    // 実際のAPI呼び出しをシミュレート
    try {
      console.log('実際のAPI呼び出しをエミュレート:');
      console.log('Anthropic APIに以下のリクエストを送信します:');
      console.log('POST https://api.anthropic.com/v1/organizations/workspaces');
      console.log('ヘッダー:');
      console.log('  Content-Type: application/json');
      console.log('  anthropic-version: 2023-06-01');
      console.log('  x-api-key: ********');
      console.log('ボディ:');
      console.log(JSON.stringify({ name: TEST_WORKSPACE_NAME }, null, 2));
      
      // 本番呼び出しの代わりに直接APIを呼び出す（テスト用）
      if (process.env.ANTHROPIC_ADMIN_KEY) {
        console.log('\n直接Anthropic APIを呼び出します...');
        
        const response = await axios.post(
          'https://api.anthropic.com/v1/organizations/workspaces',
          { name: TEST_WORKSPACE_NAME },
          {
            headers: {
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01',
              'x-api-key': process.env.ANTHROPIC_ADMIN_KEY
            }
          }
        );
        
        console.log('API呼び出し成功:');
        console.log('ステータス:', response.status);
        console.log('レスポンス:', JSON.stringify(response.data, null, 2));
        
        console.log('\n--- 5. ワークスペース作成成功 ---');
        console.log('フロントエンドでの表示:');
        console.log('✅ ワークスペースが正常に作成されました');
        console.log(`ワークスペース名: ${response.data.name}`);
        console.log(`ワークスペースID: ${response.data.id}`);
        
        return {
          success: true,
          data: response.data
        };
      } else {
        console.log('\n--- APIキーがないためモックレスポンスを使用 ---');
        console.log('✅ ワークスペース作成に成功しました（モックレスポンス）');
        
        return {
          success: true,
          data: {
            id: 'mock-workspace-id',
            name: TEST_WORKSPACE_NAME
          }
        };
      }
    } catch (error) {
      console.error('\n--- API呼び出しエラー ---');
      
      if (error.response) {
        console.error('ステータス:', error.response.status);
        console.error('レスポンスデータ:', JSON.stringify(error.response.data, null, 2));
        
        console.log('\n--- API呼び出し失敗時のフロントエンド動作 ---');
        console.log('❌ ワークスペースの作成に失敗しました');
        console.log(`エラー: ${error.response.data?.error || 'Unknown error'}`);
      } else {
        console.error('エラーメッセージ:', error.message);
        
        console.log('\n--- API呼び出し失敗時のフロントエンド動作 ---');
        console.log('❌ ワークスペースの作成に失敗しました');
        console.log(`エラー: ${error.message}`);
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  } catch (error) {
    console.error('シミュレーション実行エラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// シミュレーション実行
simulateFrontendFlow().catch(console.error);