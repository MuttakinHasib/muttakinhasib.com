import { projects } from '@/content/projects';
import { FeatureLayout, variantForSlug } from './feature-layout';

export function SelectedWork() {
  return (
    <section id="work" aria-labelledby="work-title" className="selected-work">
      <div className="shell grid-12 gap-y-6 pb-[calc(var(--space-section)*2/3)] pt-[var(--space-section)]">
        <h2 id="work-title" className="type-display col-span-4 md:col-span-7">
          Selected work
        </h2>
        <p className="type-lead col-span-4 max-w-[38ch] text-graphite md:col-span-5 md:self-end">
          Five systems where the hard part sits below the interface, and the interface still has to make it
          feel simple.
        </p>
      </div>
      {projects.map((project) => (
        <FeatureLayout key={project.slug} project={project} variant={variantForSlug(project.slug)} />
      ))}
    </section>
  );
}
