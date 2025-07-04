/**
 * テストユーザーのパスワード検証
 */
const mongoose = require('mongoose');
const dbConfig = require('../config/db.config');
const SimpleUser = require('../models/simpleUser.model');
const bcrypt = require('bcryptjs');

async function verifyTestUser() {
  try {
    // MongoDB接続
    await dbConfig.connect(mongoose);
    console.log('MongoDB接続成功');

    const email = 'cli-test@bluelamp.com';
    const password = 'clitest123!';

    // ユーザー取得
    const user = await SimpleUser.findOne({ email });
    
    if (!user) {
      console.log('ユーザーが見つかりません');
      return;
    }

    console.log('\n=== ユーザー情報 ===');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Status:', user.status);
    console.log('パスワードハッシュ存在:', !!user.password);

    // パスワード検証
    if (user.password) {
      const isValid = await bcrypt.compare(password, user.password);
      console.log('\nパスワード検証結果:', isValid ? '成功' : '失敗');
      
      // validatePasswordメソッドのテスト
      if (user.validatePassword) {
        const methodResult = await user.validatePassword(password);
        console.log('validatePasswordメソッド結果:', methodResult ? '成功' : '失敗');
      }
    }

  } catch (error) {
    console.error('エラー:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB接続を閉じました');
  }
}

// 実行
verifyTestUser();