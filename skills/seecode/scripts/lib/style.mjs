// One resolver for layout, page chrome and exports. Other diagram families
// retain the compact editorial style; explicit choices always win.
export function resolveStyle(spec = {}, settings = {}) {
  const style = spec.style ?? settings.style;
  if (style && style !== 'auto') return style;
  return ['architecture', 'flowchart'].includes(spec.type) ? 'european-comic' : 'clean';
}

export const isCardStyle = (style) => ['illustrated', 'european-comic'].includes(style);

// Bande dessinée-inspired accents, scoped to the SVG so standalone exports
// keep the same ink, panel and printed-dot treatment. No remote assets.
export const COMIC_CSS = `
.sc-svg.sc-european-comic .sc-card .n-box{stroke-width:2.2;stroke-linejoin:round}
.sc-svg.sc-european-comic .sc-card.k-focal .n-box{stroke-width:2.4}
.sc-svg.sc-european-comic .n-comic-shadow{fill:var(--sc-ink);opacity:.82}
.sc-svg.sc-european-comic .n-comic-dots{fill:var(--sc-link);opacity:.24;pointer-events:none}
.sc-svg.sc-european-comic .sc-card .n-icon{stroke:var(--sc-link);stroke-width:1.65}
.sc-svg.sc-european-comic .sc-card .n-icon rect,.sc-svg.sc-european-comic .sc-card .n-icon ellipse{fill:var(--sc-paper-2)}
.sc-svg.sc-european-comic .n-description-band,.sc-svg.sc-european-comic .n-comic-tail{fill:var(--sc-paper-2);stroke:var(--sc-ink);stroke-width:1.15;stroke-linejoin:round}
.sc-svg.sc-european-comic .n-step-badge{stroke:var(--sc-ink);stroke-width:1.4}
.sc-svg.sc-european-comic .e-line{stroke-width:2}
.sc-svg.sc-european-comic .g-box{stroke-width:1.5}
.sc-svg.sc-european-comic .sc-legend .n-box{stroke-width:2.2}
`;

export const COMIC_VIEWER_CSS = `
.sc-comic-page .sc-title{display:inline-block;background:var(--sc-paper-2);border:2px solid var(--sc-ink);box-shadow:4px 4px 0 var(--sc-ink);padding:12px 16px;letter-spacing:-.025em}
.sc-comic-page .sc-eyebrow{color:var(--sc-accent);font-family:var(--sc-font-sans);font-weight:700;letter-spacing:.12em}
.sc-comic-page .sc-caption{border:1.5px solid var(--sc-ink);box-shadow:3px 3px 0 var(--sc-ink);background:var(--sc-paper-2);border-radius:2px}
.sc-comic-page .sc-btn,.sc-comic-page .sc-search{border:1px solid var(--sc-ink);background:var(--sc-node);border-radius:3px}
`;

export const ILLUSTRATED_CSS = `
.sc-svg.sc-illustrated .sc-card .n-box{fill:var(--sc-node);stroke:var(--sc-ink);stroke-width:1.2}
.sc-svg.sc-illustrated .sc-card.k-focal .n-box{stroke:var(--sc-ink);stroke-width:1.6}
.sc-svg.sc-illustrated .sc-card .n-label{font-family:var(--sc-font-sans);font-size:17px;font-weight:700}
.sc-svg.sc-illustrated .sc-card .n-description{fill:var(--sc-ink);font-family:var(--sc-font-sans);font-size:12px}
.sc-svg.sc-illustrated .n-description-band{fill:var(--sc-paper-2)}
.sc-svg.sc-illustrated .sc-card .n-icon{stroke:var(--sc-accent);stroke-width:1.4}
.sc-svg.sc-illustrated .sc-card .n-icon rect,.sc-svg.sc-illustrated .sc-card .n-icon ellipse{fill:var(--sc-accent-tint)}
.sc-svg.sc-illustrated .n-step-badge{fill:var(--sc-accent)}
.sc-svg.sc-illustrated .n-step-number{fill:var(--sc-badge-ink);font-family:var(--sc-font-sans);font-size:19px;font-weight:700}
.sc-svg.sc-illustrated .sc-card .n-tag{font-family:var(--sc-font-sans);font-size:10px;fill:var(--sc-accent);letter-spacing:0;font-weight:600}
.sc-svg.sc-illustrated .sc-legend .n-box{fill:var(--sc-node);stroke:var(--sc-ink)}
.sc-svg.sc-illustrated .sc-legend .k-focal .n-box{stroke-width:1.6}
.sc-svg.sc-illustrated .e-line{stroke:var(--sc-ink);stroke-width:1.8}
.sc-svg.sc-illustrated .e-head{fill:var(--sc-ink)}
.sc-svg.sc-illustrated .e-label{fill:var(--sc-ink);font-family:var(--sc-font-sans);font-size:8px;letter-spacing:0;text-transform:none}
.sc-svg.sc-illustrated .g-box{fill:none;stroke:var(--sc-ink);stroke-width:1}
.sc-svg.sc-illustrated .g-box.g-dashed{stroke:var(--sc-ink);stroke-opacity:1;stroke-dasharray:4 3}
.sc-svg.sc-illustrated .g-label{fill:var(--sc-ink);font-family:var(--sc-font-sans);font-size:15px;font-weight:700;letter-spacing:0;text-transform:none}
.sc-svg.sc-illustrated .e-token{r:5px}
`;

export const ILLUSTRATED_VIEWER_CSS = `
.sc-illustrated-page .sc-title{font-family:var(--sc-font-sans);font-weight:700}
.sc-illustrated-page .sc-caption{font-family:var(--sc-font-sans);font-style:normal;font-weight:600;max-width:none;padding:10px 14px;border:1px solid var(--sc-accent);border-radius:7px;background:var(--sc-accent-tint)}
`;
