## Context

Tailwind v4 移行（Change 1）完了後の状態。`@theme` ブロックが空のプレースホルダーとして `app.css` に存在する。全18コンポーネントの色がハードコード（`gray-800`, `gray-900`, `blue-400` 等）されており、テーマ切替が不可能。

現在の設定UIは `CommandSettingsModal` のみで、`Modal.svelte` でラップされている。ナビゲーション右端の設定アイコンから開く。

フロントエンドは Svelte 5 store（writable）で状態管理。`commandPreferences` は localStorage で永続化するパターンが確立済み。

## Goals / Non-Goals

**Goals:**
- ライト/ダーク/システム追従の3テーマモードをサポート
- CSS変数ベースのセマンティックカラー体系を確立
- 全コンポーネントのハードコード色をセマンティック色に置換
- テーマ選択を localStorage に永続化
- `prefers-color-scheme` で OS 設定に追従（System モード時）
- 設定画面にテーマ選択セクションを追加

**Non-Goals:**
- 3色以上のテーマ（カスタムテーマエディタ等）は導入しない
- 設定画面のレイアウト再設計はしない（Change 3）
- SVGアイコンのリファクタリングはしない（Change 3）
- Markdown本文（`.markdown-body`）以外のカスタムスタイルの@apply削除はしない

## Decisions

### D1: CSS変数 + data属性によるテーマ切替
`<html data-theme="light|dark">` でテーマを制御。`:root` にライト、`[data-theme="dark"]` にダークの色値を定義。System モード時は `prefers-color-scheme` メディアクエリで自動判定。

**代替案**: Tailwind v4 の `@variant dark` + `dark:` プレフィックス → 全コンポーネントに `dark:` クラスを二重書きする必要があり、HTMLが肥大化するため不採用。

### D2: セマンティックカラーパレット
以下のセマンティック名を定義:

| Token | 用途 | ライト | ダーク |
|-------|------|--------|--------|
| `--color-bg` | ページ背景 | white | gray-900 |
| `--color-surface` | カード・モーダル背景 | gray-50 | gray-800 |
| `--color-surface-alt` | セカンダリ背景 | gray-100 | gray-900/950 |
| `--color-on-bg` | ページ上テキスト | gray-900 | gray-100 |
| `--color-on-surface` | カード上テキスト | gray-800 | gray-200 |
| `--color-on-surface-muted` | 補助テキスト | gray-500 | gray-400 |
| `--color-border` | 境界線 | gray-200 | gray-700 |
| `--color-brand` | ブランド色 | blue-600 | blue-400 |
| `--color-brand-hover` | ブランド色(hover) | blue-500 | blue-300 |
| `--color-input-bg` | 入力欄背景 | white | gray-700 |
| `--color-input-border` | 入力欄境界 | gray-300 | gray-600 |

`@theme` でこれらを登録し、Tailwindクラスとして `bg-surface` 等で使用可能にする。

検証のフォローアップとして、トースト・バッジ・差分ハイライト・サジェスト選択・HTMLラベル・モーダルオーバーレイ・インラインコードでも固定色を残さないため、以下の補助トークンも追加する:

- `--color-on-brand`
- `--color-overlay`
- `--color-code`
- `--color-info*`
- `--color-success*`
- `--color-warning*`
- `--color-danger*`
- `--color-accent*`
- `--color-html*`

### D3: themeStore の設計
Svelte writable store で `theme: 'light' | 'dark' | 'system'` を管理。localStorage の `openspec-theme` キーに保存。初期化時に localStorage → System判定 → デフォルト(dark)の優先順位で復元。

### D4: 設定画面への追加
既存の `CommandSettingsModal` に "Appearance" セクションを追加。3つのラジオボタン（Light / Dark / System）で構成。将来的に Change 3 で左ペイン構成に再設計する際、このセクションを独立ページに移行。

### D5: 初回描画前のテーマ適用
保存済みテーマは `frontend/index.html` のブートストラップscriptで Svelte mount 前に `<html data-theme>` へ同期反映し、初回描画時のテーマずれ（FOUC）を防ぐ。`system` 保存時は最初に OS 設定から解決した実効テーマを適用し、アプリ起動後は `themeStore` が通常の System モード動作（属性除去 + CSS media query）に戻す。

## Verification Follow-ups

- [初回表示のテーマずれ] → `index.html` で保存済みテーマを同期適用して解消
- [ステータス/補助UIの固定色残存] → status / accent / html / overlay / code token を追加して解消
- [固定色回帰の検出不足] → `themeStore` の自動テストを追加し、固定色再検索を検証手順に追加

## Risks / Trade-offs

- [セマンティック色のマッピング漏れ] → 各コンポーネントを個別に目視確認。ハードコード色が残っていてもビルドエラーにならないため、レビューで検出する必要がある。
- [初回描画のテーマ不一致] → `index.html` の同期適用で回避。以後もテーマ初期化を触る変更では再確認する。
- [Markdownレンダリングの色] → `.markdown-body` のスタイルは178行あり、変換量が大きい。ただし機械的な置換で対応可能。
- [System モードのリアルタイム追従] → `prefers-color-scheme` の change イベントをリッスンする必要があるが、実装は軽微。
