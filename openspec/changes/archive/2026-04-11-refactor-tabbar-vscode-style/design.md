## Context

現在の `TabBar.svelte` (83行) は、`MainViewer.svelte` からのみ使用される単一コンポーネント。shadcn-svelte の `Tabs` + `ScrollArea` + `Button` を使って実装されている。

タブは `rounded-lg border` のボタン風デザインで、各タブに Pin ボタンと Close ボタンが常時表示。PIN留めタブは Close ボタンが非表示になるが、Pin ボタン自体は常に表示されスペースを占有している。

Tab Store (`stores/tabs.svelte.ts`) は Svelte 5 Runes ベースで、Tab型は `{ id, type: TabType, name, path, pinned? }` を持つ。`TabType` は `'dashboard' | 'spec' | 'change'` の3種。

プロジェクトは shadcn-svelte + Tailwind v4 (oklch) を使用。ContextMenu コンポーネントは未インストール。アイコンライブラリは `@lucide/svelte`。ActivityBar は `w-12`(48px) で最上段に project button を配置し、Explorer パネル上段には project selector 行がある。

## Goals / Non-Goals

**Goals:**
- タブバーをVSCodeライクなタブ形状に変更し、視覚的にタブらしくする
- PIN ボタンを削除し、右クリック Context Menu に操作を集約する
- ファイルタイプごとのアイコンと色でタブの識別性を向上させる
- Context Menu 経由で Close Others、Close All、Copy Name、Copy Path を提供する
- PIN留めタブは Pin アイコン表示で状態を一目で分かるようにし、クリックでUnpin可能にする
- アクティブタブの閉じるボタンを常時表示する
- タブバーの高さを拡大し、Explorer パネル上段の project selector 行と先頭タブの左端を揃える

**Non-Goals:**
- タブの分割表示（split view）
- キーボードショートカットによるタブ操作
- Tab Store の根本的な再設計

## Decisions

### D1: ContextMenu を shadcn-svelte パターンで手動作成

**選択**: 既存の `dropdown-menu` コンポーネントと同じパターン（Context API + `$state`）で `context-menu/` を手動作成。6ファイル構成（context.ts, root, content, item, separator, index.ts）。

**理由**: `npx shadcn-svelte@next add context-menu` が `package.json` の配置問題で失敗するため。dropdown-menu と同じアーキテクチャで統一性を維持。`display:contents` で flex レイアウトを壊さない設計。viewport clamping 内蔵。

**代替案**: Radix ContextMenu を直接インストール → 手動作成の方がプロジェクトパターンと一致。

### D2: タブ形状を上丸みタブに変更

**選択**: アクティブタブに `rounded-t-md border border-b-0 border-border`、`bg-background` でコンテンツ領域と同色。`-mb-px` でタブバーの下ボーダーと重ねて視覚的に接続。非アクティブはボーダーなし、`hover:bg-muted/50`。タブバー全体は `h-12`(48px)、`items-end` でタブを下部に配置。

**理由**: 純粋な下罫線よりタブ形状の方が「タブ」としての認知性が高い。上部に余白ができることでVSCodeのタブに近い外観になる。`pl-2` により先頭タブの左端を Explorer パネル上段の project selector 行の視覚リズムに合わせる。ActivityBar 最上段は project button なので、ボタン中心合わせより left-edge alignment の方が実装と見た目の両方に合う。

**代替案**: 下罫線のみ → タブらしい見た目が弱い。上罫線 → コンテンツとの接続感が薄い。

### D3: ファイルタイプアイコンを動的判定で実装

**選択**: `TabBar.svelte` 内に `getTabIcon(tab)` 関数を定義。change タイプは `archivedChanges` ストアと照合し、アーカイブ済みなら `Archive`(`text-muted-foreground`)、アクティブなら `SquarePen`(`text-info`) を返す。dashboard と spec は固定マッピング。

マッピング:
- `dashboard` → `House` icon, `text-muted-foreground`
- `spec` → `FileText` icon, `text-primary`
- `change` (active) → `SquarePen` icon, `text-info`
- `change` (archived) → `Archive` icon, `text-muted-foreground`

**理由**: アーカイブ済みの Change を開いた場合、Archive アイコンでアーカイブ状態を一目で判別できる。

### D4: PIN留めタブと閉じるボタンの表示仕様

**選択**: 右端の1スロットに状況に応じたアイコンを表示:
- アクティブタブ（非PIN）: 常に `X` アイコン表示
- 非アクティブタブ（非PIN、非ホバー）: 非表示
- 非アクティブタブ（非PIN、ホバー）: `X` アイコン表示
- PIN留めタブ: 常にクリック可能な `Pin` アイコン（クリックでUnpin）

**理由**: アクティブタブは常に閉じられるべき。PIN留めタブのPinアイコンをクリック可能にすることで、Context Menuを開かずにUnpinできる。

### D5: Tab Store に `closeOthers()` と `closeAll()` を追加

**選択**: `closeOthers(tabId)` — 指定タブとPIN留めタブ以外を一括クローズ。`closeAll()` — PIN留めタブ以外を全てクローズし、先頭のPINタブをアクティブ化。

**理由**: Context Menu の「Close Others」「Close All」に必要。既存の `close()` をループで呼ぶと、各クローズでアクティブタブが切り替わる問題がある。

### D6: ドラッグ&ドロップによるタブ並べ替え

**選択**: HTML5 Drag and Drop API を用いて実装。`draggable="true"` + `ondragstart`/`ondragover`/`ondrop` で Store の `reorder()` を呼び出し。ドラッグ中は `opacity-50`。最後尾へのドロップは専用のドロップゾーン `<div>` で対応。`dataTransfer.effectAllowed = 'move'` と `dropEffect = 'move'` を設定。

**理由**: Tab Store に既に `reorder()` が実装済み。外部ライブラリ不要。

**代替案**: `svelte-dnd-action` 等のライブラリ → 外部依存が増える。

### D7: Copy 操作は Clipboard API を使用、Copy Path にプレフィックス付与

**選択**: `navigator.clipboard.writeText()` を使用。Copy Path は `` `openspec${tab.path}` `` でプロジェクトルートからの相対パスとしてコピー。Sonner トーストでフィードバック。

**理由**: プロジェクト内ではパスが `openspec/` から始まるため。ユーザーが直接利用しやすい形式。

### D8: タブバーのレイアウト調整

**選択**: タブバー高さ `h-12`(48px)、左パディング `pl-2` で先頭タブの左端を Explorer パネル上段の project selector 行に合わせる。タブ最小幅 `min-w-15`(60px)、`shrink-0` で無限縮小を防止。アクティブタブ最大幅 `max-w-96`(384px)、非アクティブタブ最大幅 `max-w-64`(256px)。アクティブタブ変更時は自動スクロールで中央に表示。

**理由**: ActivityBar 最上段の control は project button で、その隣の Explorer パネル上段は project selector 行として機能する。タブバーはその上段 UI と同じ left-edge rhythm を持たせると視覚的に自然で、実装も `pl-2` で安定している。`shrink-0` でタブが多い時も最低60pxを確保し、横スクロールでアクセス。アクティブタブを幅広くして視認性を向上。

### D9: テストは node:test + tsx と既存 CDP パターンで最小追加

**選択**: `frontend/src/lib/utils.test.ts` に `formatChangeName()` の pure unit test を追加し、`scripts/test-tabbar-ui.mjs` に focused CDP browser test を追加する。browser test は pinned Home / archived change の日付プレフィックス非表示 / `pl-2` による先頭タブの left-edge inset を確認する。

**理由**: 既存 repo では `node:test` + `tsx` と CDP browser verification script が既に採用されているため、新しい test framework を足さずに必要な回帰検知だけを追加できる。

## Risks / Trade-offs

- **[ContextMenu のモバイル対応]** → 長押しでコンテキストメニューが開くが、タブレット以下では操作性が落ちる。→ モバイルでの利用は想定されていない。
- **[既存 PIN ボタンの削除による発見性低下]** → PIN操作が右クリックに隠れる。→ PIN留めタブにはクリック可能な Pin アイコンが常時表示されるため、機能の存在は分かる。
- **[ContextMenu 手動作成の保守コスト]** → shadcn CLIで自動生成できないため、手動で追随する必要がある。→ dropdown-menu と同じパターンで統一しているため、変更時の差分は最小。
