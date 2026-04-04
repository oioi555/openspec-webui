## Context

現在、Dashboard (`/`) と Changes (`/changes`) の2ページで `ActiveChangesList` コンポーネントを使って同一の Active Changes を表示している。Changes ページにのみ Archived Changes の折りたたみ表示がある。ナビゲーションは Dashboard / Specs / Changes の3項目。

フロントエンドは Svelte + Svelte Store による SPA ルーティング。コンポーネント構成:
- `Dashboard.svelte`: Stats Cards + ActiveChangesList + Project Docs
- `ChangesList.svelte`: ActiveChangesList + Archived Changes (toggle)
- `ActiveChangesList.svelte`: 共通リストコンポーネント
- `Navigation.svelte`: ナビゲーションバー

## Goals / Non-Goals

**Goals:**
- Dashboard を Home に改名し、Active Changes の単一表示ポイントにする
- Changes ページを Archived Changes 専用にする
- Stats Cards をコンパクトにし、Archived Changes / Specs へのリンクを追加
- 3ページ構成（Home / Archived / Specs）に整理
- バックリンクを新しいルート構造に合わせる

**Non-Goals:**
- 既存の ChangeViewer / SpecViewer の内部機能変更はしない
- API エンドポイントの変更はしない
- `ActiveChangesList` コンポーネント自体の仕様変更はしない

## Decisions

### D1: Home ページの構成
`/` に Stats Cards（コンパクト版）+ Active Changes + Project Docs を配置。既存 `Dashboard.svelte` をリネームして内容を調整。Stats Cards は3列（Active / Archived / Specs）にする。

**代替案**: 専用 HomeComponent を新規作成 → 既存コンポーネントの修正で十分なので不採用。

### D2: Changes ページ → Archived 専用
`ChangesList.svelte` から Active Changes セクションを削除し、Archived Changes のみを表示。コンポーネント名・ページタイトルも「Archived Changes」に統一。

**代替案**: 別コンポーネント新規作成 → 既存コンポーネントの削除で対応可能なので不採用。

### D3: Stats Cards のコンパクト化
現在の4列（Total Specs / Active / Archived / Progress）を3列（Active Changes / Archived Changes / Total Specs）に変更。各カードを数値 + ラベルの1行構成にして、Archived と Specs はクリック可能（リンク）にする。Overall Progress は Active Changes カード内にインジケーターとして含める。

### D4: ナビゲーション構成
Home / Changes / Specs の3項目。「Dashboard」リンクを削除し、ロゴクリックで `/` に戻る動作は維持。Changes のバッジは Archived Changes 数に変更はせず、Active Changes 数のまま（Home が主表示場所のため）。

### D5: バックリンク
- `ChangeViewer`: 戻るリンクを状況に応じて Home (`/`) または Archived Changes (`/changes`) にする（change が active か archived かで判定）
- `SpecViewer`: 戻るリンクは `/specs` のまま

## Risks / Trade-offs

- [ユーザーが Changes ページで Active Changes を探す癖がある] → Home が Active Changes の正しい場所であることをナビゲーションで明示。移行期の混乱は最小限。
- [Stats Cards から Overall Progress が消える] → Active Changes カードに進捗インジケーターとして統合するので情報損失なし。
