## Context

前回の `Dashboard.svelte` 改修では summary cards・Quick Actions・Next Step・Recent Activity を追加して情報量を増やしたが、OpenSpec WebUI の中心導線は Explorer Pane にある。特に `/changes` と `/specs` の MainViewer list pages は Explorer と責務が重複し、Quick Actions / Next Step も change ごとの差分状態を十分に表現できない。一方で `activeChanges`, `archivedChanges`, `specs`, `stats`, `commandPreferencesStore`, `layoutStore`, `tabStore` は揃っているため、Explorer と整合する Home surface へ整理し直すことはフロントエンドだけで完結できる。

## Goals / Non-Goals

**Goals:**
- Dashboard を Explorer Pane と役割分担の噛み合う Home surface に寄せる
- summary cards と recent activity は残しつつ、冗長な panels と list pages を削る
- change-scoped command shortcuts を change item 自身に寄せ、状態依存の意味づけを明確にする
- UI 上の名称を `Dashboard` に戻し、tab / page title / Activity Bar / change artifacts の表記を揃える

**Non-Goals:**
- 新しい API や server-side 集計項目の追加
- Explorer Pane / Activity Bar の構造変更
- 新規共通コンポーネントの抽出や大規模デザインシステム再編

## Decisions

1. **summary cards は Explorer section launcher として扱う**
   - cards の順序は Explorer Pane と同じく Active Changes → Archive → Specs → Tasks に揃える
   - Active / Archive / Specs cards は `layoutStore.setActivityPreset(...)` を使って Explorer Pane を展開・focus し、MainViewer の `/changes` / `/specs` list page は開かない
   - Tasks card は Home / ACTIVE CHANGES context を再focus する
   - **Why**: Home 上の cards を Explorer navigation の補助に限定することで責務重複を防げる
   - **Alternative**: cards から `/changes` / `/specs` ページを開く。Explorer と二重管理になるため不採用

2. **Dashboard は single-column flow に戻す**
   - Quick Actions / Next Step panels を削除し、Recent Activity は Active Changes の下に full-width section として置く
   - **Why**: OpenSpec では active changes が少ないことが多く、右カラムだけが伸びるレイアウトは不格好になりやすい
   - **Alternative**: 2 カラムのままサイドパネルを調整する。根本的な余白問題を解消しづらいため不採用

3. **change-scoped command shortcuts は list item に埋め込む**
   - Dashboard の Active Changes item で `getChangeCommands()` と `CommandShortcutBar` を再利用し、各 change の task 状態 / 設定に応じた command chips を表示する
   - item 全体は outer container + primary open button + command row に分け、command chip クリックが navigation を発火しない構造にする
   - **Why**: `apply` / `archive` / `verify` / `sync` などは change の状態文脈に強く依存するため、item 内に置く方が意味が明確
   - **Alternative**: Next Step panel や Quick Actions で代表値だけ出す。change ごとの差異を潰してしまうため不採用

4. **MainViewer は Home + detail tabs に限定する**
   - `MainViewer.svelte` から `/changes` / `/specs` list pages を削除し、`tabs.svelte.ts` ではそれらの routes を Home (`/`) に正規化する
   - **Why**: browsing responsibility を Explorer Pane に寄せ、tabbed Main Viewer は detail reading に集中させる
   - **Alternative**: list pages は残して cards だけ変える。構造的な冗長さが残るため不採用

5. **内部 state 名は `home` のまま、表示名だけ `Dashboard` に戻す**
   - `layoutStore` の preset 名や `HOME_TAB` などの内部識別子は維持し、ユーザーに見える文字列だけ `Dashboard` へ置き換える
   - **Why**: 既存 routing / preset / tab identity を壊さずに rename を反映できる
   - **Alternative**: internal identifier まで全面 rename する。影響範囲が広く今回の要求に対して過剰なため不採用

6. **change command row には `Next Step` cue を付ける**
   - Dashboard の Active Changes item 下段は、左側に `Next Step` ラベル、右側に `CommandShortcutBar` を置く
   - command が1つだけでも次にやるべき action だと分かる構造にする
   - **Why**: 単一 chip だけだと意味が弱く、操作の意図が伝わりにくい
   - **Alternative**: label なしで chip だけ出す。前回の問題が再発するため不採用

7. **Recent Activity は row list ではなく dense card grid にする**
   - full-width section の中で activity items を compact cards として並べ、横余白を情報密度に変える
   - **Why**: current full-width row list は行の横空白が大きく、一覧の密度が低い
   - **Alternative**: single column row list のままにする。余白が多く見えるため不採用

8. **spec / active-change icon color は Dashboard summary card に揃える**
   - Specs summary card の `FileText + success variant`、Active Changes summary card の `SquarePen + info variant` を基準に、Recent Activity の spec / active-change item icon box、`SpecViewer.svelte` の h1 icon box、`TabBar.svelte` の spec icon color を同系統へ揃える
   - **Why**: spec surfaces と active change surfaces の視覚ルールを統一すると、画面間の意味づけがぶれない
   - **Alternative**: 各ビューごとに個別色を維持する。現在のように色のルールが散らばるため不採用

9. **Recent Activity header には `History` icon を使う**
   - section header は `SquarePen` や `Bookmark` と同様に plain icon + label の形式を守りつつ、時系列リストであることを示すため `History` を使う
   - **Why**: `History` は recent timeline / past updates の意味と最も一致し、header-level cue として十分に明確
   - **Alternative**: `Clock` や `Activity`。意味は通るが、今回の「履歴一覧」には `History` の方が適切なため不採用

## Risks / Trade-offs

- **Dashboard item の構造複雑化** → open button と command row を分離し、nested button を避ける
- **`/changes` / `/specs` 直接 URL の意味変更** → Home へ正規化するが、detail routes (`/changes/<name>`, `/specs/<name>`) は従来どおり維持する
- **Recent activity は summary 補助情報に留まる** → 主導線ではなく reference section として位置づけ、Active Changes より下に置く
- **表記 rename の影響範囲が scripts / specs にも及ぶ** → visible label 文字列だけを対象にし、internal preset / ids には触れない
