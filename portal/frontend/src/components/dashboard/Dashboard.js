import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Key as KeyIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import './dashboard-user.css';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  generateCliApiKey,
  deactivateCliApiKey
} from '../../services/simple/simpleUser.service';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  
  // ダイアログの状態管理
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  
  // フォームの状態管理
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'User'
  });

  // コンポーネントマウント時にユーザー一覧を取得
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getUsers();
      console.log('ユーザー一覧レスポンス:', response);
      if (response && response.data) {
        setUsers(response.data);
      }
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError('ユーザー一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ユーザー追加・編集ダイアログを開く
  const handleOpenUserDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'User'
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'User'
      });
    }
    setOpenUserDialog(true);
  };

  // ユーザー追加・編集ダイアログを閉じる
  const handleCloseUserDialog = () => {
    setOpenUserDialog(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'User'
    });
  };

  // ユーザー削除ダイアログを開く
  const handleOpenDeleteDialog = (user) => {
    setDeletingUser(user);
    setOpenDeleteDialog(true);
  };

  // ユーザー削除ダイアログを閉じる
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeletingUser(null);
  };

  // フォームデータの変更処理
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ユーザー保存処理
  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        // 編集の場合
        await updateUser(editingUser._id, formData.name, formData.email, formData.password || null);
      } else {
        // 新規作成の場合
        await createUser(formData.name, formData.email, formData.password, formData.role);
      }
      
      handleCloseUserDialog();
      fetchUsers(); // ユーザー一覧を再取得
    } catch (err) {
      console.error('ユーザー保存エラー:', err);
      setError(editingUser ? 'ユーザーの更新に失敗しました' : 'ユーザーの作成に失敗しました');
    }
  };

  // ユーザー削除処理
  const handleDeleteUser = async () => {
    try {
      await deleteUser(deletingUser._id);
      handleCloseDeleteDialog();
      fetchUsers(); // ユーザー一覧を再取得
    } catch (err) {
      console.error('ユーザー削除エラー:', err);
      setError('ユーザーの削除に失敗しました');
    }
  };

  // 役割の表示名を取得
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'SuperAdmin':
        return 'スーパー管理者';
      case 'Admin':
        return '管理者';
      case 'User':
        return 'ユーザー';
      default:
        return role;
    }
  };

  // CLI APIキー生成処理
  const handleGenerateApiKey = async (userId) => {
    try {
      const response = await generateCliApiKey(userId);
      if (response && response.data) {
        // APIキーをクリップボードにコピー
        navigator.clipboard.writeText(response.data.key);
        alert(`APIキーを発行しました。クリップボードにコピーされました。\n\nAPIキー: ${response.data.key}`);
        fetchUsers(); // ユーザー一覧を再取得
      }
    } catch (err) {
      console.error('APIキー生成エラー:', err);
      setError('APIキーの生成に失敗しました');
    }
  };

  // CLI APIキーコピー処理
  const handleCopyApiKey = (apiKey) => {
    navigator.clipboard.writeText(apiKey);
    alert('APIキーをクリップボードにコピーしました');
  };

  // CLI APIキー無効化処理
  const handleDeactivateApiKey = async (userId, apiKey) => {
    if (window.confirm('このAPIキーを無効化してもよろしいですか？')) {
      try {
        await deactivateCliApiKey(userId, apiKey);
        alert('APIキーを無効化しました');
        fetchUsers(); // ユーザー一覧を再取得
      } catch (err) {
        console.error('APIキー無効化エラー:', err);
        setError('APIキーの無効化に失敗しました');
      }
    }
  };

  // ローディング表示
  if (loading) {
    return (
      <Container>
        <Box my={4} display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        {/* ヘッダー */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            ユーザー一覧
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenUserDialog()}
            className="simple-button primary"
          >
            新規ユーザー追加
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* ユーザー一覧テーブル */}
        <TableContainer component={Paper} className="simple-user-table-container">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>名前</TableCell>
                <TableCell>メールアドレス</TableCell>
                <TableCell>ロール</TableCell>
                <TableCell>CLI APIキー</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id || user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getRoleDisplayName(user.role)}
                      color={user.role === 'SuperAdmin' ? 'error' : user.role === 'Admin' ? 'warning' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.cliApiKeys && user.cliApiKeys.length > 0 ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {user.cliApiKeys[0].key}
                        </Typography>
                        <Tooltip title="APIキーをコピー">
                          <IconButton 
                            size="small" 
                            onClick={() => handleCopyApiKey(user.cliApiKeys[0].key)}
                            sx={{ padding: '2px' }}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="APIキーを無効化">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeactivateApiKey(user._id || user.id, user.cliApiKeys[0].key)}
                            sx={{ padding: '2px', color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Button
                        size="small"
                        startIcon={<KeyIcon />}
                        onClick={() => handleGenerateApiKey(user._id || user.id)}
                        variant="outlined"
                      >
                        発行
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="編集">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenUserDialog(user)}
                        className="simple-button secondary small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="削除">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDeleteDialog(user)}
                        className="simple-button danger small"
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ユーザー追加・編集ダイアログ */}
        <Dialog open={openUserDialog} onClose={handleCloseUserDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingUser ? 'ユーザー編集' : '新規ユーザー追加'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="名前"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="メールアドレス"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="パスワード"
                type="password"
                value={formData.password}
                onChange={(e) => handleFormChange('password', e.target.value)}
                fullWidth
                required={!editingUser}
                helperText={editingUser ? "空白の場合はパスワードを変更しません" : ""}
              />
              <FormControl fullWidth>
                <InputLabel>ロール</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => handleFormChange('role', e.target.value)}
                  label="ロール"
                >
                  <MenuItem value="User">ユーザー</MenuItem>
                  <MenuItem value="Admin">管理者</MenuItem>
                  <MenuItem value="SuperAdmin">スーパー管理者</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseUserDialog}>キャンセル</Button>
            <Button onClick={handleSaveUser} variant="contained">
              {editingUser ? '更新' : '作成'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ユーザー削除確認ダイアログ */}
        <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
          <DialogTitle>ユーザー削除の確認</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ユーザー「{deletingUser?.name}」を削除してもよろしいですか？
              この操作は取り消すことができません。
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>キャンセル</Button>
            <Button onClick={handleDeleteUser} color="error" variant="contained">
              削除
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Dashboard;