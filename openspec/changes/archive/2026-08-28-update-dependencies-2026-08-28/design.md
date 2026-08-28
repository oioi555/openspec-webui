## Context

See `proposal.md` for motivation. 前回 2026-08-21 の更新でツリーは互換 patch/minor まで追従済みで audit 0 を維持。今回はその後の互換更新 6件のみが残差。いずれも `devDependencies`。`engines.node` は upstream `@fission-ai/openspec@1.11.0` が `>=20.19.0` を維持しており現行 `package.json` と一致。`packageManager` は upstream が npm 制約を公開していないため現行 `npm@11.19.0` を維持する方針（2026-08-16 / 2026-08-21 design Decision 3 と同一）。

現行 `npm outdated` (2026-08-28):
- `@inlang/paraglide-js` 2.24.1→2.25.0, `@lucide/svelte` 1.33.0→1.34.0, `@types/node` 26.2.0→26.4.0, `generate-license-file` 4.2.1→4.2.4, `marked` 18.0.10→18.0.11, `shadcn-svelte` 1.5.0→1.5.1
- `typescript` 6.0.3→7.0.2 は `svelte-check@4.7.6` の peer 範囲外のため対象外
- `npm audit` 0件

## Goals / Non-Goals

**Goals:**
- 6件の互換直接依存を現行 registry 最新へ解決
- `package-lock.json` の決定論的解決と `ThirdPartyNotices.txt` の再生成
- 全検証ゲート（typecheck / test / build / audit / verify-release）を緑維持
- なぜ TypeScript / npm 宣言を据え置くかを文書化

**Non-Goals:**
- TypeScript 7 への移行（Svelte ツールチェーン未対応）
- upstream が内部で pnpm を使用していることだけを理由にした package manager 変更
- audit/検証で問題が出ていない transitive の手動 override
- ランタイム・CLI・UI 振る舞いの変更

## Decisions

### 1. 対象を明示的 install で更新

`@inlang/paraglide-js@2.25.0`, `@lucide/svelte@1.34.0`, `@types/node@26.4.0`, `generate-license-file@4.2.4`, `marked@18.0.11`, `shadcn-svelte@1.5.1` を明示バージョンで `npm install` し lockfile を再生成。

代替の `npm update` 一括は、前回 2026-08-16 でも `@tailwindcss/oxide-wasm32-wasi` の `EALLOWREMOTE` dry-run 失敗が確認されており、明示指定の方が差分がレビュー可能で再現性が高いため不採用。

### 2. TypeScript は `^6.0.3` 維持

`svelte-check@4.7.6` が `^5.0.0 || ^6.0.0` を宣言。TypeScript 7 は JS コンパイラ API を持たないネイティブコンパイラであり、公式にも Svelte / Volar 系は当面 6 系継続とある。更新トリガは peer に `^7.0.0` を含む安定版 `svelte-check` がリリースされ、本リポジトリで `npm run typecheck` が通過すること。

peer を force したり checker を差し替える案は、確立済みの型検証ゲートを弱めるため却下。

### 3. upstream の公開要件のみ追従

`engines.node` は `>=20.19.0` を維持（`@fission-ai/openspec@1.11.0` と同一）。Vite 8 (`^20.19.0 || >=22.12.0`) と `@sveltejs/vite-plugin-svelte` 7 (`^20.19 || ^22.12 || >=24`) も満たす。

`packageManager` は upstream が npm 制約を公開していないため `npm@11.19.0` 維持。将来 upstream が npm 制約を宣言した場合は同保守 change で追従。

upstream 内部の pnpm に合わせる案は、OpenSpec が複数マネージャを公式サポートしており、変更が lockfile とリリース手順の churn を生むだけで公開互換要件を満たさないため却下（2026-08-16 / 2026-08-21 Decision 3 踏襲）。

### 4. 直接更新で transitive を解決

`npm outdated --all` で見える transitive の outdated major は、各オーナーの互換管理に委ね override しない。`npm audit` が 0 であり、検証で問題が出た場合のみ個別介入。

### 5. 生成物とパッケージングを検証

`npm run typecheck` / `npm test` / `npm run build` / `npm audit` / `scripts/verify-release.mjs` を実行。`ThirdPartyNotices.txt` は `scripts/generate-licenses.mjs`（または `npm run build` 経由）で再生成し lockfile と併せてレビュー。

## Risks / Trade-offs

- [Risk] `@inlang/paraglide-js` 2.25.0 が生成モジュールを変更する → typecheck/build 経由で生成結果を確認し、意図しない差分があれば revert
- [Risk] `@lucide/svelte` 1.34.0 が既存アイコン export を変える → typecheck と UI スモークで確認
- [Risk] `marked` 18.0.11 が Markdown レンダリングに微差を出す → 既存 viewer テストで確認
- [Risk] `generate-license-file` 4.2.4 が notices 出力を変える → `ThirdPartyNotices.txt` 差分をレビュー
- [Risk] lockfile 再生成で無関係な transitive churn → `package.json` / `package-lock.json` 差分を 6件起因に限定してレビュー
- [Risk] ローカル npm 12 と宣言 npm 11 の挙動差 → リポジトリスクリプトは npm 12 対応済み、宣言ポリシーは upstream 駆動で維持

## Migration Plan

1. 6件を明示バージョンで install し `package-lock.json` 再生成
2. `ThirdPartyNotices.txt` 再生成
3. 全検証ゲート実行と audit/差分レビュー
4. 失敗時は本 change の依存解決のみ revert し、直前のベースラインに戻す

## Open Questions

なし
