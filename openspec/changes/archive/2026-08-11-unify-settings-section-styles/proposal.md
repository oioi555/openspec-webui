## Why

設定ページ (`SettingsView.svelte`) の 3 セクション間で、ドキュメントリンクの配置・アイコン有無・リスト枠スタイルが分かれており、一貫性がない。利用者はセクションごとに視覚的な強度やレイアウトが変わるため、統一された見た目に揃えることで認知負荷を下げ、設定画面全体の秩序を高める。

## What Changes

- **Tools & Integrations**: セクションボディ先頭に独立ブロックとして置かれているドキュメントリンク (`<p>`) を、Commands セクションと同じく `<SectionHeader>` 内（タイトル直下）へ移動する。
- **Commands**: `<SectionHeader>` 内のドキュメントリンクに対し、Tools & Integrations 側と同じく `inline-flex items-center gap-1` レイアウト + `ExternalLink` アイコンを付与する（現在はテキストのみ）。
- **Versions**: "After updating OpenSpec CLI" 内の "Projects to Update" リスト (`<ul>`) を、他セクション（Tools / Commands / Validation）と同じ `divide-y divide-border overflow-hidden rounded-md border border-border bg-secondary/50` の枠付きリストへ移行し、各 `<li>` のパディングを `px-4 py-3` に揃える。

純粋な視覚スタイル統一（リファクタリング）であり、各セクションが提供する機能・リンク先・表示情報は変更しない。

## Capabilities

### New Capabilities
- なし

### Modified Capabilities
- なし

※ 本変更は UI 表示スタイルの統一のみで、spec レベルの要件（システム振る舞い）は変更しないため `skip_specs: true` を設定。

## Impact

- **対象ファイル**: `frontend/src/lib/components/layout/SettingsView.svelte`（Tools & Integrations L418–517、Commands L519–630、Versions L822–863）
- **インポートへの影響**: `ExternalLink` アイコンは既に Tools & Integrations でインポート済み。新規 import は不要。
- **テスト**: `frontend/src/lib/components/layout/settingsTab.test.ts` は `data-settings-section` アンカーに依存しているが、セクションのアンカー構造・データ属性は維持するため影響なし。リンクテキスト・プレースホルダ等のスナップショットがある場合は更新が必要になる可能性あり。
- **後方互換性**: 外部 API・データ契約の変更なし。URL 定数 (`openspecDocs.ts`) も変更しない。
