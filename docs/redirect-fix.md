# リダイレクトループ問題の修正

## 問題概要

ログイン後に「リダイレクト中... http://localhost:3000/login」という表示が発生し、ページが正しくダッシュボードに遷移しない問題がありました。

## 原因分析

調査の結果、以下の原因が特定されました：

1. **不適切なリダイレクト処理**：
   - React Router の Navigate コンポーネントではなく、`window.location.href` や `script` タグによる直接リダイレクトを使用
   - ログイン成功後の `window.location.reload()` によりナビゲーション状態がリセットされる

2. **タイミングの問題**：
   - ログイン処理完了後のリダイレクトが遅延処理（setTimeout）を使用しており、状態の更新が不安定

## 修正内容

### 1. App.js のリダイレクト処理を改善

1. **ログインページへのリダイレクト修正**：
   ```jsx
   <Route path="/login" element={
     localStorage.getItem('simpleUser') || localStorage.getItem('accessToken') ? (
       // React Router の Navigate コンポーネントを使用
       <Navigate to="/dashboard" replace />
     ) : <Login />
   } />
   ```

2. **ルートパスのリダイレクト修正**：
   ```jsx
   <Route path="/" element={
     // React Router の Navigate コンポーネントを使用
     localStorage.getItem('simpleUser') || localStorage.getItem('accessToken') 
       ? <Navigate to="/dashboard" replace />
       : <Navigate to="/login" replace />
   } />
   ```

3. **PrivateRoute コンポーネントの修正**：
   ```jsx
   const PrivateRoute = ({ children }) => {
     // 省略...
     if (!hasAuth) {
       return <Navigate to="/login" replace />;
     }
     return children;
   };
   ```

### 2. Login.js のリダイレクト処理を修正

ログイン成功後のリダイレクト処理を単純化：
```jsx
// React Routerのナビゲーション機能を使用（window.location.reloadは不要）
navigate('/dashboard', { replace: true });
```

## 効果

これらの修正により：

1. ログイン後のリダイレクトが正しく機能するようになりました
2. ページのちらつきや「リダイレクト中...」メッセージが表示されなくなりました
3. ブラウザの戻るボタンが正しく機能するようになりました（replace パラメータのおかげで）

## 影響範囲

修正は以下のファイルに影響します：

- `/portal/frontend/src/App.js`
- `/portal/frontend/src/components/auth/Login.js`

## テスト方法

以下の流れで正しく動作することを確認しました：

1. ログアウト状態から `/` にアクセス → ログインページにリダイレクト
2. ログイン実行 → ダッシュボードページに正しくリダイレクト
3. ログイン状態から `/login` にアクセス → ダッシュボードページにリダイレクト

## 技術的な補足

React Router v6 では、以下の点に注意が必要です：

1. リダイレクトには `Navigate` コンポーネントを使用するのがベストプラクティス
2. `replace` プロパティを使用すると、ナビゲーション履歴に余分なエントリを追加せず、戻るボタンの動作が自然になる
3. `window.location` による直接リダイレクトは React Router のナビゲーション状態を破壊するため避けるべき