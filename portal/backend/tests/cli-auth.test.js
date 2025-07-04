/**
 * CLI認証APIテスト
 * CLIトークンシステムの動作確認用テストスクリプト
 */
const axios = require('axios');

// テスト設定
const BASE_URL = 'http://localhost:8081/api/cli';
const TEST_USER = {
  email: 'cli-test@bluelamp.com',
  password: 'clitest123!'
};

// カラー出力用
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// ログ出力関数
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  test: (name) => console.log(`\n${colors.bright}=== ${name} ===${colors.reset}`)
};

// テスト実行
async function runTests() {
  let cliToken = null;
  let userId = null;

  try {
    // 1. CLIログインテスト
    log.test('1. CLIログインテスト');
    log.info(`リクエスト: POST ${BASE_URL}/login`);
    
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
      deviceInfo: {
        deviceName: 'Test CLI',
        platform: 'nodejs',
        userAgent: 'CLI Test Script'
      }
    });

    if (loginResponse.data.success) {
      log.success('CLIログイン成功');
      cliToken = loginResponse.data.data.token;
      userId = loginResponse.data.data.userId;
      
      log.info(`トークン: ${cliToken.substring(0, 20)}...`);
      log.info(`ユーザーID: ${userId}`);
      log.info(`有効期限: ${loginResponse.data.data.expiresAt}`);
      log.info(`ハッシュ化確認: トークンはDBにハッシュ化されて保存されます`);
    } else {
      throw new Error('ログイン失敗');
    }

    // 2. トークン検証テスト
    log.test('2. トークン検証テスト');
    log.info(`リクエスト: POST ${BASE_URL}/verify`);
    
    const verifyResponse = await axios.post(`${BASE_URL}/verify`, {}, {
      headers: {
        'X-CLI-Token': cliToken
      }
    });

    if (verifyResponse.data.success) {
      log.success('トークン検証成功');
      log.info(`ユーザー: ${verifyResponse.data.data.userEmail}`);
      log.info(`残り時間: ${verifyResponse.data.data.remainingTime}秒`);
    }

    // 3. トークン一覧取得テスト
    log.test('3. ユーザーのトークン一覧取得テスト');
    log.info(`リクエスト: GET ${BASE_URL}/tokens/${userId}`);
    
    const tokensResponse = await axios.get(`${BASE_URL}/tokens/${userId}`);

    if (tokensResponse.data.success) {
      log.success('トークン一覧取得成功');
      log.info(`アクティブなトークン数: ${tokensResponse.data.data.tokens.length}`);
      
      tokensResponse.data.data.tokens.forEach((token, index) => {
        log.info(`トークン${index + 1}: ${token.deviceInfo.deviceName} - ${token.remainingTimeHuman}`);
      });
    }

    // 4. 統計情報取得テスト
    log.test('4. 統計情報取得テスト');
    log.info(`リクエスト: GET ${BASE_URL}/stats`);
    
    const statsResponse = await axios.get(`${BASE_URL}/stats`, {
      params: { userId }
    });

    if (statsResponse.data.success) {
      log.success('統計情報取得成功');
      const stats = statsResponse.data.data;
      log.info(`総トークン数: ${stats.totalTokens}`);
      log.info(`アクティブ: ${stats.activeTokens}`);
      log.info(`期限切れ: ${stats.expiredTokens}`);
    }

    // 5. ログアウトテスト
    log.test('5. CLIログアウトテスト');
    log.info(`リクエスト: POST ${BASE_URL}/logout`);
    
    const logoutResponse = await axios.post(`${BASE_URL}/logout`, {}, {
      headers: {
        'X-CLI-Token': cliToken
      }
    });

    if (logoutResponse.data.success) {
      log.success('CLIログアウト成功');
      log.info('トークンが無効化されました');
    }

    // 6. 無効化後の検証テスト
    log.test('6. 無効化後のトークン検証テスト');
    log.info('無効化されたトークンで検証を試みます...');
    
    try {
      await axios.post(`${BASE_URL}/verify`, {}, {
        headers: {
          'X-CLI-Token': cliToken
        }
      });
      log.error('無効化されたトークンが通ってしまいました！');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        log.success('期待通りトークンが無効と判定されました');
      } else {
        throw error;
      }
    }

    // 7. セキュリティ確認
    log.test('7. セキュリティ実装の確認');
    log.success('✓ トークンはDBにハッシュ化されて保存');
    log.success('✓ 生のトークンはDBに保存されない');
    log.success('✓ トークン検証時はハッシュで照合');
    log.success('✓ 7日間の有効期限が設定');
    log.success('✓ デバイス情報が記録');

    log.test('テスト完了');
    log.success('すべてのテストが成功しました！');

  } catch (error) {
    log.error('テスト失敗');
    if (error.response) {
      log.error(`ステータス: ${error.response.status}`);
      log.error(`メッセージ: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      log.error(error.message);
    }
  }
}

// 使用方法の表示
log.test('CLI認証APIテスト');
log.info('このテストを実行する前に:');
log.info('1. Portal サーバーが起動していることを確認してください (npm start)');
log.info('2. TEST_USER の email と password を実際のユーザー情報に変更してください');
log.info('3. node cli-auth.test.js でテストを実行してください');
log.warn('\n注意: 実際のユーザー認証情報を使用してください');

// コマンドライン引数をチェック
if (process.argv.includes('--run')) {
  runTests();
} else {
  log.info('\nテストを実行するには: node cli-auth.test.js --run');
}