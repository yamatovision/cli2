import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  Container, 
  Snackbar, 
  Alert,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Chip,
  Tooltip
} from '@mui/material';
import { 
  Home as HomeIcon, 
  ExitToApp as LogoutIcon,
  Dashboard as DashboardIcon,
  Description as PromptIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';

// コンポーネント
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import PromptList from './components/prompts/PromptList';
import PromptDetail from './components/prompts/PromptDetail';
import PromptForm from './components/prompts/PromptForm';
import UserList from './components/users/UserList';
import UserDetail from './components/users/UserDetail';

// 管理者ダッシュボード
import AdminDashboard from './components/admin/AdminDashboard';
import UsageLimits from './components/admin/UsageLimits';

// シンプルモード
import SimpleApp from './components/simple/SimpleApp';

// 認証コンテキスト
import { AuthProvider, useAuth } from './contexts/AuthContext';

// テーマの設定
const theme = createTheme({
  palette: {
    primary: {
      main: '#4a6eff',
    },
    secondary: {
      main: '#5f6368',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// 認証状態確認用のプライベートルート - 認証コンテキスト対応版
const PrivateRoute = ({ children }) => {
  // 認証コンテキストの使用
  const { isAuthenticated, loading } = useAuth();
  
  // 認証処理中の場合はローディング表示
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h6">読み込み中...</Typography>
      </Box>
    );
  }
  
  // 未認証の場合はログインページにリダイレクト
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // 認証済みの場合は子コンポーネントを表示
  return children;
};

// AuthContextを内部で使用するメインアプリコンポーネント
const MainApp = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // シンプルモードへのリダイレクト
  const isSimplePath = window.location.pathname.startsWith('/simple');

  // ログアウト処理
  const handleLogout = () => {
    logout();
    showNotification('ログアウトしました', 'success');
  };

  // 通知表示
  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  // 通知閉じる
  const handleCloseNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  };

  // ログインページ以外ではヘッダーを表示する
  const shouldShowHeader = () => {
    const currentPath = window.location.pathname;
    // ログインページではヘッダーを表示しない
    return currentPath !== '/login';
  };

  // シンプルモードの場合は別のコンポーネントをレンダリング
  if (isSimplePath) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <SimpleApp />
        </Router>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {(isAuthenticated || (!isAuthenticated && shouldShowHeader())) && (
          <AppBar position="sticky">
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="home"
                sx={{ mr: 2 }}
                onClick={() => window.location.href = isAuthenticated ? '/dashboard' : '/login'}
                title={isAuthenticated ? "ダッシュボードへ" : "ログインへ"}
              >
                {isAuthenticated ? <DashboardIcon /> : <HomeIcon />}
              </IconButton>
              
              <Typography variant="h5" component="div" sx={{ 
                flexGrow: 1, 
                fontWeight: 'bold', 
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center'
              }}>
                AppGenius
              </Typography>
              
              {user ? (
                <Box mr={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'medium', mr: 1 }}>
                    {user.name || user.email || ''}
                  </Typography>
                  {user.role && (
                    <Chip 
                      size="small" 
                      label={user.role} 
                      color="default"
                      variant="outlined"
                      sx={{ 
                        fontSize: '0.75rem', 
                        height: '24px',
                        fontWeight: 'medium',
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                  )}
                </Box>
              ) : (
                shouldShowHeader() && !isAuthenticated && (
                  <Box mr={3}>
                    <Typography variant="body2">
                      ゲスト
                    </Typography>
                  </Box>
                )
              )}
              
              {isAuthenticated ? (
                <>
                  {/* ナビゲーションリンク */}
                  <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                    <Tooltip title="ダッシュボード" arrow>
                      <IconButton
                        color="inherit"
                        onClick={() => window.location.href = '/dashboard'}
                        size="large"
                        sx={{ 
                          backgroundColor: window.location.pathname === '/dashboard' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.25)'
                          }
                        }}
                      >
                        <DashboardIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="プロンプト管理" arrow>
                      <IconButton
                        color="inherit"
                        onClick={() => window.location.href = '/prompts'}
                        size="large"
                        sx={{ 
                          backgroundColor: window.location.pathname.startsWith('/prompts') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.25)'
                          }
                        }}
                      >
                        <PromptIcon />
                      </IconButton>
                    </Tooltip>
                    {user?.role === 'SuperAdmin' || user?.role === 'Admin' ? (
                      <Tooltip title="ユーザー管理" arrow>
                        <IconButton
                          color="inherit"
                          onClick={() => window.location.href = '/users'}
                          size="large"
                          sx={{ 
                            backgroundColor: window.location.pathname.startsWith('/users') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.25)'
                            }
                          }}
                        >
                          <PeopleIcon />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                    {user?.role === 'SuperAdmin' || user?.role === 'Admin' ? (
                      <Tooltip title="管理者画面" arrow>
                        <IconButton
                          color="inherit"
                          onClick={() => window.location.href = '/admin'}
                          size="large"
                          sx={{ 
                            backgroundColor: window.location.pathname.startsWith('/admin') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.25)'
                            }
                          }}
                        >
                          <AdminIcon />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </Box>
                  
                  <Tooltip title="ログアウト" arrow>
                    <IconButton 
                      color="inherit" 
                      onClick={handleLogout}
                      size="large"
                      sx={{ ml: 1 }}
                    >
                      <LogoutIcon />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <Tooltip title="ログイン" arrow>
                  <IconButton
                    color="inherit"
                    onClick={() => window.location.href = '/login'}
                    size="large"
                  >
                    <LogoutIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Toolbar>
          </AppBar>
        )}

        <Container>
          <Routes>
            <Route path="/login" element={
              // 認証コンテキストを使用した判定
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : <Login />
            } />
            
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            
            {/* プロンプト管理ルート */}
            <Route path="/prompts" element={
              <PrivateRoute>
                <PromptList />
              </PrivateRoute>
            } />
            
            <Route path="/prompts/create" element={
              <PrivateRoute>
                <PromptForm />
              </PrivateRoute>
            } />
            
            <Route path="/prompts/edit/:id" element={
              <PrivateRoute>
                <PromptForm />
              </PrivateRoute>
            } />
            
            <Route path="/prompts/:id" element={
              <PrivateRoute>
                <PromptDetail />
              </PrivateRoute>
            } />
            
            {/* ユーザー管理ルート */}
            <Route path="/users" element={
              <PrivateRoute>
                <UserList />
              </PrivateRoute>
            } />
            
            <Route path="/users/new" element={
              <PrivateRoute>
                <UserDetail />
              </PrivateRoute>
            } />
            
            <Route path="/users/:id" element={
              <PrivateRoute>
                <UserDetail />
              </PrivateRoute>
            } />
            
            
            {/* 組織関連ルート、ワークスペース関連ルートを削除 */}
            
            {/* シンプル化のため使用量ダッシュボードも削除 */}
            
            {/* 管理者ダッシュボード */}
            <Route path="/admin" element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            } />
            
            <Route path="/admin/usage-limits" element={
              <PrivateRoute>
                <UsageLimits />
              </PrivateRoute>
            } />
            
            {/* シンプルモードへのリダイレクト - SimpleAppコンポーネントで処理 */}
            <Route path="/simple/*" element={null} />
            
            <Route path="/" element={
              // 認証コンテキストを使用
              isAuthenticated 
                ? <Navigate to="/dashboard" replace />
                : <Navigate to="/login" replace />
            } />
            
            <Route path="*" element={
              <Container>
                <Box mt={8} textAlign="center">
                  <Typography variant="h4" gutterBottom>
                    404 - ページが見つかりません
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => window.location.href = '/'}
                  >
                    ホームに戻る
                  </Button>
                </Box>
              </Container>
            } />
          </Routes>
        </Container>
        
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Router>
    </ThemeProvider>
  );
};

// メインアプリをラップするためのApp関数
const App = () => {
  // シンプルモードへのリダイレクト
  const isSimplePath = window.location.pathname.startsWith('/simple');

  // シンプルモードの場合
  if (isSimplePath) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <SimpleApp />
        </Router>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;