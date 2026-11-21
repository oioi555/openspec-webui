# Design

## Context

フロントエンドは `$lib/paraglide/messages.js` / `runtime.js` を物理ファイルとして import し、Node のテスト (`locale.test.ts`, `settingsTab.test.ts`, `workflowMetadata.test.ts`) も同じ生成物を読む。生成は CLI (`scripts/compile-i18n.mjs`) と Vite プラグインの双方で行う。ロケール戦略は `custom-openspec-locale` → `preferredLanguage` → `baseLocale`。

## Goals / Non-Goals

**Goals:** 生成物の形とランタイム API を 2 系と同一に保ったまま 3 系へ上げる。

**Non-Goals:** `virtual-modules` 出力や `experimentalPerLocaleBuild` の採用、メッセージ形式の変更。

## Decisions

- **Vite で `outputStructure: 'message-modules'` を明示**: 3.0 で Vite の既定が `virtual-modules` になったため。物理出力を前提とするテスト・型チェック・`$lib` alias を維持できる。代替の `virtual-modules` 採用はテストとの分離が必要になり範囲外。
- **CLI フラグは現状維持**: `--strategy`, `--emit-ts-declarations`, `--no-emit-*` は 3 系 CLI にも存在する。
- **plugin-message-format は継続**: 3 系も `@inlang/sdk` 4 のプラグインモデルを使い、`init` も同プラグインを導入する。

## Risks / Trade-offs

- [生成コード差分で文言が変わる] → 全ロケール×全キーの描画スナップショットを前後比較する。
- [3 系で `isDevelopment` 診断が追加] → Vite プラグインがビルドモードから決定するため本番ビルドでは無効。dev サーバーでコンソールエラーがないことを確認する。

## Migration Plan

依存とロックを戻せばロールバックできる。生成物は git 管理外で再コンパイルで復元される。
