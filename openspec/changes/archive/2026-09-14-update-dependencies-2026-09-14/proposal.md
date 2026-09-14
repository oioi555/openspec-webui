## Why

`npm outdated` で現行semver範囲内の直接依存更新が10件残っている。現状の `npm audit` は脆弱性0件だが、Markdown解析、YAML処理、Windowsでのブラウザ起動などに有用な修正が含まれるため、次回リリース前に検証済みの依存ベースラインへ更新する。

## What Changes

- 現行semver範囲内の直接依存10件を最新安定版へ更新する。
- `package-lock.json` を更新し、意図した直接依存と互換推移依存だけが再解決されることを確認する。
- `ThirdPartyNotices.txt` を再生成し、ランタイム依存のライセンス表示を同期する。
- `npm audit`、型チェック、テスト、ビルド、リリース検証で更新結果を検証する。
- TypeScript 7、`openspec-webui` 自身のバージョン変更、npm公開は本Changeに含めない。

対象とする直接依存更新:

- `fastify` 5.12.3→5.12.4
- `open` 11.0.2→11.0.3
- `yaml` 2.9.0→2.9.1
- `@inlang/paraglide-js` 2.25.0→2.25.2
- `@lucide/svelte` 1.41.0→1.45.0
- `@types/node` 26.4.1→26.5.1
- `bits-ui` 2.19.0→2.19.2
- `marked` 18.0.11→18.0.13
- `tailwind-merge` 3.6.0→3.7.0
- `vite` 8.2.2→8.3.0

## Capabilities

### New Capabilities

なし。

### Modified Capabilities

なし。本変更は依存関係と生成物の保守のみで、ユーザー可視の要件変更はないため `skip_specs: true` とする。

## Impact

- `package.json`: 現行semver範囲内の直接依存10件
- `package-lock.json`: 直接依存と互換推移依存の解決結果
- `ThirdPartyNotices.txt`: ライセンス情報の再生成結果
- 検証: `npm audit` / `npm run typecheck` / `npm test` / `npm run build` / `node ./scripts/verify-release.mjs`
- `engines.node: ">=20.19.0"`、`packageManager: "npm@11.19.0"`、パッケージバージョンは維持
- CLI、サーバー、UIの意図的な振る舞い変更なし
