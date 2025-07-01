/**
 * AdminAuthGuard.js - 管理者権限が必要なルートを保護するコンポーネント
 * 
 * Admin以上の権限（AdminまたはSuperAdmin）を持たないユーザーを
 * アクセス拒否ページまたはホームページにリダイレクトします。
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

/**
 * 管理者権限保護コンポーネント
 * 
 * @param {Object} props - コンポーネントのプロパティ
 * @param {React.ReactNode} props.children - 子コンポーネント
 * @param {boolean} [props.requireSuperAdmin=false] - SuperAdminのみ許可するか
 */
const AdminAuthGuard = ({ children, requireSuperAdmin = false }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // ローディング中またはユーザー情報が不完全な場合
  if (loading || (isAuthenticated && !user?.role)) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>読み込み中...</p>
      </div>
    );
  }
  
  // 未認証ならログインページへ
  if (!isAuthenticated) {
    console.log('AdminAuthGuard: 未認証ユーザー、ログインページへリダイレクト');
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }
  
  // ユーザーロールのチェック（デバッグ情報追加）
  const userRole = user?.role || 'User';
  console.log('AdminAuthGuard: ユーザーロール判定', { 
    userObject: user, 
    role: userRole,
    userKeys: user ? Object.keys(user) : 'no user'
  });
  const isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin';
  const isSuperAdmin = userRole === 'SuperAdmin';
  
  // SuperAdminが必要な場合
  if (requireSuperAdmin && !isSuperAdmin) {
    console.log('AdminAuthGuard: SuperAdmin権限が必要です');
    return (
      <Container>
        <Box 
          sx={{ 
            mt: 8, 
            textAlign: 'center',
            p: 4,
            borderRadius: 2,
            backgroundColor: '#f5f5f5'
          }}
        >
          <Typography variant="h4" gutterBottom color="error">
            アクセス権限がありません
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            このページにアクセスするにはスーパー管理者権限が必要です。
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            ホームに戻る
          </Button>
        </Box>
      </Container>
    );
  }
  
  // Admin権限が必要な場合
  if (!isAdmin) {
    console.log('AdminAuthGuard: Admin権限がありません', userRole);
    return (
      <Container>
        <Box 
          sx={{ 
            mt: 8, 
            textAlign: 'center',
            p: 4,
            borderRadius: 2,
            backgroundColor: '#f5f5f5'
          }}
        >
          <Typography variant="h4" gutterBottom color="error">
            アクセス権限がありません
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            このページにアクセスするには管理者権限が必要です。
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            現在のロール: {userRole}
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            ホームに戻る
          </Button>
        </Box>
      </Container>
    );
  }
  
  // 権限がある場合は子要素を表示
  return children;
};

export default AdminAuthGuard;