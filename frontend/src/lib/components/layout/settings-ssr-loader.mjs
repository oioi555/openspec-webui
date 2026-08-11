/**
 * Test-only ESM loader that lets the node --test runner import Svelte 5
 * components so `svelte/server` `render()` can be exercised without a DOM.
 *
 * The standard test runner (`node --import tsx --test`) cannot load `.svelte`
 * files, so this loader registers itself from the render tests via
 * `node:module` `register()` and:
 *  - compiles `.svelte` components for server rendering (`generate: 'server'`),
 *  - compiles `.svelte.ts` rune modules via `compileModule`,
 *  - maps `$lib/...` aliases and resolves extensionless specifiers the way the
 *    Vite bundler does for the real app.
 *
 * Uses only existing dependencies (`svelte/compiler`) and Node built-ins.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { transformSync } from 'esbuild';
import { compile, compileModule } from 'svelte/compiler';

// frontend/src/lib/... — the `$lib` alias root (this file lives in .../layout/).
const LIB_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const EXTENSION_CANDIDATES = ['.ts', '.js', '.svelte', '.svelte.ts', '/index.ts'];

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function resolveWithExtensions(basePath) {
  if (isFile(basePath)) {
    return basePath;
  }
  for (const ext of EXTENSION_CANDIDATES) {
    const candidate = `${basePath}${ext}`;
    if (isFile(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Resolve a bare specifier whose package exports only a `svelte` condition
 * (e.g. `runed`, consumed by `svelte-sonner`). Bundlers supply that condition;
 * Node ESM does not, so without this fallback the import fails with
 * `ERR_PACKAGE_PATH_NOT_EXPORTED` / "No exports main defined".
 */
function resolveSvelteConditionPackage(specifier, parentURL) {
  if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.includes('file:')) {
    return null;
  }
  const parts = specifier.split('/');
  const packageName = parts[0].startsWith('@') ? `${parts[0]}/${parts[1] ?? ''}` : parts[0];
  const subpath = specifier.slice(packageName.length); // '' or '/sub/path'
  const exportsKey = subpath === '' ? '.' : subpath;

  let dir = dirname(fileURLToPath(new URL(parentURL)));
  for (;;) {
    const packageDir = join(dir, 'node_modules', packageName);
    const packageJsonPath = join(packageDir, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        const entry = packageJson.exports?.[exportsKey];
        if (typeof entry === 'string') {
          return pathToFileURL(join(packageDir, entry)).href;
        }
        if (entry && typeof entry === 'object') {
          for (const condition of ['svelte', 'import', 'module', 'default', 'node']) {
            const target = entry[condition];
            if (typeof target === 'string') {
              return pathToFileURL(join(packageDir, target)).href;
            }
          }
        }
      } catch {
        // fall through to the next ancestor node_modules
      }
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

export async function resolve(specifier, context, nextResolve) {
  // Map `$lib` aliases and extensionless specifiers to real file URLs.
  // `shortCircuit: true` terminates the chain so the built-in resolver never
  // re-resolves the raw alias specifier and fails.
  if (specifier === '$lib' || specifier.startsWith('$lib/')) {
    const relative = specifier.slice('$lib'.length).replace(/^\//, '');
    const resolved = resolveWithExtensions(join(LIB_ROOT, relative));
    if (resolved) {
      return { url: pathToFileURL(resolved).href, shortCircuit: true };
    }
  } else if (specifier.startsWith('.')) {
    // Extensionless relative imports inside compiled Svelte code.
    const parentDir = dirname(fileURLToPath(new URL(context.parentURL)));
    const resolved = resolveWithExtensions(join(parentDir, specifier));
    if (resolved) {
      return { url: pathToFileURL(resolved).href, shortCircuit: true };
    }
  }

  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    // Node ESM cannot apply the `svelte` export condition used by some
    // Svelte-component packages; fall back to a manual resolution.
    const url = resolveSvelteConditionPackage(specifier, context.parentURL);
    if (url) {
      return { url, shortCircuit: true };
    }
    throw error;
  }
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.svelte')) {
    const source = await readFile(new URL(url), 'utf8');
    try {
      const result = compile(source, { generate: 'server', dev: false, filename: url });
      return { format: 'module', source: result.js.code, shortCircuit: true };
    } catch (error) {
      throw new Error(`[settings-ssr-loader] failed to compile ${url}: ${error.message}`);
    }
  }

  if (url.endsWith('.svelte.ts') || url.endsWith('.svelte.js')) {
    const source = await readFile(new URL(url), 'utf8');
    try {
      // `compileModule` parses plain JS; strip TypeScript first with esbuild
      // (an existing dependency) so inline `type` imports and annotations do
      // not trip the Svelte parser.
      const stripped = transformSync(source, { loader: 'ts', format: 'esm', target: 'es2022' }).code;
      const result = compileModule(stripped, { generate: 'client', dev: false, filename: url });
      const code = result.js?.code ?? result.code;
      return { format: 'module', source: code, shortCircuit: true };
    } catch (error) {
      throw new Error(`[settings-ssr-loader] failed to compile module ${url}: ${error.message}`);
    }
  }

  return nextLoad(url, context);
}
