#!/usr/bin/env node
/**
 * Portal CLI APIテストスクリプト
 * 本番環境のAPIが正しく動作しているか確認
 */
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const BASE_URL = 'https://bluelamp-235426778039.asia-northeast1.run.app/api';

// テスト用のプロンプトID
const TEST_PROMPT_ID = '6862397f1428c1efc592f6de'; // test_quality_verification.j2

async function loadAuthToken() {
  const authFile = path.join(os.homedir(), '.config', 'bluelamp', 'auth.json');
  try {
    const content = await fs.readFile(authFile, 'utf8');
    const data = JSON.parse(content);
    return data.api_key;
  } catch (error) {
    console.error('認証ファイル読み込みエラー:', error.message);
    return null;
  }
}

async function testAPI() {
  console.log('=== Portal CLI API テスト ===\n');
  console.log('API URL:', BASE_URL);
  
  // 認証トークンを読み込む
  const token = await loadAuthToken();
  if (!token) {
    console.error('❌ 認証トークンが見つかりません');
    return;
  }
  console.log('✅ 認証トークン読み込み成功:', token.substring(0, 20) + '...\n');
  
  // 1. 基本的なAPI接続テスト
  console.log('1. 基本API接続テスト');
  try {
    const response = await axios.get(BASE_URL);
    console.log('   ✅ API接続成功');
    console.log('   レスポンス:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('   ❌ API接続失敗:', error.message);
  }
  
  // 2. トークン検証API
  console.log('\n2. トークン検証テスト');
  try {
    const response = await axios.post(
      `${BASE_URL}/cli/verify`,
      {},
      {
        headers: {
          'X-CLI-Token': token,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('   ✅ トークン検証成功');
    console.log('   ユーザーID:', response.data.data.userId);
    console.log('   トークン有効:', response.data.data.tokenValid);
    console.log('   残り時間:', response.data.data.remainingTime, '秒');
  } catch (error) {
    console.log('   ❌ トークン検証失敗:', error.response?.status, error.response?.data || error.message);
  }
  
  // 3. プロンプト一覧取得テスト
  console.log('\n3. プロンプト一覧取得テスト');
  try {
    const response = await axios.get(
      `${BASE_URL}/cli/prompts`,
      {
        headers: {
          'X-CLI-Token': token,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('   ✅ プロンプト一覧取得成功');
    console.log('   プロンプト数:', response.data.data.prompts.length);
    
    // 最初の3つを表示
    response.data.data.prompts.slice(0, 3).forEach((prompt, index) => {
      console.log(`   ${index + 1}. ${prompt.title} (ID: ${prompt.id})`);
    });
  } catch (error) {
    console.log('   ❌ プロンプト一覧取得失敗:', error.response?.status, error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.log('   → エンドポイントが見つかりません。APIが正しくデプロイされていない可能性があります。');
    }
  }
  
  // 4. 個別プロンプト取得テスト
  console.log('\n4. 個別プロンプト取得テスト');
  console.log('   テストID:', TEST_PROMPT_ID);
  try {
    const response = await axios.get(
      `${BASE_URL}/cli/prompts/${TEST_PROMPT_ID}`,
      {
        headers: {
          'X-CLI-Token': token,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('   ✅ プロンプト取得成功');
    console.log('   タイトル:', response.data.data.prompt.title);
    console.log('   バージョン:', response.data.data.prompt.version);
    console.log('   コンテンツ長:', response.data.data.prompt.content.length, '文字');
  } catch (error) {
    console.log('   ❌ プロンプト取得失敗:', error.response?.status, error.response?.data || error.message);
  }
  
  // 5. ローカルサーバーでのテスト（開発環境）
  console.log('\n5. ローカルサーバーテスト (localhost:8080)');
  try {
    const localResponse = await axios.get('http://localhost:8080/api/cli/prompts/' + TEST_PROMPT_ID, {
      headers: {
        'X-CLI-Token': token,
        'Content-Type': 'application/json'
      },
      timeout: 3000
    });
    console.log('   ✅ ローカルサーバー接続成功');
    console.log('   プロンプト取得成功:', localResponse.data.data.prompt.title);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('   ⚠️  ローカルサーバーが起動していません');
    } else {
      console.log('   ❌ ローカルサーバーエラー:', error.message);
    }
  }
  
  console.log('\n=== テスト完了 ===');
}

// スクリプト実行
testAPI().catch(console.error);