import { Link } from 'react-router';
import { Container, PageHeader } from '../components/ui/Section';
import { Seo } from '../components/ui/Seo';
import { useSettings } from '../lib/settings';

export default function Privacy() {
  const { settings } = useSettings();
  return (
    <>
      <Seo title="Privacy Policy" description="How Swat Kings Cricket Academy collects, uses and protects personal information." />
      <PageHeader title="Privacy policy" intro="How we handle the information you share with us." />
      <Container className="max-w-3xl py-12">
        <div className="space-y-8 text-lg text-charcoal-800 [&_h2]:mb-3 [&_h2]:text-3xl [&_h2]:font-extrabold [&_h2]:text-navy-900 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
          <p className="rounded-md bg-accent-300/25 p-4 text-base">
            This is a plain-language template. The academy should review it, and take local legal advice if needed,
            before relying on it.
          </p>

          <section>
            <h2>Who we are</h2>
            <p>
              {settings.academy_name} (“the academy”, “we”) runs cricket coaching in Swat. This policy explains what
              information this website collects and how we use it.
            </p>
          </section>

          <section>
            <h2>What we collect</h2>
            <p>When you register for trials, we collect:</p>
            <ul className="mt-2">
              <li>the player’s name and age group (not their date of birth);</li>
              <li>a parent or guardian’s name for players under 19;</li>
              <li>a contact phone number and, if you choose, an email address;</li>
              <li>cricket experience, preferred programme and preferred schedule;</li>
              <li>any additional information you choose to give;</li>
              <li>confirmation of guardian consent and that you have read this policy.</li>
            </ul>
            <p className="mt-3">
              When you use the contact form, we collect your name, email or phone number, subject and message.
            </p>
            <p className="mt-3">
              We do <strong>not</strong> ask for passwords, ID card numbers, birth certificates or payment details
              through this website.
            </p>
          </section>

          <section>
            <h2>How we use it</h2>
            <ul>
              <li>to review registrations and contact you about trials and training;</li>
              <li>to reply to your messages;</li>
              <li>to keep the website safe from spam and abuse.</li>
            </ul>
            <p className="mt-3">We do not sell your information or use it for advertising.</p>
          </section>

          <section>
            <h2>Who can see it</h2>
            <p>
              Registration details and messages are stored in a secure database and can only be viewed by authorised
              academy administrators. They are never shown on the public website.
            </p>
          </section>

          <section>
            <h2>Children’s information</h2>
            <p>
              Registrations for players under 19 need a parent or guardian’s consent. Player profiles on the public
              website are optional, are only published with consent, and show limited, approved information such as a
              display name, playing role and approved achievements. We never publish a player’s date of birth, address
              or contact details.
            </p>
          </section>

          <section>
            <h2>Photos and videos</h2>
            <p>
              The gallery only shows media the academy has approved for public display. If you would like a photo or
              video of you or your child removed, contact us and we will remove it.
            </p>
          </section>

          <section>
            <h2>Spam protection</h2>
            <p>
              To limit spam, the website records a one-way coded version (a hash) of the internet address used to send
              a form, for up to two days. We cannot turn this code back into your internet address.
            </p>
          </section>

          <section>
            <h2>Service providers</h2>
            <p>
              The website is hosted by Cloudflare and the database is provided by Supabase. They process data on our
              behalf to run the service. Fonts are loaded from Google Fonts, and YouTube videos in the gallery are
              embedded using YouTube’s privacy-enhanced mode.
            </p>
          </section>

          <section>
            <h2>How long we keep it</h2>
            <p>
              We keep registration and contact records only as long as we need them to manage applications and
              training, then delete them.
            </p>
          </section>

          <section>
            <h2>Your choices</h2>
            <p>
              You can ask us to show you, correct or delete the information we hold about you or your child by{' '}
              <Link to="/contact" className="font-semibold text-navy-800 underline underline-offset-4">
                contacting us
              </Link>
              {settings.email ? (
                <>
                  {' '}
                  or emailing{' '}
                  <a href={`mailto:${settings.email}`} className="font-semibold text-navy-800 underline underline-offset-4">
                    {settings.email}
                  </a>
                </>
              ) : null}
              .
            </p>
          </section>
        </div>
      </Container>
    </>
  );
}
