/**
 * レート制限の状況を確認するためのテストスクリプト
 * 
 * 使い方:
 * 1. このスクリプトをサーバーサイドで実行する
 * 2. 特定のIPアドレスやエンドポイントに対するリクエスト数を確認する
 */

// rate-limit.middleware.js からストア情報を取得するための関数
const { ipRequestStore, AUTH_WINDOW_MS, AUTH_MAX_REQUESTS } = require('../portal/backend/middlewares/rate-limit.middleware');

/**
 * レート制限情報をチェックする関数
 */
function checkRateLimits() {
  console.log('===== レート制限状況レポート =====');
  console.log(`実行日時: ${new Date().toISOString()}`);
  console.log('');
  
  // ipRequestStore の内容をダンプ
  console.log('IP別リクエスト数:');
  if (ipRequestStore.size === 0) {
    console.log('  記録されたリクエストはありません');
  } else {
    for (const [ip, data] of ipRequestStore.entries()) {
      const resetTime = new Date(data.resetAt);
      const timeLeft = Math.max(0, Math.ceil((data.resetAt - Date.now()) / 1000));
      
      console.log(`  IP: ${ip}`);
      console.log(`    リクエスト数: ${data.count}`);
      console.log(`    リセット時間: ${resetTime.toLocaleTimeString()} (あと${timeLeft}秒)`);
      console.log('');
    }
  }
  
  console.log('レート制限設定情報:');
  console.log(`  認証API時間枠: ${AUTH_WINDOW_MS / 1000}秒`);
  console.log(`  認証API最大リクエスト: ${AUTH_MAX_REQUESTS}`);
  
  console.log('\n===== レポート終了 =====');
}

// スクリプト実行
checkRateLimits();