## 1. Dashboard labeling and cards

- [x] 1.1 UI 上の `Home` 表示を `Dashboard` に戻す（ページタイトル、Dashboard tab 名称、Activity Bar tooltip / aria-label）
- [x] 1.2 Specs summary card のアイコンを `FileText` に統一する
- [x] 1.3 Dashboard empty state / helper copy の表記を `Dashboard` 名称に揃える

## 2. Active change next-step cue and recent activity density

- [x] 2.1 Active Changes item の command row 左側に `Next Step` cue を追加する
- [x] 2.2 Recent Activity section の items を dense card 表示に変更する

## 3. Supporting scripts and verification

- [x] 3.1 `scripts/verify-ui.mjs` と `scripts/test-tabbar-ui.mjs` の label expectations を `Dashboard` に更新する
- [x] 3.2 `openspec status --change "improve-dashboard-home"` で artifacts と tasks の整合を確認する
- [x] 3.3 `npm run typecheck:frontend` を実行して Svelte/TypeScript エラーがないことを確認する
- [x] 3.4 `npm run build` を実行してビルド成功を確認する

## 4. Spec icon color consistency

- [x] 4.1 workspace summary cards を基準に Recent Activity の spec icon box color を揃える
- [x] 4.2 `SpecViewer.svelte` の h1 icon box color を spec summary card と揃える
- [x] 4.3 `TabBar.svelte` の spec icon color を spec summary card と揃える
- [x] 4.4 `npm run typecheck:frontend` を実行して Svelte/TypeScript エラーがないことを確認する
- [x] 4.5 `npm run build` を実行してビルド成功を確認する

## 5. Recent Activity active-change icon consistency

- [x] 5.1 Recent Activity の Active Change icon box color を Active Changes summary card と揃える
- [x] 5.2 `npm run typecheck:frontend` を実行して Svelte/TypeScript エラーがないことを確認する
- [x] 5.3 `npm run build` を実行してビルド成功を確認する

## 6. Project Documentation focus behavior

- [x] 6.1 `Focus section` ボタンで ExplorerPane を展開せず、ドキュメント位置へスクロールだけ行う
- [x] 6.2 `npm run typecheck:frontend` を実行して Svelte/TypeScript エラーがないことを確認する
- [x] 6.3 `npm run build` を実行してビルド成功を確認する

## 7. Recent Activity header icon

- [x] 7.1 Recent Activity header に時系列の意味が伝わる icon を追加する
- [x] 7.2 `npm run typecheck:frontend` を実行して Svelte/TypeScript エラーがないことを確認する
- [x] 7.3 `npm run build` を実行してビルド成功を確認する
