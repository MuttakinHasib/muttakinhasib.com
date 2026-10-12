import { profile } from '@/content/profile';
import { ogSize, renderOgCard } from '@/lib/og';

export const alt = `${profile.name}, ${profile.title}`;
export const size = ogSize;
export const contentType = 'image/png';

export default function Image() {
  return renderOgCard({
    kicker: profile.title,
    title: profile.headline,
    subtitle: profile.intro,
  });
}
