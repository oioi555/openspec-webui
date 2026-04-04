## Why

Dashboard (`/`) と Changes (`/changes`) ページで Active Changes の表示が `ActiveChangesList` コンポーネントにより完全に重複している。ナビゲーションも冗長で、ユーザーは同じ内容を2つのページで見ることになる。3ページ（Home / Archived Changes / Specs）に整理して情報の重複をなくす。

## What Changes

- Dashboard ページ（`/`）を Home に改名し、Stats Cards + Active Changes + Project Docs を表示
- Changes ページ（`/changes`）を Archived Changes 専用ページに変更（名前も `ArchivedChanges` に統一）
- ナビゲーションの「Dashboard」リンクを削除し、Home / Changes / Specs の3項目に整理
- Stats Cards の順序を Active Changes → Archived Changes → Total Specs に変更
- Archived Changes と Total Specs の Stats Cards をそれぞれの専用ページにリンク
- Stats Cards をコンパクトに再設計
- ChangeViewer / SpecViewer のバックリンクを新しいルート構造に合わせて調整

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `project-context`: ナビゲーション構造の変更（Dashboard→Home、Changes→Archived専用）、Stats Cards の順序変更・リンク追加・コンパクト化、3ページ構成への再編
- `change-browsing`: ChangesList を Archived Changes 専用に変更、ページ名・コンポーネント名の統一

## Impact

- フロントエンドコンポーネント: `Dashboard.svelte`（Home化）、`ChangesList.svelte`（Archived専用化）、`Navigation.svelte`（ナビ更新）、`ChangeViewer.svelte`（バックリンク）、`SpecViewer.svelte`（バックリンク）
- ルーティング: `App.svelte` の `parseRoute` 調整
- 既存spec: `project-context` と `change-browsing` の要件変更
