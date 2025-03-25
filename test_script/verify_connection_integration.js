/**
 * ワークスペース作成の接続統合確認ツール
 * 
 * このスクリプトは、バックエンドのコントローラーがAnthropicワークスペースを作成する際に
 * 正しくAPIを呼び出すことができるかを検証します。
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// 設定
const CONTROLLER_PATH = path.join(__dirname, '../portal/backend/controllers/simpleOrganization.controller.js');
const ENV_FILE_PATH = path.join(__dirname, '../.env');
const CONFIG_FILE_PATH = path.join(__dirname, '../portal/backend/config/simple-auth.config.js');

console.log('=== ワークスペース作成統合確認ツール ===');

// APIキーの確認
function checkApiKey() {
  const apiKey = process.env.ANTHROPIC_ADMIN_KEY;
  
  if (!apiKey) {
    console.error('❌ ANTHROPIC_ADMIN_KEY 環境変数が設定されていません');
    console.log('ℹ️ .envファイルに設定するか、環境変数として設定してください');
    return false;
  }
  
  console.log(`✅ ANTHROPIC_ADMIN_KEY が設定されています: ${apiKey.substring(0, 10)}...`);
  return true;
}

// コントローラーファイルの確認
function checkControllerFile() {
  try {
    const content = fs.readFileSync(CONTROLLER_PATH, 'utf8');
    
    // 必要な変更が適用されているか確認
    const hasUpdatedCode = content.includes('実際のAnthropicのAdminキーを使用して、APIを呼び出す');
    const hasAnthropicEndpoint = content.includes('https://api.anthropic.com/v1/organizations/workspaces');
    
    if (hasUpdatedCode && hasAnthropicEndpoint) {
      console.log('✅ コントローラーファイルに必要な変更が適用されています');
      return true;
    } else {
      console.error('❌ コントローラーファイルに必要な変更が見つかりません');
      console.log('ℹ️ コントローラーファイルを最新の修正内容で更新してください');
      return false;
    }
  } catch (error) {
    console.error('❌ コントローラーファイルの読み込みに失敗しました:', error.message);
    return false;
  }
}

// .envファイルの確認
function checkEnvFile() {
  try {
    if (fs.existsSync(ENV_FILE_PATH)) {
      const content = fs.readFileSync(ENV_FILE_PATH, 'utf8');
      
      if (content.includes('ANTHROPIC_ADMIN_KEY')) {
        console.log('✅ .envファイルにANTHROPIC_ADMIN_KEYが設定されています');
        return true;
      } else {
        console.warn('⚠️ .envファイルにANTHROPIC_ADMIN_KEYが設定されていません');
        console.log('ℹ️ .envファイルに以下の行を追加してください:');
        console.log('ANTHROPIC_ADMIN_KEY=sk-ant-api-...');
        return false;
      }
    } else {
      console.warn('⚠️ .envファイルが見つかりません');
      console.log('ℹ️ .envファイルを作成して以下の行を追加してください:');
      console.log('ANTHROPIC_ADMIN_KEY=sk-ant-api-...');
      return false;
    }
  } catch (error) {
    console.error('❌ .envファイルの確認中にエラーが発生しました:', error.message);
    return false;
  }
}

// 設定ファイルの確認（あれば）
function checkConfigFile() {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      console.log('✅ simple-auth.config.jsファイルが存在します');
      return true;
    } else {
      console.log('ℹ️ simple-auth.config.jsファイルが見つかりません（必須ではありません）');
      return true;
    }
  } catch (error) {
    console.error('❌ 設定ファイルの確認中にエラーが発生しました:', error.message);
    return true; // 必須ではないのでtrueを返す
  }
}

// バックエンドサーバー設定のガイド
function showBackendServerGuide() {
  console.log('\n--- バックエンドサーバー設定ガイド ---');
  console.log('1. .envファイルがバックエンドサーバーのルートディレクトリに存在することを確認してください');
  console.log('2. バックエンドサーバーが起動時に.envファイルを読み込むことを確認してください');
  console.log('3. バックエンドサーバーを再起動して、環境変数の変更を反映させてください');
  console.log('\nサーバー再起動コマンド例:');
  console.log('cd /Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/portal');
  console.log('npm run dev');
}

// フロントエンド接続確認ガイド
function showFrontendConnectionGuide() {
  console.log('\n--- フロントエンド接続確認ガイド ---');
  console.log('1. フロントエンドがバックエンドと正しく接続していることを確認してください');
  console.log('2. ワークスペース作成機能を使用する前に、ログインしていることを確認してください');
  console.log('3. ワークスペース作成ボタンをクリックして、機能をテストしてください');
  console.log('\nブラウザでの確認:');
  console.log('http://localhost:3000/dashboard');
}

// 総合結果の表示
function showResults(apiKeyOk, controllerOk, envFileOk, configOk) {
  console.log('\n=== 診断結果 ===');
  
  if (apiKeyOk && controllerOk && envFileOk && configOk) {
    console.log('✅ すべての要素が正常です。ワークスペース作成機能は正しく動作するはずです。');
  } else {
    console.log('⚠️ 一部の要素に問題があります。以下の手順に従って修正してください:');
    
    if (!apiKeyOk) {
      console.log('- Anthropic APIキーを設定してください');
    }
    
    if (!controllerOk) {
      console.log('- コントローラーファイルを最新の変更で更新してください');
    }
    
    if (!envFileOk) {
      console.log('- .envファイルを作成し、ANTHROPIC_ADMIN_KEYを設定してください');
    }
  }
  
  console.log('\nテストスクリプトを実行して、実際の動作を確認してください:');
  console.log('node test_script/test_workspace_creation.js');
}

// メイン関数
function main() {
  const apiKeyOk = checkApiKey();
  const controllerOk = checkControllerFile();
  const envFileOk = checkEnvFile();
  const configOk = checkConfigFile();
  
  showBackendServerGuide();
  showFrontendConnectionGuide();
  showResults(apiKeyOk, controllerOk, envFileOk, configOk);
}

// 実行
main();