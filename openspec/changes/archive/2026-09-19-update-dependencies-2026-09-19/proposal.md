# Proposal

## Why

前回 2026-09-14 の依存更新以降、`npm outdated` で現行 semver 範囲内の直接依存が 9 件残っている。`npm audit` は `svelte` 経由の `devalue@5.9.0` に moderate 1 件を報告し、Fastify 系は audit 未掲載でも上流がセキュリティリリースを出している。次回リリース前に、検証済みの依存ベースラインへ更新する。

## What Changes

- 現行 semver 範囲内の直接依存 9 件を最新安定版へ更新する。
- `svelte@5.57.1` が `devalue@^5.9.2` を要求するため、推移依存 `devalue` をパッチ済み範囲へ引き上げる（直接依存や overrides は追加しない）。
- `package-lock.json` を更新し、意図した直接依存と互換推移依存だけが再解決されることを確認する。
- `ThirdPartyNotices.txt` を再生成し、ランタイム依存のライセンス表示を同期する。
- `npm audit`、型チェック、テスト、ビルド、リリース検証で更新結果を検証する。
- TypeScript 7、`openspec-webui` 自身のバージョン変更、npm 公開は本 Change に含めない。

対象とする直接依存更新:

- `@fastify/static` 10.1.3→10.1.4
- `@fastify/websocket` 11.3.0→11.3.1
- `fastify` 5.12.4→5.12.5
- `open` 11.0.3→11.0.4
- `@inlang/paraglide-js` 2.25.2→2.25.4
- `@lucide/svelte` 1.45.0→1.47.0
- `@types/node` 26.5.1→26.6.1
- `shadcn-svelte` 1.6.1→1.7.0
- `svelte` 5.57.0→5.57.1

## Capabilities

### New Capabilities

なし。

### Modified Capabilities

なし。本変更は依存関係と生成物の保守のみで、ユーザー可視の要件変更はないため `skip_specs: true` とする。

## Impact

- `package.json`: 現行 semver 範囲内の直接依存 9 件
- `package-lock.json`: 直接依存と互換推移依存の解決結果（`devalue` を含む）
- `ThirdPartyNotices.txt`: ライセンス情報の再生成結果
- 検証: `npm audit` / `npm run typecheck` / `npm test` / `npm run build` / `node ./scripts/verify-release.mjs`
- `engines.node: ">=20.19.0"`、`packageManager: "npm@11.19.0"`、パッケージバージョンは維持
- CLI、サーバー、UI の意図的な振る舞い変更なし
