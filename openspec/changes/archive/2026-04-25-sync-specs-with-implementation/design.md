## Context

2026-04-25 の監査で、26 spec 中 22 spec に実装との差異が見つかった。主な原因：
- 実装変更後に spec を更新し忘れた（17件）
- spec delta が未生成だった（2件）
- spec delta の同期漏れ（1件）
- 設計意図の相違（2件）

今回は spec を実装に合わせる方向で統一する。実装コードへの変更は行わない。

## Goals / Non-Goals

**Goals:**
- 22 spec の差異を解消し、spec を実装の真実源に戻す
- spec delta を生成して main spec に反映する
- 今後の Change 作成時に正しい前提で delta が生成されるようにする

**Non-Goals:**
- 実装コードの変更
- 実装の問題修正（別途個別に対応）
- 新機能の追加

## Decisions

### 1. spec delta 経由で main spec を更新する

**理由**: OpenSpec のワークフローに合わせるため。直接 main spec を編集すると、将来の archive 時に delta との整合性が取れなくなる。

**方法**: 各 spec に対して `## MODIFIED Requirements` 形式の delta を生成し、openspec sync で main spec に反映する。

### 2. 実装に合わせて spec を更新する

**理由**: 実装が動いており、spec が古い状態。実装を spec に戻すとリグレッションのリスクがある。

**例外**: 実装に明らかなバグがある場合は、別途個別に対応する。

### 3. 削除された要件は `## REMOVED Requirements` で処理する

**理由**: `project:switched` broadcast など、実装されていない要件は spec から削除する。

## Risks / Trade-offs

- **Risk**: spec の更新後に、将来の Change で古い spec を前提とした delta が生成される
  - **Mitigation**: 今回の更新で spec が最新状態になるため、リスクは低い
- **Risk**: 実装のバグを spec に合わせてしまう
  - **Mitigation**: 実装に明らかなバグがある場合は別途個別に対応する方針
