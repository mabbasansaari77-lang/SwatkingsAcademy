import { LinkButton } from '../components/ui/Button';
import { Container } from '../components/ui/Section';
import { Seo } from '../components/ui/Seo';

export default function NotFound() {
  return (
    <section className="bg-navy-900 text-crease">
      <Seo title="Page not found" description="The page you are looking for could not be found." noindex />
      <Container className="flex min-h-[60vh] flex-col items-start justify-center py-20">
        <svg viewBox="0 0 120 80" className="h-20 w-32 text-accent-500" aria-hidden="true">
          <rect x="30" y="10" width="5" height="60" fill="currentColor" />
          <rect x="57" y="10" width="5" height="60" fill="currentColor" transform="rotate(14 60 70)" />
          <rect x="84" y="10" width="5" height="60" fill="currentColor" transform="rotate(-22 86 70)" />
          <circle cx="104" cy="22" r="7" fill="#b3262b" />
        </svg>
        <h1 className="mt-6 text-6xl font-black uppercase sm:text-7xl">Clean bowled</h1>
        <p className="mt-4 max-w-lg text-lg text-sky-100/90">
          We could not find that page. It may have moved, or the link may be wrong.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton to="/" variant="accent">
            Go to the home page
          </LinkButton>
          <LinkButton to="/contact" variant="outline-light">
            Contact us
          </LinkButton>
        </div>
      </Container>
    </section>
  );
}
