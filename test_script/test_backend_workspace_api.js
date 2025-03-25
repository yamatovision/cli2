/**
 * バックエンドAPIを使用したワークスペース作成のエンドツーエンドテスト
 * 
 * このスクリプトは実際のバックエンドサーバーに対してAPI呼び出しを行い、
 * ワークスペース作成機能が正しく動作するかを確認します。
 */

const axios = require('axios');
require('dotenv').config();

// テスト設定
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const TEST_WORKSPACE_NAME = 'バイアウトチーム';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'password123';

// 認証トークンを保持する変数
let authToken = null;
let organizationId = null;

// APIクライアント作成関数
function createApiClient() {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  // 認証トークンがあれば、それをヘッダーに追加
  if (authToken) {
    client.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  }
  
  return client;
}

// ログイン処理
async function login() {
  console.log('\n--- ログイン処理 ---');
  console.log(`APIサーバー: ${API_BASE_URL}`);
  console.log(`ユーザー: ${TEST_USER_EMAIL}`);
  
  try {
    const apiClient = createApiClient();
    const response = await apiClient.post('/simple/auth/login', {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    // 認証トークンを保存
    authToken = response.data.token;
    console.log('✅ ログイン成功');
    console.log('認証トークン:', authToken?.substring(0, 10) + '...');
    
    return true;
  } catch (error) {
    console.error('❌ ログイン失敗:');
    
    if (error.response) {
      console.error(`ステータス: ${error.response.status}`);
      console.error('エラーレスポンス:', error.response.data);
    } else {
      console.error('エラー:', error.message);
    }
    
    return false;
  }
}

// 組織一覧取得
async function getOrganizations() {
  console.log('\n--- 組織一覧の取得 ---');
  
  try {
    const apiClient = createApiClient();
    const response = await apiClient.get('/simple/organizations');
    
    const organizations = response.data.data;
    console.log(`✅ ${organizations.length}件の組織を取得しました`);
    
    // 組織が存在する場合、最初の組織を選択
    if (organizations.length > 0) {
      organizationId = organizations[0]._id;
      console.log(`組織ID: ${organizationId}, 名称: ${organizations[0].name}`);
      
      if (organizations[0].workspaceName) {
        console.log(`現在のワークスペース名: ${organizations[0].workspaceName}`);
      }
      
      return organizations[0];
    } else {
      console.log('⚠️ 組織が見つかりません。テスト実行前に組織を作成してください。');
      return null;
    }
  } catch (error) {
    console.error('❌ 組織一覧取得失敗:');
    
    if (error.response) {
      console.error(`ステータス: ${error.response.status}`);
      console.error('エラーレスポンス:', error.response.data);
    } else {
      console.error('エラー:', error.message);
    }
    
    return null;
  }
}

// ワークスペース名の更新
async function updateWorkspaceName(orgId, newName) {
  console.log(`\n--- ワークスペース名の更新 (${newName}) ---`);
  
  try {
    const apiClient = createApiClient();
    const organization = await getOrganization(orgId);
    
    if (!organization) {
      console.error('❌ 組織情報を取得できませんでした');
      return false;
    }
    
    const response = await apiClient.put(`/simple/organizations/${orgId}`, {
      name: organization.name,
      description: organization.description || '',
      workspaceName: newName
    });
    
    if (response.data.success) {
      console.log('✅ ワークスペース名の更新に成功しました');
      return true;
    } else {
      console.error('❌ ワークスペース名の更新に失敗しました:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ ワークスペース名の更新時にエラーが発生しました:');
    
    if (error.response) {
      console.error(`ステータス: ${error.response.status}`);
      console.error('エラーレスポンス:', error.response.data);
    } else {
      console.error('エラー:', error.message);
    }
    
    return false;
  }
}

// 組織情報取得
async function getOrganization(orgId) {
  try {
    const apiClient = createApiClient();
    const response = await apiClient.get(`/simple/organizations/${orgId}`);
    
    if (response.data.success) {
      // API getSimpleOrganization は organization, apiKeys, members を含む構造を返す
      const orgData = response.data.data.organization || response.data.data;
      return orgData;
    }
    
    return null;
  } catch (error) {
    console.error('組織情報取得エラー:', error.message);
    return null;
  }
}

// ワークスペース作成テスト
async function testCreateWorkspace(orgId) {
  console.log('\n--- ワークスペース作成テスト ---');
  
  try {
    const apiClient = createApiClient();
    const response = await apiClient.post(`/simple/organizations/${orgId}/create-workspace`);
    
    console.log('ステータス:', response.status);
    console.log('レスポンス:', response.data);
    
    if (response.data.success) {
      console.log('\n✅ ワークスペース作成に成功しました');
      
      if (response.data.data) {
        console.log(`ワークスペースID: ${response.data.data.workspaceId}`);
        console.log(`ワークスペース名: ${response.data.data.workspaceName}`);
        
        if (response.data.data.isDevelopment) {
          console.log('⚠️ 注意: これは開発環境のモックレスポンスです。実際のワークスペースは作成されていません。');
        } else {
          console.log('🔗 Anthropicコンソールで確認: https://console.anthropic.com/workspaces');
        }
      }
      
      return true;
    } else {
      console.error('❌ ワークスペース作成に失敗しました:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ ワークスペース作成API呼び出しに失敗しました:');
    
    if (error.response) {
      console.error(`ステータス: ${error.response.status}`);
      console.error('エラーレスポンス:', error.response.data);
    } else {
      console.error('エラー:', error.message);
    }
    
    return false;
  }
}

// メイン関数
async function main() {
  console.log('=== ワークスペース作成APIテスト ===');
  
  try {
    // ANTHROPIC_ADMIN_KEYの確認
    if (!process.env.ANTHROPIC_ADMIN_KEY) {
      console.warn('⚠️ バックエンドサーバーの環境変数に ANTHROPIC_ADMIN_KEY が設定されていない可能性があります。');
      console.warn('   ワークスペースは開発モード（モック）で作成される可能性があります。');
    }
    
    // ログイン
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.error('❌ ログインに失敗しました。テストを終了します。');
      return;
    }
    
    // 組織一覧取得
    const organization = await getOrganizations();
    if (!organization) {
      console.error('❌ 組織情報の取得に失敗しました。テストを終了します。');
      return;
    }
    
    // ワークスペース名を更新
    const updateSuccess = await updateWorkspaceName(organizationId, TEST_WORKSPACE_NAME);
    if (!updateSuccess) {
      console.warn('⚠️ ワークスペース名の更新に失敗しましたが、テストを続行します。');
    }
    
    // ワークスペース作成テスト
    await testCreateWorkspace(organizationId);
    
  } catch (error) {
    console.error('予期しないエラーが発生しました:', error);
  }
}

// スクリプト実行
main().catch(error => {
  console.error('予期しないエラーが発生しました:', error);
  process.exit(1);
});