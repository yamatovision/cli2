/**
 * AuthContext.js - 認証関連のReactコンテキスト
 * 
 * simpleAuthServiceのラッパーとして機能し、
 * Reactコンポーネントに認証状態と機能を提供します。
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import * as simpleAuthService from '../services/simple/simpleAuth.service';

// 認証コンテキストの作成
const AuthContext = createContext(null);

// 認証プロバイダーコンポーネント
export const AuthProvider = ({ children }) => {
  // 認証状態の初期化
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  // 認証状態の更新
  const updateAuthState = () => {
    const user = simpleAuthService.getCurrentStoredUser();
    console.log('AuthContext: ストレージからユーザー情報取得', { 
      user: user, 
      hasUser: !!user,
      role: user?.role,
      userKeys: user ? Object.keys(user) : 'no user'
    });
    setAuthState({
      isAuthenticated: !!user,
      user: user,
      loading: false
    });
  };

  // 初期化時とストレージ変更時の処理
  useEffect(() => {
    console.log('AuthContext: 初期化');
    
    // 初期認証状態をチェック
    updateAuthState();
    
    // ストレージイベントのリスナー（他のタブでの変更を検知）
    const handleStorageChange = (e) => {
      if (e.key === 'simpleUser') {
        console.log('AuthContext: 認証情報の変更を検出');
        updateAuthState();
      }
    };
    
    // タブがアクティブになった時の処理
    const handleFocus = async () => {
      console.log('AuthContext: タブがアクティブになりました');
      try {
        await simpleAuthService.getCurrentUser();
        updateAuthState();
      } catch (error) {
        console.error('AuthContext: 認証チェックエラー:', error);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    
    // クリーンアップ
    return () => {
      console.log('AuthContext: クリーンアップ');
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // コンテキスト値
  const contextValue = {
    // 状態
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    loading: authState.loading,
    
    // メソッド
    login: async (email, password) => {
      try {
        console.log('AuthContext: ログイン処理開始');
        const result = await simpleAuthService.login(email, password);
        console.log('AuthContext: ログインレスポンス', result);
        
        if (result.success) {
          console.log('AuthContext: ログイン成功、認証状態を更新');
          updateAuthState();
          
          // ログイン成功後にサーバーから最新のユーザー情報を取得
          try {
            await simpleAuthService.getCurrentUser(true); // 強制更新
            updateAuthState(); // 再度更新
            console.log('AuthContext: ログイン後のユーザー情報取得完了');
          } catch (getUserError) {
            console.warn('AuthContext: ログイン後のユーザー情報取得エラー:', getUserError);
          }
        }
        return result;
      } catch (error) {
        console.error('AuthContext: ログインエラー:', error);
        throw error;
      }
    },
    
    logout: async () => {
      try {
        const result = await simpleAuthService.logout();
        updateAuthState();
        return result;
      } catch (error) {
        console.error('AuthContext: ログアウトエラー:', error);
        throw error;
      }
    },
    
    getCurrentUser: async () => {
      try {
        console.log('AuthContext: サーバーからユーザー情報取得中...');
        const result = await simpleAuthService.getCurrentUser();
        console.log('AuthContext: サーバーレスポンス', result);
        updateAuthState();
        return result;
      } catch (error) {
        console.error('AuthContext: ユーザー情報取得エラー:', error);
        throw error;
      }
    },
    
    // 後方互換性のため
    getAuthHeader: () => {
      const user = simpleAuthService.getCurrentStoredUser();
      return user?.accessToken ? { Authorization: `Bearer ${user.accessToken}` } : {};
    }
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// カスタムフック
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;