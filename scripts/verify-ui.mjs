#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';

const APP_URL = 'http://127.0.0.1:3003/';
const DEVTOOLS_LIST_URL = 'http://127.0.0.1:9222/json/list';
const PROJECT_DOC_PATH = new URL('../openspec/project.md', import.meta.url);
const LIVE_REFRESH_SENTINEL = `- LIVE REFRESH SENTINEL ${Date.now()}`;

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

  async setViewport(width, height = 900) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(500);
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
    throw new Error('Could not find Chrome DevTools page target for OpenSpec WebUI');
  }

  return page.webSocketDebuggerUrl;
}

function pageExpression(source) {
  return `(${source})()`;
}

async function clickSelector(cdp, selector) {
  const ok = await cdp.evaluate(pageExpression(() => {
    const el = document.querySelector('__SELECTOR__');
    if (!(el instanceof HTMLElement)) {
      return false;
    }

    el.click();
    return true;
  }).replace('__SELECTOR__', selector.replaceAll('\\', '\\\\').replaceAll("'", "\\'")));

  if (!ok) {
    throw new Error(`Selector not clickable: ${selector}`);
  }

  await sleep(250);
}

async function clickByText(cdp, selector, text) {
  const expression = pageExpression(() => {
    const nodes = [...document.querySelectorAll('__SELECTOR__')];
    const target = nodes.find((node) => node.textContent?.includes('__TEXT__'));
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    target.click();
    return true;
  })
    .replace('__SELECTOR__', selector.replaceAll('\\', '\\\\').replaceAll("'", "\\'"))
    .replace('__TEXT__', text.replaceAll('\\', '\\\\').replaceAll("'", "\\'"));

  const ok = await cdp.evaluate(expression);
  if (!ok) {
    throw new Error(`Could not click text '${text}' within ${selector}`);
  }

  await sleep(250);
}

async function typeIntoSearch(cdp, value) {
  const expression = pageExpression(() => {
    const input = [...document.querySelectorAll('input')].find((node) => node instanceof HTMLInputElement && node.placeholder === 'Search workspace...');
    if (!(input instanceof HTMLInputElement)) {
      return false;
    }

    input.value = '__VALUE__';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }).replace('__VALUE__', value.replaceAll('\\', '\\\\').replaceAll("'", "\\'"));

  const ok = await cdp.evaluate(expression);
  if (!ok) {
    throw new Error('Search input not found');
  }
}

async function installPageHarness(cdp) {
  await cdp.evaluate(pageExpression(() => {
    window.__copied = [];
    const clipboard = {
      writeText: async (text) => {
        window.__copied.push(text);
      },
    };

    try {
      Object.defineProperty(navigator, 'clipboard', {
        value: clipboard,
        configurable: true,
      });
    } catch {
      navigator.clipboard = clipboard;
    }

    return true;
  }));
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
    const explorer = [...document.querySelectorAll('aside')].find((node) => node.textContent?.includes('Workspace'));
    const tabNames = [...document.querySelectorAll('[role="tab"]')].map((node) => node.textContent?.trim()).filter(Boolean);
    const activeTab = document.querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim() ?? null;
    const tabs = [...document.querySelectorAll('[role="tab"]')].map((node) => {
      const name = node.textContent?.trim() ?? null;
      const group = node.closest('div.flex.items-stretch');

      return {
        name,
        pinnedHome: Boolean(group?.querySelector('[aria-label="Pinned Dashboard tab"]')),
        closeVisible: Boolean(group?.querySelector('button[aria-label="Close tab"]')),
        pinToggleVisible: Boolean(group?.querySelector('button[aria-label="Pin tab"], button[aria-label="Unpin tab"]')),
      };
    });
    const homeTab = tabs.find((tab) => tab.name === 'Dashboard') ?? null;

    const sectionState = (label) => {
      if (!explorer) {
        return null;
      }
      const trigger = [...explorer.querySelectorAll('button')].find((node) => node.textContent?.includes(label));
      return trigger?.closest('[data-state]')?.getAttribute('data-state') ?? null;
    };

    const explorerPanelStyle = document.querySelector('[data-direction="horizontal"] > div[style*="flex-basis"]')?.getAttribute('style') ?? null;

    return {
      path: location.pathname,
      tabNames,
      activeTab,
      homeTabCount: tabs.filter((tab) => tab.name === 'Dashboard').length,
      homeTabPinned: homeTab?.pinnedHome ?? false,
      homeTabCloseVisible: homeTab?.closeVisible ?? false,
      homeTabPinToggleVisible: homeTab?.pinToggleVisible ?? false,
      explorerVisible: Boolean(explorer),
      activeChangesState: sectionState('Active Changes'),
      archiveState: sectionState('Archive'),
      specsState: sectionState('Specs'),
      explorerPanelStyle,
      copied: window.__copied?.at(-1) ?? null,
      suggestionMode: Boolean(document.querySelector('.suggestion-mode')),
      suggestionPanelVisible: Boolean([...document.querySelectorAll('h2')].find((node) => node.textContent?.trim() === 'Suggestions')),
      themeAttr: document.documentElement.getAttribute('data-theme'),
      storedTheme: localStorage.getItem('openspec-theme'),
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      drawerCloseVisible: Boolean(document.querySelector('[aria-label="Close explorer"]')),
      expandExplorerVisible: Boolean(document.querySelector('[aria-label="Expand explorer"]')),
      searchDialogVisible: Boolean(document.querySelector('input[placeholder="Search workspace..."]')),
      projectDocIncludesSentinel: document.body.textContent?.includes('__SENTINEL__') ?? false,
    };
  }).replace('__SENTINEL__', LIVE_REFRESH_SENTINEL.replaceAll('\\', '\\\\').replaceAll("'", "\\'"));
}

async function getState(cdp) {
  return cdp.evaluate(getStateExpression());
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
    .replace('__LABEL__', sectionLabel.replaceAll('\\', '\\\\').replaceAll("'", "\\'"))
    .replace('__INDEX__', String(index));

  const name = await cdp.evaluate(expression);
  if (!name) {
    throw new Error(`Could not open explorer item from section ${sectionLabel}`);
  }

  await sleep(300);
  return name;
}

async function clickActiveTabAction(cdp, label) {
  const expression = pageExpression(() => {
    const activeTab = document.querySelector('[role="tab"][aria-selected="true"]');
    const group = activeTab?.closest('div.flex.items-stretch');
    const button = group?.querySelector(`button[aria-label="${'__LABEL__'}"]`);
    if (!(button instanceof HTMLElement)) {
      return false;
    }

    button.click();
    return true;
  }).replace('__LABEL__', label.replaceAll('\\', '\\\\').replaceAll("'", "\\'"));

  const ok = await cdp.evaluate(expression);
  if (!ok) {
    throw new Error(`Could not click active tab action: ${label}`);
  }
  await sleep(300);
}

async function setTheme(cdp, labelText) {
  const expression = pageExpression(() => {
    const label = [...document.querySelectorAll('label')].find((node) => node.textContent?.includes('__TEXT__'));
    if (!(label instanceof HTMLElement)) {
      return false;
    }

    label.click();
    return true;
  }).replace('__TEXT__', labelText.replaceAll('\\', '\\\\').replaceAll("'", "\\'"));

  const ok = await cdp.evaluate(expression);
  if (!ok) {
    throw new Error(`Theme option not found: ${labelText}`);
  }
  await sleep(250);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const wsUrl = await getPageWebSocketUrl();
  const cdp = new CDPClient(wsUrl);
  await cdp.connect();

  const results = [];

  try {
    await cdp.navigate(APP_URL);

    await cdp.evaluate(pageExpression(() => {
      localStorage.setItem('openspec-layout', JSON.stringify({
        explorerCollapsed: false,
        rememberedExplorerWidth: 320,
        sectionCollapsed: {
          'active-changes': false,
          archive: true,
          specs: true,
        },
      }));

      return true;
    }));

    await cdp.reload();
    await installPageHarness(cdp);

    let state = await getState(cdp);
    assert(state.path === '/', 'Dashboard route should load by default');
    assert(state.activeTab === 'Dashboard', 'Dashboard tab should be active by default');
    assert(state.homeTabCount === 1, 'Dashboard tab should be present exactly once');
    assert(state.homeTabPinned && !state.homeTabCloseVisible, 'Dashboard tab should be pinned and not closable');
    assert(!state.homeTabPinToggleVisible, 'Dashboard tab should not expose pin or unpin actions');
    assert(state.activeChangesState === 'open', 'Active Changes section should be open by default');
    assert(state.archiveState === 'closed' && state.specsState === 'closed', 'Archive and Specs should be collapsed on Dashboard');
    assert(state.explorerPanelStyle?.includes('320px'), 'Explorer should honor remembered width');
    results.push('home-default');

    await clickSelector(cdp, '[aria-label="Dashboard"]');
    state = await getState(cdp);
    assert(!state.explorerVisible && !state.expandExplorerVisible, 'Explorer should collapse fully without a standalone expand button');
    await clickSelector(cdp, '[aria-label="Dashboard"]');
    state = await getState(cdp);
    assert(state.explorerVisible && state.activeTab === 'Dashboard' && state.explorerPanelStyle?.includes('320px'), 'Dashboard should restore explorer width when re-clicked');
    results.push('explorer-collapse-restore');

    await clickSelector(cdp, '[title="Copy /opsx-propose"]');
    state = await getState(cdp);
    assert(state.copied === '/opsx-propose', 'Workspace command shortcut should copy command text');
    results.push('command-shortcut-copy');

    const initialTabNames = [...state.tabNames];
    await clickSelector(cdp, '[aria-label="Archive"]');
    state = await getState(cdp);
    assert(state.activeTab === 'Dashboard' && JSON.stringify(state.tabNames) === JSON.stringify(initialTabNames), 'Archive should not open or focus tabs');
    assert(state.archiveState === 'open' && state.activeChangesState === 'closed' && state.specsState === 'closed', 'Archive preset should focus archive without changing tabs');
    await clickSelector(cdp, '[aria-label="Archive"]');
    state = await getState(cdp);
    assert(!state.explorerVisible && !state.expandExplorerVisible, 'Re-clicking the active Archive button should collapse the explorer');
    await clickSelector(cdp, '[aria-label="Archive"]');
    state = await getState(cdp);
    assert(state.explorerVisible && state.archiveState === 'open', 'Clicking the active Archive button while collapsed should restore the explorer');
    assert(state.activeTab === 'Dashboard' && JSON.stringify(state.tabNames) === JSON.stringify(initialTabNames), 'Restoring Archive should still avoid tab changes');
    await clickSelector(cdp, '[aria-label="Specs"]');
    state = await getState(cdp);
    assert(state.activeTab === 'Dashboard' && JSON.stringify(state.tabNames) === JSON.stringify(initialTabNames), 'Specs should not open or focus tabs');
    assert(state.specsState === 'open' && state.activeChangesState === 'closed' && state.archiveState === 'closed', 'Specs preset should focus specs section without changing tabs');
    results.push('activity-bar-presets');

    await clickSelector(cdp, '[aria-label="Dashboard"]');

    const activeChangeName = await clickExplorerItem(cdp, 'Active Changes');
    state = await getState(cdp);
    assert(state.path === `/changes/${encodeURIComponent(activeChangeName)}`, 'Active change should open in a tab');
    assert(state.tabNames.includes(activeChangeName), 'Opened active change should appear in tab list');
    results.push('change-browse');

    await clickByText(cdp, 'button', 'Suggest');
    state = await getState(cdp);
    assert(state.suggestionMode && state.suggestionPanelVisible, 'Suggestion mode should show right sidebar');
    await clickSelector(cdp, '[title="Exit suggestion mode"]');
    state = await getState(cdp);
    assert(!state.suggestionMode && !state.suggestionPanelVisible, 'Suggestion sidebar should close');
    results.push('suggestion-sidebar');

    await clickSelector(cdp, '[aria-label="Specs"]');
    state = await getState(cdp);
    assert(state.specsState === 'open' && state.activeChangesState === 'closed' && state.archiveState === 'closed', 'Specs preset should focus specs section');
    const specName = await clickExplorerItem(cdp, 'Specs');
    state = await getState(cdp);
    assert(state.path === `/specs/${encodeURIComponent(specName)}`, 'Spec item should open spec tab');
    assert(state.tabNames.includes(specName), 'Opened spec should appear in tab list');
    results.push('spec-browse');

    const tabNamesBeforeHomeFocus = [...state.tabNames];
    await clickSelector(cdp, '[aria-label="Dashboard"]');
    state = await getState(cdp);
    assert(state.path === '/' && state.activeTab === 'Dashboard', 'Dashboard activity button should focus the existing Dashboard tab');
    assert(state.homeTabCount === 1 && JSON.stringify(state.tabNames) === JSON.stringify(tabNamesBeforeHomeFocus), 'Dashboard activity button should reuse the existing Dashboard tab');
    assert(state.activeChangesState === 'open' && state.archiveState === 'closed' && state.specsState === 'closed', 'Dashboard activity button should restore the Dashboard explorer preset');
    results.push('home-focus-existing-tab');

    await clickByText(cdp, '[role="tab"]', specName);
    state = await getState(cdp);
    assert(state.path === `/specs/${encodeURIComponent(specName)}`, 'Clicking existing spec tab should focus it');
    await clickActiveTabAction(cdp, 'Pin tab');
    state = await getState(cdp);
    assert(state.tabNames[0] === 'Dashboard' && state.tabNames[1] === specName, 'Pinned tab should move into the left pinned group after Dashboard');
    await clickActiveTabAction(cdp, 'Unpin tab');
    await clickActiveTabAction(cdp, 'Close tab');
    state = await getState(cdp);
    assert(!state.tabNames.includes(specName), 'Closing tab should remove it from the tab bar');
    results.push('tab-open-focus-pin-close');

    await cdp.navigate(`${APP_URL}specs/${encodeURIComponent(specName)}`);
    await installPageHarness(cdp);
    state = await getState(cdp);
    assert(state.path === `/specs/${encodeURIComponent(specName)}` && state.tabNames.includes(specName), 'Direct URL access should open corresponding tab');
    assert(state.tabNames.includes('Dashboard') && state.homeTabPinned && !state.homeTabCloseVisible && !state.homeTabPinToggleVisible, 'Direct URL access should keep the pinned Dashboard tab present');
    await cdp.navigate(APP_URL);
    await installPageHarness(cdp);
    results.push('direct-url-tab-open');

    await clickSelector(cdp, '[aria-label="Search"]');
    state = await getState(cdp);
    assert(state.searchDialogVisible, 'Search dialog should open from Activity Bar');
    const searchQuery = 'persistent vertical control strip';
    const searchResultName = 'activity-bar';
    await typeIntoSearch(cdp, searchQuery);
    await waitFor(
      cdp,
      pageExpression(() => [...document.querySelectorAll('button')].some((node) => node.textContent?.includes('__RESULT_NAME__'))).replace('__RESULT_NAME__', searchResultName.replaceAll('\\', '\\\\').replaceAll("'", "\\'")),
      'search results for stable spec',
      6000,
      250,
    );
    await clickByText(cdp, '[role="dialog"] button', searchResultName);
    state = await getState(cdp);
    assert(state.path === `/specs/${encodeURIComponent(searchResultName)}` && !state.searchDialogVisible, 'Selecting a search result should open a tab and close search');
    results.push('search-open-result');

    await clickSelector(cdp, '[aria-label="Settings"]');
    await setTheme(cdp, 'Light');
    state = await getState(cdp);
    const lightBackground = state.bodyBackground;
    assert(state.themeAttr === 'light' && state.storedTheme === 'light', 'Light theme should apply and persist');
    await setTheme(cdp, 'Dark');
    state = await getState(cdp);
    const darkBackground = state.bodyBackground;
    assert(state.themeAttr === 'dark' && state.storedTheme === 'dark', 'Dark theme should apply and persist');
    assert(lightBackground !== darkBackground, 'Light and dark themes should render different backgrounds');
    await setTheme(cdp, 'System');
    state = await getState(cdp);
    assert(state.themeAttr === null && state.storedTheme === 'system', 'System theme should remove explicit data-theme and persist');
    await clickSelector(cdp, '[aria-label="Close settings"]');
    results.push('theme-switching');

    await cdp.setViewport(700, 900);
    state = await getState(cdp);
    assert(!state.explorerVisible, 'Persistent explorer should hide in narrow mode');
    await clickSelector(cdp, '[aria-label="Dashboard"]');
    state = await getState(cdp);
    assert(state.drawerCloseVisible && state.activeChangesState === 'open', 'Dashboard should open narrow explorer drawer with Active Changes focused');
    assert(await cdp.evaluate(pageExpression(() => !!document.querySelector('[title="Copy /opsx-propose"]'))), 'Narrow Dashboard drawer should include workspace command shortcuts');
    await clickSelector(cdp, '[aria-label="Close explorer"]');
    await clickSelector(cdp, '[aria-label="Archive"]');
    state = await getState(cdp);
    assert(state.drawerCloseVisible && state.archiveState === 'open', 'Archive should open narrow explorer drawer with Archive focused');
    await clickSelector(cdp, '[aria-label="Close explorer"]');
    await clickSelector(cdp, '[aria-label="Specs"]');
    state = await getState(cdp);
    assert(state.drawerCloseVisible && state.specsState === 'open', 'Specs should open narrow explorer drawer with Specs focused');
    await clickSelector(cdp, '[aria-label="Close explorer"]');
    await cdp.setViewport(1400, 900);
    await clickSelector(cdp, '[aria-label="Dashboard"]');
    results.push('responsive-drawer');

    const originalProjectDoc = await readFile(PROJECT_DOC_PATH, 'utf8');
    try {
      await writeFile(PROJECT_DOC_PATH, `${originalProjectDoc.trimEnd()}\n${LIVE_REFRESH_SENTINEL}\n`, 'utf8');
      await waitFor(
        cdp,
        pageExpression(() => document.body.textContent?.includes('__SENTINEL__') ?? false).replace('__SENTINEL__', LIVE_REFRESH_SENTINEL.replaceAll('\\', '\\\\').replaceAll("'", "\\'")),
        'project doc sentinel appears',
        8000,
        250,
      );
    } finally {
      await writeFile(PROJECT_DOC_PATH, originalProjectDoc, 'utf8');
    }

    await waitFor(
      cdp,
      pageExpression(() => !document.body.textContent?.includes('__SENTINEL__')).replace('__SENTINEL__', LIVE_REFRESH_SENTINEL.replaceAll('\\', '\\\\').replaceAll("'", "\\'")),
      'project doc sentinel disappears',
      8000,
      250,
    );
    results.push('live-refresh');

    console.log(JSON.stringify({ ok: true, results }, null, 2));
  } finally {
    await cdp.close();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
