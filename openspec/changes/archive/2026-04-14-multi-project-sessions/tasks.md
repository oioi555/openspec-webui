## 1. Session Infrastructure

- [x] 1.1 `ActiveProjectSession` に `refCount: number` フィールドを追加する
- [x] 1.2 `ProjectRegistry` の `activeSession: ActiveProjectSession | null` を `activeSessions: Map<string, ActiveProjectSession>` に変更する
- [x] 1.3 グローバルデフォルトアクセサ（`getActiveProject()`, `getActiveData()`, `getActiveProjectRoot()` 等）が最後にアクティブ化されたセッションを返すように更新する
- [x] 1.4 `getSession(projectId: string): ActiveProjectSession | null` メソッドを追加する
- [x] 1.5 `ensureSession(projectId: string): Promise<ActiveProjectSession>` を追加（on-demand セッション作成、refCount = 0 で初期化）
- [x] 1.6 `incrementRef(projectId: string)` / `decrementRef(projectId: string)` を追加（`decrementRef` による `refCount > 0 -> 0` 遷移時のみ watcher クローズ・セッション解放）
- [x] 1.7 `prepareActivation` / `activateEntryLocked` を修正: 既存セッションがあれば再利用、なければ新規作成。他セッションの watcher を閉じない
- [x] 1.8 `onActiveFileChange(projectId, event, data)` シグネチャへ更新し、watcher 由来の `projectId` を後段へ伝搬する
- [x] 1.9 `commandAvailabilityCache` を projectId 単位のキャッシュへ変更する

## 2. API Layer

- [x] 2.1 `X-Project-Id` ヘッダーをパースする Fastify プラグイン / ヘルパーを追加する
- [x] 2.2 全プロジェクトスコープ API エンドポイント（`/api/project`, `/api/specs`, `/api/specs/:name`, `/api/changes`, `/api/changes/:name`, `/api/stats`, `/api/search`, `/api/commands/availability`）に `X-Project-Id` ヘッダー対応を追加する
- [x] 2.3 ヘッダーなしの場合はグローバルデフォルトを返す（後方互換）ことを確認する
- [x] 2.4 `POST /api/projects/:id/activate` を修正: 他セッションを閉じずに対象をアクティブ化 + グローバルデフォルト更新（`X-Client-Id` のような追加ヘッダーは導入しない）

## 3. WebSocket Client-Project Binding

- [x] 3.1 `WebSocketManager` に `clientBindings: Map<WebSocket, string | null>` を追加する
- [x] 3.2 `addClient` 時にグローバルデフォルトプロジェクトにバインド + refCount インクリメント
- [x] 3.3 クライアント切断時に refCount デクリメント + バインド解除
- [x] 3.4 `project:bind` メッセージ受信処理を追加（旧プロジェクト refCount--、新プロジェクト refCount++、on-demand セッション作成）
- [x] 3.5 `project:bound` 応答メッセージを該当クライアントのみに送信する
- [x] 3.6 `broadcastFileChange(projectId, event, data)` を修正: イベントの projectId に一致するクライアントにのみ送信
- [x] 3.7 `project:switched` の全クライアントブロードキャストを廃止し、`project:bind` / `project:bound` を shared types・フロントエンド処理へ反映する

## 4. Frontend Changes

- [x] 4.1 WebSocket ストアに `project:bind` 送信と `project:bound` 受信処理を追加する
- [x] 4.2 API 共通レイヤーで、現在バインド中の projectId を `X-Project-Id` ヘッダーへ自動注入する
- [x] 4.3 プロジェクト切り替え時に `POST /api/projects/:id/activate` の代わりに `project:bind` を使用するよう更新
- [x] 4.4 `project:bound` 受信時にプロジェクトデータを再取得・UI リセットする処理を追加
- [x] 4.5 WebSocket 再接続時に `connection:init` でローカル projectId を照合し、必要に応じて `project:bind` を送信し、再バインド完了まで `data:refresh` を無視する

## 5. Integration Tests

- [x] 5.1 複数セッション同時アクティブ化のテスト（2 プロジェクトの watcher が独立動作）
- [x] 5.2 参照カウントのテスト（バインド/アンバインドで refCount が正しく変動、0 でセッション解放）
- [x] 5.3 `X-Project-Id` ヘッダー付き API リクエストのテスト
- [x] 5.4 WebSocket クライアント個別ルーティングのテスト（プロジェクト A の変更がプロジェクト B のクライアントに届かない）
- [x] 5.5 クライアント切断時のセッション解放テスト
- [x] 5.6 既存テストの回帰確認（単一プロジェクト利用の全テストがパス）
