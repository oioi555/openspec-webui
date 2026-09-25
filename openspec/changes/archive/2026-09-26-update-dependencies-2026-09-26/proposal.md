# Proposal

## Why

前回 2026-09-19 の依存更新以降、`npm outdated` で現行 semver 範囲内の直接依存が 7 件残っている。いずれも開発依存のパッチであり、`npm audit` は 0 件だが、次回リリース前に検証済みの依存ベースラインへ揃える。

## What Changes

- 現行 semver 範囲内の直接依存 7 件を最新安定版へ更新する。
- `package-lock.json` を更新し、意図した直接依存と互換推移依存だけが再解決されることを確認する。
- `ThirdPartyNotices.txt` を再生成し、ライセンス表示が依存グラフと同期していることを確認する。
- `npm audit`、型チェック、テスト、ビルド、リリース検証で更新結果を検証する。
- TypeScript 7、`openspec-webui` 自身のバージョン変更、npm 公開は本 Change に含めない。

対象とする直接依存更新:

- `@lucide/svelte` 1.47.0→1.48.0
- `@sveltejs/vite-plugin-svelte` 7.3.0→7.3.1
- `@types/node` 26.6.1→26.6.2
- `bits-ui` 2.19.2→2.19.3
- `marked` 18.0.13→18.0.14
- `tsx` 4.23.13→4.23.15
- `vite` 8.3.0→8.3.1

## Capabilities

### New Capabilities

なし。

### Modified Capabilities

なし。本変更は依存関係と生成物の保守のみで、ユーザー可視の要件変更はないため `skip_specs: true` とする。

## Impact

- `package.json`: 現行 semver 範囲内の直接開発依存 7 件
- `package-lock.json`: 直接依存と互換推移依存の解決結果
- `ThirdPartyNotices.txt`: ライセンス情報の再生成結果
- 検証: `npm audit` / `npm run typecheck` / `npm test` / `npm run build` / `node ./scripts/verify-release.mjs`
- `engines.node: ">=20.19.0"`、`packageManager: "npm@11.19.0"`、パッケージバージョンは維持
- CLI、サーバー、UI の意図的な振る舞い変更なし
