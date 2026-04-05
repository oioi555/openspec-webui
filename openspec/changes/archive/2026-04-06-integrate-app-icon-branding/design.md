## Context

`frontend/public/app-icon.svg` は既に配置されているが、現在の UI ではナビゲーションがテキストのみで、`frontend/index.html` も別ファイルの `favicon.svg` を参照している。README もアプリアイコンを使っておらず、ブランドの見せ方が UI・ブラウザ・ドキュメントで揃っていない。

今回の変更では、既存の `app-icon.svg` をそのまま使い、最小変更で参照先を統一する。同時に `openspec/project.md` は、現行の OpenSpec WebUI が持つブラウズ・検索・ライブ更新・レビュー補助といった役割に合わせて、説明を簡潔に整理する。

## Goals / Non-Goals

**Goals:**
- `app-icon.svg` をナビゲーションと favicon の共通ブランド資産として使う
- README 冒頭に視認できるサイズでアプリアイコンを追加する
- `openspec/project.md` を現行のプロダクト意図とリポジトリ運用に合わせて更新する
- 既存の静的アセット構成（`frontend/public/`）を崩さずに反映する

**Non-Goals:**
- アプリアイコン自体の再デザイン
- PNG / ICO / Apple touch icon / manifest など追加の派生アセット生成
- ナビゲーション構造やルーティングの再設計
- README 全体の大規模な書き直し

## Decisions

### D1: `app-icon.svg` を唯一の参照元にする
ナビゲーションの左端アイコンとブラウザ favicon は、どちらも `/app-icon.svg` を直接参照する。これにより、既存の `favicon.svg` を維持する二重管理を避けられる。

**代替案:** `favicon.svg` を残して favicon 専用の簡略版として管理する。  
**不採用理由:** 現状の `app-icon.svg` は 16×16 のピクセル調 SVG で favicon 用途にも適しており、まずは 1 ファイル運用の方が保守コストが低い。

### D2: ナビゲーションではアイコンをホーム導線の一部として扱う
`Navigation.svelte` では、既存のプロジェクト名ボタン内で `app-icon.svg` を文字列の左に並べる。リンク先は現状どおり Home (`/`) のままとし、アイコン単体ではなく「アイコン + プロジェクト名」を一体のホーム導線として扱う。

**代替案:** アイコン専用の別リンクや `Icon.svelte` への取り込み。  
**不採用理由:** ブランド SVG は Heroicons ベースの `Icon.svelte` と用途が異なり、別リンク化も操作対象を増やすだけで利点が小さい。

### D3: README はトップ付近に明示サイズ付きで配置する
README はタイトル直下に `app-icon.svg` を置く。SVG 自体は 16×16 のため、Markdown の素の画像記法よりも、サイズ指定できる HTML の `img` を使う前提で計画する。

**代替案:** README では画像を使わずテキストのみを維持する。  
**不採用理由:** 変更の目的がブランド表現の統一であり、README でも同じアイコンを見せる方が一貫性が高い。

### D4: `openspec/project.md` は現行仕様の要約へ寄せる
`openspec/project.md` は実装詳細の羅列ではなく、現行プロダクトの目的・主要な体験・リポジトリ規約を短く保つ。更新時は README の「What it does today」と既存 capability specs を参照し、実態とずれた説明を減らす。

**代替案:** `openspec/project.md` は変更しない。  
**不採用理由:** ユーザーの明示要望であり、Change の範囲内でドキュメントのドリフトも同時に解消できる。

## Risks / Trade-offs

- [16×16 SVG をナビゲーションで拡大表示すると粗く見える可能性] → 余白込みで小さめサイズに収め、実表示で視認性を確認する
- [README 上で SVG が小さすぎる可能性] → `img` で表示サイズを指定し、GitHub 表示で十分見える寸法にする
- [`favicon.svg` 削除後に見落とした参照が残る可能性] → `index.html` を更新した上で参照箇所を確認し、不要ファイルとして除去する
- [`openspec/project.md` の更新が README と重複しすぎる可能性] → project.md では製品意図と運用原則に寄せ、README は利用手順中心に保つ
