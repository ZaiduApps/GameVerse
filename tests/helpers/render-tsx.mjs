import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

/**
 * 把一个 .tsx 组件编译成 CommonJS 后在隔离上下文里渲染成静态 HTML。
 *
 * 目的：验收要求「组件真的能渲染出某个按钮/三条路径」，但仓库只有 node:test，
 * 没有 jsdom 与 babel。这里用 typescript 自带的 transpileModule 只做语法转换，
 * 渲染交给 react-dom/server；组件依赖（next/link、lucide-react、@/components/**）
 * 默认替换成占位组件，需要真实依赖时用 options.modules 显式注入。
 *
 * 限制：只适合纯展示 / 纯计算的组件（不模拟浏览器行为，useEffect 不会执行）。
 */
const stubCache = new Map();

function createStubComponent(name) {
  const Stub = ({ children, ...rest }) =>
    React.createElement(
      'div',
      { 'data-stub': name, 'data-href': typeof rest.href === 'string' ? rest.href : undefined },
      children,
    );
  Stub.displayName = `Stub(${name})`;
  return Stub;
}

function createStubModule(id) {
  if (stubCache.has(id)) return stubCache.get(id);

  const fallback = createStubComponent(id);
  const module = new Proxy(
    { __esModule: true, default: fallback },
    {
      get(target, prop) {
        if (prop in target) return target[prop];
        if (typeof prop !== 'string') return undefined;
        return createStubComponent(`${id}#${prop}`);
      },
    },
  );
  stubCache.set(id, module);
  return module;
}

export async function renderTsx(filePath, props = {}, options = {}) {
  const absolutePath = path.resolve(filePath);
  const source = await readFile(absolutePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    fileName: path.basename(absolutePath),
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;

  const jsxRuntime = await import('react/jsx-runtime');
  const modules = options.modules || {};
  const module = { exports: {} };

  const requireImpl = (id) => {
    if (Object.prototype.hasOwnProperty.call(modules, id)) return modules[id];
    if (id === 'react') return React;
    if (id === 'react/jsx-runtime') return jsxRuntime;
    return createStubModule(id);
  };

  const context = {
    require: requireImpl,
    module,
    exports: module.exports,
    process,
    console,
    setTimeout,
    clearTimeout,
    navigator: { userAgent: 'node-test', platform: 'node-test' },
  };
  vm.runInNewContext(compiled, context, { filename: absolutePath });

  const exported = module.exports;
  const Component = options.pick
    ? options.pick(exported)
    : exported.default || exported;
  if (typeof Component !== 'function') {
    throw new Error(`no renderable export in ${absolutePath}`);
  }
  return renderToStaticMarkup(React.createElement(Component, props));
}
