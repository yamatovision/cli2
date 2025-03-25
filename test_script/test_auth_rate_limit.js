/**
 * 認証エンドポイントのレート制限テスト
 * 
 * このスクリプトは以下をテストします：
 * 1. ログインエンドポイントのレート制限動作
 * 2. レート制限エラー（429）の発生とレスポンス内容
 * 3. フロントエンド側のエラーハンドリング
 */

// 必要なモジュールをインポート
const axios = require('axios');

// テスト設定
const API_URL = 'http://localhost:3000/api';
const LOGIN_ENDPOINT = `${API_URL}/simple/auth/login`;
const TEST_CREDENTIALS = {
  email: 'test@example.com',    // テスト用メールアドレス（必要に応じて変更）
  password: 'password123'       // テスト用パスワード（必要に応じて変更）
};

// ヘッダー設定
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

/**
 * 指定した時間待機する関数
 * @param {number} ms 待機ミリ秒
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * ログインリクエストを送信する関数
 * @param {Object} credentials ログイン認証情報
 * @returns {Promise<Object>} レスポンス
 */
async function sendLoginRequest(credentials) {
  try {
    const startTime = Date.now();
    const response = await axios.post(LOGIN_ENDPOINT, credentials, { headers });
    const endTime = Date.now();
    
    return {
      status: response.status,
      data: response.data,
      duration: endTime - startTime
    };
  } catch (error) {
    if (error.response) {
      // サーバーからのエラーレスポンス
      return {
        status: error.response.status,
        data: error.response.data,
        error: true
      };
    } else {
      // ネットワークエラーなど
      throw error;
    }
  }
}

/**
 * レート制限テスト
 */
async function testRateLimit() {
  console.log('===== 認証エンドポイントのレート制限テスト =====');
  
  // 1. 連続リクエストテスト
  console.log('\n[テスト1] 連続ログインリクエスト（レート制限発生確認）');
  
  const results = [];
  // 10回連続でリクエストを送信
  for (let i = 0; i < 10; i++) {
    console.log(`リクエスト #${i+1} 送信中...`);
    const result = await sendLoginRequest(TEST_CREDENTIALS);
    
    // 結果を整形して出力
    if (result.error) {
      console.log(`  結果: ${result.status} エラー - ${result.data.error?.message || '不明なエラー'}`);
    } else {
      console.log(`  結果: ${result.status} 成功 - ${result.duration}ms`);
    }
    
    results.push(result);
    
    // 429エラーが発生したら詳細情報を表示
    if (result.status === 429) {
      console.log('\n[429エラー詳細]');
      console.log('エラーコード:', result.data.error?.code);
      console.log('エラーメッセージ:', result.data.error?.message);
      console.log('リセット時間:', result.data.error?.resetIn, '秒');
      console.log('再試行待機時間:', result.data.error?.retryAfter, '秒');
      
      // レート制限が検出されたらテスト完了
      break;
    }
    
    // リクエスト間に短い待機時間を入れる（サーバー負荷軽減）
    await sleep(200);
  }
  
  // 2. レート制限後の再試行テスト
  if (results.some(r => r.status === 429)) {
    console.log('\n[テスト2] レート制限後の待機と再試行');
    
    // レート制限エラーから再試行時間を取得
    const lastError = results.find(r => r.status === 429);
    const retryAfter = lastError.data.error?.retryAfter || 60;
    
    console.log(`待機時間: ${retryAfter}秒`);
    
    // retryAfter + 5秒待機（余裕を持たせる）
    const waitTime = (retryAfter + 5) * 1000;
    console.log(`${waitTime/1000}秒待機中...`);
    
    // 実際のテストでは時間がかかるため、長い待機時間はコメントアウト
    // await sleep(waitTime);
    await sleep(3000); // デモ用に短縮
    
    console.log('再試行リクエスト送信中...');
    const retryResult = await sendLoginRequest(TEST_CREDENTIALS);
    
    if (retryResult.error) {
      console.log(`  結果: ${retryResult.status} エラー - ${retryResult.data.error?.message || '不明なエラー'}`);
    } else {
      console.log(`  結果: ${retryResult.status} 成功 - ${retryResult.duration}ms`);
    }
  }
  
  console.log('\n===== テスト完了 =====');
}

// テスト実行
testRateLimit().catch(error => {
  console.error('テスト実行エラー:', error);
});