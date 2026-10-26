import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Clock, Loader2, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../components/ui/Button';
import { describedBy } from '../components/ui/aria';
import { Field, Honeypot } from '../components/ui/Field';
import { Container, PageHeader } from '../components/ui/Section';
import { Seo } from '../components/ui/Seo';
import { telLink, whatsappLink } from '../lib/format';
import { useSettings } from '../lib/settings';
import { submitContactMessage } from '../lib/submissions';
import { isSupabaseConfigured } from '../lib/supabase';
import { JsonLd } from '../components/ui/JsonLd';
import { organizationSchema } from '../lib/schema';
import { contactSchema, type ContactData, type ContactInput } from '../lib/validation';

function OrgSchema() {
  const { settings } = useSettings();
  return <JsonLd data={organizationSchema(settings)} />;
}

function ContactDetails() {
  const { settings } = useSettings();
  const wa = whatsappLink(settings.whatsapp);
  const rows = [
    settings.address && { icon: MapPin, label: 'Address', body: <span className="whitespace-pre-line">{settings.address}</span> },
    settings.phone && { icon: Phone, label: 'Phone', body: <a href={telLink(settings.phone)}>{settings.phone}</a> },
    wa && {
      icon: MessageCircle,
      label: 'WhatsApp',
      body: (
        <a href={wa} target="_blank" rel="noopener noreferrer">
          {settings.whatsapp}
        </a>
      ),
    },
    settings.email && { icon: Mail, label: 'Email', body: <a href={`mailto:${settings.email}`}>{settings.email}</a> },
    settings.training_schedule && {
      icon: Clock,
      label: 'Training times',
      body: <span className="whitespace-pre-line">{settings.training_schedule}</span>,
    },
  ].filter(Boolean) as { icon: typeof MapPin; label: string; body: ReactNode }[];

  return (
    <aside className="self-start bg-navy-900 p-7 text-crease">
      <h2 className="text-3xl font-extrabold">Academy details</h2>
      {rows.length ? (
        <dl className="mt-6 space-y-5">
          {rows.map(({ icon: Icon, label, body }) => (
            <div key={label} className="flex gap-3">
              <Icon className="mt-1 h-5 w-5 shrink-0 text-accent-500" aria-hidden="true" />
              <div>
                <dt className="text-sm text-sky-100/70">{label}</dt>
                <dd className="font-semibold [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-accent-300">{body}</dd>
              </div>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-4 text-sky-100/85">
          Our address, phone and WhatsApp details will be published here soon. Use the form to send us a message.
        </p>
      )}
      {settings.map_url && (
        <a
          href={settings.map_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block font-semibold text-accent-300 underline underline-offset-4"
        >
          Open location in maps (new tab)
        </a>
      )}
    </aside>
  );
}

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput, unknown, ContactData>({
    resolver: zodResolver(contactSchema),
    mode: 'onTouched',
    defaultValues: { name: '', contact: '', subject: '', message: '', website: '' },
  });

  const onSubmit = async (data: ContactData) => {
    setServerError(null);
    try {
      await submitContactMessage(data);
      setSent(true);
      reset();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  const err = (name: keyof ContactInput) => errors[name]?.message;

  return (
    <>
      <Seo
        title="Contact Our Cricket Academy in Mingora, Swat"
        description="Contact Swat Kings Cricket Academy in Takhtaband, Mingora, Swat about admission, fees, cricket trials, coaching and training times."
      />
      <OrgSchema />
      <PageHeader
        page="contact" title="Contact our cricket academy in Swat" intro="Questions about admission, fees, cricket trials, programmes or training times? Send us a message." />
      <Container className="grid gap-10 py-12 lg:grid-cols-[1.5fr_1fr]">
        <div>
          {sent ? (
            <div role="status" className="border-t-4 border-sky-500 bg-white p-8">
              <CheckCircle2 className="h-12 w-12 text-sky-500" aria-hidden="true" />
              <h2 className="mt-3 text-3xl font-extrabold text-navy-900">Message sent</h2>
              <p className="mt-2 text-charcoal-600">
                Thank you. The academy team will read your message and reply using the contact details you gave.
              </p>
              <Button variant="outline-dark" className="mt-6" onClick={() => setSent(false)}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative space-y-5">
              {!isSupabaseConfigured && (
                <p role="note" className="rounded-md bg-accent-300/30 p-4 text-sm">
                  The contact form will work once the website database is connected.
                </p>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="name" label="Your name" required error={err('name')}>
                  <input
                    id="name"
                    className="field-input"
                    autoComplete="name"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={describedBy('name', err('name'))}
                    {...register('name')}
                  />
                </Field>
                <Field id="contact" label="Email or phone" required hint="So we can reply to you." error={err('contact')}>
                  <input
                    id="contact"
                    className="field-input"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.contact)}
                    aria-describedby={describedBy('contact', err('contact'), true)}
                    {...register('contact')}
                  />
                </Field>
              </div>
              <Field id="subject" label="Subject" required error={err('subject')}>
                <input
                  id="subject"
                  className="field-input"
                  aria-invalid={Boolean(errors.subject)}
                  aria-describedby={describedBy('subject', err('subject'))}
                  {...register('subject')}
                />
              </Field>
              <Field id="message" label="Message" required error={err('message')}>
                <textarea
                  id="message"
                  rows={6}
                  className="field-input"
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={describedBy('message', err('message'))}
                  {...register('message')}
                />
              </Field>
              <Honeypot register={register('website')} />
              {serverError && (
                <div role="alert" className="flex gap-3 rounded-md border border-cherry/40 bg-cherry/5 p-4">
                  <AlertCircle className="h-5 w-5 shrink-0 text-cherry" aria-hidden="true" />
                  <p>{serverError}</p>
                </div>
              )}
              <p className="text-sm text-charcoal-600">
                Messages go to the academy’s private inbox. Please do not send ID numbers or other sensitive information.
              </p>
              <Button type="submit" variant="navy" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Sending…
                  </>
                ) : (
                  'Send message'
                )}
              </Button>
            </form>
          )}
        </div>
        <ContactDetails />
      </Container>
    </>
  );
}
