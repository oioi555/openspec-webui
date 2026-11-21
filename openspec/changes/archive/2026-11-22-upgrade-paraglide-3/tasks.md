# Tasks

## 1. 事前スナップショット

- [x] 1.1 2.29.3 の生成物で全 7 ロケール×全キーを描画し before.json を保存する（スクラッチスクリプトで JSON 出力を確認）
- [x] 1.2 ロケール検出・切り替え挙動（戦略順、localStorage キー、フォールバック）を記録する（記録ファイルの存在で確認）

## 2. 依存更新と適応

- [x] 2.1 `@inlang/paraglide-js` を ^3.2.2 へ、`@inlang/plugin-message-format` を範囲内最新へ更新する（`npm ls` で版を確認）
- [x] 2.2 `frontend/vite.config.ts` に `outputStructure: 'message-modules'` を明示する（`npm run build` 成功で確認）
- [x] 2.3 `scripts/compile-i18n.mjs` の CLI 引数が 3 系で有効であることを確認する（`node scripts/compile-i18n.mjs` が成功し同じファイル構成を出力）
- [x] 2.4 `ThirdPartyNotices.txt` を再生成する（paraglide は devDependency のため差分なし。再生成で出た chokidar 5→6 の差分は前コミット由来の既存のずれで本 Change の範囲外のため戻した）

## 3. 検証

- [x] 3.1 after.json を描画し before.json と比較して同一であることを確認する
- [x] 3.2 `npm test`、`npm run typecheck`、`npm run build` が成功する
- [x] 3.3 dev サーバーで Settings から en / ja / de に切り替え、表示文言が変わりコンソールエラーがないことをスクリーンショットで確認する

## Notes

- 1.2 記録(更新前、2.29.3):
  - strategy は `['custom-openspec-locale','preferredLanguage','baseLocale']`、baseLocale は `en`。
  - `custom-openspec-locale` は localStorage の `openspec-locale` を読み書きする。
  - 検出の優先順:保存済みロケール > `navigator.languages`(pt-BR・zh-CN などに正規化)> `en`。
  - 切り替え:`localeStore.setLocale` から paraglide の `setLocale(locale, {reload:false})` を呼び、`t()` を再描画する。
  - 以上は `frontend/src/lib/locale.test.ts` と `settingsTab.test.ts` でも担保している。
- 3.3 結果(3.2.2、dev サーバー):
  - Settings で ja → de → en と切り替えると、見出しが「一般」/「Allgemein」/「General」に変わった。
  - `<html lang>` と `openspec-locale` も追従し、再読み込み後も保持された。
  - ブラウザが `ja-JP` なら ja で開き、`it-IT` なら en にフォールバックした。
  - コンソールのエラー・警告は 0 件。
  - スクリーンショットはスクラッチ領域に保存した(リポジトリには含めない)。
- CI:PR #5 で ubuntu / windows と Windows の動作確認を実施。
