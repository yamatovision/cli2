const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB接続文字列
const MONGODB_URI = 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/GENIEMON?retryWrites=true&w=majority&appName=MotherPrompt-Cluster';

// SimpleUserモデルの定義（完全版）
const SimpleUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
});

const SimpleUser = mongoose.model('SimpleUser', SimpleUserSchema);

async function checkUserLogin() {
  try {
    // MongoDBに接続
    console.log('MongoDBに接続中...');
    await mongoose.connect(MONGODB_URI);
    console.log('接続成功！\n');

    // metavicer@gmail.comを検索
    console.log('=== metavicer@gmail.com のログイン確認 ===');
    
    // 大文字小文字を区別しない検索も試す
    const users = await SimpleUser.find({
      email: { $regex: /^metavicer@gmail\.com$/i }
    });
    
    console.log(`見つかったユーザー数: ${users.length}`);
    
    for (const user of users) {
      console.log('\nユーザー情報:');
      console.log('- ID:', user._id);
      console.log('- 名前:', user.name);
      console.log('- メール:', user.email);
      console.log('- ロール:', user.role);
      console.log('- アクティブ:', user.isActive);
      console.log('- 削除済み:', user.isDeleted);
      console.log('- パスワードハッシュ存在:', !!user.password);
      
      // パスワードの検証
      if (user.password) {
        const testPassword = 'aikakumei';
        const isMatch = await bcrypt.compare(testPassword, user.password);
        console.log(`- パスワード'${testPassword}'の検証結果:`, isMatch);
      }
    }

    // 完全一致検索も試す
    console.log('\n=== 完全一致検索 ===');
    const exactUser = await SimpleUser.findOne({ email: 'metavicer@gmail.com' });
    if (exactUser) {
      console.log('完全一致ユーザーが見つかりました:', exactUser._id);
    } else {
      console.log('完全一致ユーザーが見つかりません');
    }

    // isDeletedがtrueのユーザーも検索
    console.log('\n=== 削除済みユーザーの確認 ===');
    const deletedUsers = await SimpleUser.find({ 
      email: 'metavicer@gmail.com',
      isDeleted: true 
    });
    console.log(`削除済みユーザー数: ${deletedUsers.length}`);

    // ユーザーIDで検索（ログに出ているID）
    console.log('\n=== ID 67e207d18ccc8aab3e3b6a8f の確認 ===');
    const userById = await SimpleUser.findById('67e207d18ccc8aab3e3b6a8f');
    if (userById) {
      console.log('ユーザー情報:');
      console.log('- 名前:', userById.name);
      console.log('- メール:', userById.email);
      console.log('- ロール:', userById.role);
    }

  } catch (error) {
    console.error('エラー:', error.message);
  } finally {
    // 接続を閉じる
    await mongoose.connection.close();
    console.log('\n接続を閉じました');
  }
}

// 実行
checkUserLogin();