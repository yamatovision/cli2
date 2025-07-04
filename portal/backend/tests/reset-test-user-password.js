/**
 * テストユーザーのパスワードリセット
 */
const mongoose = require('mongoose');
const dbConfig = require('../config/db.config');
const SimpleUser = require('../models/simpleUser.model');

async function resetTestUserPassword() {
  try {
    // MongoDB接続
    await dbConfig.connect(mongoose);
    console.log('MongoDB接続成功');

    const email = 'cli-test@bluelamp.com';
    const newPassword = 'clitest123!';

    // ユーザー取得
    const user = await SimpleUser.findOne({ email });
    
    if (!user) {
      console.log('ユーザーが見つかりません');
      return;
    }

    console.log('\n=== ユーザー情報 ===');
    console.log('Email:', user.email);
    console.log('Name:', user.name);

    // パスワードを直接設定（pre saveフックでハッシュ化される）
    user.password = newPassword;
    await user.save();

    console.log('\nパスワードをリセットしました');

    // 検証
    const isValid = await user.validatePassword(newPassword);
    console.log('新しいパスワードの検証:', isValid ? '成功' : '失敗');

    console.log('\n=== テスト用認証情報 ===');
    console.log(`Email: ${email}`);
    console.log(`Password: ${newPassword}`);

  } catch (error) {
    console.error('エラー:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB接続を閉じました');
  }
}

// 実行
resetTestUserPassword();