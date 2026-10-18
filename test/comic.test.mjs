import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderSpec } from '../skills/seecode/scripts/lib/render.mjs';
import { svgFromHtml } from '../skills/seecode/scripts/lib/export/svg.mjs';
import { contrast } from '../skills/seecode/scripts/lib/color.mjs';

const nodes = [{ id: 'a', label: 'Read the logs', icon: 'document', tag: '1', description: 'Keep useful evidence and investigate unusual events.' }];

test('comic default is consistent across graph geometry, page and SVG export', () => {
  const r = renderSpec({ type: 'flowchart', nodes });
  assert.equal(r.ok, true);
  assert.match(r.html, /class="sc-svg sc-illustrated sc-european-comic"/);
  assert.match(r.html, /class="sc-illustrated-page sc-comic-page"/);
  assert.match(r.result.body, /class="n-comic-shadow"/);
  assert.match(r.result.body, /class="n-comic-tail"/);
  assert.match(r.result.body, /class="n-comic-dots" aria-hidden="true"/);
  const svg = svgFromHtml(r.html);
  assert.match(svg, /--sc-paper:#fff7e5/);
  assert.match(svg, /#[\w-]+\.sc-svg\.sc-european-comic \.n-comic-shadow/);
  assert.doesNotMatch(svg, /#[\w-]+ \.sc-european-comic/);
  assert.match(r.html, /data-sc-motion="trace"/);
  assert.match(r.html, /prefers-reduced-motion/);
});

test('explicit old styles remain available and settings are subordinate to specs', () => {
  const r = renderSpec({ type: 'flowchart', style: 'illustrated', nodes }, { settings: { style: 'european-comic' } });
  assert.equal(r.ok, true);
  assert.doesNotMatch(r.result.body, /n-comic-shadow/);
  assert.match(svgFromHtml(r.html), /--sc-paper:#ffffff/);
  const configured = renderSpec({ type: 'flowchart', nodes }, { settings: { style: 'illustrated' } });
  assert.doesNotMatch(configured.result.body, /n-comic-shadow/);
});

test('comic backgrounds and badges preserve theme contrast and custom brand roles', () => {
  for (const skin of ['light', 'dark', 'terminal']) {
    const r = renderSpec({ type: 'architecture', style: 'european-comic', skin, nodes });
    for (const theme of ['light', 'dark']) {
      const svg = svgFromHtml(r.html, { theme });
      const accent = /--sc-accent:([^;]+);/.exec(svg)[1];
      const badge = /--sc-badge-ink:([^;]+);/.exec(svg)[1];
      const paper = /--sc-paper:([^;]+);/.exec(svg)[1];
      const ink = /--sc-ink:([^;]+);/.exec(svg)[1];
      assert.ok(contrast(badge, accent) >= 4.5);
      assert.ok(contrast(ink, paper) >= 4.5);
    }
  }
  const branded = renderSpec({ type: 'flowchart', nodes }, { settings: { brand: { paper: '#eeeeee', ink: '#111111', accent: '#117733' } } });
  assert.match(svgFromHtml(branded.html), /--sc-paper:#eeeeee/);
  assert.match(svgFromHtml(branded.html), /--sc-accent:#117733/);
});

test('comic example routes cleanly and decorations stay inside measured cards', () => {
  const spec = JSON.parse(readFileSync(new URL('../examples/styles/windows-monitoring-comic.json', import.meta.url), 'utf8'));
  const r = renderSpec(spec);
  assert.equal(r.ok, true);
  assert.deepEqual(r.result.problems.filter((p) => !p.code.startsWith('I_')), []);
  const b = r.result.body;
  const shadow = /class="n-comic-shadow" x="([\d.-]+)" y="([\d.-]+)" width="([\d.]+)" height="([\d.]+)"/.exec(b);
  const box = /class="n-box" x="([\d.-]+)" y="([\d.-]+)" width="([\d.]+)" height="([\d.]+)"/.exec(b);
  assert.equal(+shadow[1], +box[1] + 4);
  assert.equal(+shadow[2], +box[2] + 4);
  assert.equal(+shadow[3], +box[3]);
  for (const shape of ['decision', 'terminal', 'io', 'entity', 'class', 'start', 'end']) {
    const special = [{ id: 'x', label: 'Check', shape }];
    const comic = renderSpec({ type: 'flowchart', style: 'european-comic', nodes: special });
    const old = renderSpec({ type: 'flowchart', style: 'illustrated', nodes: special });
    assert.equal(comic.result.body, old.result.body, shape);
  }
});
