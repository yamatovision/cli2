/**
 * simpleOrganization.controller.jsのワークスペース作成機能テストスクリプト
 * 
 * このスクリプトはコントローラーの実装を直接テストします。
 * モックリクエスト・レスポンスを使用して、バックエンドコードを検証します。
 */

// 必要なモジュールをロード
require('dotenv').config();
const mongoose = require('mongoose');
const SimpleOrganization = require('../portal/backend/models/simpleOrganization.model');
const SimpleUser = require('../portal/backend/models/simpleUser.model');

// コントローラーをインポート
const controller = require('../portal/backend/controllers/simpleOrganization.controller');

// モックレスポンス・リクエストの作成
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockRequest = (params = {}, body = {}, userId = null) => ({
  params,
  body,
  userId
});

// テスト設定
const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/appgenius_test';
const TEST_ORG_NAME = 'テスト組織';
const TEST_WORKSPACE_NAME = 'バイアウトチーム';
const TEST_DESCRIPTION = 'ワークスペース作成テスト用';

// MongoDB接続設定
async function connectDB() {
  try {
    console.log(`MongoDB (${TEST_DB_URI}) に接続中...`);
    await mongoose.connect(TEST_DB_URI);
    console.log('✅ MongoDB接続成功');
  } catch (error) {
    console.error('❌ MongoDB接続エラー:', error);
    process.exit(1);
  }
}

// テスト用データ作成
async function setupTestData() {
  console.log('\n--- テスト用データの準備 ---');
  
  try {
    // テスト用ユーザー作成
    const testUser = new SimpleUser({
      name: 'テストユーザー',
      email: 'test@example.com',
      password: 'password123',
      role: 'SuperAdmin',
      status: 'active'
    });
    
    await testUser.save();
    console.log(`✅ テストユーザー作成: ${testUser._id}`);
    
    // テスト用組織作成
    const testOrg = new SimpleOrganization({
      name: TEST_ORG_NAME,
      description: TEST_DESCRIPTION,
      workspaceName: TEST_WORKSPACE_NAME,
      createdBy: testUser._id,
      status: 'active'
    });
    
    await testOrg.save();
    console.log(`✅ テスト組織作成: ${testOrg._id}`);
    
    return {
      user: testUser,
      organization: testOrg
    };
  } catch (error) {
    console.error('❌ テストデータ作成エラー:', error);
    throw error;
  }
}

// テストデータ削除
async function cleanupTestData(userId, orgId) {
  console.log('\n--- テストデータのクリーンアップ ---');
  
  try {
    if (userId) {
      await SimpleUser.findByIdAndDelete(userId);
      console.log(`✅ テストユーザー削除: ${userId}`);
    }
    
    if (orgId) {
      await SimpleOrganization.findByIdAndDelete(orgId);
      console.log(`✅ テスト組織削除: ${orgId}`);
    }
  } catch (error) {
    console.error('❌ テストデータ削除エラー:', error);
  }
}

// コントローラーテスト
async function testWorkspaceCreation(userId, orgId) {
  console.log('\n--- ワークスペース作成機能テスト ---');
  
  // モックリクエスト・レスポンス作成
  const req = mockRequest({ id: orgId }, {}, userId);
  const res = mockResponse();
  
  console.log(`組織ID: ${orgId}, ユーザーID: ${userId} でテスト実行`);
  
  try {
    // ANTHROPIC_ADMIN_KEYの確認
    if (!process.env.ANTHROPIC_ADMIN_KEY) {
      console.warn('⚠️ ANTHROPIC_ADMIN_KEY が設定されていません。開発モード（モック）でテストします。');
    } else {
      console.log('✅ ANTHROPIC_ADMIN_KEY を確認しました');
    }
    
    // コントローラー関数実行
    await controller.createWorkspace(req, res);
    
    // レスポンスの検証
    console.log('ステータスコード:', res.status.mock.calls[0][0]);
    console.log('レスポンスデータ:', JSON.stringify(res.json.mock.calls[0][0], null, 2));
    
    const statusCode = res.status.mock.calls[0][0];
    const responseData = res.json.mock.calls[0][0];
    
    if (statusCode === 201 && responseData.success) {
      console.log('\n✅ テスト成功: ワークスペース作成APIは正常に動作しています');
      
      if (responseData.data) {
        console.log(`ワークスペースID: ${responseData.data.workspaceId}`);
        console.log(`ワークスペース名: ${responseData.data.workspaceName}`);
        
        if (responseData.data.isDevelopment) {
          console.log('⚠️ 注意: これは開発環境のモックレスポンスです。実際のワークスペースは作成されていません。');
        } else {
          console.log('🔗 Anthropicコンソールで確認: https://console.anthropic.com/workspaces');
        }
      }
    } else {
      console.error('\n❌ テスト失敗: ワークスペース作成APIでエラーが発生しました');
    }
  } catch (error) {
    console.error('❌ テスト実行エラー:', error);
  }
}

// メイン実行関数
async function main() {
  console.log('=== ワークスペース作成コントローラーテスト ===');
  let userId, orgId;
  
  try {
    // DBに接続
    await connectDB();
    
    // テストデータを作成
    const testData = await setupTestData();
    userId = testData.user._id;
    orgId = testData.organization._id;
    
    // コントローラーテスト実行
    await testWorkspaceCreation(userId, orgId);
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    // テスト後のクリーンアップ
    await cleanupTestData(userId, orgId);
    
    // DB接続を閉じる
    console.log('\n--- データベース接続を閉じています ---');
    await mongoose.disconnect();
    console.log('✅ MongoDB接続を閉じました');
  }
}

// スクリプト実行
main().catch(error => {
  console.error('予期しないエラーが発生しました:', error);
  process.exit(1);
});