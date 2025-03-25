/**
 * 特定のAPIキーが有効かどうかを検証するためのスクリプト
 */
const axios = require('axios');

// テスト対象のAPIキー
const apiKeyToVerify = "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";

// Anthropic APIのベースURL
const ANTHROPIC_API_BASE = 'https://api.anthropic.com';

// コマンドラインカラー定義
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

/**
 * APIキーの有効性を直接検証する
 */
async function verifyApiKey() {
  console.log(colors.cyan('=== APIキー検証テスト ==='));
  console.log(`検証するAPIキー: ${apiKeyToVerify.substring(0, 12)}...${apiKeyToVerify.substring(apiKeyToVerify.length - 4)}`);
  
  try {
    // Claude APIを呼び出してAPIキーが有効かテスト
    const response = await axios.post(`${ANTHROPIC_API_BASE}/v1/messages`, {
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      messages: [
        { role: 'user', content: 'Hello, are you working?' }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKeyToVerify,
        'anthropic-version': '2023-06-01'
      }
    });
    
    console.log(colors.green('✅ APIキーは有効です'));
    console.log('レスポンス:');
    console.log('-----------------------');
    console.log(`ID: ${response.data.id}`);
    console.log(`モデル: ${response.data.model}`);
    console.log(`コンテンツ: ${response.data.content[0].text}`);
    console.log('-----------------------');
    return {
      valid: true,
      response: response.data
    };
  } catch (error) {
    console.log(colors.red('❌ APIキーは無効または期限切れです'));
    
    if (error.response) {
      // APIからエラーレスポンスがある場合
      console.log(`ステータスコード: ${error.response.status}`);
      console.log('エラー詳細:');
      console.log(error.response.data);
    } else if (error.request) {
      // リクエストは送信されたがレスポンスがない場合
      console.log('レスポンスがありませんでした');
      console.log(error.request);
    } else {
      // リクエスト作成中のエラー
      console.log(`エラー: ${error.message}`);
    }
    
    return {
      valid: false,
      error: error.response?.data || error.message
    };
  }
}

/**
 * メイン関数
 */
async function main() {
  try {
    console.log(colors.cyan('APIキー検証を開始します...'));
    
    // APIキーを検証
    const result = await verifyApiKey();
    
    // 結果サマリーを表示
    console.log('\n=== 検証結果 ===');
    if (result.valid) {
      console.log(colors.green('APIキーは有効です ✅'));
      console.log('このAPIキーでClaudeモデルに正常にアクセスできます');
    } else {
      console.log(colors.red('APIキーは無効です ❌'));
      console.log('このAPIキーではClaudeモデルにアクセスできません');
      console.log('考えられる原因:');
      console.log('1. APIキーが期限切れまたは無効');
      console.log('2. 権限の問題');
      console.log('3. レート制限に到達している');
    }
  } catch (error) {
    console.error('検証中にエラーが発生しました:', error);
  }
}

// スクリプトを実行
main();