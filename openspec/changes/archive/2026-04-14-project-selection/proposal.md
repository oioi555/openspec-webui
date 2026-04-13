## Why

OpenSpecはリポジトリ単位で導入されるが、現在のWebUIは起動時に1つのパスしか受け付けず、複数リポジトリを横断的に見るにはポートを変えて複数インスタンスを立ち上げる必要がある。ポートが固定的なので、プロジェクトごとにアプリを起動し直したりポートがズレていくと不便。1つのアプリインスタンスで複数のOpenSpecプロジェクトを動的に追加・切り替えできるようにする。

## What Changes

- **BREAKING**: CLIの`[path]`引数を削除。起動は引数なし（`openspec-webui`）になり、起動時の初期プロジェクト投入は環境変数`OPENSPEC_INITIAL_PROJECT`で行う
- サーバー側にバージョン付きのプロジェクトレジストリを追加。`${XDG_CONFIG_HOME:-~/.config}/openspec-webui/projects.json`でプロジェクトリストとアクティブプロジェクトを永続化し、破損ファイルからは警告付きで安全に回復する
- プロジェクトのCRUD API（追加・一覧・削除・アクティブ切替）を追加
- 既存API（`/api/project`, `/api/specs`, `/api/changes`, `/api/commands/availability`等）はアクティブプロジェクトを参照するように変更
- レジストリにはプロジェクトルートを保存し、内部では`<projectRoot>/openspec`をwatch/parse対象として扱う
- プロジェクト切替時にアクティブプロジェクトのみをparse/watchする（非アクティブはwatchしない）
- プロジェクト切替はトランザクション的に行い、新プロジェクトのparse成功後にのみsession/watcherを切り替え、失敗時は旧アクティブを維持する
- WebSocketに`project:switched`と`connection:init`イベントを追加し、再接続後もアクティブプロジェクトを同期できるようにする
- フロントエンドにProjectSelector UIコンポーネントを追加（ActivityBarのプロジェクトボタンから開くDialog）
- プロジェクト0個の空状態UI（初回起動時・全削除時）を追加
- プロジェクト切替時に全storeリセット、command availability再取得、タブのDashboardリセットを行う
- `./scripts` 配下のwrapper/doctor/verifyスクリプトを新CLI契約へ追従させ、既存の開発体験（`npm run dev -- /path/to/project`など）は`OPENSPEC_INITIAL_PROJECT`への変換で維持する

## Capabilities

### New Capabilities
- `project-registry`: サーバー側のプロジェクトレジストリ管理。追加・一覧・削除・アクティブ切替・ファイル永続化。`~/.config/openspec-webui/projects.json`の読み書き。
- `project-selector-ui`: ActivityBarのプロジェクトボタンから開くDialog UI。プロジェクト一覧表示・追加・削除・切替。空状態の表示。

### Modified Capabilities
- `project-context`: 単一固定パスからマルチプロジェクトレジストリへの移行。アクティブプロジェクト切替時のWebSocket通知とフロントエンドstoreリセット。Dashboard/ExplorerPaneのプロジェクト名表示をアクティブプロジェクトに追従させる。
- `cli-runtime`: CLIを引数なし起動に切り替え、`OPENSPEC_INITIAL_PROJECT`による起動時ブートストラップを追加する。補助スクリプトも同じ起動契約に揃える。
- `live-refresh`: アクティブプロジェクトのみをwatchし、`project:switched`受信時にフロントエンドがプロジェクト単位の状態をリセット・再初期化する。
- `command-preferences`: workflow availabilityをアクティブプロジェクト単位で判定し、切替・再接続・空状態に追従して更新する。

## Impact

- **CLI** (`src/cli/index.ts`): `[path]`引数削除、環境変数`OPENSPEC_INITIAL_PROJECT`の追加
- **Scripts** (`scripts/dev-utils.mjs`, `scripts/*.mjs`): 旧CLI向けのデフォルトパス注入を削除
- **Docs & Tooling** (`README.md`, `package.json`, `scripts/doctor-dev.mjs`, `scripts/verify-ui.mjs`): CLI/開発フロー/検証スクリプトの前提を新しいプロジェクト選択モデルへ更新
- **Server** (`src/server/index.ts`): 複数プロジェクト管理、起動時のprojects.json復元、可変なactive project session、アクティブ切替ロジック
- **API Routes** (`src/server/routes/api.ts`): 新規CRUDエンドポイント追加、既存エンドポイントのアクティブプロジェクト参照化、command availabilityのプロジェクト切替追従
- **Watcher** (`src/watcher/file-watcher.ts`): 切替時のwatcher再生成
- **WebSocket** (`src/server/websocket/`, `src/shared/types.ts`, `frontend/src/lib/websocket.ts`): `project:switched` / `connection:init`イベント追加
- **Frontend Stores** (`frontend/src/stores/`): プロジェクトストア追加、切替時の全storeリセット、command availability再取得、タブリセット
- **Frontend Components**: ProjectSelector Dialog新規追加、ActivityBarの既存ボタンと連携
- **Settings**: 将来的な`~/.config/openspec-webui/config.json`への移行を見据えた設定ディレクトリ確保
