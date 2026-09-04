## Why

`npm audit` が Fastify/AJV 経由の `fast-uri` にHigh脆弱性を1件報告しており、同時に `npm outdated` では現行semver範囲内の直接依存更新が9件残っている。次回リリース前に互換更新をまとめて適用し、脆弱性ゼロの依存ベースラインへ戻す。

## What Changes

- `fastify` 5.12.1→5.12.3を含む、現行semver範囲内の直接依存9件を更新する。
- `package-lock.json` を再解決し、脆弱範囲の `fast-uri` 3.1.5 / 4.1.2が修正版へ置き換わることを確認する。
- `ThirdPartyNotices.txt` を再生成し、依存変更に伴うライセンス情報を同期する。
- `npm audit`、型チェック、テスト、ビルド、リリース検証で更新結果を検証する。
- TypeScript 7、`openspec-webui` のパッケージバージョン変更、npm公開は本Changeに含めない。

対象とする直接依存更新:

- `@inlang/plugin-message-format` 4.4.3→4.4.4
- `@lucide/svelte` 1.34.0→1.41.0
- `@types/node` 26.4.0→26.4.1
- `fastify` 5.12.1→5.12.3
- `generate-license-file` 4.2.4→4.2.5
- `open` 11.0.1→11.0.2
- `shadcn-svelte` 1.5.1→1.6.1
- `svelte` 5.56.10→5.57.0
- `tsx` 4.23.12→4.23.13

## Capabilities

### New Capabilities

なし。

### Modified Capabilities

なし。本変更は依存関係と生成物の保守のみで、ユーザー可視の要件変更はないため `skip_specs: true` とする。

## Impact

- `package.json`: 互換範囲内の直接依存9件
- `package-lock.json`: 直接依存と推移依存の解決結果（脆弱な `fast-uri` を含む）
- `ThirdPartyNotices.txt`: ライセンス情報の再生成結果
- 検証: `npm audit` / `npm run typecheck` / `npm test` / `npm run build` / `scripts/verify-release.mjs`
- `engines.node: ">=20.19.0"` と `packageManager: "npm@11.19.0"` は維持
- ランタイム、CLI、UIの意図的な振る舞い変更なし
