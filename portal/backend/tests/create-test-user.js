/**
 * CLI認証テスト用ユーザー作成スクリプト
 */
const mongoose = require('mongoose');
const dbConfig = require('../config/db.config');
const SimpleUser = require('../models/simpleUser.model');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    // MongoDB接続
    await dbConfig.connect(mongoose);
    console.log('MongoDB接続成功');

    // テスト用ユーザー情報
    const testUserData = {
      email: 'cli-test@bluelamp.com',
      password: 'clitest123!',
      name: 'CLI Test User',
      role: 'User',
      status: 'active'
    };

    // 既存ユーザーチェック
    const existingUser = await SimpleUser.findOne({ email: testUserData.email });
    
    if (existingUser) {
      console.log('\n既存のテストユーザーが見つかりました');
      console.log('Email:', existingUser.email);
      console.log('Name:', existingUser.name);
      console.log('Role:', existingUser.role);
      console.log('Status:', existingUser.status);
      
      // パスワードを更新
      const hashedPassword = await bcrypt.hash(testUserData.password, 10);
      existingUser.password = hashedPassword;
      await existingUser.save();
      console.log('\nパスワードを更新しました');
    } else {
      // 新規ユーザー作成
      const hashedPassword = await bcrypt.hash(testUserData.password, 10);
      const newUser = new SimpleUser({
        ...testUserData,
        password: hashedPassword
      });
      
      await newUser.save();
      console.log('\n新しいテストユーザーを作成しました');
    }

    console.log('\n=== テスト用認証情報 ===');
    console.log(`Email: ${testUserData.email}`);
    console.log(`Password: ${testUserData.password}`);
    console.log('\nこの情報でCLI認証テストを実行できます。');

  } catch (error) {
    console.error('エラー:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB接続を閉じました');
  }
}

// 実行
createTestUser();