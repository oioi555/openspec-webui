## Context

ExplorerPane / ChangeViewer / SpecViewer の情報表示はすでに compact metadata style へ寄せて実装が進んでいるが、change artifact の記述が一部古い。特に SpecViewer は "Updated YYYY-MM-DD" という文言ではなく、他ビューと同じく Calendar icon + formatted date の補助表示に揃っている。また verification で、change `lastModified` に spec delta ファイルの更新が反映されない点と、`formatDate` の malformed input 耐性不足が見つかった。

## Goals / Non-Goals

**Goals:**
- Active Changes / Archive / Specs の 2 段目表示を compact metadata style として明文化する
- SpecViewer の補助表示を現行 UI に合わせて Calendar icon + formatted date として記述する
- Change `lastModified` に `changes/<name>/specs/` 配下の spec delta ファイルを含める
- `formatDate` を invalid input-safe にする
- node:test + tsx で follow-up の回帰テストを追加する

**Non-Goals:**
- main specs への sync
- 新しい test framework 導入
- ExplorerPane のセクション構造やアイコン方針の再設計

## Decisions

1. **SpecViewer subtitle 表現**: 固定プレフィックス文字列は使わず、`Calendar` アイコンと `formatDate(lastModified)` のみを表示する。`lastModified` が無い場合のみ `Specification` を fallback とする
2. **Change lastModified 範囲**: root の markdown/html ファイルに加え、`changes/<name>/specs/` 以下の markdown/html ファイルも集計対象に含める。UI 上の file grouping は従来どおり spec delta を別扱いに保つ
3. **Date formatting safety**: `formatDate` は `null` / `undefined` / `Invalid Date` を空文字で吸収する
4. **Test strategy**: フロントエンド utility は既存 `frontend/src/lib/utils.test.ts` を拡張し、parser は temp dir fixture を使う `src/parser/changes.test.ts` を追加する

## Risks / Trade-offs

- **mtime 依存**: git checkout や copy によって mtime が変わる性質は残るが、この change では実用上の「直近更新の可視化」を優先する
- **spec delta 配下の探索コスト**: 追加 stat は増えるが、change 配下ファイル数は小さいため許容範囲
- **invalid date の握りつぶし**: 空文字 fallback により例外は防げるが、入力異常は UI 上で非表示になる。ただし現状用途では安全性優先が適切
