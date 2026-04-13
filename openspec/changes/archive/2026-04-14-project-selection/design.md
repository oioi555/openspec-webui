## Context

現在のOpenSpec WebUIは、CLI起動時に1つのパス（`openspec-webui [path]`）を受け取り、そのパスの`openspec/`ディレクトリを固定で読み込む。サーバー、ファイルウォッチャー、API、フロントエンドストアが全て単一プロジェクト前提で設計されている。ActivityBarにはプロジェクトセレクタを開くボタンが存在するが、オーバーレイ型（`layoutStore.overlay = 'project-selector'`）のみ定義されており、実際のUIコンポーネントとバックエンドのマルチプロジェクト対応が未実装。

OpenSpecは`openspec init`でリポジトリに`openspec/`ディレクトリを生成する仕組みで、リポジトリ単位で導入される。複数リポジトリを扱うユーザーにとって、ポートを固定した単一インスタンスで全プロジェクトを管理できることが理想的。

このchangeはCLI起動契約、server session、watcher lifecycle、既存APIの前提、frontend初期化フロー、dev scripts、検証スクリプトを同時に変更する土台レベルの変更である。段階的に差し替えても、途中で`npm run dev`や既存の単一プロジェクト閲覧が壊れないように移行順序とロールバック戦略を先に固定する必要がある。

参考としてOpenChamber（OpenCode WebUI）の`useProjectsStore`パターンを調査済み。ProjectEntryにid/path/label/color/addedAt/lastOpenedAtを持ち、localStorage + Desktop Settingsに永続化し、クライアントからサーバーにディレクトリを指示するアーキテクチャ。

技術スタック: Node.js 20+, TypeScript, Fastify, Svelte 5 (runes), Vite, chokidar。

## Goals / Non-Goals

**Goals:**
- 1つのサーバーインスタンスで複数OpenSpecプロジェクトを管理
- UIからプロジェクトを動的に追加・削除・切り替え
- 起動時に前回のプロジェクト状態を自動復元
- 既存のAPIレイヤー（`/api/project`, `/api/specs`, `/api/changes`, `/api/commands/availability`等）の互換性を維持しつつ、内部をアクティブプロジェクト参照に切替
- プロジェクト0個の空状態を適切に扱う

**Non-Goals:**
- 複数プロジェクトの同時表示（タブをまたいで別プロジェクトを開く等）— 1度に1プロジェクトがアクティブ
- プロジェクトごとのタブ状態保存・復元 — 切替時はリセット
- `~/.config/openspec-webui/config.json`へのアプリ設定移行（theme, aiTool等）— 別changeで対応
- 非アクティブプロジェクトの常時watch
- ネットワーク経由のプロジェクトアクセス（ローカルファイルシステムのみ）

## Decisions

### D1: サーバー側をプロジェクトレジストリのマスターとする

**決定**: サーバーが`~/.config/openspec-webui/projects.json`を読み書きし、プロジェクトのCRUDをAPI経由で提供する。フロントエンドはAPIを通じて操作する。

**理由**: OpenChamberはlocalStorage + Desktop Settingsの二重管理だが、OpenSpec WebUIはブラウザ専用アプリではない。サーバーがマスターであれば、CLI起動時の復元、環境変数による初期プロジェクト追加、将来的なheadlessモード等でも一貫した動作になる。localStorageはキャッシュとしてのみ使用。

**代替案**: localStorageメイン — サーバーがプロジェクトを知らない状態になり、起動時の初期データロードが困難。

### D2: アクティブプロジェクト1つのみparse + watch

**決定**: `activeProjectId`で示される1プロジェクトだけを`parseOpenSpec`してFSWatcherを張る。切替時に古いwatcherを閉じ、新しいパスで再parse + 再watchする。

**理由**: ローカルファイルシステムのparseは数十msで完了するため、切替時の待ち時間は実用上問題ない。3つのFSWatcherを同時に張るよりリソース効率が良い。

**代替案**: 全プロジェクトを常時watch — メモリ使用量がプロジェクト数に比例し、chokidarインスタンスの管理が複雑になる。当面不要。

### D3: 既存APIパスを維持、アクティブプロジェクトを暗黙参照

**決定**: `/api/project`, `/api/specs`, `/api/changes`, `/api/stats`, `/api/search`, `/api/commands/availability`等の既存パスはそのまま維持する。内部ではactive project sessionからdata/pathを取得する。プロジェクト管理は新しい`/api/projects`エンドポイント群で行う。

**理由**: フロントエンドのAPIクライアント（`frontend/src/lib/api.ts`）の変更を最小限に抑えられる。`/api/projects/*`という別名前空間にすることで既存と新規が明確に分かれる。Settings/command shortcutsもactive projectに追従したままエンドポイント名を変えずに済む。

**代替案**: `/api/{projectId}/specs`のようなパスに変更 — RESTfulだが全ルートの書き換えが必要で今回のスコープに合わない。

### D4: CLI引数`[path]`を削除、環境変数で代替

**決定**: `[path]`引数を完全に削除。`OPENSPEC_INITIAL_PROJECT`環境変数で初期プロジェクトを指定可能にする（テスト・開発用）。この環境変数は内部的に「起動時に自動的にプロジェクト追加」API呼び出しと同等の処理を行う。

**理由**: CLI引数で追加したプロジェクトとUIで追加したプロジェクトが混在すると、ユーザーが「このプロジェクトはどこから来たのか」を区別できず紛らわしい。環境変数は明確に「初期化用」の意味を持つ。

**補足**: 開発用wrapper scriptsは従来の`npm run dev -- /path/to/project`体験を維持するため、受け取った追加引数を`OPENSPEC_INITIAL_PROJECT`へ変換して起動する。引数なし時は開発用途に限りrepo rootを既定値として設定してもよいが、standalone CLIは常に引数なし起動を基本とする。

### D5: 切替時のWebSocketイベントでフロントエンドに通知

**決定**: プロジェクト切替時にWebSocketで`project:switched`イベントをブロードキャスト。フロントエンドは受信後に`initializeData()`を呼び出して全ストアを再取得する。

**理由**: 既存の`data:refresh`パターンを踏襲。ブラウザの複数タブが開いていても全タブで同期される。

### D6: プロジェクト永続化ファイルのフォーマット

**決定**:
```
~/.config/openspec-webui/projects.json
{
  "version": 1,
  "projects": [
    {
      "id": "uuid",
      "path": "/home/user/projects/my-repo",
      "label": "My Repo",
      "addedAt": 1713000000000,
      "lastOpenedAt": 1713000000000
    }
  ],
  "activeProjectId": "uuid"
}
```

**理由**: OpenChamberの`ProjectEntry`パターンを簡略化。color/icon/iconImage等のUI装飾はv2で追加。idはUUID、labelはパス末尾から自動導出（`/home/user/my-repo` → `My Repo`）、重複pathは許可しない。`version`は将来のマイグレーション用。保存する`path`はプロジェクトルートであり、内部では`<path>/openspec`をparse/watch対象へ変換する。

**補足**: 保存先は`XDG_CONFIG_HOME`を優先し、未設定時は`~/.config/openspec-webui/projects.json`を使用する。

### D7: ProjectSelectorのUI形式

**決定**: ActivityBarの既存プロジェクトボタンから開くDialog。`AppLayout.svelte`に既にある`layoutStore.overlay = 'project-selector'`用の`Dialog.Root`プレースホルダを本実装で置き換える。Dialog内にプロジェクト一覧・パス入力による追加・削除を備える。

**理由**: 既存のoverlayメカニズム（`layoutStore.overlay = 'project-selector'`）と`Dialog.Root`の配線をそのまま活用できる。SearchDialogやSettingsModalと同じパターンで、フォーカス管理・Escでのクローズも既存UIに揃えられる。

**代替案**: Popover — ActivityBarのアンカーに近い見た目にはなるが、現状のコードベースでは新しいUI基盤追加とレイアウト調整が必要になる。

### D8: createServerは可変なactive project sessionを保持する

**決定**: `createServer`は現在の`activeProjectId`、`openspecPath`、parsed `data`、current watcher、project-scoped cache（command availabilityなど）をまとめたmutable sessionを保持する。project registry操作と`registerApiRoutes`はこのsessionのgetter / hookを通じて現在のプロジェクト文脈を参照する。

**理由**: 現在の`createServer` / `registerApiRoutes`は起動時の固定`openspecPath`をclosureで保持する設計で、プロジェクト切替に追従できない。sessionを一本化するとwatcher差し替え、route参照、WebSocket通知、`server.close()`時の後始末を一箇所で整合させられる。serverはrestore/bootstrap完了後にlistenを開始し、起動完了後の503は「起動途中」ではなく「no active project」を意味するようにする。

**代替案**: プロジェクトごとにwatcher/dataを常駐保持 — 切替は速いが、リソース使用量とshutdown複雑性が増える。

### D9: プロジェクトルートと openspec ルートを明示的に分離する

**決定**: registryの`ProjectEntry.path`は常にプロジェクトルート（`project.md` と `openspec/` を含むリポジトリ/ワークスペースのルート）を保存する。内部では `getActiveProjectRoot()` と `getActiveOpenSpecPath()` を分離し、parse/watch系は `getActiveOpenSpecPath()`、`openspec config get` を実行する command availability は `getActiveProjectRoot()` を使う。

**理由**: 現行コードは`openspecPath`という単一の概念に依存しており、プロジェクト切替後に project root と `openspec/` directory の意味が混ざると parser/watcher/command execution が静かに壊れる。用途別getterに分けることで責務を明確にできる。

### D10: active session mutation は直列化し、commit/rollback可能に扱う

**決定**: `activateProject` は新しいプロジェクトのparse成功と必要な初期化が完了してから session を切り替える。初期化失敗時は旧session（data / watcher / activeProjectId）を維持し、エラーのみを返す。さらに `addProject`, `removeProject`, `activateProject`, `clearActiveProject` のように active session を変え得る全操作は同じ registry/session mutation lock で直列化する。

**理由**: watcherを先に閉じてから新projectのparseに失敗すると、サーバーが watcherなし / dataなし の半壊状態になる。さらに add/remove/activate が並行すると `activeProjectId`, watcher, in-memory data の組み合わせが壊れる。foundation changeとしては rollback 可能な切替と、全mutationの直列化をセットで持つ方が安全。

### D11: WebSocket 再接続後は active project を再同期する

**決定**: WebSocket接続直後に `connection:init` イベントを接続してきたそのclientにだけ送り、現在の `activeProjectId` を含める。フロントエンドは自身の認識と不一致なら project-scoped state を丸ごと再初期化する。

**理由**: `project:switched` はイベント性のメッセージなので、切替中に切断/再接続すると取りこぼす可能性がある。接続時の現在値同期を別イベントで持つと複数タブや再接続でも整合を保ちやすい。

### D12: projects.json は versioned + atomic write + corruption recovery で扱う

**決定**: `projects.json` は `version` フィールド付きで保存し、書き込みは temp file → rename の atomic write で行う。読み込み時にJSON破損や未知versionを検出した場合は warning を出し、空レジストリまたは互換可能な最小構成へ安全にフォールバックする。

**理由**: このchangeは新しい永続化レイヤーを導入する。書き込み途中の破損や将来フォーマット変更に耐えないと、起動不能の原因になり得る。

### D13: scripts は新CLI契約に合わせつつ開発体験を維持する

**決定**: `scripts/dev.mjs`, `debug.mjs`, `release.mjs`, `run-dev-server.mjs`, `start.mjs` は positional path をCLIへ渡さない。代わりに必要に応じて `OPENSPEC_INITIAL_PROJECT` を設定して起動する。`doctor-dev.mjs`, `verify-ui.mjs`, `README.md`, `package.json` の説明/検証も新契約に合わせて更新する。

**理由**: wrapperだけ旧CLI契約のままだと foundation change の途中で `npm run dev` 系が無言で壊れる。CLI削除とwrapper更新は一体で扱う必要がある。

**補足**: `verify-ui.mjs` は `../openspec/project.md` の固定参照をやめ、`GET /api/projects` でactive project rootを取得してから `<projectRoot>/openspec/project.md` を動的に解決する。`scripts/run-dev-frontend.mjs`, `scripts/run-local-bin.mjs`, `scripts/test-tabbar-ui.mjs` はCLI契約に依存しないため、変更不要であることを確認したうえで据え置く。

## Risks / Trade-offs

- **[切替時のフリーズ感]** → parse + watchの再初期化に数十〜数百msかかる可能性。→ Mitigation: フロントエンド側でloading stateを表示。ローカルファイルシステムなので通常は体感できないレベル。

- **[存在しないパスの追加]** → ユーザーが間違ったパスを入力する可能性。→ Mitigation: サーバー側でディレクトリ存在確認 + `openspec/`サブディレクトリの存在確認を行い、無効なパスは追加を拒否。

- **[プロジェクト削除後のデータ消失]** → プロジェクトを削除するとストアがリセットされる。→ Mitigation: 削除前に確認ダイアログを表示。削除はレジストリからの削除のみで、ファイルシステム上のデータは影響しない。

- **[XDG設定ディレクトリの作成]** → 初回起動時に`~/.config/openspec-webui/`が存在しない。→ Mitigation: サーバー起動時にディレクトリを自動作成。書き込み権限がない場合は警告して続行（プロジェクト0個で起動）。

- **[ブラウザの複数タブでの同時操作]** → タブAで切替 → タブBは古い状態。→ Mitigation: WebSocketの`project:switched`イベントで全タブに通知。

- **[command availabilityのstale cache]** → 切替前プロジェクトのworkflow availabilityを返し続ける可能性。→ Mitigation: availability cacheをactive projectに紐付けるか、切替/削除時に必ずクリアする。

- **[補助スクリプトの旧CLI契約]** → `scripts/dev-utils.mjs`と各wrapperが`./openspec`を自動注入しており、`[path]`削除後に不正引数になる。→ Mitigation: 同じchange内でhelperと全wrapperを更新する。

- **[projects.json の破損]** → 電源断や複数操作でJSONが壊れると起動不能の原因になる。→ Mitigation: atomic write / version field / corruption recovery を導入し、warning付きで空レジストリへフォールバック可能にする。

- **[プロジェクト復元時の stale path]** → 前回保存したプロジェクトが移動・削除されている可能性。→ Mitigation: startup restore時に存在確認し、無効エントリは warning を出して除外または非活性化する。

- **[activation race]** → 複数タブや連続クリックで複数activateが同時に走るとsessionが壊れる可能性。→ Mitigation: activation lock と atomic session swap を導入する。
