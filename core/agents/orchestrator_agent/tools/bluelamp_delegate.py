"""BlueLamp Delegate Tools - 完全版"""

from litellm import ChatCompletionToolParam

# BlueLamp専門エージェント委譲ツール定義（プロンプトマッピング準拠・ユーザー完了許可制）

def create_bluelamp_delegate_tools():
    """14個のBlueLamp専門エージェントへの委譲ツールを生成（#00オーケストレーターと★11拡張オーケストレーター以外全て）"""
    return [
        # #01 要件定義エンジニア
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_requirements_engineer',
                'description': '要件定義タスクをRequirementsEngineerに委譲。新規プロジェクトの要件定義書作成、既存要件のブラッシュアップ、曖昧な仕様の具体化を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '#01 要件定義エンジニアとしてのプロンプトの役割を果たしユーザーから完了許可をもらえるまで働く'},
                    },
                    'required': ['task']
                }
            }
        ),

        # #02 UI/UXデザイナー
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_ui_ux_designer',
                'description': 'UI/UXデザインタスクをUIUXDesignerに委譲。要件定義からモックアップ作成、デザインシステム構築、データ契約基盤作成を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '#02 UI/UXデザイナーとしてのプロンプトの役割を果たしユーザーから完了許可をもらえるまで働く'},
                    },
                    'required': ['task']
                }
            }
        ),

        # #03 データモデリングエンジニア
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_data_modeling_engineer',
                'description': 'データモデル設計タスクをDataModelingEngineerに委譲。要件定義とモックアップからデータ契約最適化、ディレクトリ構造設計、整合性検証を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '#03 データモデリングエンジニアとしてのプロンプトの役割を果たしユーザーから完了許可をもらえるまで働く'},
                    },
                    'required': ['task']
                }
            }
        ),

        # #04 システムアーキテクト
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_system_architect',
                'description': 'システムアーキテクチャ設計タスクをSystemArchitectに委譲。ユーザーロール明確化、認証方針決定、基本認証方針書作成を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '#04 システムアーキテクトとしてのプロンプトの役割を果たしユーザーから完了許可をもらえるまで働く'},
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
                'description': '実装計画策定タスクをImplementationConsultantに委譲。全ページのPRC作成、実装順序決定、SCOPE_PROGRESS更新を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '★5 実装計画コンサルタントとしてのプロンプトの役割を果たしユーザーから完了許可をもらえるまで働く'},
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
                'description': '開発環境構築タスクをEnvironmentSetupに委譲。外部サービス設定、環境変数構築、Git初期設定を非技術者向けにガイドして代行する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '★6 環境構築としてのプロンプトの役割を果たしユーザーから完了許可をもらえるまで働く'},
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
                'description': 'プロトタイプ実装タスクをPrototypeImplementationに委譲。初期プロトタイプ作成、基本機能実装、動作検証を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '★7 プロトタイプ実装としてのプロンプトの役割を果たしユーザーから完了許可をもらえるまで働く'},
                    },
                    'required': ['task']
                }
            }
        ),

        # ★8 実装エージェント
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_implementation_agent',
                'description': '実装タスクをImplementationAgentに委譲。本格的な機能実装、コード品質向上、統合テストを依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '★8 実装エージェントとしてのプロンプトの役割を果たしユーザーから完了許可をもらえるまで働く'},
                    },
                    'required': ['task']
                }
            }
        ),

        # ★09 デバッグエージェント v3.0
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_debug_agent',
                'description': 'デバッグタスクをDebugAgentに委譲。エラー分類、根本原因特定、クリーンコードスコア向上修正、型整合性確保を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '★09 デバッグエージェント v3.0としてのプロンプトの役割を果たしユーザーから完了許可をもらえるまで働く'},
                    },
                    'required': ['task']
                }
            }
        ),

        # #10 デプロイスペシャリスト
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_deploy_specialist',
                'description': 'デプロイタスクをDeploySpecialistに委譲。非技術者向けガイドで本番環境構築、CI/CDパイプライン設定、既存サービス保護を代行する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '#10 デプロイスペシャリストとしてのプロンプトの役割を果たしユーザーから完了許可をもらえるまで働く'},
                    },
                    'required': ['task']
                }
            }
        ),

        # ★12 新ページ作成エージェント
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_page_creator',
                'description': '新ページ作成タスクをPageCreatorに委譲。要件ヒアリング、モックアップ作成、API仕様定義、PRC作成まで一貫して新ページ追加を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '★12 新ページ作成エージェントとしてのプロンプトの役割を果たしユーザーから完了許可をもらえるまで働く'},
                    },
                    'required': ['task']
                }
            }
        ),

        # #13 コード徹底除去専門リファクタリングエージェント v1.0
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_refactoring_engineer',
                'description': 'リファクタリングタスクをRefactoringEngineerに委譲。不要コードのローラー作戦による徹底除去、連鎖削除、システム軽量化を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '#13 コード徹底除去専門リファクタリングエージェント v1.0としてのプロンプトの役割を果たしユーザーから完了許可をもらえるまで働く'},
                    },
                    'required': ['task']
                }
            }
        ),

        # #14 Universal AI-Friendliness診断プロンプト v3.0
        ChatCompletionToolParam(
            type='function',
            function={
                'name': 'delegate_to_ai_friendliness_diagnostic',
                'description': 'AI親和性診断タスクをAIFriendlinessDiagnosticに委譲。プロジェクト構造分析、AI作業効率スコア測定、改善提案を依頼する際に使用',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'task': {'type': 'string', 'description': '#14 Universal AI-Friendliness診断プロンプト v3.0としてのプロンプトの役割を果たしユーザーから完了許可をもらえるまで働く'},
                    },
                    'required': ['task']
                }
            }
        ),
    ]