## Why

現在のレスポンシブ breakpoint は 768px ですが、このアプリの主なデスクトップ利用形態は FHD（1920×1080）画面を左右半分にスナップした 960px 幅です。この幅でも Explorer Pane が常時表示のままになっており、Markdown ドキュメント表示が主目的の Main Viewer の表示領域を圧迫しています。もっとも一般的な半画面幅に breakpoint を合わせ、**960px ちょうどで** Explorer が drawer に切り替わるようにするべきです。

また、`ResponsiveMode` 型は `narrow` / `medium` / `wide` の3段階を定義していますが、実際に参照されているのは `narrow` かそれ以外かだけです。未使用の `medium` は複雑さを増やすだけで価値がありません。

## What Changes

- **BREAKING**: narrow mode への切り替え breakpoint を 768px から 960px（FHD 半画面幅）へ変更し、`960px 以下` を narrow とする
- 未使用の `medium` responsive mode を削除し、型を `narrow` | `wide` に簡素化する
- spec 内の 768px 参照を 960px に更新する

## Capabilities

### New Capabilities

_なし_

### Modified Capabilities

- `resizable-layout`: narrow-width fallback の breakpoint を 768px から 960px に変更し、960px 以下で narrow layout に切り替える
- `explorer-pane`: narrow drawer 挙動が 768px ではなく 960px 以下で発火するようにする

## Impact

- `frontend/src/stores/layout.svelte.ts` — breakpoint 定数と `ResponsiveMode` 型
- `openspec/specs/resizable-layout/spec.md` — 768px を参照している spec テキスト
- `openspec/specs/explorer-pane/spec.md` — 768px を参照している spec テキスト
- UI コンポーネントの構造変更は行わず、store 由来の反応的な挙動のみ変更する
