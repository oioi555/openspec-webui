## Why

2026-08-16 の post-release 依存関係更新以降、6件の互換 patch/minor がリリースされ `npm outdated` で検出される。`npm audit` は 0 脆弱性を維持しているが、差分が小さいうちに追従することで次回リリース時のマイグレーション負荷を抑え、ゼロ脆弱性ベースラインを維持する。upstream OpenSpec CLI (`@fission-ai/openspec@1.10.0`) の `engines.node` は `>=20.19.0` のままであり、現行 `package.json:36` と整合済み。

## What Changes

- `npm outdated` で検出された6件の互換更新を適用: `@lucide/svelte` 1.31.0→1.33.0, `bits-ui` 2.18.1→2.19.0, `fastify` 5.12.0→5.12.1, `marked` 18.0.9→18.0.10, `svelte` 5.56.9→5.56.10, `vite` 8.2.1→8.2.2。
- `typescript` は `6.0.3` を維持。`latest` は `7.0.2` だが `svelte-check@4.7.6` の peer `^5.0.0 || ^6.0.0` 外であり、現行ツールチェーンが未対応のため。
- `package-lock.json` と `ThirdPartyNotices.txt` を生成・更新。
- `engines.node: ">=20.19.0"` と `packageManager: "npm@11.19.0"` は upstream 1.10.0 が npm 制約を公開していないため据え置き（upstream が宣言した場合のみ追従）。
- 型チェック、テスト、ビルド、リリース検証、`npm audit` で検証。

## Capabilities

### New Capabilities

なし。本変更は依存関係・ビルドツールチェーンの保守のみ。

### Modified Capabilities

なし。ユーザー可視の要件変更なしのため `skip_specs: true` を設定し、delta spec は生成しない。

## Impact

- `package.json`: 6件の直接依存バージョン
- `package-lock.json`: 対象更新に伴う transitive 解決結果
- `ThirdPartyNotices.txt`: `scripts/generate-licenses.mjs` で再生成
- 検証パイプライン: `npm run typecheck` / `npm test` / `npm run build` / `npm audit` / `scripts/verify-release.mjs`
- 実行時・CLI・UI 振る舞いの変更なし
