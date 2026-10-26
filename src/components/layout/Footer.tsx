import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, Youtube } from 'lucide-react';
import { Link } from 'react-router';
import { telLink, whatsappLink } from '../../lib/format';
import { useSettings } from '../../lib/settings';
import { Logo } from '../graphics/Logo';
import { Container } from '../ui/Section';
import { NAV_ITEMS } from '../../lib/nav';

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.5 3c.4 2.2 1.8 3.7 4 3.9v3.2c-1.5 0-2.9-.4-4-1.2v6.3c0 3.3-2.6 5.8-5.8 5.8S4.9 18.5 4.9 15.2s2.6-5.8 5.8-5.8c.3 0 .6 0 .9.1v3.3a2.6 2.6 0 0 0-.9-.2 2.6 2.6 0 1 0 2.6 2.6V3h3.2Z" />
    </svg>
  );
}

export function Footer() {
  const { settings } = useSettings();
  const wa = whatsappLink(settings.whatsapp);
  const socials = [
    { href: settings.facebook_url, label: 'Facebook', icon: Facebook },
    { href: settings.instagram_url, label: 'Instagram', icon: Instagram },
    { href: settings.youtube_url, label: 'YouTube', icon: Youtube },
    { href: settings.tiktok_url, label: 'TikTok', icon: TikTokIcon },
  ].filter((s) => s.href);
  const hasContact = settings.address || settings.phone || settings.email || wa;

  return (
    <footer className="bg-navy-950 text-crease/90">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-sm text-crease/85">
            Cricket academy and cricket club in Takhtaband, Mingora, Swat, KPK. Cricket coaching and training for kids, youth and adults.
          </p>
          {socials.length > 0 && (
            <ul className="mt-6 flex gap-2" aria-label="Social media">
              {socials.map(({ href, label, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/20 text-crease hover:border-accent-500 hover:text-accent-300"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="sr-only">{label} (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Footer">
          <h2 className="font-display text-xl font-bold text-crease">Explore</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-accent-300">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/register" className="hover:text-accent-300">
                Registration
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-accent-300">
                FAQ
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-accent-300">
                Privacy policy
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-xl font-bold text-crease">Get in touch</h2>
          {hasContact ? (
            <ul className="mt-4 space-y-3">
              {settings.address && (
                <li className="flex gap-3">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-accent-500" aria-hidden="true" />
                  <span className="whitespace-pre-line">{settings.address}</span>
                </li>
              )}
              {settings.phone && (
                <li className="flex gap-3">
                  <Phone className="mt-1 h-4 w-4 shrink-0 text-accent-500" aria-hidden="true" />
                  <a href={telLink(settings.phone)} className="hover:text-accent-300">
                    {settings.phone}
                  </a>
                </li>
              )}
              {wa && (
                <li className="flex gap-3">
                  <MessageCircle className="mt-1 h-4 w-4 shrink-0 text-accent-500" aria-hidden="true" />
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-accent-300">
                    WhatsApp {settings.whatsapp}
                  </a>
                </li>
              )}
              {settings.email && (
                <li className="flex gap-3">
                  <Mail className="mt-1 h-4 w-4 shrink-0 text-accent-500" aria-hidden="true" />
                  <a href={`mailto:${settings.email}`} className="break-all hover:text-accent-300">
                    {settings.email}
                  </a>
                </li>
              )}
            </ul>
          ) : (
            <p className="mt-4 text-crease/85">
              Contact details will be published here soon. Meanwhile, send us a message through the{' '}
              <Link to="/contact" className="text-accent-300 underline underline-offset-4">
                contact form
              </Link>
              .
            </p>
          )}
        </div>
      </Container>
      <div className="border-t border-white/20">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-crease/80">
          <p>
            © {new Date().getFullYear()} {settings.academy_name}
          </p>
          <Link to="/admin" className="hover:text-crease" rel="nofollow">
            Staff login
          </Link>
        </Container>
      </div>
    </footer>
  );
}
