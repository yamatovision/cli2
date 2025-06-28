"""BlueLamp Delegate Tools"""

from litellm import ChatCompletionToolParam

# BlueLamp専門エージェント委譲ツール定義

def create_bluelamp_delegate_tools():
    """16個のBlueLamp専門エージェントへの委譲ツールを生成"""
    return [
        # ★1 要件定義エンジニア
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_requirements_engineer',
                'description': '要件定義タスクをRequirementsEngineerに委譲。新規プロジェクトの要件定義書作成を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '実行する要件定義タスクの詳細'},
                        'context': {'type': 'object', 'description': 'プロジェクト情報などの追加コンテキスト'},
                        'requirements': {'type': 'string', 'description': '制約条件・要件'},
                        'completion_criteria': {'type': 'string', 'description': '完了条件の明確な定義'}
                    },
                    'required': ['task']
                }
            }
        ),
        
        # ★2 UI/UXデザイナー
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_ui_ux_designer',
                'description': 'UI/UXデザインタスクをUIUXDesignerに委譲。モックアップやデザイン作成を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '実行するUI/UXデザインタスクの詳細'},
                        'context': {'type': 'object', 'description': 'デザイン要件などの追加コンテキスト'},
                        'requirements': {'type': 'string', 'description': '制約条件・要件'},
                        'completion_criteria': {'type': 'string', 'description': '完了条件の明確な定義'}
                    },
                    'required': ['task']
                }
            }
        ),
        
        # ★3 データモデリングエンジニア
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_data_modeling_engineer',
                'description': 'データモデル設計タスクをDataModelingEngineerに委譲。型定義やAPI設計を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '実行するデータモデリングタスクの詳細'},
                        'context': {'type': 'object', 'description': 'データ要件などの追加コンテキスト'},
                        'requirements': {'type': 'string', 'description': '制約条件・要件'},
                        'completion_criteria': {'type': 'string', 'description': '完了条件の明確な定義'}
                    },
                    'required': ['task']
                }
            }
        ),
        
        # ★4 システムアーキテクト
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_system_architect',
                'description': 'システムアーキテクチャ設計タスクをSystemArchitectに委譲。認証・権限設計を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '実行するシステム設計タスクの詳細'},
                        'context': {'type': 'object', 'description': 'システム要件などの追加コンテキスト'},
                        'requirements': {'type': 'string', 'description': '制約条件・要件'},
                        'completion_criteria': {'type': 'string', 'description': '完了条件の明確な定義'}
                    },
                    'required': ['task']
                }
            }
        ),
        
        # ★5 実装計画コンサルタント
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_implementation_consultant',
                'description': '実装計画策定タスクをImplementationConsultantに委譲。実装戦略と技術選定を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '実行する実装計画タスクの詳細'},
                        'context': {'type': 'object', 'description': 'プロジェクト要件などの追加コンテキスト'},
                        'requirements': {'type': 'string', 'description': '制約条件・要件'},
                        'completion_criteria': {'type': 'string', 'description': '完了条件の明確な定義'}
                    },
                    'required': ['task']
                }
            }
        ),
        
        # ★6 環境構築
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_environment_setup',
                'description': '開発環境構築タスクをEnvironmentSetupに委譲。初期設定やインフラ構築を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '実行する環境構築タスクの詳細'},
                        'context': {'type': 'object', 'description': '環境要件などの追加コンテキスト'},
                        'requirements': {'type': 'string', 'description': '制約条件・要件'},
                        'completion_criteria': {'type': 'string', 'description': '完了条件の明確な定義'}
                    },
                    'required': ['task']
                }
            }
        ),
        
        # ★7 プロトタイプ実装
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_prototype_implementation',
                'description': 'フロントエンド実装タスクをPrototypeImplementationに委譲。モックAPI使用のプロトタイプ開発を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '実行するプロトタイプ実装タスクの詳細'},
                        'context': {'type': 'object', 'description': '実装要件などの追加コンテキスト'},
                        'requirements': {'type': 'string', 'description': '制約条件・要件'},
                        'completion_criteria': {'type': 'string', 'description': '完了条件の明確な定義'}
                    },
                    'required': ['task']
                }
            }
        ),
        
        # ★8 バックエンド実装
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_backend_implementation',
                'description': 'バックエンド実装タスクをBackendImplementationに委譲。垂直スライス実装と統合テスト作成を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '実行するバックエンド実装タスクの詳細'},
                        'context': {'type': 'object', 'description': '実装要件などの追加コンテキスト'},
                        'requirements': {'type': 'string', 'description': '制約条件・要件'},
                        'completion_criteria': {'type': 'string', 'description': '完了条件の明確な定義'}
                    },
                    'required': ['task']
                }
            }
        ),
        
        # ★9 テスト品質検証
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_test_quality_verification',
                'description': 'テスト実行タスクをTestQualityVerificationに委譲。統合テストの実行と品質保証を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '実行するテスト検証タスクの詳細'},
                        'context': {'type': 'object', 'description': 'テスト要件などの追加コンテキスト'},
                        'requirements': {'type': 'string', 'description': '制約条件・要件'},
                        'completion_criteria': {'type': 'string', 'description': '完了条件の明確な定義'}
                    },
                    'required': ['task']
                }
            }
        ),
        
        # ★10 API統合
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_api_integration',
                'description': 'API統合タスクをAPIIntegrationに委譲。モックAPIから実APIへの置換を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '実行するAPI統合タスクの詳細'},
                        'context': {'type': 'object', 'description': 'API要件などの追加コンテキスト'},
                        'requirements': {'type': 'string', 'description': '制約条件・要件'},
                        'completion_criteria': {'type': 'string', 'description': '完了条件の明確な定義'}
                    },
                    'required': ['task']
                }
            }
        ),
        
        # ★11 デバッグ探偵
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_debug_detective',
                'description': 'デバッグタスクをDebugDetectiveに委譲。エラー調査と修正を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '実行するデバッグタスクの詳細'},
                        'error': {'type': 'string', 'description': 'エラーメッセージやスタックトレース'},
                        'context': {'type': 'object', 'description': 'デバッグに必要な追加コンテキスト'},
                        'requirements': {'type': 'string', 'description': '制約条件・要件'},
                        'completion_criteria': {'type': 'string', 'description': '完了条件の明確な定義'}
                    },
                    'required': ['task']
                }
            }
        ),
        
        # ★12 デプロイスペシャリスト
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_deploy_specialist',
                'description': 'デプロイタスクをDeploySpecialistに委譲。本番環境構築とデプロイを依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '実行するデプロイタスクの詳細'},
                        'context': {'type': 'object', 'description': 'デプロイ要件などの追加コンテキスト'},
                        'requirements': {'type': 'string', 'description': '制約条件・要件'},
                        'completion_criteria': {'type': 'string', 'description': '完了条件の明確な定義'}
                    },
                    'required': ['task']
                }
            }
        ),
        
        # ★13 GitHubマネージャー
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_github_manager',
                'description': 'Git管理タスクをGitHubManagerに委譲。複雑なGit操作やリポジトリ管理を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '実行するGit管理タスクの詳細'},
                        'context': {'type': 'object', 'description': 'Git操作要件などの追加コンテキスト'},
                        'requirements': {'type': 'string', 'description': '制約条件・要件'},
                        'completion_criteria': {'type': 'string', 'description': '完了条件の明確な定義'}
                    },
                    'required': ['task']
                }
            }
        ),
        
        # ★14 TypeScriptマネージャー
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_typescript_manager',
                'description': '型エラー修正タスクをTypeScriptManagerに委譲。型定義管理と型エラー解消を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '実行する型エラー修正タスクの詳細'},
                        'errors': {'type': 'array', 'items': {'type': 'string'}, 'description': '型エラーのリスト'},
                        'context': {'type': 'object', 'description': '型エラーに関する追加コンテキスト'},
                        'requirements': {'type': 'string', 'description': '制約条件・要件'},
                        'completion_criteria': {'type': 'string', 'description': '完了条件の明確な定義'}
                    },
                    'required': ['task']
                }
            }
        ),
        
        # ★15 機能拡張
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_feature_extension',
                'description': '新機能開発タスクをFeatureExtensionに委譲。新機能計画書作成と実装を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '実行する機能拡張タスクの詳細'},
                        'context': {'type': 'object', 'description': '機能要件などの追加コンテキスト'},
                        'requirements': {'type': 'string', 'description': '制約条件・要件'},
                        'completion_criteria': {'type': 'string', 'description': '完了条件の明確な定義'}
                    },
                    'required': ['task']
                }
            }
        ),
        
        # ★16 リファクタリングエキスパート
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_refactoring_expert',
                'description': 'リファクタリングタスクをRefactoringExpertに委譲。コード改善と最適化を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '実行するリファクタリングタスクの詳細'},
                        'context': {'type': 'object', 'description': 'コード改善要件などの追加コンテキスト'},
                        'requirements': {'type': 'string', 'description': '制約条件・要件'},
                        'completion_criteria': {'type': 'string', 'description': '完了条件の明確な定義'}
                    },
                    'required': ['task']
                }
            }
        ),
    ]