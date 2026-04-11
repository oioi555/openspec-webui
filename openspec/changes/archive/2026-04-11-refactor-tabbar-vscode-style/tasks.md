## 1. 依存関係のセットアップ

- [x] 1.1 ContextMenu コンポーネント群を手動作成 — `context-menu/` に6ファイル（context.ts, root, content, item, separator, index.ts）。shadcn CLI非対応のため手動。

## 2. Tab Store の拡張

- [x] 2.1 `stores/tabs.svelte.ts` に `closeOthers(tabId: string)` メソッドを追加 — 指定タブとPIN留めタブ以外を一括クローズし、指定タブをアクティブにする
- [x] 2.2 `stores/tabs.svelte.ts` に `closeAll()` メソッドを追加 — PIN留めタブ以外を全てクローズし、先頭のPINタブをアクティブ化

## 3. TabBar コンポーネントの書き換え

- [x] 3.1 ファイルタイプアイコンマッピング関数 `getTabIcon(tab)` を定義 — change タイプは `archivedChanges` と照合し動的判定（アクティブ=SquarePen, アーカイブ=Archive）
- [x] 3.2 タブ形状を上丸みタブスタイルに変更 — アクティブ: `rounded-t-md border border-b-0 border-border bg-background -mb-px`、非アクティブ: ボーダーなし、ホバー: `bg-muted/50`
- [x] 3.3 タブバーのレイアウト調整 — `h-12`(48px) 高さ、`pl-2` による先頭タブ left-edge alignment（Explorer パネル上段の project selector 行と揃える）、`items-end` でタブを下端に揃える
- [x] 3.4 PIN ボタンをタブから削除し、右端スロットを `×` (アクティブ常時/非アクティブホバー時) / クリック可能 `Pin` アイコン (PIN留め時) に変更
- [x] 3.5 PinアイコンクリックでUnpin可能にする
- [x] 3.6 ContextMenu を各タブに実装 — メニュー項目: Pin/Unpin, Close, Close Others, Close All, separator, Copy Name, Copy Path
- [x] 3.7 Homeタブの ContextMenu で Close, Close Others, Pin/Unpin を無効化
- [x] 3.8 Copy Name / Copy Path のアクション実装 — `navigator.clipboard.writeText()` + Sonner トースト通知。Copy Path は `openspec` プレフィックス付き
- [x] 3.9 ドラッグ&ドロップによるタブ並べ替えを実装 — HTML5 DnD API + Store の `reorder()` + 最右端ドロップゾーン + `dataTransfer` 設定
- [x] 3.10 アーカイブChangeタブ名の日付プレフィックス省略 — `$lib/utils.ts` の `formatChangeName()` ユーティリティ関数で共通化
- [x] 3.11 タブ幅の最小幅確保とアクティブタブ拡張 — `min-w-15` (60px) + `shrink-0` で最小幅確保、アクティブ時 `max-w-96` (384px)、非アクティブ時 `max-w-64` (256px)、`transition-all duration-150` でアニメーション
- [x] 3.12 アクティブタブへの自動スクロール — `tabRefs` 配列でタブ参照を保持、`$effect` で `activeTabId` 変更時に `scrollIntoView({ behavior: 'smooth', inline: 'center' })` を実行
- [x] 3.13 マウスホイールによる横スクロール — `onwheel` イベントハンドラで垂直ホイールを水平スクロールに変換

## 4. テスト

- [x] 4.1 `frontend/src/lib/utils.test.ts` に `formatChangeName()` の unit test を追加 — archived change の日付プレフィックス除去と非アーカイブ名の据え置きを確認
- [x] 4.2 `scripts/test-tabbar-ui.mjs` に focused CDP browser test を追加 — pinned Home、archived change タブの表示名、`pl-2` による left-edge inset を確認
- [x] 4.3 `package.json` の test scripts を更新 — unit test と tabbar browser test を別々に実行できるようにする
