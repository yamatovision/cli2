/**
 * ワークスペース作成コントローラーの直接テスト
 * バックエンドサーバーを起動せずにコントローラーを直接テストします
 */

// 環境変数をロード
require('dotenv').config();

// モックレスポンス・リクエストオブジェクト
class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.data = null;
    this.headers = {};
  }
  
  status(code) {
    this.statusCode = code;
    return this;
  }
  
  json(data) {
    this.data = data;
    console.log(`[Response] Status: ${this.statusCode}, Data:`, JSON.stringify(data, null, 2));
    return this;
  }
  
  setHeader(name, value) {
    this.headers[name] = value;
    return this;
  }
}

class MockRequest {
  constructor(params = {}, body = {}, userId = 'mock-user-id') {
    this.params = params;
    this.body = body;
    this.userId = userId;
  }
}

// テスト関数
async function testWorkspaceCreation() {
  try {
    console.log('=== ワークスペース作成コントローラー直接テスト ===');
    console.log('環境変数:');
    console.log('- NODE_ENV:', process.env.NODE_ENV || '未設定');
    console.log('- ANTHROPIC_ADMIN_KEY:', process.env.ANTHROPIC_ADMIN_KEY ? '設定済み' : '未設定');
    
    // モジュールをロード
    console.log('\n--- モジュールロード ---');
    
    // モックモンゴースモデル
    const mockOrganization = {
      _id: 'mock-org-id',
      name: 'テスト組織',
      workspaceName: 'バイアウトチーム',
      save: async () => { console.log('[DB] 組織を保存'); return true; }
    };
    
    const mockUser = {
      _id: 'mock-user-id',
      isSuperAdmin: () => true,
      isAdmin: () => true
    };
    
    // コントローラー関数のモックテスト
    console.log('\n--- コントローラーテスト ---');
    
    // モックリクエスト・レスポンスを作成
    const req = new MockRequest({ id: 'mock-org-id' });
    const res = new MockResponse();
    
    // モックデータベース関数
    const findById = async (id) => {
      console.log(`[DB] ID: ${id} でオブジェクトを検索`);
      if (id === 'mock-org-id') return mockOrganization;
      if (id === 'mock-user-id') return mockUser;
      return null;
    };
    
    // コントローラー関数の手動呼び出し
    console.log('\n手動でコントローラーロジックを実行:');
    
    try {
      // コントローラーロジックをシミュレート
      
      // 1. 組織取得
      const organization = await findById('mock-org-id');
      console.log('組織データ:', organization ? '取得成功' : '取得失敗');
      
      // 2. ユーザー権限チェック
      const user = await findById('mock-user-id');
      console.log('ユーザーデータ:', user ? '取得成功' : '取得失敗');
      
      // 3. ワークスペース名チェック
      if (!organization.workspaceName) {
        console.error('ワークスペース名が設定されていません');
        return res.status(400).json({
          success: false,
          message: 'ワークスペース名が設定されていません'
        });
      }
      
      // 4. API呼び出し
      console.log('\n--- API呼び出しシミュレーション ---');
      
      // 開発環境判定
      if (process.env.NODE_ENV !== 'production' || !process.env.ANTHROPIC_ADMIN_KEY) {
        console.log('開発モード: モックレスポンスを使用');
        
        return res.status(201).json({
          success: true,
          message: 'ワークスペースが正常に作成されました (開発モード)',
          data: {
            workspaceId: organization.workspaceName,
            workspaceName: organization.workspaceName,
            organization: organization.name,
            isDevelopment: true
          }
        });
      }
      
      // 本番環境: 実際のAPI呼び出し
      console.log('本番環境: Anthropic APIを呼び出します');
      
      const axios = require('axios');
      
      // リクエストデータ
      const requestData = {
        name: organization.workspaceName
      };
      
      // APIリクエスト
      const anthropicResponse = await axios.post(
        'https://api.anthropic.com/v1/organizations/workspaces',
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
            'x-api-key': process.env.ANTHROPIC_ADMIN_KEY
          }
        }
      );
      
      console.log('API応答:', anthropicResponse.data);
      
      // 組織データ更新
      organization.workspaceId = anthropicResponse.data.id;
      await organization.save();
      
      // 結果返却
      return res.status(201).json({
        success: true,
        message: 'ワークスペースが正常に作成されました',
        data: {
          workspaceId: anthropicResponse.data.id,
          workspaceName: anthropicResponse.data.name,
          organization: organization.name,
          createdAt: anthropicResponse.data.created_at
        }
      });
      
    } catch (error) {
      console.error('\n--- エラー発生 ---');
      console.error('エラータイプ:', error.constructor.name);
      console.error('エラーメッセージ:', error.message);
      
      if (error.response) {
        console.error('APIレスポンスエラー:');
        console.error('ステータス:', error.response.status);
        console.error('データ:', error.response.data);
      }
      
      return res.status(500).json({
        success: false,
        message: 'ワークスペース作成に失敗しました',
        error: error.message
      });
    }
  } catch (error) {
    console.error('テスト実行エラー:', error);
  }
}

// テスト実行
console.log('テスト開始');
testWorkspaceCreation().catch(console.error);