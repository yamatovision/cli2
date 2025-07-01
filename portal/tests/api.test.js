/**
 * APIエンドポイントテストスクリプト
 * 
 * このスクリプトは、AppGenius プロンプト管理ポータルのAPIエンドポイントを
 * テストします。サーバーが起動していることを確認してから実行してください。
 */

const axios = require('axios');

// chalk の代わりに単純な色付け関数を定義
const colors = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`
};

// 設定
const API_BASE_URL = 'http://127.0.0.1:5000/api';
const AUTH_BASE_URL = `${API_BASE_URL}/auth`;

// テスト結果を保存する配列
const testResults = [];

// ユーザーデータ
const testUser = {
  name: 'テストユーザー',
  email: `test-${Date.now()}@example.com`,
  password: 'Test@12345'
};

// 認証トークン
let accessToken = null;
let refreshToken = null;

// テスト関数
async function runTest(name, testFn) {
  try {
    console.log(colors.blue(`実行中: ${name}`));
    await testFn();
    console.log(colors.green(`✓ 成功: ${name}`));
    testResults.push({ name, success: true });
  } catch (error) {
    console.error(colors.red(`✗ 失敗: ${name}`));
    console.error(colors.red(`  エラー: ${error.message}`));
    if (error.response) {
      console.error(colors.red(`  ステータス: ${error.response.status}`));
      console.error(colors.red(`  レスポンス: ${JSON.stringify(error.response.data, null, 2)}`));
    }
    testResults.push({ name, success: false, error: error.message });
  }
}

// API ヘルスチェック
async function testApiHealth() {
  const response = await axios.get(`${API_BASE_URL}`);
  if (response.status !== 200) {
    throw new Error(`期待するステータスコード200ではなく${response.status}が返されました`);
  }
  console.log(colors.gray(`  API情報: ${response.data.message}, バージョン: ${response.data.version}`));
}

// 認証エンドポイント ヘルスチェック
async function testAuthHealth() {
  const response = await axios.get(`${AUTH_BASE_URL}/health`);
  if (response.status !== 200) {
    throw new Error(`期待するステータスコード200ではなく${response.status}が返されました`);
  }
  console.log(colors.gray(`  認証API状態: ${response.data.status}, タイムスタンプ: ${response.data.timestamp}`));
}

// ユーザー登録テスト
async function testRegister() {
  try {
    const response = await axios.post(`${AUTH_BASE_URL}/register`, testUser);
    if (response.status !== 201) {
      throw new Error(`期待するステータスコード201ではなく${response.status}が返されました`);
    }
    
    // トークンとユーザー情報を保存
    accessToken = response.data.accessToken;
    refreshToken = response.data.refreshToken;
    
    console.log(colors.gray(`  新規ユーザーを作成しました: ${response.data.user.name} (${response.data.user.email})`));
    console.log(colors.gray(`  アクセストークンを取得: ${accessToken.substring(0, 15)}...`));
  } catch (error) {
    // ユーザーが既に存在する場合はログインを試みる
    if (error.response && error.response.data.error && 
        error.response.data.error.code === 'DUPLICATE_ENTRY') {
      console.log(colors.yellow(`  ユーザーは既に存在します。ログインを試みます。`));
      await testLogin();
    } else {
      throw error;
    }
  }
}

// ログインテスト
async function testLogin() {
  const loginData = {
    email: testUser.email,
    password: testUser.password
  };
  
  const response = await axios.post(`${AUTH_BASE_URL}/login`, loginData);
  if (response.status !== 200) {
    throw new Error(`期待するステータスコード200ではなく${response.status}が返されました`);
  }
  
  // トークンとユーザー情報を保存
  accessToken = response.data.accessToken;
  refreshToken = response.data.refreshToken;
  
  console.log(colors.gray(`  ログインしました: ${response.data.user.name} (${response.data.user.email})`));
  console.log(colors.gray(`  アクセストークンを取得: ${accessToken.substring(0, 15)}...`));
}

// トークン更新テスト
async function testRefreshToken() {
  if (!refreshToken) {
    throw new Error('リフレッシュトークンがありません。先にログインしてください。');
  }
  
  const response = await axios.post(`${AUTH_BASE_URL}/refresh-token`, { refreshToken });
  if (response.status !== 200) {
    throw new Error(`期待するステータスコード200ではなく${response.status}が返されました`);
  }
  
  // 新しいアクセストークンを保存
  const newAccessToken = response.data.accessToken;
  console.log(colors.gray(`  新しいアクセストークンを取得: ${newAccessToken.substring(0, 15)}...`));
  
  // 新しいトークンで認証できることを確認
  accessToken = newAccessToken;
}

// 現在のユーザー情報取得テスト
async function testGetCurrentUser() {
  if (!accessToken) {
    throw new Error('アクセストークンがありません。先にログインしてください。');
  }
  
  const response = await axios.get(`${AUTH_BASE_URL}/users/me`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  if (response.status !== 200) {
    throw new Error(`期待するステータスコード200ではなく${response.status}が返されました`);
  }
  
  console.log(colors.gray(`  ユーザー情報を取得: ${response.data.user.name} (${response.data.user.email})`));
}

// ユーザー情報更新テスト
async function testUpdateUser() {
  if (!accessToken) {
    throw new Error('アクセストークンがありません。先にログインしてください。');
  }
  
  const updatedName = `${testUser.name} (更新済み)`;
  
  const response = await axios.put(`${AUTH_BASE_URL}/users/me`, 
    { name: updatedName },
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );
  
  if (response.status !== 200) {
    throw new Error(`期待するステータスコード200ではなく${response.status}が返されました`);
  }
  
  console.log(colors.gray(`  ユーザー情報を更新: ${response.data.user.name}`));
  
  // 更新されたことを確認
  if (response.data.user.name !== updatedName) {
    throw new Error(`ユーザー名が正しく更新されていません。期待値: "${updatedName}", 実際: "${response.data.user.name}"`);
  }
}

// ログアウトテスト
async function testLogout() {
  if (!refreshToken) {
    throw new Error('リフレッシュトークンがありません。先にログインしてください。');
  }
  
  const response = await axios.post(`${AUTH_BASE_URL}/logout`, { refreshToken });
  if (response.status !== 200) {
    throw new Error(`期待するステータスコード200ではなく${response.status}が返されました`);
  }
  
  console.log(colors.gray(`  ログアウトしました: ${response.data.message}`));
  
  // トークンをクリア
  accessToken = null;
  refreshToken = null;
}

// 認可エラーテスト
async function testAuthorizationError() {
  try {
    // 無効なトークンでリクエスト
    await axios.get(`${AUTH_BASE_URL}/users/me`, {
      headers: { 'Authorization': 'Bearer invalid_token' }
    });
    
    // エラーが発生しなかった場合は失敗
    throw new Error('認可エラーが発生しませんでした。無効なトークンでもアクセスできました。');
  } catch (error) {
    // 401エラーを期待
    if (!error.response || error.response.status !== 401) {
      throw new Error(`期待するステータスコード401ではなく${error.response ? error.response.status : 'レスポンスなし'}が返されました`);
    }
    
    console.log(colors.gray(`  認可エラーテストは成功しました: ${error.response.data.error.message}`));
  }
}


// テスト実行の主関数
async function runTests() {
  console.log(colors.blue('=== AppGenius API テスト開始 ==='));
  
  // 基本的なヘルスチェック
  await runTest('API ヘルスチェック', testApiHealth);
  await runTest('認証API ヘルスチェック', testAuthHealth);
  
  // 認証フロー
  await runTest('ユーザー登録', testRegister);
  await runTest('現在のユーザー情報取得', testGetCurrentUser);
  await runTest('ユーザー情報更新', testUpdateUser);
  
  // 認証フロー（続き）
  await runTest('トークン更新', testRefreshToken);
  await runTest('認可エラーテスト', testAuthorizationError);
  await runTest('ログアウト', testLogout);
  
  // テスト結果のサマリーを表示
  console.log(colors.blue('\n=== テスト結果サマリー ==='));
  const successCount = testResults.filter(r => r.success).length;
  const failureCount = testResults.length - successCount;
  
  console.log(colors.blue(`合計テスト数: ${testResults.length}`));
  console.log(colors.green(`成功: ${successCount}`));
  console.log(colors.red(`失敗: ${failureCount}`));
  
  if (failureCount > 0) {
    console.log(colors.red('\n失敗したテスト:'));
    testResults.filter(r => !r.success).forEach(result => {
      console.log(colors.red(`- ${result.name}: ${result.error}`));
    });
    process.exit(1);
  } else {
    console.log(colors.green('\nすべてのテストが成功しました！'));
    process.exit(0);
  }
}

// テストの実行
runTests().catch(error => {
  console.error(colors.red('テスト実行中にエラーが発生しました:'));
  console.error(colors.red(error.stack));
  process.exit(1);
});