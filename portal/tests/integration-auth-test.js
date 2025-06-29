/**
 * 認証システム総合テスト
 * 実際のMongoDB環境を使用して認証フロー全体をテストします
 */

const axios = require('axios');
const mongoose = require('mongoose');
const SimpleUser = require('../backend/models/simpleUser.model');
const dbConfig = require('../backend/config/db.config');

// テスト設定
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000/api/simple',
  testUsers: [
    {
      email: 'test-integration@example.com',
      password: 'TestPassword123!',
      name: 'Integration Test User'
    }
  ],
  timeout: 30000 // 30秒タイムアウト
};

class AuthIntegrationTest {
  constructor() {
    this.testResults = [];
    this.cleanup = [];
    this.axios = axios.create({
      baseURL: TEST_CONFIG.baseURL,
      timeout: TEST_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * テスト結果を記録
   */
  logResult(testName, success, details = '', error = null) {
    const result = {
      test: testName,
      success,
      details,
      error: error ? error.message : null,
      timestamp: new Date().toISOString()
    };
    this.testResults.push(result);
    
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}`);
    if (details) console.log(`   詳細: ${details}`);
    if (error) console.log(`   エラー: ${error.message}`);
  }

  /**
   * データベース接続テスト
   */
  async testDatabaseConnection() {
    try {
      await mongoose.connect(dbConfig.url, dbConfig.options);
      this.logResult('データベース接続', true, 'MongoDB接続成功');
      return true;
    } catch (error) {
      this.logResult('データベース接続', false, 'MongoDB接続失敗', error);
      return false;
    }
  }

  /**
   * テストユーザーのクリーンアップ
   */
  async cleanupTestUsers() {
    try {
      for (const user of TEST_CONFIG.testUsers) {
        await SimpleUser.deleteMany({ email: user.email });
      }
      this.logResult('テストユーザークリーンアップ', true, 'テストユーザーを削除');
    } catch (error) {
      this.logResult('テストユーザークリーンアップ', false, 'クリーンアップ失敗', error);
    }
  }

  /**
   * ユーザー登録テスト
   */
  async testUserRegistration() {
    try {
      const testUser = TEST_CONFIG.testUsers[0];
      
      const response = await this.axios.post('/auth/register', {
        name: testUser.name,
        email: testUser.email,
        password: testUser.password
      });

      if (response.data.success && response.data.data.accessToken) {
        this.logResult('ユーザー登録', true, 
          `ユーザー ${testUser.email} の登録成功`);
        
        // クリーンアップ用に記録
        this.cleanup.push(() => SimpleUser.deleteOne({ email: testUser.email }));
        
        return response.data;
      } else {
        throw new Error('登録レスポンスが無効');
      }
    } catch (error) {
      if (error.response?.status === 400 && 
          error.response?.data?.message?.includes('既に使用されています')) {
        this.logResult('ユーザー登録', true, 'ユーザーは既に存在（スキップ）');
        return null;
      }
      this.logResult('ユーザー登録', false, 'ユーザー登録失敗', error);
      throw error;
    }
  }

  /**
   * ログインテスト
   */
  async testLogin() {
    try {
      const testUser = TEST_CONFIG.testUsers[0];
      
      const response = await this.axios.post('/auth/login', {
        email: testUser.email,
        password: testUser.password,
        clientType: 'portal'
      });

      if (response.data.success && response.data.data.accessToken) {
        this.logResult('ログイン', true, 
          `ユーザー ${testUser.email} のログイン成功`);
        return response.data;
      } else {
        throw new Error('ログインレスポンスが無効');
      }
    } catch (error) {
      this.logResult('ログイン', false, 'ログイン失敗', error);
      throw error;
    }
  }

  /**
   * 認証チェックテスト
   */
  async testAuthCheck(authData) {
    try {
      console.log('認証チェック: トークンの確認', {
        hasAccessToken: !!authData.data.accessToken,
        tokenLength: authData.data.accessToken ? authData.data.accessToken.length : 0,
        tokenStart: authData.data.accessToken ? authData.data.accessToken.substring(0, 20) + '...' : 'なし'
      });

      const response = await this.axios.get('/auth/check', {
        headers: {
          'Authorization': `Bearer ${authData.data.accessToken}`
        }
      });

      if (response.data.success && response.data.data.user) {
        this.logResult('認証チェック', true, 
          `ユーザー認証確認成功: ${response.data.data.user.email}`);
        return response.data;
      } else {
        throw new Error('認証チェックレスポンスが無効');
      }
    } catch (error) {
      console.log('認証チェック詳細エラー:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      
      this.logResult('認証チェック', false, 
        `HTTP ${error.response?.status}: ${error.response?.data?.message || error.message}`, error);
      throw error;
    }
  }

  /**
   * 重複ログインテスト（同じクライアントタイプ）
   */
  async testDuplicateLogin() {
    try {
      const testUser = TEST_CONFIG.testUsers[0];
      
      // 最初のログイン
      const firstLogin = await this.axios.post('/auth/login', {
        email: testUser.email,
        password: testUser.password,
        clientType: 'portal'
      });

      if (!firstLogin.data.success) {
        throw new Error('最初のログインが失敗');
      }

      // テスト環境では即座に重複ログイン可能

      // 2回目のログイン（同じクライアントタイプ）
      try {
        const secondLogin = await this.axios.post('/auth/login', {
          email: testUser.email,
          password: testUser.password,
          clientType: 'portal'
        });

        // セッションタイムアウト機能により、2回目も成功するはず
        if (secondLogin.data.success) {
          this.logResult('重複ログイン', true, 
            '古いセッションが自動クリアされ、新規ログイン成功');
        } else {
          throw new Error('2回目のログインが失敗');
        }
      } catch (error) {
        if (error.response?.status === 409 && 
            error.response?.data?.code === 'ACTIVE_SESSION_EXISTS') {
          this.logResult('重複ログイン', false, 
            'セッション競合エラーが発生（修正が必要）', error);
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.logResult('重複ログイン', false, '重複ログインテスト失敗', error);
    }
  }

  /**
   * 強制ログインテスト
   */
  async testForceLogin() {
    try {
      const testUser = TEST_CONFIG.testUsers[0];
      
      const response = await this.axios.post('/auth/force-login', {
        email: testUser.email,
        password: testUser.password,
        forceLogin: true
      });

      if (response.data.success && response.data.data.accessToken) {
        this.logResult('強制ログイン', true, 
          `強制ログイン成功: ${response.data.previousSessionTerminated ? '前セッション終了' : '新規セッション'}`);
        return response.data;
      } else {
        throw new Error('強制ログインレスポンスが無効');
      }
    } catch (error) {
      this.logResult('強制ログイン', false, '強制ログイン失敗', error);
      throw error;
    }
  }

  /**
   * トークンリフレッシュテスト
   */
  async testTokenRefresh(authData) {
    try {
      const response = await this.axios.post('/auth/refresh-token', {
        refreshToken: authData.data.refreshToken
      });

      if (response.data.success && response.data.data.accessToken) {
        this.logResult('トークンリフレッシュ', true, 
          'リフレッシュトークンによる新規アクセストークン取得成功');
        return response.data;
      } else {
        throw new Error('トークンリフレッシュレスポンスが無効');
      }
    } catch (error) {
      this.logResult('トークンリフレッシュ', false, 'トークンリフレッシュ失敗', error);
      throw error;
    }
  }

  /**
   * ログアウトテスト
   */
  async testLogout(authData) {
    try {
      console.log('ログアウト: リフレッシュトークンの確認', {
        hasRefreshToken: !!authData.data.refreshToken,
        tokenLength: authData.data.refreshToken ? authData.data.refreshToken.length : 0
      });

      const response = await this.axios.post('/auth/logout', {
        refreshToken: authData.data.refreshToken,
        clientType: 'portal'
      });

      if (response.data.success) {
        this.logResult('ログアウト', true, 'ログアウト成功');
        return response.data;
      } else {
        throw new Error('ログアウトレスポンスが無効');
      }
    } catch (error) {
      console.log('ログアウト詳細エラー:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      
      this.logResult('ログアウト', false, 
        `HTTP ${error.response?.status}: ${error.response?.data?.message || error.message}`, error);
      throw error;
    }
  }

  /**
   * セッション情報確認テスト
   */
  async testSessionInfo() {
    try {
      const users = await SimpleUser.find(
        { email: { $in: TEST_CONFIG.testUsers.map(u => u.email) } },
        'email activeSessions activeSession'
      ).lean();

      for (const user of users) {
        const activeSessionCount = user.activeSessions ? user.activeSessions.length : 0;
        const hasLegacySession = user.activeSession && user.activeSession.sessionId;
        
        this.logResult('セッション情報確認', true, 
          `${user.email}: アクティブセッション ${activeSessionCount}個, ` +
          `レガシーセッション ${hasLegacySession ? 'あり' : 'なし'}`);
      }
    } catch (error) {
      this.logResult('セッション情報確認', false, 'セッション情報取得失敗', error);
    }
  }

  /**
   * 全体テスト実行
   */
  async runAllTests() {
    console.log('🚀 認証システム総合テスト開始');
    console.log('=' .repeat(60));

    try {
      // データベース接続
      const dbConnected = await this.testDatabaseConnection();
      if (!dbConnected) {
        throw new Error('データベース接続に失敗しました');
      }

      // 事前クリーンアップ
      await this.cleanupTestUsers();

      // テストユーザー登録
      await this.testUserRegistration();

      // ログインテスト
      const loginResult = await this.testLogin();

      // 認証チェック
      await this.testAuthCheck(loginResult);

      // 重複ログインテスト
      await this.testDuplicateLogin();

      // 強制ログイン
      const forceLoginResult = await this.testForceLogin();

      // トークンリフレッシュ
      const refreshResult = await this.testTokenRefresh(forceLoginResult);

      // セッション情報確認
      await this.testSessionInfo();

      // ログアウト
      await this.testLogout(refreshResult);

      // 最終セッション確認
      await this.testSessionInfo();

    } catch (error) {
      console.error('❌ テスト実行中にエラーが発生:', error.message);
    } finally {
      // クリーンアップ実行
      for (const cleanupFn of this.cleanup) {
        try {
          await cleanupFn();
        } catch (error) {
          console.warn('クリーンアップエラー:', error.message);
        }
      }

      // データベース切断
      await mongoose.disconnect();
    }

    // 結果サマリー
    this.printSummary();
  }

  /**
   * テスト結果サマリー表示
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 テスト結果サマリー');
    console.log('='.repeat(60));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    console.log(`総テスト数: ${totalTests}`);
    console.log(`成功: ${passedTests} ✅`);
    console.log(`失敗: ${failedTests} ❌`);
    console.log(`成功率: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`);

    if (failedTests > 0) {
      console.log('\n❌ 失敗したテスト:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.test}: ${r.error || r.details}`);
        });
    }

    // 詳細結果をJSONファイルに出力
    const fs = require('fs');
    const resultFile = `./tests/integration-test-results-${Date.now()}.json`;
    fs.writeFileSync(resultFile, JSON.stringify(this.testResults, null, 2));
    console.log(`\n📄 詳細結果: ${resultFile}`);
  }
}

// メイン実行
async function main() {
  const tester = new AuthIntegrationTest();
  await tester.runAllTests();
}

// スクリプトが直接実行された場合のみテストを実行
if (require.main === module) {
  main().catch(error => {
    console.error('❌ テスト実行エラー:', error);
    process.exit(1);
  });
}

module.exports = AuthIntegrationTest;