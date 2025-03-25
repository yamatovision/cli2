import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getSimpleOrganizationUsers, 
  addSimpleOrganizationUser, 
  removeSimpleOrganizationUser, 
  updateSimpleUserRole,
  updateSimpleUser,
  getSimpleUser
} from '../../services/simple/simpleUser.service';
import { 
  getSimpleOrganization 
} from '../../services/simple/simpleOrganization.service';
import {
  getSimpleOrganizationApiKeys
} from '../../services/simple/simpleApiKey.service';
import { isLoggedIn, getCurrentUser } from '../../services/simple/simpleAuth.service';

// Material-UI コンポーネント
import { 
  Box, 
  Typography, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Card, 
  CardContent, 
  CardHeader, 
  CircularProgress, 
  Alert, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Grid, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  IconButton,
  Tooltip,
  Chip,
  FormControlLabel,
  Checkbox,
  Divider
} from '@mui/material';

// アイコン
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import KeyIcon from '@mui/icons-material/Key';

/**
 * ユーザー管理コンポーネント
 * Material-UIを使用したシンプルユーザー管理の再実装
 */
const UserManager = ({ organizationId, onUserUpdate }) => {
  const [users, setUsers] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingUser, setAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'User',
    apiKeyId: ''
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // ログイン状態と権限を確認
    const checkAuth = async () => {
      if (!isLoggedIn()) {
        navigate('/simple/login');
        return;
      }
      
      try {
        const userData = await getCurrentUser();
        setCurrentUser(userData.data.user);
        
        // 権限チェック (SuperAdminとAdminのみアクセス可能)
        if (userData.data.user.role !== 'SuperAdmin' && userData.data.user.role !== 'Admin') {
          navigate('/simple/dashboard');
          return;
        }
      } catch (err) {
        console.error('ユーザー情報取得エラー:', err);
        setError('ユーザー情報の取得に失敗しました');
      }
    };
    
    checkAuth();
    fetchData();
  }, [organizationId, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 組織情報を取得
      const orgResponse = await getSimpleOrganization(organizationId);
      
      if (!orgResponse.success) {
        throw new Error(orgResponse.message || '組織データの取得に失敗しました');
      }
      
      setOrganization(orgResponse.data);
      
      // ユーザー一覧を取得
      const usersResponse = await getSimpleOrganizationUsers(organizationId);
      
      if (!usersResponse.success) {
        throw new Error(usersResponse.message || 'ユーザー一覧の取得に失敗しました');
      }
      
      setUsers(usersResponse.data || []);

      // APIキー一覧を取得
      try {
        const apiKeysResponse = await getSimpleOrganizationApiKeys(organizationId);
        if (apiKeysResponse.success) {
          setApiKeys(apiKeysResponse.data || []);
        } else {
          console.warn('APIキー一覧取得エラー:', apiKeysResponse.message);
          setApiKeys([]);
        }
      } catch (apiKeyErr) {
        console.warn('APIキー一覧取得エラー:', apiKeyErr);
        setApiKeys([]);
      }

      // 親コンポーネントに変更を通知（オプション）
      if (onUserUpdate) {
        onUserUpdate(usersResponse.data || []);
      }
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError('データの取得に失敗しました: ' + (err.message || '不明なエラー'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setError('名前、メールアドレス、パスワードは必須です');
      return false;
    }
    
    if (newUser.password.length < 8) {
      setError('パスワードは8文字以上である必要があります');
      return false;
    }
    
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(newUser.email)) {
      setError('有効なメールアドレスを入力してください');
      return false;
    }
    
    return true;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await addSimpleOrganizationUser(
        organizationId, 
        newUser.name, 
        newUser.email, 
        newUser.password, 
        newUser.role,
        newUser.apiKeyId || null
      );
      
      if (!response.success) {
        throw new Error(response.message || 'ユーザーの追加に失敗しました');
      }
      
      // 成功したらフォームをリセットして一覧を更新
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'User',
        apiKeyId: ''
      });
      setAddingUser(false);
      fetchData();
    } catch (err) {
      console.error('ユーザー追加エラー:', err);
      setError('ユーザーの追加に失敗しました: ' + (err.message || '不明なエラー'));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setLoading(true);
      
      const response = await updateSimpleUserRole(organizationId, userId, newRole);
      
      if (!response.success) {
        throw new Error(response.message || 'ユーザーの役割更新に失敗しました');
      }
      
      // 成功したら一覧を更新
      fetchData();
    } catch (err) {
      console.error('役割更新エラー:', err);
      setError('ユーザーの役割更新に失敗しました: ' + (err.message || '不明なエラー'));
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setLoading(true);
      
      const response = await removeSimpleOrganizationUser(organizationId, userToDelete._id);
      
      if (!response.success) {
        throw new Error(response.message || 'ユーザーの削除に失敗しました');
      }
      
      // 成功したらダイアログを閉じて一覧を更新
      setShowDeleteDialog(false);
      setUserToDelete(null);
      fetchData();
    } catch (err) {
      console.error('ユーザー削除エラー:', err);
      setError('ユーザーの削除に失敗しました: ' + (err.message || '不明なエラー'));
      setShowDeleteDialog(false);
      setUserToDelete(null);
      setLoading(false);
    }
  };

  const openDeleteDialog = (user) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };
  
  const openEditMode = (user) => {
    setUserToEdit({
      _id: user._id,
      name: user.name,
      email: user.email,
      password: '',
      showPasswordField: false,
      apiKeyId: user.apiKeyId || '',
    });
    setEditMode(true);
  };
  
  const handleEditUser = async (e) => {
    e.preventDefault();
    
    if (!userToEdit || !userToEdit.name || !userToEdit.email) {
      setError('名前とメールアドレスは必須です');
      return;
    }
    
    // パスワードフィールドを表示している場合、パスワードのバリデーション
    if (userToEdit.showPasswordField && userToEdit.password) {
      if (userToEdit.password.length < 8) {
        setError('パスワードは8文字以上である必要があります');
        return;
      }
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // パスワードが入力されている場合のみパスワードを更新
      const passwordToUpdate = userToEdit.showPasswordField && userToEdit.password ? userToEdit.password : null;
      
      const response = await updateSimpleUser(
        userToEdit._id,
        userToEdit.name,
        userToEdit.email,
        passwordToUpdate,
        userToEdit.apiKeyId || null
      );
      
      if (!response.success) {
        throw new Error(response.message || 'ユーザー情報の更新に失敗しました');
      }
      
      // 成功したら編集モードを閉じて一覧を更新
      setEditMode(false);
      setUserToEdit(null);
      fetchData();
    } catch (err) {
      console.error('ユーザー更新エラー:', err);
      setError('ユーザー情報の更新に失敗しました: ' + (err.message || '不明なエラー'));
      setLoading(false);
    }
  };

  // 現在のユーザーがSuperAdminかどうか
  const isSuperAdmin = currentUser && currentUser.role === 'SuperAdmin';

  if (loading && !organization) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !organization) {
    return (
      <Box sx={{ maxWidth: 640, mx: 'auto', my: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button 
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/simple/dashboard')}
        >
          ダッシュボードに戻る
        </Button>
      </Box>
    );
  }

  return (
    <Box mb={3}>
      {organization && (
        <>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            mb: 3,
            pb: 2,
            borderBottom: '1px solid #eee'
          }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {organization.name} - ユーザー管理
              </Typography>
            </Box>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          )}
          
          <Card variant="outlined" sx={{ mb: 4 }}>
            <CardHeader 
              title="ユーザー一覧" 
              action={
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={addingUser ? <CancelIcon /> : <AddIcon />}
                  onClick={() => setAddingUser(!addingUser)}
                >
                  {addingUser ? 'キャンセル' : 'ユーザーを追加'}
                </Button>
              }
            />
            
            <CardContent>
              {addingUser && (
                <Paper elevation={0} sx={{ 
                  p: 3, 
                  mb: 3, 
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #eee',
                  borderRadius: 1
                }}>
                  <form onSubmit={handleAddUser}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="名前"
                          id="name"
                          name="name"
                          value={newUser.name}
                          onChange={handleInputChange}
                          required
                          variant="outlined"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="メールアドレス"
                          id="email"
                          name="email"
                          type="email"
                          value={newUser.email}
                          onChange={handleInputChange}
                          required
                          variant="outlined"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="パスワード (8文字以上)"
                          id="password"
                          name="password"
                          type="password"
                          value={newUser.password}
                          onChange={handleInputChange}
                          required
                          variant="outlined"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth variant="outlined">
                          <InputLabel id="role-label">役割</InputLabel>
                          <Select
                            labelId="role-label"
                            id="role"
                            name="role"
                            value={newUser.role}
                            onChange={handleInputChange}
                            label="役割"
                          >
                            <MenuItem value="User">ユーザー</MenuItem>
                            <MenuItem value="Admin">管理者</MenuItem>
                            {isSuperAdmin && (
                              <MenuItem value="SuperAdmin">スーパー管理者</MenuItem>
                            )}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth variant="outlined">
                          <InputLabel id="apiKeyId-label">APIキー</InputLabel>
                          <Select
                            labelId="apiKeyId-label"
                            id="apiKeyId"
                            name="apiKeyId"
                            value={newUser.apiKeyId}
                            onChange={handleInputChange}
                            label="APIキー"
                          >
                            <MenuItem value="">選択なし</MenuItem>
                            {apiKeys.map(apiKey => (
                              <MenuItem key={apiKey._id} value={apiKey._id}>
                                {/* APIキー名を表示 */}
                                {apiKey.name || 'API Key'}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end', 
                      gap: 1,
                      mt: 3 
                    }}>
                      <Button
                        variant="outlined"
                        onClick={() => setAddingUser(false)}
                      >
                        キャンセル
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                      >
                        {loading ? '処理中...' : 'ユーザーを追加'}
                      </Button>
                    </Box>
                  </form>
                </Paper>
              )}
              
              {users.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4,
                  color: 'text.secondary'
                }}>
                  <Typography variant="body1" gutterBottom>
                    ユーザーが見つかりません
                  </Typography>
                  {!addingUser && (
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => setAddingUser(true)}
                      sx={{ mt: 1 }}
                    >
                      ユーザーを追加する
                    </Button>
                  )}
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>名前</TableCell>
                        <TableCell>メールアドレス</TableCell>
                        <TableCell>役割</TableCell>
                        <TableCell>APIキー</TableCell>
                        <TableCell align="right">操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user._id} hover>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user._id === currentUser?.id ? (
                              <Chip 
                                label={
                                  user.role === 'SuperAdmin' ? 'スーパー管理者' : 
                                  user.role === 'Admin' ? '管理者' : 'ユーザー'
                                } 
                                color="primary" 
                                variant="outlined"
                                size="small"
                              />
                            ) : (
                              <FormControl fullWidth size="small">
                                <Select
                                  value={user.role}
                                  onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                  displayEmpty
                                  disabled={!isSuperAdmin && user.role === 'SuperAdmin'}
                                  variant="outlined"
                                >
                                  <MenuItem value="User">ユーザー</MenuItem>
                                  <MenuItem value="Admin">管理者</MenuItem>
                                  {isSuperAdmin && (
                                    <MenuItem value="SuperAdmin">スーパー管理者</MenuItem>
                                  )}
                                </Select>
                              </FormControl>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.apiKeyId ? (
                              <Tooltip title={`APIキーID: ${user.apiKeyId}`}>
                                <Chip
                                  icon={<KeyIcon fontSize="small" />}
                                  label={
                                    // APIキー名を表示
                                    apiKeys.find(key => key._id === user.apiKeyId)?.name || 'API Key'
                                  }
                                  variant="outlined"
                                  size="small"
                                />
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" color="text.secondary" fontSize="0.875rem" fontStyle="italic">
                                未設定
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <Button
                                startIcon={<EditIcon />}
                                variant="outlined"
                                size="small"
                                onClick={() => openEditMode(user)}
                              >
                                編集
                              </Button>
                              {user._id !== currentUser?.id && (
                                <Button
                                  startIcon={<DeleteIcon />}
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  onClick={() => openDeleteDialog(user)}
                                >
                                  削除
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
          
          {/* 編集用ダイアログ */}
          <Dialog 
            open={editMode} 
            onClose={() => {
              setEditMode(false);
              setUserToEdit(null);
            }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>ユーザー情報編集</DialogTitle>
            <form onSubmit={handleEditUser}>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="名前"
                      value={userToEdit?.name || ''}
                      onChange={(e) => setUserToEdit({...userToEdit, name: e.target.value})}
                      margin="normal"
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="メールアドレス"
                      type="email"
                      value={userToEdit?.email || ''}
                      onChange={(e) => setUserToEdit({...userToEdit, email: e.target.value})}
                      margin="normal"
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={userToEdit?.showPasswordField || false}
                          onChange={() => setUserToEdit({
                            ...userToEdit, 
                            showPasswordField: !userToEdit?.showPasswordField,
                            password: ''
                          })}
                        />
                      }
                      label="パスワードを変更する"
                    />
                  </Grid>
                  
                  {userToEdit?.showPasswordField && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="新しいパスワード (8文字以上)"
                        type="password"
                        value={userToEdit?.password || ''}
                        onChange={(e) => setUserToEdit({...userToEdit, password: e.target.value})}
                        margin="normal"
                        inputProps={{
                          minLength: 8
                        }}
                      />
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <FormControl fullWidth variant="outlined" margin="normal">
                      <InputLabel id="edit-apikey-label">APIキー</InputLabel>
                      <Select
                        labelId="edit-apikey-label"
                        id="edit-apikey"
                        value={userToEdit?.apiKeyId || ''}
                        onChange={(e) => setUserToEdit({...userToEdit, apiKeyId: e.target.value})}
                        label="APIキー"
                      >
                        <MenuItem value="">選択なし</MenuItem>
                        {apiKeys.map(apiKey => (
                          <MenuItem key={apiKey._id} value={apiKey._id}>
                            {/* APIキー名を表示 */}
                            {apiKey.name || 'API Key'}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button 
                  onClick={() => {
                    setEditMode(false);
                    setUserToEdit(null);
                  }}
                >
                  キャンセル
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={loading}
                >
                  {loading ? '保存中...' : '保存する'}
                </Button>
              </DialogActions>
            </form>
          </Dialog>
          
          {/* 削除確認ダイアログ */}
          <Dialog
            open={showDeleteDialog}
            onClose={() => {
              setShowDeleteDialog(false);
              setUserToDelete(null);
            }}
          >
            <DialogTitle>ユーザーを削除</DialogTitle>
            <DialogContent>
              <DialogContentText>
                本当に「{userToDelete?.name}」を削除しますか？
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => {
                  setShowDeleteDialog(false);
                  setUserToDelete(null);
                }}
                disabled={loading}
              >
                キャンセル
              </Button>
              <Button 
                onClick={handleDeleteUser}
                variant="contained"
                color="error"
                disabled={loading}
              >
                {loading ? '削除中...' : '削除する'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default UserManager;