## Why

現在の TabBar はボタンが並んだシンプルなUIで、タブらしい見た目ではない。PIN ボタンが各タブに常時表示されてスペースを無駄に消費している。また、ファイルタイプごとのアイコン表示や右クリックメニューがなく、VSCodeライクな操作感に遠い。タブバーの見た目と操作性をVSCode水準に引き上げ、タブの視認性と操作効率を改善する。

## What Changes

- PIN ボタンをタブから削除し、Context Menu（右クリックメニュー）に移動する
- shadcn-svelte の ContextMenu コンポーネントを導入する（shadcn CLIが動作しないため手動作成）
- Context Menu に以下の操作を追加: Pin/Unpin、Close、Close Others、Close All、Copy Name、Copy Path
- タブの見た目をタブ形状（上丸み+ボーダー）に変更し、アクティブタブはコンテンツ領域と視覚的に接続する
- ファイルタイプ（dashboard / spec / change）ごとにアイコンと色を表示する
- change タイプはアーカイブ状態を動的判定し、アクティブ=`SquarePen`、アーカイブ済み=`Archive` に切り替える
- PIN留めタブは `×` の代わりに Pin アイコンを表示し、クリックで Unpin 可能にする
- アクティブタブの閉じるボタンは常時表示、非アクティブはホバー時のみ表示する
- Tab Store に `closeOthers()` と `closeAll()` メソッドを追加する
- タブのドラッグ&ドロップによる並べ替えを可能にする（既存の `reorder()` メソッドを活用）
- タブバーの高さを48pxに拡大し、`pl-2` の左パディングで先頭タブの左端を Explorer パネル上段の project selector 行と揃える（ActivityBar 最上段は project button のため、ボタン中心合わせではなく左端合わせを維持する）
- タブ最小幅を60pxに設定し、`shrink-0` で無限縮小を防止、横スクロールを有効化
- アクティブタブは最大384px、非アクティブは最大256pxで視認性を向上
- アクティブタブ変更時に自動スクロールでタブを中央に表示
- Copy Path は `openspec/` プレフィックス付きでプロジェクトルートからの相対パスをコピーする

## Capabilities

### New Capabilities

（なし — 既存 `tabbed-viewer` の拡張）

### Modified Capabilities

- `tabbed-viewer`: タブバーの視覚スタイル変更（タブ形状、ファイルタイプアイコン、高さ拡大、`pl-2` による左端揃え、最小幅60pxでスクロール有効化、アクティブタブ最大384pxで強調）、PIN ボタン廃止→Context Menu化+PinアイコンクリックUnpin、Context Menu操作の追加（Close Others、Close All、Copy Name、Copy Path）、アクティブタブの閉じるボタン常時表示、タブのドラッグ&ドロップ並べ替え、アクティブタブへの自動スクロール、`formatChangeName()` の unit test とタブバー挙動の CDP browser test 追加

## Impact

- **コンポーネント**: `TabBar.svelte` の全面書き換え（83行→210行）
- **コンポーネント**: `context-menu/` UIコンポーネント群を新規作成（6ファイル）
- **Store**: `tabs.svelte.ts` に `closeOthers()`, `closeAll()` メソッドを追加
- **依存関係**: shadcn-svelte `context-menu` コンポーネント（手動作成、shadcn CLI非対応のため）
- **ユーティリティ**: ファイルタイプ→アイコン/色のマッピング関数（TabBar内インライン）
- **テスト**: `frontend/src/lib/utils.test.ts` に `formatChangeName()` の unit test を追加
- **テスト**: `scripts/test-tabbar-ui.mjs` に tab bar の left-edge alignment / archived change 表示名 / pinned Home を確認する CDP browser test を追加
- **既存機能**: PIN/Unpin の機能自体は維持、操作手段をボタン→Context Menu + Pinアイコンクリックに変更
- **ドラッグ&ドロップ**: 既存 `reorder()` メソッドをUI層から呼び出す形で実装
