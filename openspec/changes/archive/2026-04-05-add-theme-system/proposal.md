## Why

全コンポーネントの色が Tailwind のダーク系クラス（`gray-800`, `gray-900` 等）にハードコードされており、テーマ変更が不可能。Tailwind v4 の `@theme` と CSS 変数を利用して、ライト/ダーク/システム追従のテーマ切替を可能にする。Change 1（migrate-tailwind-v4）で構築した v4 基盤の上に構築する。

## What Changes

- `app.css` の `@theme` ブロックにセマンティックカラーを定義（`--color-surface`, `--color-on-surface`, `--color-border` 等）
- `:root` と `[data-theme="dark"]` でライト/ダークの色値を定義
- 全 Svelte コンポーネントのハードコード色（`gray-800`, `gray-900`, `blue-400` 等）をセマンティッククラスに置換
- `app.css` 内の `.markdown-body` 等の `@apply` もセマンティック色に置換
- テーマ選択 UI を設定画面に追加（Light / Dark / System の3択）
- `<html data-theme="">` でテーマを切り替え、`localStorage` で永続化
- `prefers-color-scheme` メディアクエリでシステム設定に追従

## Capabilities

### New Capabilities

- `theme-management`: ライト/ダークテーマの定義、切替、永続化、システム追従に関する要件

### Modified Capabilities

- `cli-runtime`: テーマシステムに関するフロントエンドストアの追加
- `command-preferences`: 設定画面に Appearance セクション（テーマ選択）を追加

## Impact

- 全 Svelte コンポーネント（18ファイル）の色クラス書き換え
- `app.css` の178行のスタイル定義の色書き換え
- 新規ストア: テーマ状態管理（`themeStore`）
- 設定画面の拡張
