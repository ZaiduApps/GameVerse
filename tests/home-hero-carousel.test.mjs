import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');

const carouselSource = await readSource('../src/components/home/HomeHeroCarousel.tsx');

// 渲染分支：{isHeroFirstSlide ? (原生 <img> 首帧) : (<Image> 非首帧)}
const firstSlideBranch = carouselSource.match(/\{isHeroFirstSlide \? \(([\s\S]*?)\) : \(/)?.[1] ?? '';
const otherSlideBranch = carouselSource.match(/\) : \(([\s\S]*?)\/>/)?.[1] ?? '';

test('轮播首帧 eager 高优先级，不懒加载（首页 LCP 元素）', () => {
  assert.ok(firstSlideBranch.includes('<img'), '首帧应是原生 img（携带 /media/variants 的 srcSet）');
  assert.match(firstSlideBranch, /loading="eager"/);
  assert.match(firstSlideBranch, /fetchPriority="high"/);
  assert.doesNotMatch(firstSlideBranch, /loading="lazy"/);
});

test('轮播非首帧保留 lazy，按需加载', () => {
  assert.match(otherSlideBranch, /<Image/);
  assert.match(otherSlideBranch, /loading="lazy"/);
});
