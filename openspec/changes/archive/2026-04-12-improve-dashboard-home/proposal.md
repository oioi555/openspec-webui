## Why

前回の Dashboard 改修で情報量は増えたが、Quick Actions / Next Step / MainViewer の list pages は OpenSpec の実際の導線と噛み合っていない。Explorer Pane が担うべき browsing 責務と、change ごとに異なる command shortcut を Dashboard 側で重複的に扱ってしまい、かえってノイズが増えた。

## What Changes

- Dashboard summary cards を Explorer Pane と同じ順序（Active Changes / Archive / Specs / Tasks）に揃える
- summary cards は MainViewer の `/changes` / `/specs` list page を開かず、対応する Explorer Pane section を展開・focus するだけにする
- MainViewer の standalone Changes / Specs list pages を削除し、section browsing は Explorer Pane に一本化する
- UI 上の `Home` 表示を `Dashboard` に戻し、ページタイトル・Dashboard tab 名称・Activity Bar tooltip/aria-label・change artifacts 内のページ名称を揃える
- Dashboard の Quick Actions / Next Step panels を廃止し、2 カラムレイアウトをやめて single-column flow に戻す
- Recent Activity は採用しつつ、Active Changes の下に full-width section として再配置する
- Specs summary card のアイコンを `FileText` に統一する
- change-scoped command shortcuts は Dashboard の Active Changes list item 内に移し、各 change の task 状態と設定に応じて表示し、行頭に `Next Step` ラベルを添える
- Active Changes の empty state は維持しつつ、Explorer focus ベースの導線に揃える
- Recent Activity section の各 item は list row ではなく密度の高い card 表示にする
- workspace summary cards を基準に、Recent Activity / SpecViewer / TabBar の spec / active-change icon color を統一する
- Recent Activity section header に、時系列の意味が伝わる適切な icon を追加する

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `project-context`: Dashboard を Explorer と整合した summary / active changes / recent activity / documentation の Home surface に再整理する
- `activity-bar`: `Home` 表示を `Dashboard` に戻し、Activity Bar の tooltip / aria-label / spec 上の名称を揃える
- `tabbed-viewer`: MainViewer から standalone Changes / Specs list pages を削除し、detail tab 中心の routing に寄せる
- `command-shortcuts`: change-scoped command shortcuts を Dashboard の Active Changes list item に埋め込む
- `spec-browsing`: spec surfaces の icon color を Dashboard summary cards と整合させる

## Impact

- `openspec/specs/project-context/spec.md`: Dashboard card order / layout / recent activity / empty state の更新
- `openspec/specs/activity-bar/spec.md`: Dashboard 名称への UI ラベル戻し
- `openspec/specs/tabbed-viewer/spec.md`: `/changes` / `/specs` list page 廃止と route normalization の更新
- `openspec/specs/command-shortcuts/spec.md`: Dashboard list item 内 change-scoped command shortcut の更新
- `frontend/src/components/Dashboard.svelte`: Dashboard 名称表示、Specs card icon 統一、Recent Activity card 化、item-level command shortcut + `Next Step` ラベル実装
- `frontend/src/components/SpecViewer.svelte`: spec header icon color の統一
- `frontend/src/components/layout/TabBar.svelte`: spec tab icon color の統一
- `frontend/src/components/layout/ActivityBar.svelte`: Dashboard tooltip / aria-label
- `frontend/src/components/layout/MainViewer.svelte`: standalone list pages 削除
- `frontend/src/stores/tabs.svelte.ts`: `/changes` / `/specs` の Home fallback 化
- `scripts/verify-ui.mjs`, `scripts/test-tabbar-ui.mjs`: Dashboard tab / activity button 名称に追従
- `frontend/src/lib/commandShortcuts.ts`: Dashboard list item から再利用できる change command helper 調整
