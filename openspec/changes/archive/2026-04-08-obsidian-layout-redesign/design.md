## Context

OpenSpec WebUIは現在、シングルカラムの従来型Webレイアウトを採用している。Svelte 5 (runes) + Vite 6 + Tailwind CSS 4 の構成で、カスタムCSS変数によるテーマ管理、手動pathnameパースによるルーティング、全てハンドメイドのUIコンポーネントで構成されている。

フロントエンドは `frontend/` サブディレクトリに配置され、`svelte.config.js` で `runes: true` を指定。SvelteKitは使用せず、plain Svelte + Vite SPAとして動作している。

バックエンド（Fastify）はAPI + WebSocket + ファイル監視を提供し、今回の変更範囲外。

## Goals / Non-Goals

**Goals:**
- Obsidianライクな3ペインレイアウト（Activity Bar + Explorer + Main Viewer）の実現
- Activity Bar / Explorer Pane / Dashboard の役割を、`Home → ACTIVE CHANGES`、`Changes → ARCHIVE`、`Specs → SPECS` の対応で揃える
- Activity Bar の選択と Explorer Pane のセクションが直接リンクするようにする
- Explorer Pane を閉じても Activity Bar を残し、常にレイアウトの起点として機能させる
- project selector をレイアウトの上位導線として統合する
- Explorer ですべてのリストを見せつつ、Activity Bar 選択で必要なセクションだけを優先展開する
- shadcn-svelteコンポーネントライブラリの導入によるUI品質向上とパーツ化
- タブベースのメインビューアーによる複数ドキュメントの並行閲覧
- Resizableペインによるレイアウトのカスタマイズ性
- 画面幅が不足する場合に Activity Bar + Main Viewer へ縮退する desktop-first なレスポンシブ挙動
- 既存テーマ（light/dark/system）の維持とshadcnテーマへの移行
- 既存の全機能（specs/changes閲覧、search、suggestion、command shortcuts）の保持

**Non-Goals:**
- バックエンドAPIの変更
- 新しい multi-project discovery / loading API の設計し直し（レイアウト側では既存の current project / project selector 導線を受け取る）
- 完全なモバイル最適化（ただし狭幅時の Activity Bar-only fallback は対象）
- オフライン機能やPWA対応
- 認証・認可

## Decisions

### Decision 1: shadcn-svelte を plain Vite + Svelte 5 で使用する

**Choice**: shadcn-svelte (Svelte 5 + Tailwind CSS v4対応版) を `$lib` エイリアスで導入

**Rationale**: shadcn-svelteはSvelteKit前提のドキュメントが多いが、実際にはplain Vite環境でも動作する。`$lib` エイリアスを `frontend/src/lib` に設定し、`components.json` でパスを指定することで対応。

**Alternatives considered:**
- SvelteKitへの移行: 現在のSPA構成を壊す変更が多すぎる。バックエンドがFastifyでSSR不要
- Skeleton UI: v3でSvelte 5対応したが、shadcn-svelteの方がコンポーネント数が多く、コミュニティも活発
- Completely custom: 現状のアプローチ。メンテナンスコストが高い

### Decision 2: アイコンライブラリに @lucide/svelte を採用

**Choice**: `@lucide/svelte`（shadcn-svelte推奨の後継）

**Rationale**: shadcn-svelte v2以降は `lucide-svelte` から `@lucide/svelte` に移行。既存のカスタム `Icon.svelte` を完全に置き換える。Obsidianで使われるアイコンに相当するものが全て揃っている。

**Migration**: `Icon.svelte` は削除し、各コンポーネントで直接 `@lucide/svelte` からインポートする。

### Decision 3: レイアウト構成

**Choice**: 3ペイン構成（Activity Bar + Explorer Pane + Main Viewer）+ オプション右サイドバー。Activity Bar は常時残し、最上部に current project control を置く

```
┌────────────┬─────────────────────────┬────────────────────────┐
│ Activity   │ Explorer Pane           │ Main Viewer (Tabbed)   │
│ Bar        │ (Collapsible/Resizable) │ ┌─Tab1─┬─Tab2─┐       │
│ (48px)     │ Project header          │ │      │      │       │
│ [Project]  │ ▾ ACTIVE CHANGES        │ │ Content Renderer     │
│ Home       │ ▾ ARCHIVE               │ │      │      │       │
│ Changes    │ ▸ SPECS                 │ └──────┴──────┘       │
│ Specs      │                         │                        │
│ Search     │ (240px default,         │ (flex-1)               │
│ Settings   │ 180-400px resizable)    │                        │
└────────────┴─────────────────────────┴────────────────────────┘
```

**Rationale**: ObsidianのUIパターンを踏襲しつつ、Explorer Pane を閉じてもナビゲーションの足場を失わないようにする。project selector を Activity Bar に置くことで、Explorer 非表示時や狭幅時でも project context を失わない。

**Implementation**: shadcn-svelteの `Resizable`, `Tabs`, `Collapsible`, `ScrollArea`, `Tooltip`, `Sheet` コンポーネントを活用。

### Decision 4: タブ管理システム

**Choice**: 新しい `tabStore` でタブ状態を一元管理。URLルーティングは補助的に維持。

**Rationale**: タブのオープン/クローズ/切り替え/並び順を集中管理する。URLは直接アクセス時にタブを復元する用途で維持（`/specs/foo` → `foo` タブをオープン）。

**Tab data model:**
```typescript
interface Tab {
  id: string;          // 一意ID（"spec:auth" や "change:login-feature"）
  type: 'spec' | 'change' | 'dashboard';
  name: string;        // 表示名
  path: string;        // URL path（復元用）
  pinned?: boolean;    // ピン留め
  dirty?: boolean;     // 変更あり（将来用）
}
```

### Decision 5: テーマ移行アプローチ

**Choice**: 段階的移行。既存のカスタムCSS変数をshadcnのoklch変数にマップし、段階的にshadcnコンポーネントに置き換え。

**Rationale**: 一度に全てを移行するとリスクが高い。まずshadcnのCSS変数をベースに追加し、既存変数をshadcn変数のエイリアスとして残すことで、移行期間中の互換性を確保。

### Decision 6: Explorer Paneの構造

**Choice**: 3つの collapsible セクション（ACTIVE CHANGES / ARCHIVE / SPECS）を workflow 順に縦に並べるリスト形式。すべてのセクションヘッダーは常時見せ、Activity Bar の選択で「focus preset」を適用する

**Rationale**: 一覧の全体像は常に見せつつ、operator の実際の workflow（active work → archived reference → specs reference）に並び順を揃え、Activity Bar 側の `Home / Changes / Specs` と対応づけるため。ツリー（ネスト）ではなくフラットリスト + セクションヘッダーの方が、現在のデータ構造（specs/changesはフラット）に合致する。

**Interaction rules:**
- `Home` を Activity Bar で選ぶと、Dashboard タブを開きつつ、Explorer Pane を必要に応じて再展開し、`ACTIVE CHANGES` を展開、`ARCHIVE` と `SPECS` を縮小する
- `Changes` を Activity Bar で選ぶと、Explorer Pane を必要に応じて再展開し、`ARCHIVE` を展開、`ACTIVE CHANGES` と `SPECS` を縮小する
- `Specs` を Activity Bar で選ぶと、Explorer Pane を必要に応じて再展開し、`SPECS` を展開、`ACTIVE CHANGES` と `ARCHIVE` を縮小する
- `Search` / `Settings` は overlay を開き、Explorer の状態は保持する
- Explorer 内での手動開閉は許可し、その状態は次の Activity Bar preset 適用まで維持する

### Decision 7: 画面幅ごとの縮退ルール

**Choice**: 3つのレイアウトモードを定義する

| Mode | Width | Behavior |
|------|-------|----------|
| Wide | `> 1024px` | Activity Bar + Explorer + Main Viewer を常設。Explorer は resizable |
| Medium | `768px - 1024px` | 3ペインを維持。ただし Explorer はより狭い幅を初期値にし、右 sidebar はデフォルトで閉じる |
| Narrow | `< 768px` | Activity Bar + Main Viewer のみ常設。Explorer は常時表示せず、`Home` / `Changes` / `Specs` 選択時に temporary drawer (`Sheet`) として開く |

**Rationale**: 現段階ではデスクトップファーストを維持しつつ、「幅が足りないときは Activity Bar だけ残す」という縮退だけは明文化しておく。完全なモバイル最適化までは広げない。

### Decision 8: Project selector の配置

**Choice**: current project control を Activity Bar 最上部に常設し、Explorer が開いているときは Explorer header に full label を重ねて見せる

**Rationale**: project selection はレイアウトの文脈そのものなので、Explorer Pane の有無に依存させない方がよい。48px の Activity Bar では icon / initials / tooltip で current project を示し、Explorer 側では名称をフル表示して補完する。

### Decision 9: Dashboard の役割

**Choice**: Dashboard は `Home` タブとして残し、project overview / documentation と Active Changes の導線を持つ

**Rationale**: Activity Bar に `ACTIVE CHANGES` 専用アイコンを増やさずに Explorer Pane と対応づけるには、`Home → ACTIVE CHANGES` の関係を明示する必要がある。Dashboard は Home surface として残し、Explorer Pane の ACTIVE CHANGES section と連動させる。

## Risks / Trade-offs

- **[Risk] shadcn-svelte + plain Vite の相性問題** → 手動セットアップ手順を確立し、`components.json` で適切なパスを設定。初期セットアップで動作確認してから本格実装へ
- **[Risk] 大規模なフロントエンド書き換えによるデグレ** → 段階的アプローチ。まずレイアウトシェルを作成し、既存コンポーネントを順次移行
- **[Risk] Activity Bar と Explorer の二重状態管理が複雑化する** → `layoutStore` に focus preset / explorer collapse / remembered width を集約する
- **[Trade-off] 初期開発コストが高い** → shadcn導入により長期的な保守コストは大幅に削減
- **[Trade-off] バンドルサイズの増加** → shadcn-svelteは個別コンポーネント追加方式（tree-shakeable）なので、使用分のみの増加に抑える
- **[Risk] タブ状態の複雑化** → シンプルなtabStore設計で対応。永続化は当初しない（将来の改善）
- **[Trade-off] 完全なモバイル対応は先送り** → まずは narrow mode での Activity Bar-only fallback と drawer access に留める
