## 1. Navigation

- [x] 1.1 `Navigation.svelte` の Dashboard リンクを削除し、Home / Changes / Specs の3項目にする
- [x] 1.2 Changes ナビゲーションのバッジを archived changes 数に変更

## 2. Home Page (Dashboard → Home)

- [x] 2.1 `Dashboard.svelte` のページタイトルを "Dashboard" → "Home" に変更
- [x] 2.2 Stats Cards を3列（Active Changes / Archived Changes / Total Specs）に変更し、順序を入れ替え
- [x] 2.3 Archived Changes カードを `/changes` へのリンクにする
- [x] 2.4 Total Specs カードを `/specs` へのリンクにする
- [x] 2.5 Stats Cards をコンパクトな1行フォーマット（数値 + ラベル）に変更
- [x] 2.6 Overall Progress を Active Changes カード内のインラインインジケーターに統合

## 3. Changes Page (Archived 専用化)

- [x] 3.1 `ChangesList.svelte` から Active Changes セクションと `CommandShortcutBar` を削除
- [x] 3.2 ページタイトルを "Changes" → "Archived Changes" に変更
- [x] 3.3 Archived Changes のトグル表示を常時表示に変更
- [x] 3.4 アーカイブがない場合 "No archived changes" を表示

## 4. Back Links

- [x] 4.1 `ChangeViewer.svelte` の戻るリンクを、active change なら `/`、archived change なら `/changes` に条件分岐
- [x] 4.2 `SpecViewer.svelte` の戻るリンクが `/specs` であることを確認（調整があれば修正）

## 5. Cleanup

- [x] 5.1 未使用の import（`CommandShortcutBar` 等）を `ChangesList.svelte` から削除
- [x] 5.2 ビルド・型チェックが通ることを確認
