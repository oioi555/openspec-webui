## Why

公開前の確認で、`openspec-webui` には upstream と同じ `0.2.0` が複数箇所に残っており、README には配布パッケージ向けの依存関係・帰属表示・運用情報が不足していることが分かった。さらに、`npm pack --dry-run` では test 生成物や不要な build artifact も tarball に含まれており、このままでは公開物の説明責任と再現性が弱い。

公開前に package identity、配布物、ライセンス/attribution、検証手順を整理し、誰が見ても監査しやすい release-ready な状態にする必要がある。

## What Changes

- `package.json` を package version / metadata の single source of truth として扱い、CLI の `--version` 表示や公開 metadata と整合させる
- README は利用案内中心の簡潔な内容に戻し、third-party notices は生成ファイルとして配布する
- `generate-license-file` で `ThirdPartyNotices.txt` を publish 前に自動生成し、パッケージに同梱する
- npm tarball から compiled test や stale artifact などの非 runtime ファイルを除外し、`npm pack --dry-run` で公開内容を検証できるようにする
- build / test / typecheck / tarball inspection / packaged CLI smoke test を公開前ゲートとして定義する
- release 用の package manager / lockfile の authoritative source を決め、再現可能な publish 手順として文書化する

## Capabilities

### New Capabilities
- `package-distribution`: npm package metadata、tarball contents、third-party notices、release verification を公開向けに定義する

### Modified Capabilities
- `cli-runtime`: README と CLI version 表示を、公開される package metadata と運用情報に整合させる

## Impact

- `package.json`, `package-lock.json`, `src/cli/index.ts`: version / metadata / publish gate の整合
- `README.md`, `LICENSE`, `ThirdPartyNotices.txt`: 公開向け説明の簡素化と third-party attribution の配布
- build / packaging 設定: compiled test と stale artifact を tarball から除外
- release 手順: `npm pack --dry-run` と packaged CLI smoke test を含む公開前チェックの追加
