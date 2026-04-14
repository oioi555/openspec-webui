## Context

ChangeViewerとSpecViewerはMarkdown文書を`MarkdownRenderer`（`{@html}`経由）で描画している。ブラウザ標準のテキスト選択は動作するが、右クリック時のコンテキストメニューはなく、Change名/Spec名やファイル名などのメタ情報を付与した引用コピーができない。

プロジェクトには既存のコンテキストメニューシステム（`$lib/components/ui/context-menu/`）があり、ExplorerPaneやTabBarで使用実績がある。また `navigator.clipboard.writeText()` + `svelte-sonner` のトースト通知パターンも確立されている。

Suggestion機能（`remove-suggestion-feature`で削除済み）の「テキスト蓄積→コンテキスト付き出力」目的を、はるかにシンプルな形で代替する。

## Goals / Non-Goals

**Goals:**
- ChangeViewerとSpecViewer内のMarkdownコンテンツ上で右クリック時にコンテキストメニューを表示する
- 選択テキストのプレーンコピー（テキストのみ）
- 選択テキストの引用付きコピー（Markdown形式でChange名/Spec名・タブ名を付与）
- テキスト未選択時はメニュー項目をdisabledにする

**Non-Goals:**
- コードブロック専用のコピーボタン（別機能として検討可能）
- 見出しへのリンクやアンカー生成
- 選択テキストの蓄積・複数選択（旧Suggestion機能の再現ではない）

## Decisions

### Decision 1: ContextMenuをMarkdownRendererではなく各Viewerに配置する

**選択**: `ContextMenu.Root`で各ViewerのMarkdownRendererコンテンツ領域全体をラップする。MarkdownRenderer自体は汎用コンポーネントとして変更しない。

**理由**: 引用コピーに必要なコンテキスト情報（Change名/Spec名、ファイル名、タブ名）はすべて各Viewerで管理されている。MarkdownRendererにpropを増やして責務を混ぜるより、各Viewer側でラップする方が自然。ChangeViewerとSpecViewerで同一パターンを適用。

### Decision 2: 引用付きコピーのフォーマット

**選択**: シンプルなMarkdown blockquote形式:
```
> [change-name] file-name.md
> 選択テキスト
```

SpecViewerの場合:
```
> [spec-name] Specification
> 選択テキスト
```

**理由**: Markdownエディタやチャットツールにそのまま貼り付け可能。Change名/Spec名はkebab-caseのまま。ChangeViewerのspec deltaの場合は`delta.capability`を、SpecViewerの場合はタブ名（Specification / Design）をコンテキストラベルに使用。

### Decision 3: 選択テキストの取得方法

**選択**: disabled判定は`onOpenChange`コールバックで行い（Decision 4）、実際のコピー対象テキストはメニュー項目クリック時に取得する。この2段構えにより、UIの有効/無効の即時反映とコピー時の確実なテキスト取得を両立する。

**理由**: メニュー表示時（`oncontextmenu`イベント時）に取得すると、ブラウザによっては右クリック操作自体で選択が解除される場合がある。クリック時の取得の方が確実。Chromium・Firefox双方で正常動作を確認済み。

### Decision 4: disabled判定

**選択**: `onOpenChange`コールバックで`window.getSelection().toString()`をチェックし、hasSelection状態を更新。メニュー項目の`disabled`propにバインドする。

**理由**: メニューが開いた時点でテキストが選択されているかを判定し、項目の有効/無効を切り替える。UXとして直感的。

## Risks / Trade-offs

- **[選択解除のタイミング]** → 一部ブラウザでは右クリック時に選択が解除される可能性がある。Mitigation: メニュー項目のクリック時に選択テキストを再取得し、空の場合はトーストで通知する。
- **[Firefoxのclipboard API]** → `navigator.clipboard.writeText()`はHTTPSまたはlocalhostでのみ動作。Mitigation: ローカル開発環境はlocalhost、本番はHTTPS前提なので実質影響なし。フォールバックとして`document.execCommand('copy')`は使用しない（非推奨）。
