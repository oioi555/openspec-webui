## 1. ChangeViewer Context Menu Integration

- [x] 1.1 `ChangeViewer.svelte` に `ContextMenu` コンポーネント（Root, Content, Item）と `toast`（svelte-sonner）、`Clipboard` / `Quote` アイコン（@lucide/svelte）を import する
- [x] 1.2 ChangeViewer の script に `hasSelection` 状態（`$state(false)`）を追加し、`getContextLabel()` ヘルパー関数を実装する — 現在のタブ（file content / spec delta）に応じてファイル名または capability 名を返す
- [x] 1.3 `copyToClipboard(text: string, label: string)` 関数を実装する — `navigator.clipboard.writeText()` + `toast.success` / `toast.error` の既存パターンに従う
- [x] 1.4 `handleCopy()` 関数を実装する — `window.getSelection().toString()` で選択テキストを取得し `copyToClipboard()` に渡す
- [x] 1.5 `handleQuoteCopy()` 関数を実装する — 選択テキストを取得し、`> [{changeName}] {contextLabel}\n` + 各行に `> ` プレフィックスを付けて Markdown blockquote 形式に組み立て、`copyToClipboard()` に渡す
- [x] 1.6 コンテンツ領域を `ContextMenu.Root` でラップし、`onOpenChange` コールバックで `window.getSelection().toString()` をチェックして `hasSelection` を更新する
- [x] 1.7 `ContextMenu.Content` 内に "Copy" と "Quote Copy" の2つの `ContextMenu.Item` を配置し、それぞれ `disabled={!hasSelection}` と `onSelect` ハンドラをバインドする

## 2. SpecViewer Context Menu Integration

- [x] 2.1 `SpecViewer.svelte` に `ContextMenu` コンポーネント（Root, Content, Item）と `toast`（svelte-sonner）、`Clipboard` / `Quote` アイコン（@lucide/svelte）を import する
- [x] 2.2 SpecViewer の script に `hasSelection` 状態を追加し、コンテキストラベルとして `activeTab` に応じて "Specification" または "Design" を返すロジックを実装する
- [x] 2.3 `copyToClipboard` / `handleCopy` / `handleQuoteCopy` を ChangeViewer と同一パターンで実装する（コンテキスト情報は `specName` + タブラベル）
- [x] 2.4 コンテンツ領域を `ContextMenu.Root` でラップし、ChangeViewer と同一のテンプレート構成にする

## 3. Verification

- [x] 3.1 ChangeViewer: テキスト未選択状態で右クリック時、両メニュー項目が disabled になることを確認する
- [x] 3.2 ChangeViewer: テキスト選択状態で "Copy" 実行時、クリップボードにプレーンテキストがコピーされトーストが表示されることを確認する
- [x] 3.3 ChangeViewer: テキスト選択状態で "Quote Copy" 実行時、クリップボードに `> [change-name] file-name\n> selected text` 形式でコピーされることを確認する
- [x] 3.4 ChangeViewer: Spec Deltas タブで "Quote Copy" 実行時、capability 名がコンテキスト情報として使用されることを確認する
- [x] 3.5 SpecViewer: テキスト未選択状態で右クリック時、両メニュー項目が disabled になることを確認する
- [x] 3.6 SpecViewer: "Quote Copy" 実行時、spec name と "Specification" / "Design" がコンテキスト情報として使用されることを確認する
- [x] 3.7 複数行選択時、Quote Copy で各行に `> ` プレフィックスが付くことを確認する
