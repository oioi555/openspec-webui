## Context

obsidian-layout-redesign で shadcn-svelte を導入し、ActivityBar / ExplorerPane / MainViewer の3ペインレイアウトとタブシステムを構築した。shadcn コンポーネント（Button, Badge, Dialog, Tabs, Tooltip 等）は `frontend/src/lib/components/ui/` に配置済み。

しかし既存のビジネスコンポーネント（ChangeViewer, SpecViewer, Dashboard, ExplorerPane 等）では、shadcn コンポーネントを使わずにインラインクラスで同等の UI を手書きしている箇所が多数ある。また ErrorBanner, LoadingState, EmptyState 等の共通パターンが各ファイルにコピペされている。

加えて `CommandShortcutBar` のコピー用ボタンは、このプロジェクトで最も目立たせたい導線の1つであり、現在は success 系カラーで強調されている。ここを通常の `<Button>` にそのまま揃えると、重要度が埋もれるか、逆に通常ボタンと同サイズになって密度が悪化する。ユーザー設定次第で多数の command が並ぶため、**command shortcut 専用の shared component に抽象化して、強調・密度・統一感のバランスを中央集約で調整できる状態**にする必要がある。

フロントエンドは Svelte 5 (runes) + Vite 6 + Tailwind CSS 4 構成。shadcn-svelte コンポーネントはプロジェクト内コピー方式（アップストリームから独立して編集可能）。

## Goals / Non-Goals

**Goals:**
- 一般 UI アクションのインライン実装を shadcn `<Button>` / `<Badge>` に統一し、テーマ変更時の修正箇所を shared layer に集約する
- command shortcut を `CommandChip` という専用 shared component に抽象化し、目立つが過密でも破綻しない command row を実現する
- ErrorBanner, LoadingState, EmptyState を共通コンポーネントとして `frontend/src/lib/components/ui/` に抽出し、再利用可能にする
- ExplorerPane の3セクション構造を ExplorerSection コンポーネントで抽象化する
- UnderlineTabs（ChangeViewer / SpecViewer の underline nav）を共通化し、count badge も component API に吸収する
- IconBox, Callout, DialogHeader を共通パーツ化する
- ユーティリティ関数（`truncateText`, `decodeName`）を `frontend/src/lib/utils.ts` に集約する
- `badge-num` グローバル CSS クラスを削除する
- semantic color role（primary / secondary / accent / success / warning / danger / info / muted）の使用ルールを定義し、hover / active / status の意味論を揃える

**Non-Goals:**
- 新しい shadcn コンポーネントの追加インストール
- 全ての「button に見えるもの」を無理に通常 `<Button>` に寄せること（command shortcut は専用 component とする）
- 見た目の全面リデザイン
- レイアウト構造の変更
- バックエンドの変更
- パフォーマンス最適化
- SettingsModal の section selector card や ChangeViewer の secondary file switcher まで今回の標準化対象を広げること
- `explorer-simplify-navigation` で確立した「Explorer collapsed 時の独立 expand button は置かない」「ExplorerPane のリストアイテムにアイコンは出さない」というレイアウト方針を変更すること

## Decisions

### Decision 1: 共通パーツは `frontend/src/lib/components/ui/` に配置

**Choice**: 新しい共通 UI パーツ（ErrorBanner, LoadingState, EmptyState 等）は `frontend/src/lib/components/ui/<name>/` に配置し、shadcn 純正コンポーネントと同じ `$lib` エイリアスで import する

**Rationale**: shadcn-svelte はプロジェクト内コピー方式なので、独自パーツを同じ階層に置いてもアップストリーム更新の邪魔にならない。import パスも `$lib/components/ui/error-banner` のように統一できる。

### Decision 2: 一般 UI アクションは shadcn Button variant で統一

**Choice**: 通常の action button は shadcn `<Button>` の variant / size で置き換える
- Primary action → `<Button variant="default">`
- Cancel / low-emphasis action → `<Button variant="ghost">`
- Close / icon-only utility → `<Button variant="ghost" size="icon">`
- Destructive → `<Button variant="destructive">`
- Bordered utility icon → `<Button variant="outline" size="icon">`

**Rationale**: 一般 UI アクションのスタイルと focus / disabled / hover 状態を `<Button>` に集約することで、通常操作の一貫性を高める。

### Decision 3: Command shortcut は専用 `CommandChip` に抽象化

**Choice**: `CommandShortcutBar` の各 copy action は `frontend/src/lib/components/ui/command-chip/` の `CommandChip` を使って描画する。`CommandChip` は pill 形状・小さめの高さ・`text-xs` ベースの dense な見た目を持ち、accent 系の tint / border で視覚強調する。command row は wrap 可能にし、通常ボタンと同じ visual weight にしない。

**Rationale**: command shortcut は「通常ボタン」ではなく、このプロジェクトの重要導線そのもの。通常 Button と同サイズに揃えると密度が悪くなり、小さくするだけだとチグハグに見える。専用 component にすることで、強調・サイズ・間隔・テーマ差分のバランスを1箇所で調整できる。

### Decision 4: バッジは shadcn Badge variant で統一

**Choice**: インライン badge は shadcn `<Badge>` の variant で置き換える
- Count badge → `<Badge variant="secondary">`
- Status / design indicator → `<Badge variant="outline">`
- Done / capability emphasis → `<Badge variant="success">`
- Archived → `<Badge variant="secondary">`

**Rationale**: `app.css` の `badge-num` グローバルクラスを削除し、Badge variant に一本化する。ChangeViewer の tab count は `UnderlineTabs` の badge API に吸収する。

### Decision 5: ExplorerSection で ExplorerPane の3セクションを抽象化

**Choice**: ACTIVE CHANGES / ARCHIVE / SPECS の共通構造を `ExplorerSection` コンポーネントに抽出する。`ExplorerSection` は `title`, `count`, `open`, `focused?`, `onToggle` を受け取り、default slot でリストや empty state を描画する。ACTIVE CHANGES の command shortcut row を保持するため、ヘッダー下に描画される `headerExtra` slot を提供する。

**Rationale**: 3セクションはヘッダー（タイトル + カウントバッジ + chevron）とコンテンツ（リスト + empty state）の構造が同一。ACTIVE CHANGES だけが command row を追加で持つため、default slot だけでなく headerExtra slot を分けるほうが責務が明確。

### Decision 6: UnderlineTabs は shared component として定義する

**Choice**: ChangeViewer / SpecViewer の underline tab navigation は `frontend/src/lib/components/ui/underline-tabs/` の `UnderlineTabs` を唯一の利用境界にする。`UnderlineTabs` は `tabs: { id, label, badge? }[]`, `activeId`, `onSelect` を受け取る。内部で shadcn Tabs を使うかどうかは component 実装側の裁量とし、feature component からは隠蔽する。

**Rationale**: SpecViewer と ChangeViewer の underline nav は見た目が近いが、ChangeViewer には count badge がある。先に `UnderlineTabs` API を定めておけば、見た目や内部実装をあとで調整しても consumer 側は崩れない。

### Decision 7: ユーティリティは `frontend/src/lib/utils.ts` に集約

**Choice**: `truncateText` と `decodeName` を `frontend/src/lib/utils.ts` に移動し、各コンポーネントから import する。

**Rationale**: 両関数は完全に shared utility であり、ローカル定義を残す理由がない。

### Decision 8: semantic color role の usage guideline を `theme-management` へ追加

**Choice**: semantic color token の使用ルールは `theme-management` capability に定義する。状態表現は次に揃える。
- `primary`: 現在地、選択中、主要 action、active tab
- `secondary`: 中立 hover、低強調 surface、count badge
- `accent`: 非 selected の補助的強調、CommandChip など特化 affordance
- `success`: 完了、成功状態
- `warning`: 注意喚起
- `danger`: エラー・破壊的操作
- `info`: 情報提示、補助説明
- `muted`: 補助テキスト、プレースホルダー

**Rationale**: token が存在しても、いつ何を使うかが未定義だと hover と active の意味が混ざる。theme-management に usage guideline を置くことで、トークン定義と役割定義を同じ capability に保てる。

### Decision 9: Explorer simplified navigation の方針を維持する

**Choice**: `explorer-simplify-navigation` で決めた以下を維持する。
- Explorer collapsed 時に MainViewer 内へ独立 expand button を出さない
- ExplorerPane はセクションヘッダーにアイコンを出し、リストアイテムにはアイコンを出さない

**Rationale**: この change は UI 標準化であり、既存レイアウト方針を覆す change ではない。共通化の過程で既存意思決定を壊さないことを明示する必要がある。

## Risks / Trade-offs

- **[Risk] 置き換えによる見た目の微妙な変化** → shadcn Button / Badge と既存インラインとの差分を確認し、必要なら shared component 側で微調整する
- **[Risk] command chip row が派手すぎてノイズになる** → solid fill ではなく accent tint + border ベースに寄せ、light / dark 両テーマで視認性を確認する
- **[Risk] command chip と通常ボタンが近接すると窮屈に見える** → ChangeViewer では command row と Suggest button を別 cluster として配置し、wrap 時も階層が崩れないようにする
- **[Risk] ExplorerSection 抽出で slot 境界が曖昧になる** → `headerExtra` は command row 等の header 補助要素、default slot は list / empty state に限定する
- **[Risk] UnderlineTabs の API が狭いと ChangeViewer を表現できない** → `badge?` を最初からサポートし、count badge を feature component から消す
- **[Trade-off] shared component が増えてファイル数は増える** → ただし UI 調整点の集中による保守性向上が上回る
