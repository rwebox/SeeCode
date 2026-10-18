// Node box sizing + drawing shared by graph, tree and lane renderers.
// Shapes: box (default), decision, terminal, io, store, state, start, end,
// entity (ER / db-schema table), class (UML compartments).
import { el, text } from '../../svg.mjs';
import { textWidth, ceil4, wrap } from '../../text.mjs';
import { TYPE } from '../../tokens.mjs';
import { hasIcon, drawIcon, ICON_ROOM, ICON_SIZE } from './icons.mjs';

const LABEL = { size: TYPE.label, weight: 600 };
const SUB = { size: TYPE.sub, mono: true };
const TAG = { size: TYPE.tag, mono: true, tracking: 0.12, upper: true };
const FIELD = { size: 10 };
const FTYPE = { size: 9, mono: true };
const ROW_H = 18;
const HEAD_H = 30;

// Illustrated boxes reserve their own text metrics. Special shapes and the
// other renderer families continue using the compact layout below.
function cardWrap(value, width, options) {
  return wrap(value, width, options).flatMap((line) => {
    if (textWidth(line, options) <= width) return [line];
    const lines = []; let part = '';
    for (const char of line) {
      if (part && textWidth(part + char, options) > width) { lines.push(part); part = ''; }
      part += char;
    }
    if (part) lines.push(part);
    return lines;
  });
}

function sizeCard(n) {
  n.w = 288;
  n.badge = /^\d{1,2}$/.test(n.tag || '');
  n.lines = cardWrap(n.label, n.w - (n.badge ? 78 : 32), { size: 17, weight: 700 });
  n.cardHead = Math.max(56, n.lines.length * 23 + 24) + (n.tag && !n.badge ? 18 : 0);
  n.descriptionLines = n.description || n.sub ? cardWrap(n.description || n.sub, n.w - 44, { size: 12 }) : [];
  n.cardBand = n.descriptionLines.length ? n.descriptionLines.length * 17 + 20 : 0;
  n.h = ceil4(n.cardHead + (hasIcon(n) ? 84 : 0) + n.cardBand + 12);
  return n;
}

function drawCard(n, parts) {
  const { x, y, w } = n;
  let titleY = y + 32;
  if (n.badge) {
    parts.push(el('circle', { class: 'n-step-badge', cx: x + 30, cy: y + 29, r: 18 }));
    parts.push(text({ class: 'n-step-number', x: x + 30, y: y + 36, 'text-anchor': 'middle' }, n.tag));
  }
  for (const line of n.lines) {
    parts.push(text({ class: 'n-label', x: x + (n.badge ? 60 : 16), y: titleY }, line));
    titleY += 23;
  }
  if (n.tag && !n.badge) parts.push(text({ class: 'n-tag', x: x + 16, y: titleY - 4 }, n.tag));
  if (hasIcon(n)) {
    if (n.comic) {
      const dots = [];
      for (const left of [x + 22, x + w - 54]) {
        for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) {
          dots.push(el('circle', { cx: left + c * 8 + (r % 2 ? 2 : 0), cy: y + n.cardHead + 12 + r * 8, r: 1 }));
        }
      }
      parts.push(el('g', { class: 'n-comic-dots', 'aria-hidden': 'true' }, dots));
    }
    parts.push(drawIcon(n.icon, x + w / 2 - 32, y + n.cardHead + 6, 64));
  }
  if (n.cardBand) {
    const by = y + n.h - n.cardBand - 8;
    if (n.comic) parts.push(el('path', { class: 'n-comic-tail', d: `M${x + 30},${by + 1} L${x + 34},${by - 6} L${x + 42},${by + 1} Z`, 'aria-hidden': 'true' }));
    parts.push(el('rect', { class: 'n-description-band', x: x + 8, y: by, width: w - 16, height: n.cardBand, rx: 5 }));
    n.descriptionLines.forEach((line, i) => parts.push(text({ class: 'n-description', x: x + 22, y: by + 22 + i * 17 }, line)));
  }
}

export const MIN_W = 112;
export const MAX_W = 220;
export const POINT_SHAPES = new Set(['decision', 'start', 'end']);

export function normalizeKind(n) {
  if (n.focal) return 'focal';
  return n.kind || 'backend';
}

// "user_id FK uuid" | "email: text UQ" | ["id","uuid","PK"] → {name,type,key}
export function parseField(f) {
  if (Array.isArray(f)) return { name: String(f[0]), type: f[1] ? String(f[1]) : '', key: f[2] ? String(f[2]).toUpperCase() : '' };
  const toks = String(f).replace(':', ' ').split(/\s+/).filter(Boolean);
  const keys = toks.filter((t) => /^(PK|FK|UQ|NN|IDX)$/i.test(t)).map((t) => t.toUpperCase());
  const rest = toks.filter((t) => !/^(PK|FK|UQ|NN|IDX)$/i.test(t));
  return { name: rest[0] || '', type: rest.slice(1).join(' '), key: keys.join(' ') };
}

function tableRows(n) {
  if (n.shape === 'class') {
    const attrs = (n.attrs || []).map((a) => ({ text: String(a) }));
    const methods = (n.methods || []).map((m) => ({ text: String(m) }));
    return { sections: [attrs, methods] };
  }
  return { sections: [(n.fields || []).map(parseField)] };
}

// Measure a node: sets n.w, n.h, n.lines (wrapped label lines).
export function sizeNode(n, { minW = MIN_W, maxW = MAX_W } = {}) {
  const shape = n.shape || 'box';
  if (n.illustrated && shape === 'box') return sizeCard(n);
  if (shape === 'start' || shape === 'end') {
    n.w = n.h = shape === 'start' ? 20 : 24;
    n.lines = [];
    return n;
  }
  if (shape === 'entity' || shape === 'class') {
    const { sections } = tableRows(n);
    n.sections = sections;
    let inner = textWidth(n.label, LABEL) + (n.tag ? textWidth(n.tag, TAG) + 24 : 0);
    for (const s of sections) {
      for (const r of s) {
        const w = r.text !== undefined
          ? textWidth(r.text, FTYPE)
          : (r.key ? 24 : 0) + textWidth(r.name, FIELD) + (r.type ? textWidth(r.type, FTYPE) + 18 : 0);
        inner = Math.max(inner, w);
      }
    }
    n.headH = shape === 'class' && n.tag ? 42 : HEAD_H;
    if (shape === 'class') inner = Math.max(textWidth(n.label, LABEL), n.tag ? textWidth(n.tag, TAG) : 0, inner - (n.tag ? textWidth(n.tag, TAG) + 24 : 0));
    n.w = ceil4(Math.max(minW + 16, inner + 28));
    const rows = sections.reduce((s, sec) => s + Math.max(sec.length, shape === 'class' ? 1 : 0), 0);
    n.h = n.headH + rows * ROW_H + (sections.length - 1) * 6 + (rows ? 8 : 0);
    n.lines = [n.label];
    return n;
  }
  const room = hasIcon(n) ? ICON_ROOM : 0; // an icon sits left of the label
  const lw = textWidth(n.label, LABEL);
  let lines = [n.label];
  let inner = lw;
  if (lw > maxW - 32 - room) {
    lines = wrap(n.label, maxW - 32 - room, LABEL).slice(0, 2);
    inner = Math.max(...lines.map((l) => textWidth(l, LABEL)));
  }
  const sw = n.sub ? textWidth(n.sub, SUB) : 0;
  const tw = n.tag ? textWidth(n.tag, TAG) + 10 : 0;
  inner = Math.max(inner + room, sw + room, tw ? tw * 2 + 8 : 0);
  let w = ceil4(Math.max(minW, inner + 32));
  const extra = (lines.length - 1) * 15;
  let h = (n.tag ? 64 : n.sub ? 52 : 40) + extra;
  if (shape === 'decision') {
    w = ceil4(Math.max(128, inner * 1.5 + 40));
    h = ceil4(Math.max(72, w * 0.5)) + extra;
  } else if (shape === 'terminal') {
    w = ceil4(Math.max(96, inner + 40));
    h = n.sub ? 48 : 36;
  } else if (shape === 'io') {
    w = ceil4(Math.max(minW, inner + 48));
  } else if (shape === 'state') {
    w = ceil4(Math.max(96, inner + 36));
  }
  n.w = w;
  n.h = h;
  n.lines = lines;
  return n;
}

// y (absolute) of a named field row in an entity/class node, or null.
export function fieldY(n, name) {
  if (!n.sections) return null;
  let y = n.y + n.headH + 4;
  for (const sec of n.sections) {
    for (const r of sec) {
      if ((r.name || r.text) === name || (r.text && r.text.split(/[\s:(]/)[0] === name)) return y + ROW_H / 2;
      y += ROW_H;
    }
    y += 6;
  }
  return null;
}

function outline(n, cls) {
  const { x, y, w, h } = n;
  if (n.comic && (n.shape || 'box') === 'box') {
    return el('rect', { class: cls, x, y, width: w - 4, height: h - 4, rx: 3 });
  }
  switch (n.shape) {
    case 'decision':
      return el('path', { class: cls, d: `M${x + w / 2},${y} L${x + w},${y + h / 2} L${x + w / 2},${y + h} L${x},${y + h / 2} Z` });
    case 'terminal':
      return el('rect', { class: cls, x, y, width: w, height: h, rx: h / 2 });
    case 'io':
      return el('path', { class: cls, d: `M${x + 10},${y} L${x + w},${y} L${x + w - 10},${y + h} L${x},${y + h} Z` });
    case 'state':
      return el('rect', { class: cls, x, y, width: w, height: h, rx: 14 });
    case 'start':
    case 'end':
      return el('circle', { class: cls, cx: x + w / 2, cy: y + h / 2, r: w / 2 });
    default:
      return el('rect', { class: cls, x, y, width: w, height: h, rx: 6 });
  }
}

function drawTable(n, parts) {
  const { x, y, w } = n;
  const H = n.headH;
  parts.push(el('rect', { class: 'n-head', x: x + 0.5, y: y + 0.5, width: w - 1, height: H - 0.5, rx: 5.5 }));
  parts.push(el('line', { class: 'n-rule', x1: x, y1: y + H, x2: x + w, y2: y + H }));
  if (n.shape === 'class') {
    if (n.tag) parts.push(text({ class: 'n-tag', x: x + w / 2, y: y + 15, 'text-anchor': 'middle', style: 'text-transform:none' }, n.tag));
    parts.push(text({ class: 'n-label', x: x + w / 2, y: y + H - 10.5, 'text-anchor': 'middle' }, n.label));
  } else {
    if (n.tag) parts.push(text({ class: 'n-tag', x: x + 10, y: y + 18 }, n.tag));
    const tagW = n.tag ? textWidth(n.tag, TAG) + 16 : 0;
    parts.push(text({ class: 'n-label', x: x + 10 + tagW, y: y + 19.5 }, n.label));
  }
  let ry = y + H + 4;
  n.sections.forEach((sec, si) => {
    if (si > 0) {
      parts.push(el('line', { class: 'n-rule', x1: x, y1: ry + 2, x2: x + w, y2: ry + 2 }));
      ry += 6;
    }
    if (!sec.length && n.shape === 'class') ry += ROW_H;
    for (const r of sec) {
      const base = ry + 12.5;
      if (r.text !== undefined) {
        parts.push(text({ class: 'n-field-t', x: x + 10, y: base }, r.text));
      } else {
        let fx = x + 10;
        if (r.key) {
          const k = r.key.split(' ')[0];
          parts.push(text({ class: `n-key n-key-${k.toLowerCase()}`, x: fx, y: base }, k));
          fx += 24;
        }
        parts.push(text({ class: 'n-field', x: fx, y: base }, r.name));
        if (r.type) parts.push(text({ class: 'n-field-t', x: x + w - 10, y: base, 'text-anchor': 'end' }, r.type));
      }
      ry += ROW_H;
    }
  });
}

export function drawNode(n, { step, extraClass = '', attrs = {} } = {}) {
  const kind = normalizeKind(n);
  const parts = [];
  // Keep the offset shadow inside the node's measured routing bounds.
  if (n.comic) parts.push(el('rect', { class: 'n-comic-shadow', x: n.x + 4, y: n.y + 4, width: n.w - 4, height: n.h - 4, rx: 3, 'aria-hidden': 'true' }));
  if (n.shape !== 'start' && n.shape !== 'end') parts.push(outline(n, 'n-mask'));
  parts.push(outline(n, 'n-box'));
  const cx = n.x + n.w / 2;
  if (n.shape === 'end') parts.push(el('circle', { class: 'n-dot', cx, cy: n.y + n.h / 2, r: 6 }));
  else if (n.shape === 'start') {
    /* filled via .sh-start */
  } else if (n.shape === 'entity' || n.shape === 'class') {
    drawTable(n, parts);
  } else if (n.illustrated && (n.shape || 'box') === 'box') {
    drawCard(n, parts);
  } else {
    let top = n.y;
    if (n.tag) {
      const tw = textWidth(n.tag, TAG) + 10;
      parts.push(el('rect', { class: 'n-tag-box', x: n.x + 8, y: n.y + 8, width: tw, height: 12, rx: 2 }));
      parts.push(text({ class: 'n-tag', x: n.x + 8 + tw / 2, y: n.y + 17, 'text-anchor': 'middle' }, n.tag));
      top += 16;
    }
    const lines = n.lines || [n.label];
    const block = lines.length * 15 + (n.sub ? 14 : 0) - 3;
    const mid = top + (n.y + n.h - top) / 2;
    let y = mid - block / 2 + 11;
    // with an icon, icon + text are centred together as one group
    let tx = cx;
    if (hasIcon(n)) {
      const inner = Math.max(...lines.map((l) => textWidth(l, LABEL)), n.sub ? textWidth(n.sub, SUB) : 0);
      const left = cx - (ICON_ROOM + inner) / 2;
      parts.push(drawIcon(n.icon, left, mid - ICON_SIZE / 2));
      tx = left + ICON_ROOM + inner / 2;
    }
    for (const line of lines) {
      parts.push(text({ class: 'n-label', x: tx, y, 'text-anchor': 'middle' }, line));
      y += 15;
    }
    if (n.sub) parts.push(text({ class: 'n-sub', x: tx, y: y + 0.5, 'text-anchor': 'middle' }, n.sub));
  }
  if (n.status) parts.push(el('circle', { class: `n-status st-${n.status}`, cx: n.x + n.w - 9, cy: n.y + 9, r: 3.5 }));
  if (n.change === 'added') parts.push(text({ class: 'n-change', x: n.x + n.w - 8, y: n.y - 5, 'text-anchor': 'end' }, '+ NEW'));
  if (n.change === 'removed') parts.push(text({ class: 'n-change', x: n.x + n.w - 8, y: n.y - 5, 'text-anchor': 'end' }, '− REMOVED'));
  if (n.change === 'changed') parts.push(text({ class: 'n-change', x: n.x + n.w - 8, y: n.y - 5, 'text-anchor': 'end' }, '~ CHANGED'));
  const cls = ['sc-node', n.illustrated ? 'sc-card' : '', `k-${kind}`, `sh-${n.shape || 'box'}`, n.change ? `k-change ch-${n.change}` : '', extraClass].filter(Boolean).join(' ');
  return el('g', {
    class: cls,
    'data-sc-node': n.id,
    'data-sc-description': n.illustrated ? n.description || n.sub : undefined,
    'data-sc-step': step,
    style: step !== undefined ? `--step:${step}` : undefined,
    tabindex: 0,
    role: 'group',
    'aria-label': [n.label || n.shape, n.description || n.sub].filter(Boolean).join(', '),
    ...attrs,
  }, parts);
}
