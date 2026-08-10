## Why

OpenSpec CLI のアップグレード後、各プロジェクトは個別に `openspec update` を実行して生成ファイル（スキル/コマンド）を更新する必要がある。現在 Settings の Versions ページは「登録されたプロジェクトのパス一覧」と「単一の `openspec update` コマンドコピー」を表示するだけなので、利用者はどのプロジェクトが実際に古いかを判断できず、プロジェクトごとに `cd` するかパスを補ってコマンドを組み立てる必要がある。本変更は、各プロジェクトがどの OpenSpec CLI バージョンで生成されたかを検出し、更新が必要なプロジェクトを一目で特定できるようにする。あわせて、プロジェクトごとにパス付きコマンド `openspec update <path>` を簡素なコピー操作で取得できるようにする。

## What Changes

- 各登録プロジェクトについて、OpenSpec が生成したスキルファイルの frontmatter（`metadata.generatedBy`）を読み取り、そのプロジェクトがどの CLI バージョンで生成されたかを検出する。
- 検出した生成バージョンを現在の（グローバルな）OpenSpec CLI バージョンと比較し、プロジェクトごとの更新状態（up-to-date / update-available / unknown）を算出する。
- プロジェクトごとのバージョン状態を API 経由で公開する。
- Versions ページの更新操作で、グローバル版状態を先に再取得し、続いてプロジェクトごとの状態を再計算して表示に反映する（起動後に新規登録されたプロジェクトも含む）。
- Settings の Versions ページにある「アップグレード後のプロジェクト案内」を、プロジェクトパスの単純な一覧表示から、プロジェクトごとに「現在の生成バージョン・更新状態・パス付きコピーボタン」を簡素に示す行へと変更する。
- コピーボタンはプロジェクトごとに `openspec update <path>` を提供し、空白を含むパスはシェルで安全に実行できるようクォートする。
- 従来の「単一の `openspec update` コマンドコピー」はプロジェクトごとのコピーボタンに置き換える。

## Capabilities

### New Capabilities
- `project-version-status`: 登録された各プロジェクトについて、OpenSpec 生成ファイルに埋め込まれたバージョン情報の読み取り、現在の CLI バージョンとの比較、更新状態の判定、およびその結果の API 公開。

### Modified Capabilities
- `versions-page`: 既存の「アップグレード後のプロジェクト案内」表示を変更し、プロジェクトパスの一覧から、プロジェクトごとの生成バージョン・更新状態・パス付きコピーボタンを含む簡素な行表示へと置き換える。従来の単一コマンドコピーの振る舞いはプロジェクトごとのコピーボタンに取って代わられる。

## Impact

- **Backend**: バージョン状態サービス層（`src/server/version-status.ts` 周辺、または新規モジュール）にプロジェクト単位の検出ロジックを追加。`src/server/project-registry.ts` の登録プロジェクト一覧との連携。`src/server/routes/api.ts` でプロジェクトごとのバージョン状態を返すエンドポイント（または既存 `/version-status` の拡張）を公開。
- **Frontend**: `frontend/src/lib/types/api.ts` にプロジェクトごとのバージョン状態型を追加。`frontend/src/lib/api.ts` に API クライアント。`frontend/src/lib/components/layout/SettingsView.svelte` の Versions ページ該当セクションの UI を簡素化・再構築。関連ストア・テスト（`versionStatus.svelte.ts` / `versionStatusCore.ts` および対応する `*.test.ts`、`settingsTab.test.ts`）を更新。
- **Dependencies**: OpenSpec CLI が生成するスキルファイルの `metadata.generatedBy` マーカーに依存する（OpenSpec 1.x の生成物）。マーカーが存在しない、または読み取れないプロジェクトは `unknown` 状態として扱う。
- **Scope notes**: 検出は読み取り専用であり、プロジェクト側のファイルを変更しない。また、WebUI は CLI 代行ではなくコピー補助に徹し、`openspec update` の実行自体は引き続き利用者のターミナルで行う設計を維持する。
