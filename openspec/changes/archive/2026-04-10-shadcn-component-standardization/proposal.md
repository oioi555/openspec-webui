## Why

obsidian-layout-redesign で shadcn-svelte を導入し、レイアウト骨格を構築した。しかし既存コンポーネントの内部では、shadcn の `<Button>` や `<Badge>` があるにもかかわらずインラインクラスで手書きされたボタン・バッジが散在し、同一の UI 概念（エラー表示、ローディング、空状態、クローズボタン等）がファイルごとに微妙に異なるスタイルで実装されている。これを放置すると、テーマ変更時やデザイン調整時に全箇所を直すことになり、保守コストが高い。

一方で `CommandShortcutBar` の success 風ボタンはこのプロジェクトのコア導線であり、通常ボタンと同じ見た目に揃えるのではなく、**目立つが小さく、高密度でも破綻しない専用コンポーネント**として扱う必要がある。一般 UI アクションは shadcn `<Button>` / `<Badge>` に寄せつつ、command shortcut だけは `CommandChip` として抽象化し、強調と統一感の両立を図る。

## What Changes

- 一般 UI の primary / ghost / destructive / icon button を shadcn `<Button>` variant に統一
- インライン close / utility icon button を shared Button usage に統一（TabBar を含む。Explorer collapsed 時の独立 expand button は復活させない）
- インライン badge（`badge-num` CSS class を含む）を shadcn `<Badge>` variant に統一
- `CommandShortcutBar` の success 風ボタンを専用 shared component `<CommandChip>` に抽象化し、コンパクトで強調された command row に統一
- `Dashboard` / `ExplorerPane` / `ChangeViewer` で command shortcut row を通常ボタン群と視覚的に分離した compact cluster として整える
- 3ファイルにコピペされている Error banner を共通コンポーネントに抽出
- 3ファイルにコピペされている Loading state を共通コンポーネントに抽出
- 7箇所に散在する Empty state を共通コンポーネントに抽出
- ChangeViewer / SpecViewer の underline tab nav を共通 `<UnderlineTabs>` に統一し、count badge も API に吸収する
- ExplorerPane の3セクション（ACTIVE CHANGES / ARCHIVE / SPECS）の重複構造を `ExplorerSection` に抽象化
- 重複ユーティリティ関数（`truncateText`, `decodeName`）を `frontend/src/lib/utils.ts` に集約
- IconBox（色付きアイコン+背景）、Callout（info/warning ボックス）、DialogHeader の共通化
- `app.css` の `badge-num` グローバルクラスを削除（`<Badge>` または `UnderlineTabs` の badge API で代替）
- semantic color role（primary / secondary / accent / success / warning / danger / info / muted）の使用ガイドを spec 化し、hover/active の意味論を揃える

## Capabilities

### New Capabilities
- `shared-ui-parts`: ErrorBanner, LoadingState, EmptyState, IconBox, Callout, DialogHeader, ExplorerSection, CommandChip, UnderlineTabs の各共通 UI パーツ。`frontend/src/lib/components/ui/` 配下に配置し、`$lib` エイリアスで import 可能にする

### Modified Capabilities
- `shadcn-integration`: Button / Badge の共通利用を徹底し、feature component からインライン button / badge 実装を除去する。command shortcut は通常 Button ではなく `CommandChip` を使う
- `theme-management`: semantic color token の定義だけでなく、各 role をどの状態・用途で使うかの usage guideline を定義する
- `command-shortcuts`: workspace / change-scoped の command shortcut row を `CommandChip` ベースの compact, emphasized cluster に更新する
- `tabbed-viewer`: ChangeViewer / SpecViewer の underline tab nav を共通 UnderlineTabs に統一し、optional badge count をサポートする
- `explorer-pane`: 3セクションの重複構造を ExplorerSection コンポーネントで抽象化し、ACTIVE CHANGES では headerExtra slot に command shortcut row を差し込めるようにする
- `suggestion-handoff`: SuggestionPanel / SuggestionPopover のユーティリティ関数（`truncateText`）を `frontend/src/lib/utils.ts` に移動し、一般 action button を shadcn Button に統一する
- `activity-bar`: `decodeName` ユーティリティを `frontend/src/lib/utils.ts` に移動

## Impact

- **Frontend**: `frontend/src/components/` の各 feature component が影響。`frontend/src/lib/components/ui/` に shared component を追加。`frontend/src/lib/utils.ts` に関数追加
- **CSS**: `frontend/src/app.css` から `badge-num` クラスを削除。command shortcut 用の見た目は shared component 側へ集約
- **Dependencies**: 新規依存なし（既存 shadcn コンポーネントと既存 theme token を活用）
- **Backend**: 影響なし
- **Breaking**: なし（レイアウト構造と主要フローは維持し、UI 実装境界を整理する）
