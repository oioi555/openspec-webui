## Context

現在のバージョン状態サービス（`src/server/version-status.ts`）は OpenSpec WebUI と OpenSpec CLI の「グローバルな」バージョンのみを扱う。グローバル CLI バージョンは `openspec --version`、最新版は npm registry から取得する。プロジェクトごとの「生成バージョン」は扱わない。

他方、OpenSpec CLI はプロジェクトに生成するスキルファイルの frontmatter（`metadata.generatedBy`）に生成元バージョンを埋め込む。CLI 自身は `getToolVersionStatus`（`@fission-ai/openspec` 内）で `generatedByVersion !== currentVersion` により更新要否を判定している。現状の Versions ページの「アップグレード後のプロジェクト案内」はプロジェクトのパス一覧と単一の `openspec update` コマンドコピーのみで、プロジェクトごとの状態は提示しない。

動機については proposal.md の Why を参照。

## Goals / Non-Goals

**Goals:**
- 登録された各プロジェクトの生成バージョンを、OpenSpec 生成スキルファイルの `generatedBy` マーカーから読み取る。
- 生成バージョンと現在のグローバル CLI バージョンを比較し、up-to-date / update-available / unknown の状態を算出する。
- Versions ページのプロジェクト案内を、プロジェクトごとの状態とパス付きコピーを備えた簡素な行表示にする。

**Non-Goals:**
- OpenSpec CLI の `openspec update` を WebUI から代行実行しない（コピー補助のみ）。実行は引き続き利用者のターミナルで行う。
- プロジェクト側のファイルを一切変更しない（読み取り専用）。
- npm registry の最新バージョンをプロジェクトごとの比較に持ち込まない（比較基準はあくまで現在のグローバル CLI バージョン）。
- CLI の完全な検出表（commands-only fallback 等）を完全再現しない。代表的なスキルディレクトリを対象とし、検出できない場合は unknown に倒す。

## Decisions

### Decision 1: 生成バージョンはスキルファイルの `generatedBy` から読み取る
**Choice**: OpenSpec CLI が各ツール向けに生成するスキルファイル（`<tool>/skills/<name>/SKILL.md`）の frontmatter `metadata.generatedBy` を読み取る。

**Alternatives considered**:
- CLI プロセスを都度起動して検出結果を得る。複数プロジェクトでは起動オーバーヘッドが顕著で、CLI 内部 APIへの結合も強まる。却下。
- コマンドファイルのフィンガープリント比較で再現。CLI の fallback 経路だが仕様が流動的で維持コストが高い。却下。

**Rationale**: `generatedBy` は CLI が生成時に埋め込む事実上のソースであり、軽量なファイル読み取りで取得できる。

### Decision 2: 対象ツールのスキルディレクトリは代表的なものに限定し、検出できない場合は unknown とする
**Choice**: 主要な AI ツールのスキルディレクトリ（Claude Code、OpenCode、GitHub Copilot 等）を順に走査し、最初に見つかったスキルファイルの `generatedBy` をそのプロジェクトの生成バージョンとして採用する。

**Rationale**: CLI の完全なツール表を追従するのは維持コストが高い。代表ツールをカバーし、検出できなければ unknown に倒すことで安全側に振る。

### Decision 3: API はグローバル `/version-status` とは別にプロジェクト単位の状態を返す
**Choice**: プロジェクトごとのバージョン状態は、グローバルスナップショットとは別のエンドポイントで公開する（例: `/project-version-status`）。応答には比較基準となる現在の CLI バージョンも含める。起動時と手動再取得で計算する。

Versions ページの更新ボタンは、グローバル状態（`versionStatusStore`）を先に再取得してからプロジェクト状態（`projectVersionStatusStore`）を再取得する（`handleRefreshVersions`）。グローバル CLI バージョンの比較基準を新しい値に揃えた上でプロジェクト状態を算出するためである。手動 refresh（`POST /api/project-version-status/refresh`）はその時点の全登録プロジェクトを再走査するため、起動後に新規登録されたプロジェクトも次の再取得で反映される。

**Alternatives considered**:
- 既存 `/version-status` を拡張してプロジェクト状態を同梱する。取得タイミング・キャッシュ方針が異なる（グローバルは npm registry へのネットワーク取得、プロジェクトはローカルファイル読み取り）。一つに混ぜると更新戦略が衝突する。却下。

**Rationale**: 関心事が異なるため分離する。グローバル CLI バージョンを応答に含めることで、UI が別途取得しなくても状態を描画できる。

### Decision 4: バージョン比較ロジックは既存の `compareVersions` を再利用する
**Choice**: グローバル版状態サービス内のセマンテックバージョン比較関数を共有ユーティリティとして再利用する。

**Rationale**: プリリリースを含む比較がすでに実装済みであり、グローバル版とプロジェクト版で判定の一貫性が保たれる。

### Decision 5: UI は罫線過多の「うるさい」リストにせず、状態インジケーター＋パス＋コピーアイコンの簡素な行にする
**Choice**: 各プロジェクト行を「状態インジケーター（色/ドット）＋プロジェクト表示名またはパス＋アイコンのみのコピーボタン」で構成し、行ごとの枠線や背景ボックスを多用しない。長いパスは truncate しつつ title 属性で全文を示す。

**Alternatives considered**:
- 既存のコマンドボックス（`border bg-background px-3 py-2`）を行ごとに繰り返す。ユーザーフィードバックで「うるさい」と指摘された形式。却下。

**Rationale**: 行数が増えても状態と操作対象が一目で分かるようにする。

### Decision 6: コピーするコマンドは空白パスのみシングルクォートで囲む
**Choice**: `openspec update <path>` を生成し、パスに空白を含む場合のみ `'...'` で囲む。パス内シングルクォートのエスケープは行わない。

**Rationale**: レアケースへの過剰対応を避け、代表ケースの利便性と可読性を優先する。

## Risks / Trade-offs

- **[CLI 側の生成物フォーマット変更]** → `generatedBy` が削除/移動された場合は検出が unknown に退化するが、機能は壊れず安全に失敗する。フォーマット変更を検知したら追随する。
- **[スキル未生成プロジェクト]** → `openspec init`/`update` 未実行のプロジェクトは unknown になる。これは仕様（unknown＝要確認）として案内文で補完する。
- **[CLI バージョン未取得時の見え方]** → グローバル CLI が取得できない場合は全プロジェクト unknown となり、現状より情報量が減る見え方になりうる。案内文で unknown の意味を明示する。
- **[クォートエスケープの限界]** → パス内シングルクォートには対応しない。代表ケースの利便性を優先する。
- **[CLI 完全再現でない]** → CLI の検出は commands-only fallback 等も持つが、本設計は代表スキルのみを対象とする。差分は unknown 側に倒すことで安全側に振る。


---

## Revisions

| 日付 | 種別 | 変更内容 | 理由 | 影響 API |
|------|------|----------|------|----------|
| 2026-08-10 | behavior | Versions ページの更新操作は、グローバル版状態（CLI バージョン）を先に再取得してから、プロジェクト単位の状態を再計算する（`handleRefreshVersions` が `versionStatusStore.manualRefresh()` → `projectVersionStatusStore.manualRefresh()` の順で実行）。手動 refresh（`POST /api/project-version-status/refresh`）は、起動後に新規登録されたプロジェクトも含め、その時点の全登録プロジェクトを再走査して最新状態を返す。 | 実機確認で、Versions ページの更新ボタンがグローバル版の状態のみを更新し、プロジェクト単位の状態が更新されない問題を発見。ボタンがグローバル版とプロジェクト単位の両方の状態を再取得するよう修正した。修正後の挙動をアーティファクトに反映する。 | - |
