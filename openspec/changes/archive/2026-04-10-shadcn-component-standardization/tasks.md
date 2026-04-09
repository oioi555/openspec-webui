## 1. Foundations: shared utilities and shared UI primitives

- [x] 1.1 `truncateText(text, maxLength)` を `frontend/src/lib/utils.ts` に追加
- [x] 1.2 `decodeName(value)` を `frontend/src/lib/utils.ts` に追加
- [x] 1.3 `ActivityBar.svelte` のローカル `decodeName` を `$lib/utils` からの import に置き換え
- [x] 1.4 `MainViewer.svelte` のローカル `decodeName` を `$lib/utils` からの import に置き換え
- [x] 1.5 `SuggestionPanel.svelte` のローカル `truncateText` を `$lib/utils` からの import に置き換え
- [x] 1.6 `SuggestionPopover.svelte` のローカル `truncateText` を `$lib/utils` からの import に置き換え
- [x] 1.7 `frontend/src/lib/components/ui/badge/badge.svelte` に `success` variant があることを確認し、未実装なら追加する
- [x] 1.8 `frontend/src/lib/components/ui/error-banner/` に ErrorBanner コンポーネントを作成（`error` prop, `onRetry?` prop, `index.ts` を含む）
- [x] 1.9 `frontend/src/lib/components/ui/loading-state/` に LoadingState コンポーネントを作成（`height?` prop, デフォルト `h-64`, `index.ts` を含む）
- [x] 1.10 `frontend/src/lib/components/ui/empty-state/` に EmptyState コンポーネントを作成（`message` prop, `icon?` prop, `index.ts` を含む）
- [x] 1.11 `frontend/src/lib/components/ui/icon-box/` に IconBox コンポーネントを作成（`size`, `variant`, `icon` props, `index.ts` を含む）
- [x] 1.12 `frontend/src/lib/components/ui/callout/` に Callout コンポーネントを作成（`variant` prop, slot for content, `index.ts` を含む）
- [x] 1.13 `frontend/src/lib/components/ui/dialog-header/` に DialogHeader コンポーネントを作成（`icon?`, `title`, `description?`, `onClose` props, `index.ts` を含む）
- [x] 1.14 `frontend/src/lib/components/ui/command-chip/` に CommandChip コンポーネントを作成（`label`, `icon?`, `title?` props, compact emphasized styling, `index.ts` を含む）
- [x] 1.15 `frontend/src/lib/components/ui/underline-tabs/` に UnderlineTabs コンポーネントを作成（`tabs: { id, label, badge? }[]`, `activeId`, `onSelect` props, `index.ts` を含む）
- [x] 1.16 `frontend/src/lib/components/ui/explorer-section/` に ExplorerSection コンポーネントを作成（`title`, `count`, `open`, `focused?`, `onToggle` props + `headerExtra` snippet + default snippet, `index.ts` を含む）

## 2. Command shortcut abstraction first

- [x] 2.1 `CommandShortcutBar.svelte` の inline success button を `<CommandChip>` に置き換え
- [x] 2.2 `CommandShortcutBar.svelte` の row layout を compact な wrap row に調整する（dense gap, 複数行対応）
- [x] 2.3 `Dashboard.svelte` で command shortcut row が count badge / 見出しと衝突せず compact cluster として配置されるよう調整する
- [x] 2.4 `ChangeViewer.svelte` で command shortcut row と Suggest / Exit button を別 cluster として整列し、多数表示時も破綻しないようにする

## 3. General Button standardization

- [x] 3.1 `SuggestionPanel.svelte` の primary action button（Generate Instructions 等）を `<Button variant="default">` に置き換え
- [x] 3.2 `SuggestionPanel.svelte` の cancel / dismiss button を `<Button variant="ghost">` に置き換え
- [x] 3.3 `SuggestionPopover.svelte` の primary action button を `<Button variant="default">` に置き換え
- [x] 3.4 `SuggestionPopover.svelte` の cancel button を `<Button variant="ghost">` に置き換え
- [x] 3.5 `ChangeViewer.svelte` の suggestion toggle を state-aware な `<Button>` usage に置き換え（active / inactive の見た目を shared Button 上で表現）
- [x] 3.6 `MainViewer.svelte:45` の Retry button を `<Button variant="destructive">` に置き換え
- [x] 3.7 全ファイルの close (X icon) button を `<Button variant="ghost" size="icon">` に置き換え（ExplorerPane, SettingsModal, SearchDialog, SuggestionPanel, TabBar）
- [x] 3.8 `TabBar.svelte` の pin / unpin button を `<Button variant="ghost" size="icon">` に置き換え
- [x] 3.9 `explorer-simplify-navigation` の方針に合わせ、Explorer collapsed 時の独立 expand button を再導入しないことを確認する

## 4. Tabs and badge migration

- [x] 4.1 `SpecViewer.svelte` の inline underline tab nav を `<UnderlineTabs>` に置き換え
- [x] 4.2 `ChangeViewer.svelte` の primary group / spec delta tab nav を `<UnderlineTabs>` に置き換え、file count / spec delta count は `badge` prop で表現する
- [x] 4.3 `ExplorerPane.svelte` の count badge（3セクション分）を `<Badge variant="secondary">` に置き換え
- [x] 4.4 `ExplorerPane.svelte` の design indicator badge を `<Badge variant="outline">` に置き換え
- [x] 4.5 `ExplorerPane.svelte` の done badge を `<Badge variant="success">` に置き換え
- [x] 4.6 `ChangeViewer.svelte` の status / archived badge を `<Badge variant="secondary">` に置き換え
- [x] 4.7 `ChangeViewer.svelte` の spec delta capability badge を `<Badge variant="success">` に置き換え
- [x] 4.8 `Dashboard.svelte` の count badge を `<Badge variant="secondary">` に置き換え
- [x] 4.9 `ActiveChangesList.svelte` の design badge を `<Badge variant="outline">` に置き換え
- [x] 4.10 `SearchDialog.svelte` の type badge を `<Badge>` variant に置き換え

## 5. Error / loading / empty state replacement

- [x] 5.1 `ChangeViewer.svelte` の error container を `<ErrorBanner>` に置き換え
- [x] 5.2 `SpecViewer.svelte` の error container を `<ErrorBanner>` に置き換え
- [x] 5.3 `MainViewer.svelte` の error container を `<ErrorBanner>` に置き換え（onRetry 付き）
- [x] 5.4 `ChangeViewer.svelte` の loading 表示を `<LoadingState>` に置き換え
- [x] 5.5 `SpecViewer.svelte` の loading 表示を `<LoadingState>` に置き換え
- [x] 5.6 `MainViewer.svelte` の loading 表示を `<LoadingState>` に置き換え
- [x] 5.7 `ActiveChangesList.svelte` の empty state を `<EmptyState>` に置き換え
- [x] 5.8 `ExplorerPane.svelte` の3セクションの empty state を `<EmptyState>` に置き換え
- [x] 5.9 `MainViewer.svelte` の specs / changes empty state を `<EmptyState>` に置き換え
- [x] 5.10 `SuggestionPanel.svelte` の empty state を `<EmptyState>` に置き換え

## 6. Explorer structure extraction

- [x] 6.1 `ExplorerPane.svelte` の ACTIVE CHANGES セクションを `<ExplorerSection>` に置き換え（`headerExtra` snippet に CommandShortcutBar、default snippet に list / empty state を注入）
- [x] 6.2 `ExplorerPane.svelte` の ARCHIVE セクションを `<ExplorerSection>` に置き換え
- [x] 6.3 `ExplorerPane.svelte` の SPECS セクションを `<ExplorerSection>` に置き換え

## 7. Icon / callout / dialog header adoption

- [x] 7.1 `ExplorerPane.svelte` のセクションヘッダー側で icon を表示し、リストアイテム側には icon を表示しないことを確認する
- [x] 7.2 `ActiveChangesList.svelte` のアイテムアイコンを `<IconBox>` に置き換え
- [x] 7.3 `MainViewer.svelte` の list item アイコンを `<IconBox>` に置き換え
- [x] 7.4 `SpecViewer.svelte` のヘッダーアイコンを `<IconBox>` に置き換え
- [x] 7.5 `SettingsModal.svelte` の info / warning callout を `<Callout>` に置き換え
- [x] 7.6 `SuggestionPanel.svelte` の info callout を `<Callout>` に置き換え
- [x] 7.7 `SettingsModal.svelte` の dialog header を `<DialogHeader>` に置き換え
- [x] 7.8 `SearchDialog.svelte` の dialog header を `<DialogHeader>` に置き換え
- [x] 7.9 `SuggestionPanel.svelte` の panel header を `<DialogHeader>` に置き換え

## 8. Cleanup and verification

- [x] 8.1 `app.css` から `badge-num` グローバル CSS クラスを削除する
- [x] 8.2 `npm run typecheck` で TypeScript エラーがないことを確認
- [x] 8.3 `npm run build` で production build が成功することを確認
- [x] 8.4 `npm run test` で既存テスト（`theme.test.ts` を含む）が成功することを確認
- [x] 8.5 `badge-num` がコードベース内に残っていないことを確認
- [x] 8.6 `truncateText` / `decodeName` のローカル定義が残っていないことを確認
- [x] 8.7 `CommandShortcutBar.svelte` に inline success button 実装が残っていないことを確認
- [x] 8.8 `Dashboard` / `ExplorerPane` / `ChangeViewer` で command shortcut row が compact に wrap し、通常 action button と視覚的に分離されていることを手動確認
- [x] 8.9 新規 shared component がすべて `$lib/components/ui/<name>` から import 可能であることを確認
- [x] 8.10 Explorer collapsed 時に MainViewer 内の独立 expand button が存在しないことを確認
- [x] 8.11 ExplorerPane のセクションヘッダーには icon があり、リストアイテムには icon がないことを確認
