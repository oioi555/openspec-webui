## 1. Tools & Integrations: ドキュメントリンクをヘッダー内へ移動

- [x] 1.1 `SettingsView.svelte` L442–465 のドキュメントリンク `<p>` ブロック（ボディ先頭）を、同セクションの `<SectionHeader>` 左カラム（説明 `<p>` の直下）へ移動
- [x] 1.2 移動後の `<p>` に `flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground` クラスを適用し、Commands L526–531 と同じ構造にする
- [x] 1.3 ボディ `<div class="space-y-4 p-4">` の先頭から当該 `<p>` が削除され、検出インテグレーションリスト（L472 の枠付きリスト）がボディ先頭に来ることを確認

## 2. Commands: ドキュメントリンクにアイコンを付与

- [x] 2.1 `SettingsView.svelte` L526–531 のリンク `<a>` 2件のクラスを `underline hover:text-foreground` から `inline-flex items-center gap-1 underline hover:text-foreground` へ変更
- [x] 2.2 各リンクテキストの直後に `<ExternalLink class="h-3.5 w-3.5" />` を追加（Tools & Integrations L455, L463 と同じ記述）。`ExternalLink` は既に import 済みのため追加 import 不要

## 3. Versions: Projects to Update リストを枠付きスタイルへ統一

- [x] 3.1 `SettingsView.svelte` L832 の `<ul>` クラスを `mt-2 space-y-0.5` から `mt-2 divide-y divide-border overflow-hidden rounded-md border border-border bg-secondary/50` へ変更
- [x] 3.2 L837 の `<li>` クラス `flex items-center gap-2 rounded-sm px-1 py-1 text-sm` を `flex items-center gap-2 px-4 py-3 text-sm` へ変更（`rounded-sm` と `px-1 py-1` を削除、`px-4 py-3` を追加）
- [x] 3.3 空状態 (`{:else}` ブロック) の `<p>` は変更せず維持し、枠なしメッセージとして成立することを確認

## 4. 検証

- [x] 4.1 `npm test` で既存テスト（`settingsTab.test.ts` 含む）を実行。スナップショット差分が発生した場合は、意図された範囲（リンク位置・アイコン追加・リスト枠）の差分か確認し、問題なければ更新
- [x] 4.2 開発サーバで設定ページの 3 セクションを目視確認: ドキュメントリンクのヘッダー内統一配置、`ExternalLink` アイコン付きリンク、枠付き Projects to Update リスト
- [x] 4.3 `data-settings-section` アンカー属性が維持されていることを確認し、`settingsTab.test.ts` のアンカーベース探索が壊れていないことを検証
