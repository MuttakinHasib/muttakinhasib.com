import { profile } from '@/content/profile';

const INK = '#171815';
const SIGNAL = '#c7f36b';

/** Dhaka wired to the four countries Hasib's remote teams worked from. */
export function TeamsDiagram() {
  const rows = profile.teams;
  const top = 34;
  const step = 76;
  const hubY = top + ((rows.length - 1) * step) / 2 + 26;

  return (
    <figure className="teams-diagram" aria-labelledby="teams-caption">
      <svg viewBox="0 0 520 330" aria-hidden="true" focusable="false">
        {rows.map((row, index) => {
          const y = top + index * step + 26;
          return (
            <path
              key={row.place}
              d={`M182 ${hubY}C262 ${hubY} 238 ${y} 300 ${y}`}
              fill="none"
              stroke={INK}
              strokeWidth="1.4"
            />
          );
        })}
        <rect x={16} y={hubY - 36} width={166} height={72} rx={7} fill={INK} />
        <text x={34} y={hubY - 8} className="td-kicker" fill="#a9a79c">
          home base
        </text>
        <text x={34} y={hubY + 18} className="td-title" fill="#f4f1e8">
          Dhaka, GMT+6
        </text>
        <circle cx={182} cy={hubY} r={5.5} fill={SIGNAL} stroke={INK} strokeWidth="1.75" />
        {rows.map((row, index) => {
          const y = top + index * step;
          return (
            <g key={row.place}>
              <rect x={300} y={y} width={204} height={52} rx={7} fill="#f4f1e8" stroke={INK} strokeWidth="1.25" />
              <circle cx={300} cy={y + 26} r={5.5} fill={SIGNAL} stroke={INK} strokeWidth="1.75" />
              <text x={318} y={y + 22} className="td-title" fill={INK}>
                {row.place}
              </text>
              <text x={318} y={y + 41} className="td-kicker" fill="#5c5b54">
                {row.companies}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption id="teams-caption" className="type-small mt-3 text-graphite">
        Remote teams I’ve shipped with, from Dhaka: {rows.map((row) => `${row.place} (${row.companies})`).join(', ')}.
      </figcaption>
    </figure>
  );
}
