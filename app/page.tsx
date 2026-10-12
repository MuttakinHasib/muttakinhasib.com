import { ContactSection } from '@/components/contact/contact-section';
import { AboutIntro } from '@/components/home/about-intro';
import { Capabilities } from '@/components/home/capabilities';
import { Hero } from '@/components/home/hero';
import { Impact } from '@/components/home/impact';
import { SelectedWork } from '@/components/home/selected-work';
import { PageTransition } from '@/components/site/page-transition';

export default function HomePage() {
  return (
    <PageTransition>
      <main id="main" tabIndex={-1}>
        <Hero />
        <SelectedWork />
        <Impact />
        <Capabilities />
        <AboutIntro />
      </main>
      <ContactSection />
    </PageTransition>
  );
}
