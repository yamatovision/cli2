const mongoose = require('mongoose');

// MongoDB接続文字列
const MONGODB_URI = 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/GENIEMON?retryWrites=true&w=majority&appName=MotherPrompt-Cluster';

// SimpleUserモデルの定義
const SimpleUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  status: {
    type: String,
    enum: ['active', 'disabled'],
    default: 'active'
  },
  createdAt: Date,
  updatedAt: Date
});

const SimpleUser = mongoose.model('SimpleUser', SimpleUserSchema);

async function enableUser() {
  try {
    // MongoDBに接続
    console.log('MongoDBに接続中...');
    await mongoose.connect(MONGODB_URI);
    console.log('接続成功！\n');

    // metavicer@gmail.comのユーザーを有効化
    console.log('=== metavicer@gmail.com を有効化 ===');
    
    const result = await SimpleUser.updateOne(
      { email: 'metavicer@gmail.com' },
      { $set: { status: 'active' } }
    );

    console.log(`更新結果: ${result.modifiedCount}件のユーザーを更新しました`);

    // 確認
    const user = await SimpleUser.findOne({ email: 'metavicer@gmail.com' });
    if (user) {
      console.log('\n更新後のユーザー情報:');
      console.log('- 名前:', user.name);
      console.log('- メール:', user.email);
      console.log('- ロール:', user.role);
      console.log('- ステータス:', user.status);
    }

    // findByEmailメソッドのテスト
    console.log('\n=== findByEmailメソッドのテスト ===');
    const foundUser = await SimpleUser.findOne({ 
      email: 'metavicer@gmail.com'.toLowerCase(),
      status: 'active'
    });
    
    if (foundUser) {
      console.log('findByEmailの条件でユーザーが見つかりました:', foundUser.name);
    } else {
      console.log('findByEmailの条件でユーザーが見つかりません');
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
enableUser();