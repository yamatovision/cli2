/**
 * API エンドポイントテストスクリプト
 */
const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function testAPIEndpoints() {
  console.log('=== API エンドポイントテスト開始 ===');
  
  try {
    // 1. 公開プロンプトテスト（★11 デバッグ探偵）
    console.log('\n1. 公開プロンプトテスト');
    const publicToken = '3900bf2028a173fd6a80cc49f30ea7fe'; // ★11 デバッグ探偵のトークン
    
    try {
      const publicResponse = await axios.get(`${BASE_URL}/api/prompts/public/${publicToken}`);
      console.log('✅ 公開プロンプト取得成功');
      console.log(`   タイトル: ${publicResponse.data.title}`);
      console.log(`   ID: ${publicResponse.data.id}`);
    } catch (error) {
      console.log('❌ 公開プロンプト取得失敗:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // 2. プロンプト一覧テスト（認証なし）
    console.log('\n2. プロンプト一覧テスト（認証なし）');
    try {
      const listResponse = await axios.get(`${BASE_URL}/api/prompts`);
      console.log('❌ 認証なしでアクセスできてしまった（問題）');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ 認証エラーで正常にブロックされた');
      } else {
        console.log('❌ 予期しないエラー:', error.response?.status, error.response?.data?.message || error.message);
      }
    }
    
    // 3. サーバー生存確認
    console.log('\n3. サーバー生存確認');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/`);
      console.log('✅ サーバー応答確認');
    } catch (error) {
      console.log('❌ サーバー応答なし:', error.message);
    }
    
  } catch (error) {
    console.error('テスト実行エラー:', error.message);
  }
  
  console.log('\n=== API エンドポイントテスト完了 ===');
}

// サーバーが起動するまで少し待つ
setTimeout(() => {
  testAPIEndpoints().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('テスト実行エラー:', error);
    process.exit(1);
  });
}, 3000); // 3秒待機