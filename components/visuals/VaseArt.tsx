interface VaseArtProps {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Shift the palette toward the generated variant used in Generative Fill. */
  variant?: 'source' | 'generated';
}

/** Original still-life used inside the reconstructions instead of borrowed screenshots. */
export function VaseArt({ x, y, w, h, variant = 'source' }: VaseArtProps) {
  const sky = variant === 'source' ? '#cdbfa6' : '#c9b8a8';
  const sun = variant === 'source' ? '#ecdcb8' : '#f0d3c0';
  return (
    <svg x={x} y={y} width={w} height={h} viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">
      <rect width="160" height="100" fill={sky} />
      <circle cx="118" cy="30" r="16" fill={sun} />
      <rect x="0" y="74" width="160" height="26" fill="#b3a58c" />
      <rect x="44" y="64" width="72" height="14" fill="#9c8e76" />
      <ellipse cx="80" cy="64" rx="24" ry="3.5" fill="#7d705b" opacity="0.5" />
      <path d="M70 64C58 56 58 38 70 30L70 20L90 20L90 30C102 38 102 56 90 64Z" fill="#f4f1e8" />
      <path d="M90 30C102 38 102 56 90 64L84 64C93 56 93 38 84 30Z" fill="#dfdbcf" />
      <path d="M78 20C76 10 70 6 64 4M82 20C84 9 92 5 98 6" stroke="#5c5b54" strokeWidth="1.4" fill="none" />
    </svg>
  );
}
