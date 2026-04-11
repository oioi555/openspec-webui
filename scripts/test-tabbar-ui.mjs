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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function formatArchivedChangeName(name) {
  return name.replace(/^\d{4}-\d{2}-\d{2}-/, '');
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
          specs: true,
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

    await clickSelector(cdp, '[aria-label="Archive"]');

    const archivedChangeName = await clickExplorerItem(cdp, 'Archive', 0);
    state = await getState(cdp);

    assert(state.path === `/changes/${encodeURIComponent(archivedChangeName)}`, 'Archived change route should keep the full archived name');
    assert(state.activeTab === formatArchivedChangeName(archivedChangeName), 'Archived change tab label should hide the date prefix');

    console.log(JSON.stringify({
      ok: true,
      checks: [
        'home-tab-pinned',
        'tabbar-left-edge-inset',
        'archived-change-label-format',
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
