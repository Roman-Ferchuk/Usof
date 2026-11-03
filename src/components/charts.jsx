import { useState } from 'react';

const W = 640;
const H = 220;
const PAD = {
  top: 12, right: 12, bottom: 26, left: 34,
};

const niceMax = (max) => {
  if (max <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 5, 10].find((m) => m * pow >= max / 4) * pow;
  return Math.ceil(max / step) * step;
};

const shortDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/*
 * Line chart drawn with plain SVG (no chart library).
 * series: [{ key, name, values: number[] }], labels: ISO dates, one per value.
 */
export function LineChart({ series, labels, title }) {
  const [hover, setHover] = useState(null);
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (labels.length > 1 ? (i / (labels.length - 1)) * innerW : innerW / 2);
  const y = (v) => PAD.top + innerH - (v / max) * innerH;
  const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i);

  const onMove = (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    const i = Math.round(((px - PAD.left) / innerW) * (labels.length - 1));
    setHover(Math.min(labels.length - 1, Math.max(0, i)));
  };

  return (
    <figure className="chart">
      <figcaption className="chart__legend">
        {series.map((s) => (
          <span key={s.key} className={`chart__key chart__key--${s.key}`}>{s.name}</span>
        ))}
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={title}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <title>{title}</title>
        {ticks.map((t) => (
          <g key={t}>
            <line className="chart__grid" x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
            <text className="chart__tick" x={PAD.left - 6} y={y(t) + 4} textAnchor="end">{Math.round(t)}</text>
          </g>
        ))}
        {[[0, 'start'], [Math.floor(labels.length / 2), 'middle'], [labels.length - 1, 'end']].map(([i, anchor]) => (
          <text key={i} className="chart__tick" x={x(i)} y={H - 6} textAnchor={anchor}>{shortDate(labels[i])}</text>
        ))}
        {series.map((s) => (
          <g key={s.key} className={`chart__series chart__series--${s.key}`}>
            <polyline points={`${PAD.left},${y(0)} ${s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} ${x(labels.length - 1)},${y(0)}`} className="chart__area" />
            <polyline points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} className="chart__line" />
          </g>
        ))}
        {hover !== null && (
          <g>
            <line className="chart__cursor" x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={y(0)} />
            {series.map((s) => (
              <circle key={s.key} className={`chart__dot chart__dot--${s.key}`} cx={x(hover)} cy={y(s.values[hover])} r="4" />
            ))}
          </g>
        )}
      </svg>
      <p className="chart__readout" aria-live="polite">
        {hover === null
          ? 'Move the pointer over the chart for exact numbers.'
          : `${shortDate(labels[hover])}: ${series.map((s) => `${s.values[hover]} ${s.name.toLowerCase()}`).join(' · ')}`}
      </p>
    </figure>
  );
}

/* Horizontal bars: items = [{ key, label, value, to }] */
export function BarList({ items, render }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ol className="bars">
      {items.map((i) => (
        <li key={i.key}>
          <span className="bars__label">{render ? render(i) : i.label}</span>
          <span className="bars__track" aria-hidden="true"><span className="bars__fill" style={{ width: `${(i.value / max) * 100}%` }} /></span>
          <b className="bars__value">{i.value}</b>
        </li>
      ))}
    </ol>
  );
}

/* Two-part ring: likes against dislikes. */
export function Ring({ good, bad }) {
  const total = good + bad;
  const R = 42;
  const C = 2 * Math.PI * R;
  const share = total ? good / total : 0;
  return (
    <figure className="ring">
      <svg viewBox="0 0 100 100" role="img" aria-label={`${good} likes and ${bad} dislikes`}>
        <circle className="ring__bad" cx="50" cy="50" r={R} />
        {total > 0 && (
          <circle
            className="ring__good"
            cx="50"
            cy="50"
            r={R}
            strokeDasharray={`${share * C} ${C}`}
            transform="rotate(-90 50 50)"
          />
        )}
        <text x="50" y="55" textAnchor="middle" className="ring__text">{total ? `${Math.round(share * 100)}%` : '–'}</text>
      </svg>
      <figcaption>
        <span className="chart__key chart__key--posts">{good} likes</span>
        <span className="chart__key chart__key--comments">{bad} dislikes</span>
      </figcaption>
    </figure>
  );
}
