# Proposal

## Why

`@inlang/paraglide-js` は 2.29.3 に留まっており、最新メジャー 3.2.2 が公開されている。3.0 の破壊的変更（Vite 統合の既定出力が `virtual-modules` に変更、CLI で型宣言が既定出力化、`additionalFiles` 等の削除）を吸収し、翻訳・ロケール検出・切り替えのユーザー可視挙動を変えずに 3 系へ移行する。

## What Changes

- `@inlang/paraglide-js` を ^2.25.4 (2.29.3) から ^3.2.2 へ更新し、`package-lock.json` と `ThirdPartyNotices.txt` を同期する。
- `@inlang/plugin-message-format` は 3 系 SDK (@inlang/sdk 4) と互換のため継続利用し、範囲内最新へ揃える。
- `frontend/vite.config.ts` の Vite プラグインに `outputStructure: 'message-modules'` を明示し、2 系と同じ物理出力 (`frontend/src/lib/paraglide/`) を維持する。
- `scripts/compile-i18n.mjs` の CLI 引数を 3 系で有効なフラグに合わせて確認する。
- 全 7 ロケール × 全メッセージキーの描画結果を更新前後で比較し、同一であることを確認する。
- 翻訳文言、ロケール戦略、`openspec-webui` のバージョン、npm 公開は変更しない。

## Capabilities

### New Capabilities

なし。

### Modified Capabilities

なし。ツール依存の更新のみで要件レベルの挙動は変わらないため、`skip_specs: true` とする。

## Impact

- `package.json`, `package-lock.json`, `ThirdPartyNotices.txt`
- `frontend/vite.config.ts`, `scripts/compile-i18n.mjs`
- 生成物 `frontend/src/lib/paraglide/`（git 管理外）
