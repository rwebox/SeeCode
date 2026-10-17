import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderSpec } from '../skills/seecode/scripts/lib/render.mjs';
import { svgFromHtml } from '../skills/seecode/scripts/lib/export/svg.mjs';
import { sizeNode } from '../skills/seecode/scripts/lib/render/shared/nodes.mjs';
import { textWidth } from '../skills/seecode/scripts/lib/text.mjs';
import { skinCss } from '../skills/seecode/scripts/lib/tokens.mjs';
import { contrast } from '../skills/seecode/scripts/lib/color.mjs';

const spec = { type: 'flowchart', nodes: [{ id: 'a', label: 'Read event logs', tag: '3', icon: 'document', description: 'Keep server, time, provider, event ID and message.' }] };

test('style precedence is shared by graph layout, HTML and exported SVG', () => {
  const r = renderSpec(spec);
  assert.equal(r.ok, true);
  assert.match(r.html, /class="sc-svg sc-illustrated"/);
  assert.match(r.html, /class="n-step-number"[^>]*>3<\/text>/);
  assert.match(r.html, /class="n-description-band"/);
  assert.match(r.html, /data-sc-description="Keep server, time, provider, event ID and message\."/);
  const svg = svgFromHtml(r.html);
  assert.match(svg, /class="sc-svg sc-still sc-illustrated"/);
  assert.match(svg, /--sc-paper:#ffffff/);
  assert.match(svg, /--sc-font-sans:Arial/);
  assert.match(svg, /--sc-accent:#0070c9/);
  assert.match(svg, /#[\w-]+\.sc-svg\.sc-illustrated \.n-description-band/);
  assert.doesNotMatch(svg, /#[\w-]+ \.sc-illustrated/);
  assert.match(svgFromHtml(r.html, { theme: 'dark' }), /--sc-paper:#1a1a1a/);
  const compact = { ...spec, nodes: [{ id: 'a', label: 'Read logs', tag: '3' }] };
  const clean = renderSpec(compact, { settings: { style: 'clean' } });
  assert.doesNotMatch(clean.html, /class="sc-svg sc-illustrated"/);
  const override = renderSpec({ ...compact, style: 'illustrated' }, { settings: { style: 'clean' } });
  assert.match(override.html, /class="sc-svg sc-illustrated"/);
  assert.match(renderSpec({ ...compact, style: 'sketchy' }).html, /class="sc-svg sc-sketchy"/);
});

test('wrapped card explanations preserve all text and fit inside the card', () => {
  for (const description of ['a'.repeat(500), 'Scan every server; keep unknown events and unusual spikes. '.repeat(6), '这是中文说明文字，检查日志并保存证据。'.repeat(12)]) {
    const n = sizeNode({ id: 'a', label: 'A'.repeat(40), tag: '12', description, illustrated: true });
    assert.ok(n.descriptionLines.every((line) => textWidth(line, { size: 12 }) <= n.w - 44));
    assert.equal(n.descriptionLines.join('').replace(/\s/g, ''), description.replace(/\s/g, ''));
    assert.ok(n.lines.every((line) => textWidth(line, { size: 17, weight: 700 }) <= n.w - 78));
    assert.ok(n.h >= n.cardHead + n.cardBand + 12);
  }
});

test('special shapes keep compact metrics and descriptions fail visibly outside cards', () => {
  for (const shape of ['decision', 'terminal', 'io', 'start', 'end', 'entity', 'class', 'state']) {
    const nodes = [{ id: 'a', label: 'Check', shape, sub: 'Short note' }];
    const a = renderSpec({ type: 'flowchart', style: 'illustrated', nodes });
    const b = renderSpec({ type: 'flowchart', style: 'clean', nodes });
    assert.equal(a.ok, true);
    assert.equal(a.result.body, b.result.body, shape);
  }
  const r = renderSpec({ ...spec, style: 'clean' });
  assert.equal(r.ok, false);
  assert.equal(r.problems[0].code, 'E_DESCRIPTION');
});

test('monitoring reference renders without routing warnings and keeps all five steps', () => {
  const demo = JSON.parse(readFileSync(new URL('../examples/styles/windows-monitoring.json', import.meta.url), 'utf8'));
  const r = renderSpec(demo);
  assert.equal(r.ok, true, JSON.stringify(r.problems));
  assert.deepEqual(r.result.problems.filter((p) => !p.code.startsWith('I_')), []);
  assert.equal((r.html.match(/class="n-step-number"/g) || []).length, 5);
  assert.equal((r.html.match(/class="n-description-band"/g) || []).length, 7);
  assert.match(r.html, /data-sc-motion="trace"/);
  assert.match(r.html, /data-sc-action="replay"/);
});

test('badges stay readable across themes and custom brand accents', () => {
  for (const skin of ['light', 'dark', 'terminal']) {
    for (const brand of [{}, { accent: '#ffeeaa' }, { accent: '#001155' }]) {
      const css = skinCss({ skin, brand, style: 'illustrated' });
      for (const root of css.matchAll(/:root[^{}]*\{([^}]+)\}/g)) {
        const accent = /--sc-accent:([^;]+);/.exec(root[1])[1];
        const foreground = /--sc-badge-ink:([^;]+);/.exec(root[1])[1];
        assert.ok(contrast(foreground, accent) >= 4.5, `${skin}: ${foreground} on ${accent}`);
      }
    }
  }
});

test('wide group headings fit their group and stay inside exported bounds', () => {
  const r = renderSpec({ type: 'flowchart', groups: [{ id: 'g', label: 'W'.repeat(32), style: 'dashed' }], nodes: [{ id: 'a', label: 'A', group: 'g' }] });
  assert.equal(r.ok, true);
  const body = r.result.body;
  const width = Number(/class="g-box g-dashed"[^>]*width="([\d.]+)"/.exec(body)[1]);
  const label = /class="g-label-bg" x="([\d.-]+)" y="([\d.-]+)" width="([\d.]+)"/.exec(body);
  assert.ok(Number(label[3]) <= width - 24);
  const [x, , w] = r.result.viewBox;
  assert.ok(Number(label[1]) + Number(label[3]) <= x + w);
});
