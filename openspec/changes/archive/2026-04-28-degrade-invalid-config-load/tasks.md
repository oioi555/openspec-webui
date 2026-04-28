## 1. Parser and shared model

- [x] 1.1 `src/shared/types.ts` と `frontend/src/lib/types/api.ts` を更新し、planning context に parsed / invalid を区別できる status・parse errors・raw config fields を追加する
- [x] 1.2 `src/parser/project.ts` を更新し、readable だが malformed な `config.yaml` では degraded project data を返し、raw config・diagnostics・legacy project.md を保持する
- [x] 1.3 `src/parser/index.ts` の集約ロジックを更新し、invalid planning context を理由に OpenSpec 全体を `data: null` にしないようにする

## 2. Activation and refresh behavior

- [x] 2.1 project activation フローを更新し、malformed `config.yaml` だけでは `ACTIVATION_FAILED` にしないようにする
- [x] 2.2 live refresh フローを更新し、`config.yaml` が invalid に変化した場合も last-known-good を固定せず degraded project data を broadcast できるようにする

## 3. Dashboard invalid-config UX

- [x] 3.1 `frontend/src/lib/projectPlanningContext.ts` と Dashboard 関連 UI を更新し、invalid planning context 用の notice / callout を追加する
- [x] 3.2 `frontend/src/lib/views/Dashboard.svelte` を更新し、valid 時は既存の structured planning view、invalid 時は parse diagnostics と raw `config.yaml` を表示する

## 4. Verification

- [x] 4.1 parser / project-registry / server integration / live refresh のテストを追加または更新し、invalid `config.yaml` でも project load と refresh が継続することを確認する
- [x] 4.2 frontend テストまたは状態検証を追加し、Dashboard が invalid config callout と raw config fallback を表示することを確認する
- [x] 4.3 `openspec status --change "degrade-invalid-config-load"` を実行し、change が apply-ready になることを確認する
