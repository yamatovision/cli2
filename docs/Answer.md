APIキー
APIキーを取得
得る
/
v1
/
組織
/
APIキー
/
{APIキーID}
ヘッダー
​
x-api-キー
弦
必須
認証用の一意の管理者 API キー。

このキーは、アカウントを認証し、Anthropic のサービスにアクセスするために、すべての管理 API リクエストのヘッダーに必要です。コンソールから管理 API キーを取得してください。

​
人類版
弦
必須
使用する Anthropic API のバージョン。

バージョン管理とバージョン履歴の詳細については、こちらをご覧ください。

パスパラメータ
​
APIキーID
弦
必須
API キーの ID。

応答
200 - アプリケーション/json
​
作成日時
弦
必須
API キーが作成された日時を示す RFC 3339 日時文字列。

​
作成者
物体
必須
API キーを作成したアクターの ID とタイプ。


子の属性を表示

​
id
弦
必須
API キーの ID。

​
名前
弦
必須
API キーの名前。

​
部分的なキーヒント
文字列 | null
必須
API キーに関する部分的に編集されたヒント。

​
状態
enum<文字列>
必須
API キーのステータス。

利用可能なオプション: active、 inactive、 archived 
​
タイプ
enum<文字列>
デフォルト：
APIキー
必須
オブジェクトタイプ。

API キーの場合、これは常に です"api_key"。

利用可能なオプション: api_key 
​
ワークスペースID
文字列 | null
必須
API キーに関連付けられたワークスペースの ID。API キーがデフォルトのワークスペースに属している場合は null になります。

このページは役に立ちましたか?


はい

いいえ
ワークスペースメンバーの削除
APIキーの一覧
x
リンクトイン

カール

curl "https://api.anthropic.com/v1/organizations/api_keys/apikey_01Rj2N8SVvo6BePZj99NhmiT" \
  --header "anthropic-version: 2023-06-01" \
  --header "content-type: application/json" \
  --header "x-api-key: $ANTHROPIC_ADMIN_KEY"

200

4XX

{
  "id": "apikey_01Rj2N8SVvo6BePZj99NhmiT",
  "type": "api_key",
  "name": "Developer Key",
  "workspace_id": "wrkspc_01JwQvzr7rXLA5AGx3HKfFUJ",
  "created_at": "2024-10-30T23:58:27.427722Z",
  "created_by": {
    "id": "user_01WCz1FkmYMm4gnmykNKUu3Q",
    "type": "user"
  },
  "partial_key_hint": "sk-ant-api03-R2D...igAA",
  "status": "active"
}




⏺ モデルにも正しく apiKeyFull フィールドの定義があります。で
  は、現在のデータがどのような状態か確認しましょう：

⏺ Search(pattern: "keyHint", include: "*.js")…
  ⎿  Found 21 files

⏺ コードでも keyHint
  が多数の場所で使用されています。実際に現在の
  formatApiKeyHint
  関数がどのように実装されているか確認しましょう：

⏺ Read(file_path: "portal/backend/controllers/simpleOrganiz…
      tion.controller.js", offset: 1, limit: 30)
  ⎿  /**
      * シンプルな組織管理コントローラー
      * 組織の作成、取得、更新、削除を行います
     ... (+27 lines)

⏺ 現状をまとめると：

  1. コードには apiKeyFull

  この時まで戻すことできる？


      apiKeyId: 'apikey_1742888221593_pqzlei',

      apikeyIdってこれはUserやOrganizatio


db.anthropicapikeys.find().sort({createdAt:-1}).limit(5).pretty()
      
      
      ですよね。でライブラリを構築していくのは良いと思うんです。後々のために。
      しかしまずここで質問があります。

      例えばすでにうまくいっているLPをモデリングするフローを考えていく上で、まず一番最初に文章を見つけてそれをフレームワーク化してテンプレート化し、ユーザーにフレームワーク構築に必要な情報収集をしてそのあとテンプレートに当てこんで別のLP文章にする。といった感じでいいのかなと思っていますが、まずそれで文書を作成したら今度はその文章をLPのレイアウトや画像デザインなどを似せたやつにしてメッセージを取り替えて入れ込んでいく。といった流れなのかなと思っています。ここまではどうですか？



_id: ObjectId('67e25d1db827c5f114a07a94'),
    apiKeyId: 'apikey_1742888221593_pqzlei',
    apiKeyFull: 'sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-XXXXXXXXXX',
    name: 'API_KEY_NAME_REDACTED',
    status: 'active',
    workspaceId: null,
    lastUsedAt: null,
    lastSyncedAt: ISODate('2025-03-25T07:37:01.743Z'),
    createdAt: ISODate('2025-03-25T07:37:01.745Z'),
    updatedAt: ISODate('2025-03-25T07:37:01.745Z'),




dashboardのapiキー作成で下記のAPIキーを作成しました。


Atlas atlas-121m2p-shard-0 [primary] GENIEMON> db.anthropicapikeys.find().sort({createdAt:-1}).limit(5).pretty()
[
  {
    _id: ObjectId('67e27305b12696edea988c2e'),
    apiKeyId: 'apikey_01WNe935VjdR8y5kLv4Dcixm',
    apiKeyFull: 'sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-XXXXXXXXXX',
    name: '何さ',
    status: 'active',
    workspaceId: null,
    lastUsedAt: null,
    lastSyncedAt: ISODate('2025-03-25T09:10:35.209Z'),
    createdAt: ISODate('2025-03-25T09:10:29.860Z'),
    updatedAt: ISODate('2025-03-25T09:10:35.210Z'),
    __v: 0
  },

そしてそのあとユーザー一覧の変更からTatsuyaの秘密鍵を上記の何さに登録した後に、ユーザーデータを見た結果下記です。

    Atlas atlas-121m2p-shard-0 [primary] GENIEMON> db.simpleusers.findOne({email: 'shiraishi.tatsuya@mikoto.co.jp'})
{
  _id: ObjectId('67e207d18ccc8aab3e3b6a8f'),
  name: 'Tatsuya',
  email: 'shiraishi.tatsuya@mikoto.co.jp',
  password: '$2a$10$itrXSzJ0WhJpbH2lERr7yOzM7EVfcyq5Q.6etNdCoZT5SsJysGnF6',
  role: 'SuperAdmin',
  organizationId: ObjectId('67e13cca553bcd3453514123'),
  apiKeyId: 'apikey_01WNe935VjdR8y5kLv4Dcixm',
  apiKeyValue: 'sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-XXXXXXXXXX',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZTIwN2QxOGNjYzhhYWIzZTNiNmE4ZiIsImlhdCI6MTc0Mjg4NTY3NCwiZXhwIjoxNzQzNDkwNDc0LCJhdWQiOiJhcHBnZW5pdXMtc2ltcGxlLXVzZXJzIiwiaXNzIjoiYXBwZ2VuaXVzLXNpbXBsZS1hdXRoIn0.FJn_w0bFXJxOhniJ1nC26wffnGe64lqn7azBkhss3Ww',
  status: 'active',
  createdAt: ISODate('2025-03-25T01:33:05.907Z'),
  updatedAt: ISODate('2025-03-25T09:14:07.212Z'),
  __v: 1,
  organizationIds: []
}
Atlas atlas-121m2p-shard-0 [primary] GENIEMON> 

全然紐づいてないように思うんですが、poratalのdashboardのユーザー情報編集から秘密鍵を切り替えてもなぜ情報が切り替わらないかをフロントエンドからバックエンドの実装を追って調べてください