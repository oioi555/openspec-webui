## Why

現在のUIはシングルカラム＋トップナビの従来型レイアウトで、specs/changes/project間の行き来に毎回ページ遷移が必要。さらに、ワークフロー上は ACTIVE CHANGES → ARCHIVE → SPECS の順で見たいのに、Activity Bar の `Home / Changes / Specs` と Explorer Pane のセクションが明示的に対応していない。`Home → ACTIVE CHANGES`、`Changes → ARCHIVE`、`Specs → SPECS` を揃えた ObsidianライクなIDE的レイアウトにすることで、ナビゲーションの摩擦を無くし、複数コンテンツを並行参照できるようにする。あわせて、Explorer Pane を折りたたんでも Activity Bar と project selector を残し、狭い画面幅では Activity Bar 中心に縮退できるようにする。またshadcn-svelteの導入により、UIコンポーネントの品質と保守性を大幅に向上させる。

## What Changes

- **BREAKING**: トップナビゲーション→左サイドのActivity Bar + Explorer Pane構成への全面的なレイアウト変更
- **BREAKING**: 手動ルーティング（pathname parse）→タブベースのビューアーシステムに変更。既存のURLルーティングは維持するが、メインコンテンツはタブで管理
- shadcn-svelte（+ bits-ui, @lucide/svelte）の導入とパスエイリアス（`$lib`）の設定
- 既存カスタムCSS変数テーマ→shadcn-svelteのoklchベーステーマへの移行
- カスタム`Icon.svelte`→`@lucide/svelte`への置き換え
- Explorer Pane（左サイド）: ACTIVE CHANGES / ARCHIVE / SPECS を workflow 順に並べる collapsible sections。Activity Bar の `Home / Changes / Specs` と 1:1 に対応させ、必要なセクションだけ展開して他を縮小
- Activity Bar（最左）: Explorer Pane を閉じても残る 48px 固定の縦バー。project selector 導線と Home / Changes / Specs / Search / Settings を配置し、`Home → ACTIVE CHANGES`、`Changes → ARCHIVE`、`Specs → SPECS` を表す
- タブ化メインビューアー: 複数Spec/Changeを同時オープン、タブ切り替え、閉じる操作
- Resizableペイン分割: Explorer Pane と Main Viewer の境界をドラッグでリサイズ可能。狭幅時は Explorer Pane を常設せず、Activity Bar + Main Viewer に縮退
- 折りたたみ可能な右サイドバー（Suggestion Panel等）
- Dashboard は Home surface のまま維持し、Active Changes と project overview の入口として扱う

## Capabilities

### New Capabilities
- `activity-bar`: 最左の固定コントロールレール。project selector の起点、Explorer 復帰導線、セクション（Home/Changes/Specs/Search/Settings）の表示・切替、アクティブ状態のハイライト
- `explorer-pane`: 左サイドのツリー/リストペイン。ACTIVE CHANGES・ARCHIVE・SPECS の collapsible セクションを workflow 順に見せつつ、Activity Bar の `Home / Changes / Specs` 選択に対応するセクションを優先展開。項目クリックでタブをオープン
- `tabbed-viewer`: メインエリアのタブシステム。複数ドキュメントを並行表示。タブの追加・削除・切り替え。ピン留め。変更状態表示
- `resizable-layout`: ResizableペインによるObsidianライクな3ペイン（Activity Bar + Explorer + Main Viewer）レイアウト。ペインの折りたたみ・展開と、狭幅時の Activity Bar-only fallback
- `shadcn-integration`: shadcn-svelte コンポーネントライブラリの統合。パスエイリアス、テーマ移行、Lucideアイコンへの置き換え

### Modified Capabilities
- `theme-management`: カスタムCSS変数→shadcn-svelteのoklchベーステーマ変数への移行。light/dark/systemモードは維持
- `project-context`: トップナビ→Activity Bar + Explorer構成へのUI変更。Dashboard は `Home → ACTIVE CHANGES` の対応を保ったまま、project selector を Activity Bar 上端と Explorer header に統合
- `change-browsing`: `Home → ACTIVE CHANGES`、`Changes → ARCHIVE` の対応で Explorer Pane の change sections を再編する
- `spec-browsing`: `Specs → SPECS` の対応で Explorer Pane 内の後段 workflow セクションへ統合
- `search`: ナビゲーションバー内の検索→Command PaletteまたはActivity Barからの検索パネルへ移動
- `command-preferences`: 設定Modal→Activity BarのSettingsアイコンから開くSidebarまたはDialogへ変更
- `command-shortcuts`: workspace command row を `Home → ACTIVE CHANGES` surface に合わせて再配置する
- `suggestion-handoff`: Suggestion Panel→右サイドのcollapsibleパネルとして統合

## Impact

- **Dependencies**: shadcn-svelte, bits-ui, @lucide/svelte, tailwindcss-animate の追加
- **Frontend**: `frontend/` 配下の全コンポーネントが影響。App.svelte, Navigation.svelte, Dashboard.svelte, SpecsList.svelte, ChangesList.svelte は大幅改修または置き換え
- **Stores**: `stores/index.svelte.ts` のルーティングロジック→タブ管理状態へ拡張
- **CSS**: `app.css` のテーマ変数定義をshadcn形式に移行
- **Config**: `vite.config.ts` に`$lib`エイリアス追加、`tsconfig.json` にpaths追加
- **Build**: `components.json`（shadcn-svelte設定）の追加
- **Backend**: 新規APIは追加しない。レイアウト側では project selector の配置と起動導線を担い、multi-project の発見/読み込みロジックは既存実装または別Changeに委ねる
