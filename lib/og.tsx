import { ImageResponse } from 'next/og';
import { profile } from '@/content/profile';
import { VIZ_FOG as FOG, VIZ_GRAPHITE as GRAPHITE, VIZ_INK as INK, VIZ_PAPER as PAPER, VIZ_SIGNAL as SIGNAL } from '@/components/visuals/palette';

export const ogSize = { width: 1200, height: 630 };

interface OgCard {
  kicker: string;
  title: string;
  subtitle: string;
}

/** Shared Open Graph card: a person node wired into the page's title. */
export function renderOgCard({ kicker, title, subtitle }: OgCard): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: PAPER,
        color: INK,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(23,24,21,0.18) 1.5px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '18px 24px',
            background: INK,
            color: PAPER,
            borderRadius: 10,
          }}
        >
          <div style={{ fontSize: 20, color: FOG }}>person</div>
          <div style={{ fontSize: 30, fontWeight: 700 }}>{profile.name}</div>
        </div>
        <div style={{ display: 'flex', width: 120, height: 3, background: INK }} />
        <div
          style={{
            display: 'flex',
            width: 22,
            height: 22,
            borderRadius: 999,
            background: SIGNAL,
            border: `3px solid ${INK}`,
          }}
        />
        <div style={{ display: 'flex', marginLeft: 20, fontSize: 24, color: GRAPHITE }}>{kicker}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2, lineHeight: 1.02, maxWidth: 1000 }}>
          {title}
        </div>
        <div style={{ marginTop: 24, fontSize: 30, color: GRAPHITE, maxWidth: 940 }}>{subtitle}</div>
      </div>
    </div>,
    ogSize,
  );
}
