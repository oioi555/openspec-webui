## 1. バックエンド: 型拡張

- [x] 1.1 `src/shared/types.ts` の `Spec` インターフェースに `lastModified: string | null` を追加
- [x] 1.2 `src/shared/types.ts` の `Change` インターフェースに `lastModified: string | null` を追加
- [x] 1.3 `src/parser/specs.ts` の `parseCapability` で spec.md と design.md の最新 mtime を取得し `lastModified` に設定
- [x] 1.4 `src/parser/changes.ts` の `parseChange` で change 内ファイルの最新 mtime を取得し `lastModified` に設定
- [x] 1.5 `src/server/routes/api.ts` の `/api/specs` レスポンスに `lastModified` を含める
- [x] 1.6 `src/server/routes/api.ts` の `summarizeChange` に `lastModified` を含める

## 2. フロントエンド: API型更新

- [x] 2.1 `frontend/src/lib/api.ts` の `Spec`・`SpecSummary`・`ChangeSummary`・`Change` インターフェースに `lastModified` を追加

## 3. フロントエンド: 共通ユーティリティ

- [x] 3.1 `formatDate` 関数を `lib/utils.ts` に集約し、ExplorerPane / ChangeViewer / SpecViewer から共通利用する
- [x] 3.2 `formatDate` が null / undefined / malformed input で空文字を返すよう安全化する
- [x] 3.3 `frontend/src/lib/utils.test.ts` に `formatDate` の正常系・異常系テストを追加する

## 4. フロントエンド: ExplorerPane表示改善

- [x] 4.1 `Calendar`, `CircleCheckBig` アイコンと `formatChangeName` ユーティリティを import
- [x] 4.2 Active Changes 2段目を「Calendar+日付 + FileText+delta数 + CircleCheckBig+done/total + プログレスバー(w-14)」に変更
- [x] 4.3 Archive Change名を `formatChangeName` で日付プレフィックス除去
- [x] 4.4 Archive 2段目を「Calendar+日付 + FileText+delta数 + CircleCheckBig+done/total」に変更（プログレスバーなし）
- [x] 4.5 Specs 2行目を Calendarアイコン＋最終更新日（YYYY-MM-DD）に変更

## 5. フロントエンド: ChangeViewer表示改善

- [x] 5.1 `Calendar`, `CircleCheckBig`, `FileText` アイコンと `formatChangeName`, `formatDate` を import
- [x] 5.2 isArchived: タイトルから日付プレフィックスを除去（`formatChangeName` 使用）
- [x] 5.3 isArchived: 2行目を「Calendar+アーカイブ日付 + FileText+delta数 + CircleCheckBig+done/total + プログレスバー(w-32)」に変更
- [x] 5.4 !isArchived: 2行目を「Calendar+最終更新日 + FileText+delta数 + CircleCheckBig+done/total + プログレスバー(w-32)」に変更

## 6. フロントエンド: SpecViewer表示改善

- [x] 6.1 SpecViewer のサブタイトルを compact metadata style（Calendar icon + formatted date）に変更し、`lastModified` 不在時のみ `Specification` を表示する

## 7. フロントエンド: Dashboard表示改善

- [x] 7.1 Active Changes 2段目を「Calendar+日付 + FileText+delta数 + CircleCheckBig+done/total」に変更

## 8. Follow-up: parser lastModified 補強

- [x] 8.1 `src/parser/changes.ts` の change `lastModified` 計算に `changes/<name>/specs/` 配下の spec delta ファイルを含める
- [x] 8.2 file grouping / spec delta 表示ロジックを変えずに mtime 集計のみ拡張する
- [x] 8.3 `src/parser/changes.test.ts` を追加し、root ファイルと spec delta ファイルの両方が `lastModified` に影響することを検証する

## 9. 検証

- [x] 9.1 `npm run test:unit` で utility / parser テスト成功を確認
- [x] 9.2 `npm run build` でビルド成功を確認
- [x] 9.3 既存 CDP UI スクリプトを拡張し、ExplorerPane / SpecViewer の compact metadata 表示と archived change 名称表示を回帰確認する
