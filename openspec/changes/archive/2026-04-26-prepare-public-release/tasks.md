## 1. Package metadata と version policy の整理

- [x] 1.1 初回公開の versioning policy を独自系列 `0.1.0` として決め、`package.json` を version / package identity の single source of truth にする
- [x] 1.2 CLI の `--version` 表示と公開 metadata が `package.json` と一致するように更新する
- [x] 1.3 release で authoritative な package manager / lockfile を決め、必要なら lockfile とドキュメントを整理する
- [x] 1.4 release verification に必要な devDependencies が環境差分で落ちないよう npm config を固定する

## 2. Publish tarball の整理

- [x] 2.1 compiled test と runtime に不要な build artifact が `dist/` / tarball に入らない build 構成へ更新する
- [x] 2.2 stale artifact を残さない clean build 手順を追加する
- [x] 2.3 `npm pack --dry-run` で tarball contents を確認し、公開対象を最小化する

## 3. README / notice / attribution の更新

- [x] 3.1 README を install / usage 中心の簡潔な内容へ戻す
- [x] 3.2 README に fork provenance と current package identity の説明を追加する
- [x] 3.3 `generate-license-file` で `ThirdPartyNotices.txt` を生成し、パッケージへ同梱する

## 4. 公開前 verification の追加

- [x] 4.1 publish 前に notice 生成、`build`, `test`, `typecheck`, `npm pack --dry-run` を通す verification 手順を追加する
- [x] 4.2 packed artifact に対する `openspec-webui --help` / `openspec-webui --version` smoke test を追加する
- [x] 4.3 metadata mismatch や unexpected tarball files を publish 前に検出できるようにする

## 5. 最終確認

- [x] 5.1 README / LICENSE / notice 文書 / package metadata に旧 fork 元の誤解を招く記述が残っていないか確認する
- [x] 5.2 `npm run build`, `npm run test`, `npm run typecheck` を実行して release candidate を検証する
- [x] 5.3 `npm pack --dry-run` と packaged CLI smoke test の結果、および `ThirdPartyNotices.txt` 同梱を記録し、公開前チェックリストを完了する

## Verification notes

- [x] `npm run build`
- [x] `npm test`
- [x] `npm run typecheck` (existing Svelte warning only; no type errors)
- [x] `npm pack --dry-run --json` で tarball に `dist/cli/index.js`, `dist-frontend/index.html`, `README.md`, `LICENSE`, `ThirdPartyNotices.txt` を確認
- [x] `node ./scripts/verify-release.mjs` で packed CLI の `--help`, `--version`, `--no-open --port 0` startup smoke test を確認
- [x] `.npmrc` の `include=dev` で release/verification toolchain の再現性を固定
