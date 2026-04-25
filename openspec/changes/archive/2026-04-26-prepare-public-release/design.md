## Context

現状の `openspec-webui` は npm 公開に必要な基本 metadata (`name`, `license`, `repository`, `bugs`, `homepage`) は揃っているが、公開物として見るといくつかの不整合が残っている。`package.json` と `src/cli/index.ts` の両方に `0.2.0` が直書きされており、fork 後の独自 version lineage と見分けが付きにくい。README は本来 install / usage の最小説明で足りるが、third-party attribution を README に寄せすぎると冗長になる。

また、`npm pack --dry-run` では `dist/**/*.test.js`、`dist/**/*.test.d.ts`、map files を含む publish tarball が生成されており、現在の build は clean step を持たないため stale artifact が残る余地もある。さらに、`package-lock.json` と `bun.lock` が共存しており、release 再現性の基準が曖昧である。

## Goals / Non-Goals

**Goals:**
- package metadata と CLI version の single source of truth を定義する
- npm ユーザー向け README を簡潔に保ちつつ、third-party notices を生成ファイルとして配布する
- publish tarball を runtime 必要物だけに絞り、`npm pack --dry-run` で検証できるようにする
- build / test / typecheck / tarball / smoke test を含む公開前ゲートを定義する
- release で authoritative な package manager / lockfile を決める

**Non-Goals:**
- CI/CD や自動 publish パイプラインの構築
- package の機能追加や UI/UX 変更
- third-party license を完全自動収集する新しい仕組みの導入
- 最終 version number 自体をこの design 文書で固定すること（ただし versioning policy は決める）

## Decisions

### D1: `package.json` を version / package identity の正本にする

**決定**: package version, package name, repository metadata は `package.json` を唯一の正本とし、CLI の `--version` 表示はそこから導出する。

**理由**:
- npm publish metadata の正本が `package.json` であるため、二重管理をやめるのが最も監査しやすい
- `src/cli/index.ts` の直書き version を残すと release 時の更新漏れが起きやすい

**代替案**:
- CLI 側の version を別定数ファイルで管理する → npm metadata と別軸になり、release audit が複雑になるため不採用

### D2: README は簡潔に保ち、notice は生成ファイルに集約する

**決定**: README は install / usage 中心の簡潔な内容に戻し、third-party license 情報は `generate-license-file` により生成する `ThirdPartyNotices.txt` に集約する。

**理由**:
- README だけに全 dependency を列挙すると肥大化しやすい
- 生成ツールを使う方が依存更新時の追随漏れを減らせる
- publish 時に自動更新すれば配布物と notice のずれを抑えられる

**代替案**:
- 手書きの notice 文書を維持する → 更新漏れが起きやすいため不採用

### D3: tarball には runtime に不要な build output を含めない

**決定**: compiled test、stale artifact、公開実行に不要な生成物は tarball から除外する。build は clean 前提にし、TypeScript build は publish 用出力だけを生成する構成へ寄せる。

**理由**:
- 現状の `npm pack --dry-run` は `dist/parser/*.test.js` や `dist/server/*.test.js` を含んでいる
- clean step がないと削除済み source に由来する stale file が publish されうる

**代替案**:
- `files` フィールドだけで吸収する → `dist/` 配下の不要物が混ざったままになりやすく、再現性が弱いため不採用

### D4: release gate は publish 前の実物検証まで含める

**決定**: publish 前検証は `build`, `test`, `typecheck`, `npm pack --dry-run`, packaged CLI の `--help` / `--version` smoke test を最低ラインにする。

**理由**:
- metadata mismatch や tarball contamination は unit test だけでは検出できない
- 利用者が最初に触るのは packed artifact なので、公開物そのものの確認が必要

**代替案**:
- `prepublishOnly` を build のみ維持する → packaging regression を見逃しやすいため不採用

### D5: release の依存解決基準を明示する

**決定**: npm publish に用いる authoritative source は npm / `package-lock.json` とし、bun を残す場合も release 正本ではないことを文書化する。

**理由**:
- lockfile が複数あると license report や publish 再現性の基準がぶれる
- npm package の公開検証と最も自然に整合するのは npm / package-lock

**代替案**:
- bun を release 正本にする → 現在の publish / metadata / pack チェックと運用が分かれ、説明が複雑になるため不採用

### D6: publish/verification に必要な devDependencies 解決を `.npmrc` で固定する

**決定**: `.npmrc` に `include=dev` を設定し、環境依存で `npm install` が devDependencies を落としても release verification が壊れないようにする。

**理由**:
- `generate-license-file`, `typescript`, `vite`, `svelte-check` など publish/verification に必要なツールが devDependencies にある
- VSCodium 由来などの環境差で `npm install` 時に devDependencies が入らないケースがあり、tarball install 後の検証再現性が下がる

**代替案**:
- 毎回 `npm install --include=dev` を前提にする → 実行者依存で抜けやすいため不採用

## Risks / Trade-offs

- **[低リスク] notice 生成結果が publish 前に working tree を更新する** → `prepublishOnly` / verification で自動生成し、配布内容は生成結果を基準に確認する
- **[中リスク] tarball から map や補助生成物を減らすとデバッグ性が下がる可能性がある** → runtime 必須かどうかを基準に判断し、必要なら release artifacts のポリシーとして明記する
- **[低リスク] npm を release 正本に寄せると bun 利用者に追加説明が必要** → README / contributing に「release source of truth」を短く明記する
- **[低リスク] `.npmrc` が install 挙動を固定する** → release/verification 用の再現性確保を優先し、必要なら将来 contributor docs に意図を補足する
- **[低リスク] version lineage の扱いに判断が必要** → versioning policy を task 化し、最終公開番号は実装時に maintainer が選べるようにする

## Migration Plan

1. package metadata / version policy / lockfile policy を決める
2. build 出力と tarball を整理し、`npm pack --dry-run` が clean になるまで調整する
3. README を簡潔化し、notice 生成ファイルの配布に切り替える
4. publish 前 verification を追加し、packed artifact で smoke test する
5. 最終 publish 前に metadata / docs / tarball を一括確認する

## Open Questions

- third-party notice の生成結果を repository に保持するか、publish 時生成物として扱うか
- source map を publish artifact に残すか、公開最小化を優先して除外するか
