## Why

`frontend/public/app-icon.svg` は追加済みだが、ナビゲーション、ブラウザタブ、README のどこからも参照されておらず、アプリ内の見た目と配布面のブランド表現が分断されている。あわせて `openspec/project.md` も現行の OpenSpec WebUI の振る舞いと運用前提に合わせて整理しておきたい。

## What Changes

- 既存の `app-icon.svg` をナビゲーション左端のホーム導線に追加し、プロジェクト名と並べて表示する
- `frontend/index.html` の favicon 参照を `app-icon.svg` に切り替え、重複する `favicon.svg` は廃止する
- README の冒頭に `app-icon.svg` を追加し、現行の見た目に沿った紹介へ整える
- `openspec/project.md` を更新し、現状のプロダクト意図・UI 役割・リポジトリ運用を実態に合わせる

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `project-context`: ナビゲーションのホーム導線にアプリアイコンを表示し、ブラウザの favicon も同じ `app-icon.svg` を使うようにする

## Impact

- UI: `frontend/src/components/Navigation.svelte`
- App shell metadata: `frontend/index.html`
- Static assets: `frontend/public/app-icon.svg`, `frontend/public/favicon.svg`
- Documentation: `README.md`, `openspec/project.md`
