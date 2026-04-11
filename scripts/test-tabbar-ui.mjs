#!/usr/bin/env node

const APP_URL = process.env.APP_URL ?? 'http://127.0.0.1:3003/';
const DEVTOOLS_LIST_URL = process.env.DEVTOOLS_LIST_URL ?? 'http://127.0.0.1:9222/json/list';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class CDPClient {
  #ws;
  #id = 0;
  #pending = new Map();

  constructor(wsUrl) {
    this.#ws = new WebSocket(wsUrl);
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.#ws.addEventListener('open', resolve, { once: true });
      this.#ws.addEventListener('error', reject, { once: true });
    });

    this.#ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (!('id' in message)) {
        return;
      }

      const pending = this.#pending.get(message.id);
      if (!pending) {
        return;
      }

      this.#pending.delete(message.id);

      if (message.error) {
        pending.reject(new Error(message.error.message ?? 'CDP command failed'));
        return;
      }

      pending.resolve(message.result ?? {});
    });

    await this.send('Runtime.enable');
    await this.send('Page.enable');
    await this.send('Emulation.setDeviceMetricsOverride', {
      width: 1400,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
  }

  send(method, params = {}) {
    const id = ++this.#id;

    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      this.#ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });

    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || 'Runtime.evaluate failed');
    }

    return result.result?.value;
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await sleep(1200);
  }

  async reload() {
    await this.send('Page.reload');
    await sleep(1200);
  }

  async close() {
    this.#ws.close();
  }
}

async function getPageWebSocketUrl() {
  const response = await fetch(DEVTOOLS_LIST_URL);
  const targets = await response.json();
  const page = targets.find((target) => target.type === 'page' && target.url.startsWith(APP_URL));

  if (!page?.webSocketDebuggerUrl) {
    throw new Error(`Could not find Chrome DevTools page target for ${APP_URL}`);
  }

  return page.webSocketDebuggerUrl;
}

function pageExpression(source) {
  return `(${source})()`;
}

function escapeForPage(value) {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
}

async function clickSelector(cdp, selector) {
  const ok = await cdp.evaluate(pageExpression(() => {
    const el = document.querySelector('__SELECTOR__');
    if (!(el instanceof HTMLElement)) {
      return false;
    }

    el.click();
    return true;
  }).replace('__SELECTOR__', escapeForPage(selector)));

  if (!ok) {
    throw new Error(`Selector not clickable: ${selector}`);
  }

  await sleep(250);
}

async function clickExplorerItem(cdp, sectionLabel, index = 0) {
  const expression = pageExpression(() => {
    const explorer = [...document.querySelectorAll('aside')].find((node) => node.textContent?.includes('Workspace'));
    if (!explorer) {
      return null;
    }

    const sections = [...explorer.querySelectorAll('[data-state]')];
    const section = sections.find((node) => node.querySelector('button')?.textContent?.includes('__LABEL__'));
    if (!section) {
      return null;
    }

    const body = section.querySelector('.divide-y');
    if (!body) {
      return null;
    }

    const items = [...body.querySelectorAll('button')];
    const target = items[__INDEX__];
    if (!(target instanceof HTMLElement)) {
      return null;
    }

    const text = target.querySelector('.font-medium, .truncate')?.textContent?.trim() ?? target.textContent?.trim() ?? null;
    target.click();
    return text;
  })
    .replace('__LABEL__', escapeForPage(sectionLabel))
    .replace('__INDEX__', String(index));

  const name = await cdp.evaluate(expression);
  if (!name) {
    throw new Error(`Could not open explorer item from section ${sectionLabel}`);
  }

  await sleep(300);
  return name;
}

async function getExplorerItemDetails(cdp, sectionLabel, index = 0) {
  const expression = pageExpression(() => {
    const normalizeText = (value) => value?.replace(/\s+/g, ' ').trim() ?? '';
    const explorer = [...document.querySelectorAll('aside')].find((node) => node.textContent?.includes('Workspace'));
    if (!explorer) {
      return null;
    }

    const sections = [...explorer.querySelectorAll('[data-state]')];
    const section = sections.find((node) => node.querySelector('button')?.textContent?.includes('__LABEL__'));
    if (!section) {
      return null;
    }

    const body = section.querySelector('.divide-y');
    if (!body) {
      return null;
    }

    const items = [...body.querySelectorAll('button')];
    const target = items[__INDEX__];
    if (!(target instanceof HTMLElement)) {
      return null;
    }

    const label = target.querySelector('.font-medium, .truncate');
    const content = target.querySelector('.min-w-0.flex-1');
    const contentChildren = content ? [...content.children] : [];
    const metadata = contentChildren.find((node, childIndex) => childIndex > 0 && node instanceof HTMLElement) ?? null;
    const progress = target.querySelector('[data-slot="progress"]');

    return {
      visibleLabel: normalizeText(label?.textContent),
      title: label?.getAttribute('title') ?? null,
      metadataText: normalizeText(metadata?.textContent),
      metadataItems: metadata ? [...metadata.querySelectorAll('span')].map((node) => normalizeText(node.textContent)) : [],
      hasProgress: Boolean(progress),
      progressContainerClass: progress?.parentElement?.className ?? null,
    };
  })
    .replace('__LABEL__', escapeForPage(sectionLabel))
    .replace('__INDEX__', String(index));

  const details = await cdp.evaluate(expression);
  if (!details) {
    throw new Error(`Could not inspect explorer item from section ${sectionLabel}`);
  }

  return details;
}

async function waitFor(cdp, predicateExpression, label, timeoutMs = 8000, intervalMs = 200) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = await cdp.evaluate(predicateExpression);
    if (result) {
      return result;
    }
    await sleep(intervalMs);
  }

  throw new Error(`Timed out waiting for: ${label}`);
}

function getStateExpression() {
  return pageExpression(() => {
    const tabList = document.querySelector('[role="tablist"]');
    const tabs = [...document.querySelectorAll('[role="tab"]')].map((node) => {
      const text = node.querySelector('span')?.textContent?.trim() ?? node.textContent?.trim() ?? null;

      return {
        text,
        selected: node.getAttribute('aria-selected') === 'true',
        closeVisible: Boolean(node.querySelector('button[aria-label="Close tab"]')),
        pinVisible: Boolean(node.querySelector('button[aria-label="Pin tab"], button[aria-label="Unpin tab"]')),
      };
    });

    const firstTab = document.querySelector('[role="tab"]');

    return {
      path: location.pathname,
      tabListClass: tabList?.className ?? '',
      firstTabInset: firstTab && tabList
        ? Math.round(firstTab.getBoundingClientRect().left - tabList.getBoundingClientRect().left)
        : null,
      activeTab: tabs.find((tab) => tab.selected)?.text ?? null,
      homeTab: tabs.find((tab) => tab.text === 'Home') ?? null,
      tabNames: tabs.map((tab) => tab.text).filter(Boolean),
    };
  });
}

async function getState(cdp) {
  return cdp.evaluate(getStateExpression());
}

async function getViewerSubtitle(cdp) {
  return cdp.evaluate(pageExpression(() => {
    const heading = document.querySelector('h1');
    const subtitle = heading?.parentElement?.querySelector('p');
    return subtitle?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
  }));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function formatArchivedChangeName(name) {
  return name.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function assertCompactDate(value, message) {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(value), message);
}

async function main() {
  const wsUrl = await getPageWebSocketUrl();
  const cdp = new CDPClient(wsUrl);
  await cdp.connect();

  try {
    await cdp.navigate(APP_URL);

    await cdp.evaluate(pageExpression(() => {
      localStorage.setItem('openspec-layout', JSON.stringify({
        explorerCollapsed: false,
        rememberedExplorerWidth: 320,
        sectionCollapsed: {
          'active-changes': false,
          archive: false,
          specs: false,
        },
      }));

      return true;
    }));

    await cdp.reload();

    await waitFor(
      cdp,
      pageExpression(() => Boolean(document.querySelector('[role="tablist"]') && document.querySelector('[aria-label="Archive"]'))),
      'tab bar and archive activity button',
    );

    let state = await getState(cdp);
    assert(state.homeTab?.pinVisible === true, 'Home tab should stay pinned');
    assert(state.homeTab?.closeVisible === false, 'Home tab should not show a close button');
    assert(state.tabListClass.includes('pl-2'), 'Tab list should keep pl-2 for left-edge alignment');
    assert(typeof state.firstTabInset === 'number' && state.firstTabInset >= 6 && state.firstTabInset <= 10, `Expected first tab inset near 8px, received ${state.firstTabInset}`);

    const activeRow = await getExplorerItemDetails(cdp, 'Active Changes', 0);
    assert(activeRow.visibleLabel.length > 0, 'Expected an active change row');
    assert(activeRow.metadataItems.length === 3, `Active change row should expose three compact metadata items, received ${activeRow.metadataItems.length}`);
    assertCompactDate(activeRow.metadataItems[0], 'Active change row should show compact date metadata');
    assert(/^\d+$/.test(activeRow.metadataItems[1]), 'Active change row should show compact spec delta count');
    assert(/^\d+\/\d+$/.test(activeRow.metadataItems[2]), 'Active change row should show compact task progress');
    assert(activeRow.hasProgress, 'Active change row should show a progress bar');
    assert(activeRow.progressContainerClass?.includes('w-14'), 'Active change row should keep the compact progress width');
    assert(!activeRow.metadataText.includes('Updated'), 'Active change row should not use the old Updated label');

    await clickSelector(cdp, '[aria-label="Archive"]');

    const archivedRow = await getExplorerItemDetails(cdp, 'Archive', 0);
    const archivedChangeName = archivedRow.title ?? archivedRow.visibleLabel;
    assert(/^\d{4}-\d{2}-\d{2}-/.test(archivedChangeName), 'Archived change row tooltip should preserve the full archived name');
    assert(archivedRow.visibleLabel === formatArchivedChangeName(archivedChangeName), 'Archived change row label should hide the date prefix');
    assert(archivedRow.metadataItems.length === 3, `Archived change row should expose three compact metadata items, received ${archivedRow.metadataItems.length}`);
    assertCompactDate(archivedRow.metadataItems[0], 'Archived change row should show archived date metadata');
    assert(/^\d+$/.test(archivedRow.metadataItems[1]), 'Archived change row should show compact spec delta count');
    assert(/^\d+\/\d+$/.test(archivedRow.metadataItems[2]), 'Archived change row should show compact task progress');
    assert(!archivedRow.hasProgress, 'Archived change row should not render a progress bar');
    assert(!archivedRow.metadataText.includes('Updated'), 'Archived change row should not use the old Updated label');

    await clickExplorerItem(cdp, 'Archive', 0);
    state = await getState(cdp);

    assert(state.path === `/changes/${encodeURIComponent(archivedChangeName)}`, 'Archived change route should keep the full archived name');
    assert(state.activeTab === formatArchivedChangeName(archivedChangeName), 'Archived change tab label should hide the date prefix');

    await clickSelector(cdp, '[aria-label="Specs"]');

    const specRow = await getExplorerItemDetails(cdp, 'Specs', 0);
    assert(specRow.visibleLabel.length > 0, 'Expected a spec row');
    assertCompactDate(specRow.metadataText, 'Spec row should show compact date metadata');
    assert(!specRow.metadataText.includes('Updated'), 'Spec row should not use the old Updated label');

    const specName = await clickExplorerItem(cdp, 'Specs', 0);
    state = await getState(cdp);
    assert(state.path === `/specs/${encodeURIComponent(specName)}`, 'Spec route should use the visible spec name');

    const subtitle = await getViewerSubtitle(cdp);
    assertCompactDate(subtitle ?? '', 'Spec viewer subtitle should show compact calendar/date metadata');
    assert(subtitle === specRow.metadataText, 'Spec viewer subtitle should match the explorer metadata date');
    assert(!subtitle?.includes('Updated'), 'Spec viewer subtitle should not use the old Updated label');

    console.log(JSON.stringify({
      ok: true,
      checks: [
        'home-tab-pinned',
        'tabbar-left-edge-inset',
        'active-change-compact-metadata',
        'archived-change-label-format',
        'archived-change-compact-metadata',
        'spec-row-date-metadata',
        'spec-viewer-compact-subtitle',
      ],
    }, null, 2));
  } finally {
    await cdp.close();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
