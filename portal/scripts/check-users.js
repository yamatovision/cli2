const mongoose = require('mongoose');

// MongoDB接続文字列
const MONGODB_URI = 'mongodb+srv://lisence:FhpQAu5UPwjm0L1J@motherprompt-cluster.np3xp.mongodb.net/GENIEMON?retryWrites=true&w=majority&appName=MotherPrompt-Cluster';

// SimpleUserモデルの定義（簡易版）
const SimpleUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
});

const SimpleUser = mongoose.model('SimpleUser', SimpleUserSchema);

async function checkUsers() {
  try {
    // MongoDBに接続
    console.log('MongoDBに接続中...');
    await mongoose.connect(MONGODB_URI);
    console.log('接続成功！\n');

    // ユーザーIDで検索
    console.log('=== ユーザーID 67e207d18ccc8aab3e3b6a8f を検索 ===');
    const userById = await SimpleUser.findById('67e207d18ccc8aab3e3b6a8f');
    if (userById) {
      console.log('ユーザーが見つかりました:');
      console.log('- 名前:', userById.name);
      console.log('- メール:', userById.email);
      console.log('- ロール:', userById.role);
      console.log('- アクティブ:', userById.isActive);
    } else {
      console.log('ユーザーが見つかりません');
    }

    // メールアドレスで検索
    console.log('\n=== メールアドレス metavicer@gmail.com を検索 ===');
    const userByEmail1 = await SimpleUser.findOne({ email: 'metavicer@gmail.com' });
    if (userByEmail1) {
      console.log('ユーザーが見つかりました:');
      console.log('- ID:', userByEmail1._id);
      console.log('- 名前:', userByEmail1.name);
      console.log('- ロール:', userByEmail1.role);
    } else {
      console.log('ユーザーが見つかりません');
    }

    // メールアドレスで検索
    console.log('\n=== メールアドレス lisence@mikoto.co.jp を検索 ===');
    const userByEmail2 = await SimpleUser.findOne({ email: 'lisence@mikoto.co.jp' });
    if (userByEmail2) {
      console.log('ユーザーが見つかりました:');
      console.log('- ID:', userByEmail2._id);
      console.log('- 名前:', userByEmail2.name);
      console.log('- ロール:', userByEmail2.role);
    } else {
      console.log('ユーザーが見つかりません');
    }

    // 全ユーザーの一覧
    console.log('\n=== 全ユーザー一覧 ===');
    const allUsers = await SimpleUser.find({}, 'name email role isActive').limit(10);
    console.log(`総ユーザー数: ${await SimpleUser.countDocuments()}`);
    console.log('\n最初の10件:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role} - アクティブ: ${user.isActive}`);
    });

  } catch (error) {
    console.error('エラー:', error.message);
  } finally {
    // 接続を閉じる
    await mongoose.connection.close();
    console.log('\n接続を閉じました');
  }
}

// 実行
checkUsers();