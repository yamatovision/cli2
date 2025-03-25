import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  Button, 
  Skeleton,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  LinearProgress,
  Grid
} from '@mui/material';
import { Link } from 'react-router-dom';
import { 
  Business as BusinessIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Key as KeyIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  BarChart as BarChartIcon,
  Refresh as RefreshIcon,
  WorkspacePremium as WorkspaceIcon,
  Settings as SettingsIcon,
  Tabs as TabsIcon
} from '@mui/icons-material';
import { 
  getSimpleOrganizations, 
  createSimpleOrganization,
  deleteSimpleOrganization,
  getSimpleOrganization
} from '../../services/simple/simpleOrganization.service';
import { getCurrentUser } from '../../services/simple/simpleAuth.service';

/**
 * 組織カード表示コンポーネント
 * シンプルダッシュボードの組織カード表示機能を標準ダッシュボードに統合
 * @param {Object} props
 * @param {Function} props.onSelectOrganization - 組織選択時のコールバック関数
 * @param {Function} props.onOpenUserManagement - ユーザー管理を開くためのコールバック関数
 * @param {Function} props.onOpenWorkspaceManager - ワークスペース管理を開くためのコールバック関数
 * @param {Function} props.onOrganizationsLoaded - 組織一覧が読み込まれた時のコールバック関数
 */
const OrganizationCards = ({ 
  onSelectOrganization = () => {}, 
  onOpenUserManagement = () => {},
  onOpenWorkspaceManager = () => {},
  onOrganizationsLoaded = () => {}
}) => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [organizationToDelete, setOrganizationToDelete] = useState(null);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [deletingOrg, setDeletingOrg] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // 新規組織作成用のフォーム状態
  const [newOrganization, setNewOrganization] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    // 現在のユーザー情報を取得
    const fetchUserData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData.data.user);
      } catch (err) {
        console.error('ユーザー情報取得エラー:', err);
        setError('ユーザー情報の取得に失敗しました');
      }
    };

    // 組織一覧を取得
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const response = await getSimpleOrganizations();
        
        // 組織データに各組織のメンバー数を追加
        const orgsWithMemberCounts = await Promise.all(response.data.map(async (org) => {
          try {
            // 各組織のメンバー数をAPIから取得
            const orgDetails = await getSimpleOrganization(org._id);
            return {
              ...org,
              members: orgDetails.data.members || []
            };
          } catch (err) {
            console.error(`組織 ${org._id} の詳細取得エラー:`, err);
            return {
              ...org,
              members: []
            };
          }
        }));
        
        setOrganizations(orgsWithMemberCounts);
        setLoading(false);
        
        // 読み込んだ組織一覧を親コンポーネントにも通知
        onOrganizationsLoaded(orgsWithMemberCounts);
      } catch (err) {
        console.error('組織一覧取得エラー:', err);
        setError('組織一覧の取得に失敗しました');
        setLoading(false);
      }
    };

    fetchUserData();
    fetchOrganizations();
  }, []);

  // ユーザーがSuperAdminまたはAdminの場合のみ新規組織作成ボタンを表示
  const canCreateOrganization = user && (user.role === 'SuperAdmin' || user.role === 'Admin');
  
  // 入力値の変更ハンドラー
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOrganization(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 組織作成ダイアログをリセット
  const resetCreateDialog = () => {
    setNewOrganization({
      name: '',
      description: ''
    });
    setCreateDialogOpen(false);
    setError(null);
  };
  
  // 新規組織作成の処理
  const handleCreateOrganization = async () => {
    // バリデーション
    if (!newOrganization.name.trim()) {
      setError('組織名は必須です');
      return;
    }
    
    try {
      setCreatingOrg(true);
      setError(null);
      
      // 組織名のみで作成（ワークスペース名は後でワークスペース管理から設定）
      const response = await createSimpleOrganization(
        newOrganization.name.trim(),
        newOrganization.description.trim(),
        newOrganization.name.trim() // 一時的にはorganization.nameをworkspaceNameとして使用
      );
      
      if (!response.success) {
        throw new Error(response.message || '組織の作成に失敗しました');
      }
      
      // 成功メッセージを表示
      setSuccessMessage('組織が正常に作成されました');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // ダイアログを閉じて組織一覧を更新
      resetCreateDialog();
      fetchOrganizations();
      
    } catch (err) {
      console.error('組織作成エラー:', err);
      setError('組織の作成に失敗しました: ' + (err.message || '不明なエラー'));
    } finally {
      setCreatingOrg(false);
    }
  };
  
  // 削除ダイアログを開く
  const openDeleteDialog = (org) => {
    setOrganizationToDelete(org);
    setDeleteDialogOpen(true);
  };
  
  // 組織削除の処理
  const handleDeleteOrganization = async () => {
    if (!organizationToDelete) return;
    
    try {
      setDeletingOrg(true);
      setError(null);
      
      const response = await deleteSimpleOrganization(organizationToDelete._id);
      
      if (!response.success) {
        throw new Error(response.message || '組織の削除に失敗しました');
      }
      
      // 成功メッセージを表示
      setSuccessMessage('組織が正常に削除されました');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // ダイアログを閉じて組織一覧を更新
      setDeleteDialogOpen(false);
      setOrganizationToDelete(null);
      fetchOrganizations();
      
    } catch (err) {
      console.error('組織削除エラー:', err);
      setError('組織の削除に失敗しました: ' + (err.message || '不明なエラー'));
    } finally {
      setDeletingOrg(false);
    }
  };

  if (loading) {
    return (
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <BusinessIcon sx={{ mr: 1.5, fontSize: '28px', color: 'primary.main' }} />
            組織一覧
          </Typography>
          <Skeleton variant="rectangular" width={150} height={40} />
        </Box>
        
        <Card variant="outlined" sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="組織一覧">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>組織名</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>ワークスペース</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>APIキー数</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>メンバー数</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[1, 2, 3, 4].map((item) => (
                  <TableRow key={item}>
                    <TableCell><Skeleton variant="text" width="80%" height={40} /></TableCell>
                    <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Skeleton variant="circular" width={32} height={32} />
                        <Skeleton variant="circular" width={32} height={32} />
                        <Skeleton variant="circular" width={32} height={32} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    );
  }

  // 組織作成API関数の修正
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await getSimpleOrganizations();
      setOrganizations(response.data);
      setLoading(false);
    } catch (err) {
      console.error('組織一覧取得エラー:', err);
      setError('組織一覧の取得に失敗しました');
      setLoading(false);
    }
  };

  return (
    <Box mb={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          <BusinessIcon sx={{ mr: 1.5, fontSize: '28px', color: 'primary.main' }} />
          組織一覧
        </Typography>
        {canCreateOrganization && (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => setCreateDialogOpen(true)}
            startIcon={<AddIcon />}
          >
            新規組織作成
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Card variant="outlined" sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchOrganizations}
            sx={{ mr: 2 }}
          >
            更新
          </Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="組織一覧">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>組織名</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>ワークスペース</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>APIキー数</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>メンバー数</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                      組織が見つかりません
                    </Typography>
                    {canCreateOrganization && (
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        onClick={() => setCreateDialogOpen(true)}
                        startIcon={<AddIcon />}
                        sx={{ mb: 3 }}
                      >
                        新規組織を作成する
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map(org => (
                  <TableRow 
                    key={org._id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {org.name}
                        </Typography>
                        {org.description && (
                          <Typography variant="body2" color="textSecondary">
                            {org.description}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {org.workspaceName || '未設定'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={<KeyIcon />} 
                        label={`${org.apiKeyIds?.length || 0}個`} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={<PeopleIcon />} 
                        label={`${org.members?.length || 0}人`} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="ワークスペース管理">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              // ワークスペース管理ボタンを押した場合はワークスペースタブへ
                              onSelectOrganization(org._id);
                              // 注: このボタンは組織を選択してワークスペースタブ(タブ1)に移動する
                            }}
                          >
                            <WorkspaceIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="APIキー管理">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              // APIキー管理ボタンを押した場合はAPIキー管理タブへ
                              onOpenWorkspaceManager(org._id);
                              // 注: このボタンは組織を選択してAPIキー管理タブ(タブ2)に移動する
                            }}
                          >
                            <KeyIcon />
                          </IconButton>
                        </Tooltip>
                        {canCreateOrganization && (
                          <Tooltip title="ユーザー管理">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => onOpenUserManagement(org._id)}
                            >
                              <PeopleIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canCreateOrganization && (
                          <Tooltip title="削除">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openDeleteDialog(org)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      
      {/* 組織作成ダイアログ */}
      <Dialog 
        open={createDialogOpen} 
        onClose={resetCreateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          新規組織作成
          <IconButton
            aria-label="close"
            onClick={resetCreateDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="組織名"
              name="name"
              autoFocus
              value={newOrganization.name}
              onChange={handleInputChange}
              disabled={creatingOrg}
            />
            <TextField
              margin="normal"
              fullWidth
              id="description"
              label="説明（任意）"
              name="description"
              multiline
              rows={3}
              value={newOrganization.description}
              onChange={handleInputChange}
              disabled={creatingOrg}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={resetCreateDialog} 
            color="inherit"
            disabled={creatingOrg}
          >
            キャンセル
          </Button>
          <Button 
            onClick={handleCreateOrganization} 
            variant="contained"
            color="primary"
            disabled={creatingOrg || !newOrganization.name.trim()}
          >
            {creatingOrg ? '作成中...' : '作成'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 組織削除ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deletingOrg && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>組織を削除</DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Typography>
            本当に「{organizationToDelete?.name}」を削除しますか？
          </Typography>
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            この操作は取り消せません。組織に関連するすべてのデータが削除されます。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            color="inherit"
            disabled={deletingOrg}
          >
            キャンセル
          </Button>
          <Button 
            onClick={handleDeleteOrganization} 
            variant="contained"
            color="error"
            disabled={deletingOrg}
          >
            {deletingOrg ? '削除中...' : '削除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrganizationCards;