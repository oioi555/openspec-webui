## Context

設定ページは `frontend/src/lib/components/layout/SettingsView.svelte`（868行、Svelte 5 runes）に一本化されており、各セクションは `<SurfaceCard>` + `<SectionHeader>`（`frontend/src/lib/components/shared/surface/`）で構成されている。現在 3 セクションで視覚パターンが混在しており、利用者に一貫性のない印象を与えている。

| セクション | ドキュメントリンク配置 | リンクアイコン | リスト枠スタイル |
|---|---|---|---|
| Tools & Integrations (L418–517) | ボディ先頭の独立 `<p>` ブロック | `Info` + `ExternalLink` あり | 枠付き (`divide-y … bg-secondary/50`) |
| Commands (L519–630) | `<SectionHeader>` 内（タイトル直下） | `Info` のみ、リンクはテキストのみ | 枠付き (同上) |
| Versions / Projects to Update (L829–862) | （該当セクション外） | — | 枠なし (`space-y-0.5` + `rounded-sm px-1 py-1`) |

動機については `proposal.md - Why` を参照。

## Goals / Non-Goals

**Goals:**
- ドキュメントリンクの配置を Commands パターン（`<SectionHeader>` 内）に統一する
- ドキュメントリンクのアイコン表示を Tools & Integrations パターン（`inline-flex items-center gap-1` + `ExternalLink`）に統一する
- "Projects to Update" リストを既存の枠付きリスト パターン（4箇所で既出）に統一する
- 各セクションのアンカー (`data-settings-section`) とリンク先 URL 定数は維持する

**Non-Goals:**
- 各セクションの機能・表示情報の変更（リンク先、リスト項目の意味、コピー可否など）
- URL 定数 (`openspecDocs.ts`) の追加・変更
- 国際化ラベル (`uiText.ts`) の意味変更（既存キーをそのまま使用）
- 他セクション（Validation, Search など）への同パターンの横展開

## Decisions

### Decision 1: Tools & Integrations のドキュメントリンクを `<SectionHeader>` 内へ移動

Tools & Integrations セクションは `<SectionHeader>` のタイトル + 説明の下に、ボディ `<div class="space-y-4 p-4">` の先頭として独立 `<p>` ブロック（L442–465）を持つ。これを Commands と同じ位置（`<SectionHeader>` 左カラム内、説明 `<p>` の直下）へ移動する。

- **採用**: Commands の L526–531 と同じ構造（`<p class="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">`）を採用
- **理由**: 2セクション間でヘッダー構造が統一され、ボディはリスト本体のみに専念できる。refresh Button は既に右カラムにあるため競合しない
- **代替案**: 逆に Commands のリンクをボディ先頭へ移す案は、ボディがコマンドリストで始まる Commands において冗長な余白を生むため不採用

### Decision 2: Commands のドキュメントリンクに `ExternalLink` アイコンを付与

Commands セクション L526–531 のリンク (`<a>`) は現在 `underline hover:text-foreground` のみで、`ExternalLink` アイコンがない。Tools & Integrations 側のパターン（`inline-flex items-center gap-1 underline hover:text-foreground` + `<ExternalLink class="h-3.5 w-3.5" />`）へ合わせる。

- **採用**: リンク `<a>` のクラスを `inline-flex items-center gap-1 underline hover:text-foreground` に変更し、リンクテキスト直後に `<ExternalLink>` を追加
- **理由**: 外部リンクであることが視覚的に伝わり、Tools & Integrations と同じクリック可能感を提示できる。`ExternalLink` は既に Tools & Integrations でインポート済みのため新規 import 不要
- **代替案**: アイコンを付けない統一（逆方向）は、外部リンクのアフォーダンスが低下するため不採用

### Decision 3: Projects to Update リストを枠付きリスト パターンへ移行

Versions セクション L829–862 の `<ul class="mt-2 space-y-0.5">` + `<li class="flex items-center gap-2 rounded-sm px-1 py-1 text-sm">` を、既存4箇所（Tools L472, Commands L586, Commands L607, Validation L640）で使用中のパターンへ変更する。

- **採用**:
  - `<ul>`: `mt-2 divide-y divide-border overflow-hidden rounded-md border border-border bg-secondary/50`（先頭に `mt-2` を保持してラベルとの間隔を維持）
  - `<li>`: `flex items-center gap-2 px-4 py-3 text-sm`（`rounded-sm px-1 py-1` を置換。ステータスドット・パス・バージョン・Copy ボタン構造は維持）
- **理由**: Versions ページ内の軽量リストだけ浮いて見える問題を解消し、利用者が「これはリスト領域である」と一瞬で認識できるようになる
- **代替案**: 既存の軽量スタイルを維持しつつ他セクションも軽量化する案は、4箇所の変更が必要になり影響範囲が広がるため不採用
- **空状態**: プロジェクト0件時の `<p class="mt-2 text-sm text-muted-foreground">` は、枠付きリストの文脈で不自然にならないようそのまま維持（`<ul>` が描画されないため枠も描画されず、単独のメッセージとして成立）

## Risks / Trade-offs

- **[Risk] 枠付きリスト化による行高の増加** → `py-1` (4px) → `py-3` (12px) への増加で、プロジェクト数が多い場合にリストが長くなる。**Mitigation**: プロジェクト登録数は通常数件〜十数件程度であり、実用上問題ない。Versions セクション全体が `InsetPanel` 内にあるため、リスト単独のスクロールは発生しない。
- **[Risk] ヘッダー内への移動による行数増加で縦長化** → Tools & Integrations のリンクがボディからヘッダーへ移動しても、ボディから 1 ブロック減るためトータル高さはほぼ不変。**Mitigation**: なし（影響微小）。
- **[Risk] スナップショットテストの更新** → `settingsTab.test.ts` が DOM 構造やリンク個数をスナップショットで保持している場合、差分が発生する。**Mitigation**: 実装後にテストを実行し、意図された差分は更新・非意図的な破損は修正する。`data-settings-section` アンカー属性は維持するため、アンカーベースの探索テストは影響なし。
- **[Trade-off] Decision 3 の空状態が枠で括られない** → 空時はメッセージのみで枠なし。統一感を重視するなら空状態も枠内メッセージにできるが、メッセージ単独の方が「中身がない」ことが明確。本変更では既存動作を維持する。
