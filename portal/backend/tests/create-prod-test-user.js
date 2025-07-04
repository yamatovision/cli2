/**
 * 本番環境用CLIテストユーザー作成スクリプト
 * 注意: 本番環境のMongoDBに接続するため、慎重に実行してください
 */
const mongoose = require('mongoose');
const SimpleUser = require('../models/simpleUser.model');
const bcrypt = require('bcryptjs');

// 本番環境のMongoDB接続情報
const PROD_MONGODB_URI = 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/GENIEMON?retryWrites=true&w=majority&appName=MotherPrompt-Cluster';

async function createProdTestUser() {
  try {
    // 本番MongoDBに接続
    await mongoose.connect(PROD_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('本番MongoDB接続成功');

    // テスト用ユーザー情報
    const testUserData = {
      email: 'cli-prod-test@bluelamp.com',
      password: 'cliprodtest123!',
      name: 'CLI Production Test User',
      role: 'User',
      status: 'active'
    };

    // 既存ユーザーチェック
    const existingUser = await SimpleUser.findOne({ email: testUserData.email });
    
    if (existingUser) {
      console.log('\n既存のテストユーザーが見つかりました');
      // パスワードを更新
      existingUser.password = testUserData.password;
      await existingUser.save();
      console.log('パスワードを更新しました');
    } else {
      // 新規ユーザー作成
      const newUser = new SimpleUser({
        ...testUserData,
        password: testUserData.password  // pre saveフックでハッシュ化される
      });
      
      await newUser.save();
      console.log('\n新しいテストユーザーを作成しました');
    }

    console.log('\n=== 本番環境テスト用認証情報 ===');
    console.log(`Email: ${testUserData.email}`);
    console.log(`Password: ${testUserData.password}`);
    console.log(`\nこの情報で本番環境のCLI認証をテストできます。`);
    console.log(`エンドポイント: https://bluelamp-235426778039.asia-northeast1.run.app/api/cli/login`);

  } catch (error) {
    console.error('エラー:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB接続を閉じました');
  }
}

// 確認プロンプト
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  警告: このスクリプトは本番環境のデータベースに接続します。');
console.log('テスト用ユーザーを作成してもよろしいですか？ (yes/no): ');

rl.question('', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    createProdTestUser();
  } else {
    console.log('キャンセルされました。');
  }
  rl.close();
});