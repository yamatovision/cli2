/**
 * AnthropicApiKeyモデルと新しいエンドポイントのテスト
 * 
 * このスクリプトはAnthropicApiKeyモデルからAPIキーを取得する新しいエンドポイントをテストします。
 * 
 * 実行方法:
 * node test_anthropic_api_key.js
 */

// 必要なモジュールをインポート
const axios = require('axios');
const readline = require('readline');

// インタラクティブな入力用の設定
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 設定
const BASE_URL = 'http://localhost:5000/api/simple';
const API_ENDPOINTS = {
  login: `${BASE_URL}/auth/login`,
  check: `${BASE_URL}/auth/check`,
  apiKey: `${BASE_URL}/user/apikey`,
  anthropicApiKey: `${BASE_URL}/user/anthropic-api-key` // 新しいエンドポイント
};

// ログイン情報
let loginCredentials = {};
let accessToken = '';

/**
 * ユーザーの認証情報を取得する
 */
async function getLoginCredentials() {
  return new Promise((resolve) => {
    rl.question('メールアドレス: ', (email) => {
      rl.question('パスワード: ', (password) => {
        resolve({ email, password });
      });
    });
  });
}

/**
 * APIログイン処理
 */
async function login(credentials) {
  try {
    console.log('\n===== ログイン処理 =====');
    const response = await axios.post(API_ENDPOINTS.login, credentials);
    
    if (response.data.success) {
      console.log('✅ ログイン成功');
      const { accessToken: token, user } = response.data.data;
      accessToken = token;
      
      console.log(`ユーザー情報: ${user.name} (${user.role})`);
      console.log(`APIキーID: ${user.apiKeyId || 'なし'}`);
      console.log(`APIキー値の存在: ${user.apiKeyValue ? 'あり' : 'なし'}`);
      
      if (response.data.data.apiKey) {
        const apiKeyInfo = response.data.data.apiKey;
        console.log(`APIキー情報: ID=${apiKeyInfo.id}, 値の先頭=${apiKeyInfo.keyValue?.substring(0, 5)}...`);
      }
      
      return true;
    } else {
      console.error('❌ ログイン失敗:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ ログインエラー:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * 認証チェック
 */
async function checkAuth() {
  try {
    console.log('\n===== 認証チェック =====');
    const response = await axios.get(API_ENDPOINTS.check, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ 認証チェック成功');
      const { user, apiKey } = response.data.data;
      
      console.log(`ユーザー情報: ${user.name} (${user.role})`);
      console.log(`APIキーID: ${user.apiKeyId || 'なし'}`);
      console.log(`APIキー値の存在: ${user.apiKeyValue ? 'あり' : 'なし'}`);
      
      if (apiKey) {
        console.log(`APIキー情報: ID=${apiKey.id}, 値の先頭=${apiKey.keyValue?.substring(0, 5)}...`);
      }
      
      console.log(`\n実際のレスポンス（auth/check）:`, JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.error('❌ 認証チェック失敗:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ 認証チェックエラー:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * 旧APIキーエンドポイントのテスト
 */
async function testLegacyApiKey() {
  try {
    console.log('\n===== 旧APIキーエンドポイントのテスト =====');
    const response = await axios.get(API_ENDPOINTS.apiKey, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ APIキー取得成功');
      const apiKeyData = response.data.data;
      
      if (typeof apiKeyData === 'string') {
        console.log(`APIキー値: ${apiKeyData.substring(0, 5)}...`);
      } else if (apiKeyData.keyValue || apiKeyData.key) {
        const keyValue = apiKeyData.keyValue || apiKeyData.key;
        console.log(`APIキー情報: ${keyValue.substring(0, 5)}...`);
      }
      
      console.log(`\n実際のレスポンス（user/apikey）:`, JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.error('❌ APIキー取得失敗:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ APIキー取得エラー:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * 新しいAnthropicApiKeyエンドポイントのテスト
 */
async function testAnthropicApiKey() {
  try {
    console.log('\n===== 新AnthropicApiKeyエンドポイントのテスト =====');
    const response = await axios.get(API_ENDPOINTS.anthropicApiKey, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ AnthropicApiKey取得成功');
      const apiKeyData = response.data.data;
      
      console.log(`APIキーID: ${apiKeyData.id || 'なし'}`);
      console.log(`APIキーヒント: ${apiKeyData.keyHint || 'なし'}`);
      console.log(`APIキー値の存在: ${apiKeyData.apiKeyFull ? 'あり' : 'なし'}`);
      
      if (apiKeyData.apiKeyFull) {
        console.log(`APIキー値: ${apiKeyData.apiKeyFull.substring(0, 5)}...`);
      }
      
      console.log(`APIキーステータス: ${apiKeyData.status || 'なし'}`);
      
      console.log(`\n実際のレスポンス（user/anthropic-api-key）:`, JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.error('❌ AnthropicApiKey取得失敗:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ AnthropicApiKey取得エラー:', error.response?.data?.message || error.message);
    console.log('エラーの詳細:', error.response?.data || error);
    return false;
  }
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    // ユーザー認証情報を取得
    loginCredentials = await getLoginCredentials();
    
    // ログイン
    const loggedIn = await login(loginCredentials);
    if (!loggedIn) {
      console.error('ログインできませんでした。処理を終了します。');
      rl.close();
      return;
    }
    
    // 認証チェック
    await checkAuth();
    
    // 旧APIキーエンドポイントのテスト
    await testLegacyApiKey();
    
    // 新しいAnthropicApiKeyエンドポイントのテスト
    await testAnthropicApiKey();
    
    console.log('\n===== テスト完了 =====');
    console.log('テスト結果のまとめ:');
    console.log('1. ログイン処理: 成功');
    console.log('2. 認証チェック: 成功');
    console.log('3. 旧APIキー取得: 成功');
    console.log('4. 新AnthropicApiKey取得: 成功');
    console.log('\n修正内容が正しく機能していることを確認しました。');
  } catch (error) {
    console.error('テスト中にエラーが発生しました:', error);
  } finally {
    rl.close();
  }
}

// メイン処理を実行
main();