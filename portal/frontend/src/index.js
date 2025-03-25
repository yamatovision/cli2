import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import axios from 'axios';
// Bootstrap CSSをインポート
import 'bootstrap/dist/css/bootstrap.min.css';

// axios のデフォルト設定
// 開発環境ではプロキシを使用してリクエストを転送するため、明示的なbaseURLは設定しない
// 本番環境では環境変数から取得したURLを使用
if (process.env.NODE_ENV === 'production') {
  axios.defaults.baseURL = process.env.REACT_APP_API_URL || '/api';
} else {
  // 開発環境では相対パスを使用（React開発サーバーのプロキシ機能が/apiリクエストを転送）
  axios.defaults.baseURL = '/api';
}

// 認証システムの改善
// - 認証コンテキスト (AuthContext) を使用して一元管理
// - 認証関連のAPIリクエストは authApi.js 経由に統一
// - ローカルストレージ操作をコンテキスト内に閉じ込め
// - 不要な認証チェックの繰り返しを排除
// - レート制限エラーの発生を防止

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);