lementationAssistant (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:35535:17)
	at async Th.value (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:34112:25)
[2025-03-26T10:57:58.511Z] [ERROR] 公開URLでのClaudeCode起動に失敗しました
[2025-03-26T10:57:58.511Z] [ERROR] Error details: URLからプロンプトを取得できませんでした: http://geniemon-portal-backend-production.up.railway.app/api/prompts/public/8c09f971e4a3d020497eec099a53e0a6
[2025-03-26T10:57:58.511Z] [ERROR] Stack trace: Error: URLからプロンプトを取得できませんでした: http://geniemon-portal-backend-production.up.railway.app/api/prompts/public/8c09f971e4a3d020497eec099a53e0a6
	at ClaudeCodeIntegrationService.launchWithPublicUrl (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:26400:23)
	at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
	at async ScopeManagerPanel._handleLaunchImplementationAssistant (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:35535:17)
	at async Th.value (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:34112:25)
[2025-03-26T10:57:59.247Z] [INFO] 【API連携】公開プロンプトの取得を開始: http://geniemon-portal-backend-production.up.railway.app/api/prompts/public/247df2890160a2fa8f6cc0f895413aed
[2025-03-26T10:58:06.390Z] [ERROR] 【API連携】公開プロンプト取得に失敗しました (4回目)
[2025-03-26T10:58:06.390Z] [ERROR] Error details: Request failed with status code 502
[2025-03-26T10:58:06.391Z] [ERROR] API Error: 502 GET http://geniemon-portal-backend-production.up.railway.app/api/prompts/public/cdc2b284c05ebaae2bc9eb1f3047aa39
[2025-03-26T10:58:06.391Z] [ERROR] Response data: {
  "status": "error",
  "code": 502,
  "message": "Application failed to respond",
  "request_id": "rFpQAOEUTkKSeYyN9e-YgA_98031763"
}
[2025-03-26T10:58:06.391Z] [ERROR] Stack trace: AxiosError: Request failed with status code 502
	at settle (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:2701:12)
	at IncomingMessage.handleStreamEnd (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:3818:11)
	at IncomingMessage.emit (node:events:530:35)
	at endReadableNT (node:internal/streams/readable:1698:12)
	at process.processTicksAndRejections (node:internal/process/task_queues:82:21)
	at Axios.request (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:4928:41)
	at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
	at async /Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:19292:34
	at async ClaudeCodeApiClient._retryWithExponentialBackoff (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:19145:24)
	at async ClaudeCodeApiClient.getPromptFromPublicUrl (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:19282:20)
	at async ClaudeCodeIntegrationService.launchWithPublicUrl (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:26398:28)
	at async SimpleChatPanel._launchClaudeCode (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:31492:29)
	at async Th.value (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:29851:21)
[2025-03-26T10:58:06.391Z] [ERROR] [API] 502: Application failed to respond
[2025-03-26T10:58:06.391Z] [ERROR] Error details: Application failed to respond
[2025-03-26T10:58:06.391Z] [DEBUG] エラー詳細: {
  "url": "http://geniemon-portal-backend-production.up.railway.app/api/prompts/public/cdc2b284c05ebaae2bc9eb1f3047aa39",
  "method": "get",
  "status": 502,
  "data": {
    "status": "error",
    "code": 502,
    "message": "Application failed to respond",
    "request_id": "rFpQAOEUTkKSeYyN9e-YgA_98031763"
  }
}
[2025-03-26T10:58:06.392Z] [ERROR] 【API連携】公開URLからのプロンプト取得に失敗しました (URL: http://geniemon-portal-backend-production.up.railway.app/api/prompts/public/cdc2b284c05ebaae2bc9eb1f3047aa39)
[2025-03-26T10:58:06.392Z] [ERROR] Error details: Request failed with status code 502
[2025-03-26T10:58:06.392Z] [ERROR] API Error: 502 GET http://geniemon-portal-backend-production.up.railway.app/api/prompts/public/cdc2b284c05ebaae2bc9eb1f3047aa39
[2025-03-26T10:58:06.392Z] [ERROR] Response data: {
  "status": "error",
  "code": 502,
  "message": "Application failed to respond",
  "request_id": "rFpQAOEUTkKSeYyN9e-YgA_98031763"
}
[2025-03-26T10:58:06.392Z] [ERROR] Stack trace: AxiosError: Request failed with status code 502
	at settle (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:2701:12)
	at IncomingMessage.handleStreamEnd (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:3818:11)
	at IncomingMessage.emit (node:events:530:35)
	at endReadableNT (node:internal/streams/readable:1698:12)
	at process.processTicksAndRejections (node:internal/process/task_queues:82:21)
	at Axios.request (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:4928:41)
	at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
	at async /Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:19292:34
	at async ClaudeCodeApiClient._retryWithExponentialBackoff (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:19145:24)
	at async ClaudeCodeApiClient.getPromptFromPublicUrl (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:19282:20)
	at async ClaudeCodeIntegrationService.launchWithPublicUrl (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:26398:28)
	at async SimpleChatPanel._launchClaudeCode (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:31492:29)
	at async Th.value (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:29851:21)
[2025-03-26T10:58:06.393Z] [ERROR] [API] 502: Application failed to respond
[2025-03-26T10:58:06.393Z] [ERROR] Error details: Application failed to respond
[2025-03-26T10:58:06.393Z] [DEBUG] エラー詳細: {
  "url": "http://geniemon-portal-backend-production.up.railway.app/api/prompts/public/cdc2b284c05ebaae2bc9eb1f3047aa39",
  "method": "get",
  "status": 502,
  "data": {
    "status": "error",
    "code": 502,
    "message": "Application failed to respond",
    "request_id": "rFpQAOEUTkKSeYyN9e-YgA_98031763"
  }
}
[2025-03-26T10:58:06.393Z] [ERROR] 【API連携】サーバーエラー(502): http://geniemon-portal-backend-production.up.railway.app/api/prompts/public/cdc2b284c05ebaae2bc9eb1f3047aa39
[2025-03-26T10:58:06.393Z] [ERROR] Error details: Request failed with status code 502
[2025-03-26T10:58:06.393Z] [ERROR] API Error: 502 GET http://geniemon-portal-backend-production.up.railway.app/api/prompts/public/cdc2b284c05ebaae2bc9eb1f3047aa39
[2025-03-26T10:58:06.393Z] [ERROR] Response data: {
  "status": "error",
  "code": 502,
  "message": "Application failed to respond",
  "request_id": "rFpQAOEUTkKSeYyN9e-YgA_98031763"
}
[2025-03-26T10:58:06.393Z] [ERROR] Stack trace: AxiosError: Request failed with status code 502
	at settle (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:2701:12)
	at IncomingMessage.handleStreamEnd (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:3818:11)
	at IncomingMessage.emit (node:events:530:35)
	at endReadableNT (node:internal/streams/readable:1698:12)
	at process.processTicksAndRejections (node:internal/process/task_queues:82:21)
	at Axios.request (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:4928:41)
	at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
	at async /Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:19292:34
	at async ClaudeCodeApiClient._retryWithExponentialBackoff (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:19145:24)
	at async ClaudeCodeApiClient.getPromptFromPublicUrl (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:19282:20)
	at async ClaudeCodeIntegrationService.launchWithPublicUrl (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:26398:28)
	at async SimpleChatPanel._launchClaudeCode (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:31492:29)
	at async Th.value (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:29851:21)
[2025-03-26T10:58:06.394Z] [ERROR] 公開URLでのClaudeCode起動に失敗しました
[2025-03-26T10:58:06.394Z] [ERROR] Error details: URLからプロンプトを取得できませんでした: http://geniemon-portal-backend-production.up.railway.app/api/prompts/public/cdc2b284c05ebaae2bc9eb1f3047aa39
[2025-03-26T10:58:06.394Z] [ERROR] Stack trace: Error: URLからプロンプトを取得できませんでした: http://geniemon-portal-backend-production.up.railway.app/api/prompts/public/cdc2b284c05ebaae2bc9eb1f3047aa39
	at ClaudeCodeIntegrationService.launchWithPublicUrl (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:26400:23)
	at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
	at async SimpleChatPanel._launchClaudeCode (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:31492:29)
	at async Th.value (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:29851:21)
[2025-03-26T10:58:11.089Z] [ERROR] 【API連携】公開プロンプト取得に失敗しました (1回目)
[2025-03-26T10:58:11.090Z] [ERROR] Error details: Request failed with status code 502
[2025-03-26T10:58:11.090Z] [ERROR] API Error: 502 GET http://geniemon-portal-backend-production.up.railway.app/api/prompts/public/247df2890160a2fa8f6cc0f895413aed
[2025-03-26T10:58:11.090Z] [ERROR] Response data: {
  "status": "error",
  "code": 502,
  "message": "Application failed to respond",
  "request_id": "JcIJAA5kSHqo9l9_Qg4MSA_4108239275"
}
[2025-03-26T10:58:11.090Z] [ERROR] Stack trace: AxiosError: Request failed with status code 502
	at settle (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:2701:12)
	at IncomingMessage.handleStreamEnd (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:3818:11)
	at IncomingMessage.emit (node:events:530:35)
	at endReadableNT (node:internal/streams/readable:1698:12)
	at process.processTicksAndRejections (node:internal/process/task_queues:82:21)
	at Axios.request (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:4928:41)
	at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
	at async /Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:19292:34
	at async ClaudeCodeApiClient._retryWithExponentialBackoff (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:19145:24)
	at async ClaudeCodeApiClient.getPromptFromPublicUrl (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:19282:20)
	at async ClaudeCodeIntegrationService.launchWithPublicUrl (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:26398:28)
	at async SimpleChatPanel._handleLaunchMockupCreator (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:31386:29)
	at async Th.value (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:29839:21)
[2025-03-26T10:58:11.090Z] [INFO] 【API連携】公開プロンプト取得を801.302289208265ms後に再試行します (1/3)
[2025-03-26T10:58:11.897Z] [INFO] 【API連携】公開プロンプトの取得を開始: http://geniemon-portal-backend-production.up.railway.app/api/prompts/public/247df2890160a2fa8f6cc0f895413aed
[2025-03-26T10:58:14.576Z] [DEBUG] ClaudeCode CLIパスを試行中: claude
[2025-03-26T10:58:23.798Z] [ERROR] 【API連携】公開プロンプト取得に失敗しました (2回目)
[2025-03-26T10:58:23.800Z] [ERROR] Error details: Request failed with status code 502
[2025-03-26T10:58:23.800Z] [ERROR] API Error: 502 GET http://geniemon-portal-backend-production.up.railway.app/api/prompts/public/247df2890160a2fa8f6cc0f895413aed
[2025-03-26T10:58:23.800Z] [ERROR] Response data: {
  "status": "error",
  "code": 502,
  "message": "Application failed to respond",
  "request_id": "ZBSyRex1TVOwgS2ap-ixDg_3176973899"
}
[2025-03-26T10:58:23.800Z] [ERROR] Stack trace: AxiosError: Request failed with status code 502
	at settle (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:2701:12)
	at IncomingMessage.handleStreamEnd (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:3818:11)
	at IncomingMessage.emit (node:events:530:35)
	at endReadableNT (node:internal/streams/readable:1698:12)
	at process.processTicksAndRejections (node:internal/process/task_queues:82:21)
	at Axios.request (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:4928:41)
	at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
	at async /Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:19292:34
	at async ClaudeCodeApiClient._retryWithExponentialBackoff (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:19145:24)
	at async ClaudeCodeApiClient.getPromptFromPublicUrl (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:19282:20)
	at async ClaudeCodeIntegrationService.launchWithPublicUrl (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:26398:28)
	at async SimpleChatPanel._handleLaunchMockupCreator (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:31386:29)
	at async Th.value (/Users/tatsuya/Desktop/システム開発/AppGenius2/AppGenius/dist/extension.js:29839:21)
[2025-03-26T10:58:23.801Z] [INFO] 【API連携】公開プロンプト取得を1740.32675268563ms後に再試行します (2/3)
[2025-03-26T10:58:25.543Z] [INFO] 【API連携】公開プロンプトの取得を開始: http://geniemon-portal-backend-production.up.railway.app/api/prompts/public/247df2890160a2fa8f6cc0f895413aed
