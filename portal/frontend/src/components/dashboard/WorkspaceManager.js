import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  Grid, 
  Alert, 
  CircularProgress,
  InputAdornment,
  Divider,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { 
  Launch as LaunchIcon, 
  Check as CheckIcon,
  Warning as WarningIcon,
  WorkspacePremium as WorkspaceIcon
} from '@mui/icons-material';
import { createSimpleWorkspace, getSimpleOrganization, updateSimpleOrganization } from '../../services/simple/simpleOrganization.service';

/**
 * ワークスペース管理コンポーネント
 * 組織のワークスペース作成・管理機能を提供
 * @param {Object} props
 * @param {string} props.organizationId - 組織ID
 * @param {Function} props.onWorkspaceUpdate - ワークスペースの更新時に呼び出されるコールバック
 */
const WorkspaceManager = ({ organizationId, onWorkspaceUpdate = () => {} }) => {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [editingName, setEditingName] = useState(false);

  // 組織情報を取得
  useEffect(() => {
    if (organizationId) {
      fetchOrganizationData();
    }
  }, [organizationId]);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getSimpleOrganization(organizationId);
      
      if (!response.success) {
        throw new Error(response.message || '組織データの取得に失敗しました');
      }
      
      console.log('取得した組織データ:', response.data);
      
      // API getSimpleOrganization は organization, apiKeys, members を含む構造を返す
      // simpleOrganization.controller.js の getOrganization 関数で返されるデータ構造を確認
      const orgData = response.data.organization || response.data;
      console.log('使用する組織データ:', orgData);
      
      // メンバー情報も保存
      const members = response.data.members || [];
      console.log('組織のメンバー:', members);
      
      // 組織データにメンバー情報を追加
      const enhancedOrgData = {
        ...orgData,
        members: members
      };
      
      setOrganization(enhancedOrgData);
      setWorkspaceName(orgData.workspaceName || '');
      
      console.log('設定したワークスペース名:', orgData.workspaceName || '');
      
      // すでにワークスペースIDが設定されているか確認
      if (orgData.workspaceId) {
        setWorkspaceId(orgData.workspaceId);
      }
    } catch (err) {
      console.error('組織データ取得エラー:', err);
      setError('組織データの取得に失敗しました: ' + (err.message || '不明なエラー'));
    } finally {
      setLoading(false);
    }
  };

  // ワークスペース名の更新
  const handleUpdateWorkspaceName = async () => {
    if (!workspaceName.trim()) {
      setError('ワークスペース名を入力してください');
      return;
    }
    
    try {
      setUpdating(true);
      setError(null);
      setSuccess(null);
      
      console.log('更新前の組織データ:', organization);
      console.log('更新するワークスペース名:', workspaceName.trim());
      
      // 組織のワークスペース名を更新
      const response = await updateSimpleOrganization(
        organizationId,
        organization.name,
        organization.description,
        workspaceName.trim()
      );
      
      console.log('組織更新API応答:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'ワークスペース名の更新に失敗しました');
      }
      
      // 更新成功
      setSuccess('ワークスペース名が正常に更新されました');
      setEditingName(false);
      
      // 少し待機してから再取得（DB更新に時間がかかる場合がある）
      setTimeout(() => {
        // 最新の組織データを再取得
        fetchOrganizationData();
      }, 500);
    } catch (err) {
      console.error('ワークスペース名更新エラー:', err);
      setError('ワークスペース名の更新に失敗しました: ' + (err.message || '不明なエラー'));
    } finally {
      setUpdating(false);
    }
  };
  
  // APIを使用して自動的にワークスペースを作成
  const handleCreateWorkspace = async () => {
    try {
      if (!organizationId) {
        setError('組織IDが指定されていません');
        return;
      }
      
      if (!workspaceName.trim()) {
        setError('ワークスペース名を入力してください');
        return;
      }
      
      setCreating(true);
      setError(null);
      setSuccess(null);
      
      console.log('作成前の組織データ:', organization);
      console.log('設定するワークスペース名:', workspaceName.trim());
      
      // ワークスペース名を組織に保存（常に最新の名前で更新）
      console.log('ワークスペース名を更新します');
      const updateResponse = await updateSimpleOrganization(
        organizationId,
        organization.name,
        organization.description,
        workspaceName.trim()
      );
      
      console.log('組織更新API応答:', updateResponse);
      
      if (!updateResponse.success) {
        throw new Error(updateResponse.message || 'ワークスペース名の保存に失敗しました');
      }
      
      // 少し待機してから実行（DB更新が確実に反映されるのを待つ）
      console.log('データベース更新を待機中...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // ワークスペースを作成（設定したワークスペース名で作成される）
      console.log('ワークスペース作成APIを呼び出します');
      const response = await createSimpleWorkspace(organizationId);
      
      console.log('ワークスペース作成API応答:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'ワークスペースの作成に失敗しました');
      }
      
      // 作成成功
      let successMessage = 'ワークスペースが正常に作成されました';
      
      // 警告がある場合は表示
      if (response.warning) {
        successMessage += ' (警告あり: ' + response.warning + ')';
      }
      
      setSuccess(successMessage);
      
      // ワークスペースの詳細をコンソールに出力（デバッグ用）
      console.log('ワークスペース作成結果:', response.data);
      
      // ワークスペース情報を設定
      if (response.data) {
        // ワークスペースIDを設定
        if (response.data.workspaceId) {
          setWorkspaceId(response.data.workspaceId);
          console.log('ワークスペースID設定:', response.data.workspaceId);
        }
        
        // 返却されたワークスペース名が異なる場合は更新
        if (response.data.workspaceName && response.data.workspaceName !== workspaceName) {
          setWorkspaceName(response.data.workspaceName);
          console.log('ワークスペース名更新:', response.data.workspaceName);
        }
        
        // 現在のAnthropicのワークスペースIDは "wrkspc_" プレフィックスを持っているか確認
        if (response.data.workspaceId && !response.data.workspaceId.startsWith('wrkspc_')) {
          console.warn('警告: ワークスペースID形式が通常と異なります:', response.data.workspaceId);
          
          // 特別なアラートのためにstate変数を設定
          setError('警告: ワークスペースIDの形式が通常と異なります。Anthropic APIキーの設定を確認してください。');
        }
      }
      
      // 編集モードを終了
      setEditingName(false);
      
      // 親コンポーネントに通知
      onWorkspaceUpdate();
      
      // 少し待機してから再取得（DB更新に時間がかかる場合がある）
      setTimeout(() => {
        console.log('組織データを再取得します');
        // 最新の組織データを再取得
        fetchOrganizationData();
      }, 1000);
    } catch (err) {
      console.error('ワークスペース作成エラー:', err);
      
      // エラーメッセージの抽出とフォーマット
      let errorMessage = 'ワークスペースの作成に失敗しました';
      
      if (err.message) {
        errorMessage += ': ' + err.message;
      }
      
      // エラーオブジェクトに詳細情報がある場合は追加
      if (err.errorCategory) {
        errorMessage += ` (カテゴリ: ${err.errorCategory})`;
      }
      
      if (err.advice) {
        errorMessage += ` - ${err.advice}`;
      }
      
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  // ローディング表示
  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  // 組織データが取得できない場合
  if (!organization) {
    return (
      <Alert severity="error">
        組織データを取得できませんでした。再度お試しください。
      </Alert>
    );
  }

  // ワークスペースが既に存在する場合
  const hasWorkspace = !!workspaceId;

  return (
    <Box mb={3}>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          <WorkspaceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          ワークスペース管理
        </Typography>
        <Divider sx={{ my: 2 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* ワークスペース情報カード */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  ワークスペース情報
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    ワークスペース名:
                  </Typography>
                  {editingName ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        placeholder="ワークスペース名を入力"
                        disabled={updating}
                        sx={{ mr: 1 }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleUpdateWorkspaceName}
                        disabled={updating || !workspaceName.trim()}
                      >
                        {updating ? '保存中...' : '保存'}
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'medium', mr: 1 }}>
                        {workspaceName || '未設定'}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setEditingName(true)}
                      >
                        編集
                      </Button>
                    </Box>
                  )}
                  
                  <Typography variant="body2" color="text.secondary">
                    ワークスペースID:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography variant="body1" sx={{ fontWeight: 'medium', mr: 1 }}>
                      {workspaceId ? workspaceId : '未作成'}
                    </Typography>
                    {workspaceId && (
                      <>
                        {/* 本番用ワークスペースIDかどうかを判定 */}
                        {workspaceId.startsWith('wrkspc_') ? (
                          // 正しいAnthropicワークスペースID
                          <Chip 
                            icon={<CheckIcon />} 
                            label="接続済み" 
                            color="success" 
                            size="small" 
                            sx={{ ml: 1, mr: 1 }}
                          />
                        ) : (
                          // 不正なIDの場合は警告表示
                          <Chip 
                            icon={<WarningIcon />} 
                            label="形式不正" 
                            color="warning" 
                            size="small" 
                            sx={{ ml: 1, mr: 1 }}
                          />
                        )}
                      </>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* ワークスペース操作カード */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  ワークスペース操作
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  {hasWorkspace ? (
                    <>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        ワークスペースは既に作成されています。Anthropicコンソールで確認できます。
                      </Alert>
                      
                      {/* 不正なワークスペースIDの場合に警告を表示 */}
                      {workspaceId && !workspaceId.startsWith('wrkspc_') && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          <Typography variant="body2">
                            このワークスペースIDは正しい形式（wrkspc_で始まる）ではありません。
                            Anthropicコンソールに実際のワークスペースが存在しない可能性があります。
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>対処方法:</strong> 以下のボタンからコンソールを開き、ワークスペースの存在を確認してください。存在しなければ、
                            環境変数の設定を確認の上、再度ワークスペースを作成してください。
                          </Typography>
                        </Alert>
                      )}
                      
                      <Button
                        variant="contained"
                        color="primary"
                        href="https://console.anthropic.com/workspaces"
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<LaunchIcon />}
                        fullWidth
                      >
                        Anthropicコンソールを開く
                      </Button>
                    </>
                  ) : (
                    <>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          「ワークスペース作成」ボタンをクリックすると、入力されたワークスペース名で
                          Anthropicワークスペースが作成されます。
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>注意:</strong> 開発環境ではワークスペース名がそのままIDとして使用されます。
                          本番環境では実際にAnthropicのAPIを使用してワークスペースが作成されます。
                        </Typography>
                      </Alert>

                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCreateWorkspace}
                        disabled={creating || !workspaceName.trim()}
                        fullWidth
                      >
                        {creating ? (
                          <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Anthropicワークスペース作成中...
                          </>
                        ) : (
                          'Anthropicワークスペース作成'
                        )}
                      </Button>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* APIキーの依存関係を削除したためチェック不要 */}
        
        {/* 使用方法の説明 */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            ワークスペースについて
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ワークスペースはAnthropicのClaudeモデルを使用するための環境です。ワークスペースを作成すると、
            組織のメンバーがClaudeを利用できるようになります。
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default WorkspaceManager;