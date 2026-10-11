import { ContactSection } from '@/components/contact/ContactSection';
import { AboutIntro } from '@/components/home/AboutIntro';
import { Capabilities } from '@/components/home/Capabilities';
import { Hero } from '@/components/home/Hero';
import { Impact } from '@/components/home/Impact';
import { SelectedWork } from '@/components/home/SelectedWork';
import { PageTransition } from '@/components/site/PageTransition';

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
