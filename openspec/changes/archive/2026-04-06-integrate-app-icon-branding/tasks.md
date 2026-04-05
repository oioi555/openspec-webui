## 1. ナビゲーションと favicon の統一

- [x] 1.1 `frontend/src/components/Navigation.svelte` のホーム導線に `app-icon.svg` を追加し、プロジェクト名の左に表示する
- [x] 1.2 `frontend/index.html` の favicon 参照を `/favicon.svg` から `/app-icon.svg` に切り替える
- [x] 1.3 追加参照が残らないことを確認したうえで `frontend/public/favicon.svg` を削除する

## 2. ドキュメント整理

- [x] 2.1 `README.md` のタイトル直下に `app-icon.svg` を追加し、GitHub 上で見やすい表示サイズに調整する
- [x] 2.2 `README.md` の紹介文または現状説明を、共有アプリアイコンを使う現行 UI に合わせて必要最小限更新する
- [x] 2.3 `openspec/project.md` を現行の OpenSpec WebUI の役割・主要体験・リポジトリ規約に合わせて整理する

## 3. 検証

- [x] 3.1 ナビゲーションで `app-icon.svg` とプロジェクト名が 1 つの Home 導線として表示されることを確認する
- [x] 3.2 ブラウザタブが `/app-icon.svg` を favicon として参照し、`/favicon.svg` への依存がなくなることを確認する
- [x] 3.3 README のアイコン表示と `openspec/project.md` の更新内容を確認し、現行仕様説明と矛盾がないことを確認する
- [x] 3.4 必要な型チェックまたはビルド確認を行い、変更で既存挙動が壊れていないことを確認する
