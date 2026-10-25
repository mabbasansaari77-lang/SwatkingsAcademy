import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router';
import { Button, LinkButton } from '../components/ui/Button';
import { describedBy } from '../components/ui/aria';
import { Field, Honeypot } from '../components/ui/Field';
import { Container, PageHeader } from '../components/ui/Section';
import { Seo } from '../components/ui/Seo';
import { AGE_GROUPS, EXPERIENCE_LEVELS, SCHEDULES } from '../lib/labels';
import { fetchProgrammes } from '../lib/queries';
import { useSettings } from '../lib/settings';
import { submitRegistration } from '../lib/submissions';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAsync } from '../lib/useAsync';
import { registrationSchema, type RegistrationData, type RegistrationInput } from '../lib/validation';

function Success({ reference }: { reference: string }) {
  return (
    <div role="status" className="mx-auto max-w-xl border-t-4 border-sky-500 bg-white p-8 text-center shadow-sm">
      <CheckCircle2 className="mx-auto h-14 w-14 text-sky-500" aria-hidden="true" />
      <h2 className="mt-4 text-4xl font-extrabold text-navy-900">Registration received</h2>
      <p className="mt-3 text-lg text-charcoal-600">
        Thank you. Your application is now <strong>pending</strong>. The academy will contact you using the phone number
        you provided.
      </p>
      <p className="mt-6 text-charcoal-600">Your registration reference</p>
      <p className="scoreboard mx-auto mt-2 inline-block rounded px-5 py-2 font-display text-3xl font-black tracking-wider text-accent-300">
        {reference}
      </p>
      <p className="mt-3 text-sm text-charcoal-600">Keep this reference in case you need to contact us about your application.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton to="/" variant="outline-dark">
          Back to home
        </LinkButton>
        <LinkButton to="/programmes" variant="navy">
          View programmes
        </LinkButton>
      </div>
    </div>
  );
}

function RegistrationForm({ onSuccess }: { onSuccess: (reference: string) => void }) {
  const [params] = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const programmes = useAsync(async () => {
    if (!isSupabaseConfigured) return [];
    return (await fetchProgrammes()).filter((p) => p.status !== 'closed');
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationInput, unknown, RegistrationData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onTouched',
    defaultValues: {
      player_name: '',
      guardian_name: '',
      phone: '',
      email: '',
      programme_id: params.get('programme') ?? '',
      experience_details: '',
      additional_info: '',
      guardian_consent: false,
      website: '',
    },
  });

  const ageGroup = useWatch({ control, name: 'age_group' });
  const isMinor = Boolean(ageGroup) && ageGroup !== 'adult';

  const onSubmit = async (data: RegistrationData) => {
    setServerError(null);
    try {
      const reference = await submitRegistration(data);
      onSuccess(reference);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  const err = (name: keyof RegistrationInput) => errors[name]?.message as string | undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative space-y-10" aria-describedby="required-note">
      <p id="required-note" className="text-sm text-charcoal-600">
        Fields marked <span className="text-cherry">*</span> are required. We do not ask for dates of birth, ID
        documents or passwords.
      </p>

      <fieldset className="space-y-5">
        <legend className="mb-2 font-display text-3xl font-extrabold text-navy-900">Player details</legend>
        <Field id="player_name" label="Player’s full name" required error={err('player_name')}>
          <input
            id="player_name"
            className="field-input"
            autoComplete="name"
            aria-invalid={Boolean(errors.player_name)}
            aria-describedby={describedBy('player_name', err('player_name'))}
            {...register('player_name')}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="age_group" label="Age group" required error={err('age_group')}>
            <select
              id="age_group"
              className="field-input"
              defaultValue=""
              aria-invalid={Boolean(errors.age_group)}
              aria-describedby={describedBy('age_group', err('age_group'))}
              {...register('age_group')}
            >
              <option value="" disabled>
                Choose an age group
              </option>
              {AGE_GROUPS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id="guardian_name"
            label="Parent or guardian name"
            required={isMinor}
            optional={!isMinor}
            hint={isMinor ? 'Required for players under 19.' : undefined}
            error={err('guardian_name')}
          >
            <input
              id="guardian_name"
              className="field-input"
              autoComplete="off"
              aria-invalid={Boolean(errors.guardian_name)}
              aria-describedby={describedBy('guardian_name', err('guardian_name'), isMinor)}
              {...register('guardian_name')}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="mb-2 font-display text-3xl font-extrabold text-navy-900">Contact details</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="phone"
            label="Contact phone"
            required
            hint="Include the country code if outside Pakistan, e.g. +92 300 1234567"
            error={err('phone')}
          >
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="field-input"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={describedBy('phone', err('phone'), true)}
              {...register('phone')}
            />
          </Field>
          <Field id="email" label="Email address" optional error={err('email')}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="field-input"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={describedBy('email', err('email'))}
              {...register('email')}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="mb-2 font-display text-3xl font-extrabold text-navy-900">Cricket and training</legend>
        <Field
          id="programme_id"
          label="Preferred programme"
          optional
          hint={programmes.error ? 'Programme list unavailable — choose “Not sure yet”.' : undefined}
          error={err('programme_id')}
        >
          <select
            id="programme_id"
            className="field-input"
            aria-describedby={describedBy('programme_id', err('programme_id'), Boolean(programmes.error))}
            {...register('programme_id')}
          >
            <option value="">Not sure yet — please advise</option>
            {programmes.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.status === 'waitlist' ? ' (waiting list)' : p.status === 'coming_soon' ? ' (coming soon)' : ''}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="experience_level" label="Previous cricket experience" required error={err('experience_level')}>
            <select
              id="experience_level"
              className="field-input"
              defaultValue=""
              aria-invalid={Boolean(errors.experience_level)}
              aria-describedby={describedBy('experience_level', err('experience_level'))}
              {...register('experience_level')}
            >
              <option value="" disabled>
                Choose experience
              </option>
              {EXPERIENCE_LEVELS.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="preferred_schedule" label="Preferred training schedule" required error={err('preferred_schedule')}>
            <select
              id="preferred_schedule"
              className="field-input"
              defaultValue=""
              aria-invalid={Boolean(errors.preferred_schedule)}
              aria-describedby={describedBy('preferred_schedule', err('preferred_schedule'))}
              {...register('preferred_schedule')}
            >
              <option value="" disabled>
                Choose a schedule
              </option>
              {SCHEDULES.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field
          id="experience_details"
          label="Tell us about the player’s cricket so far"
          optional
          hint="For example: preferred role, teams played for, or what they want to improve."
          error={err('experience_details')}
        >
          <textarea
            id="experience_details"
            rows={3}
            className="field-input"
            aria-describedby={describedBy('experience_details', err('experience_details'), true)}
            {...register('experience_details')}
          />
        </Field>
        <Field
          id="additional_info"
          label="Anything else we should know"
          optional
          hint="Please do not include medical records or ID numbers. We will ask in person if needed."
          error={err('additional_info')}
        >
          <textarea
            id="additional_info"
            rows={3}
            className="field-input"
            aria-describedby={describedBy('additional_info', err('additional_info'), true)}
            {...register('additional_info')}
          />
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 font-display text-3xl font-extrabold text-navy-900">Consent</legend>
        {isMinor && (
          <div>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 accent-navy-800"
                aria-invalid={Boolean(errors.guardian_consent)}
                aria-describedby={errors.guardian_consent ? 'guardian_consent-error' : undefined}
                {...register('guardian_consent')}
              />
              <span>
                I am the player’s parent or guardian and I consent to this registration and to the academy contacting me
                about it.
              </span>
            </label>
            {errors.guardian_consent && (
              <p id="guardian_consent-error" role="alert" className="mt-1 pl-8 text-sm font-medium text-cherry">
                {errors.guardian_consent.message}
              </p>
            )}
          </div>
        )}
        <div>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 accent-navy-800"
              aria-invalid={Boolean(errors.privacy_acknowledged)}
              aria-describedby={errors.privacy_acknowledged ? 'privacy_acknowledged-error' : undefined}
              {...register('privacy_acknowledged')}
            />
            <span>
              I have read the{' '}
              <Link to="/privacy" target="_blank" className="font-semibold text-navy-800 underline underline-offset-4">
                privacy notice
              </Link>{' '}
              and understand how these details will be used. <span className="text-cherry">*</span>
            </span>
          </label>
          {errors.privacy_acknowledged && (
            <p id="privacy_acknowledged-error" role="alert" className="mt-1 pl-8 text-sm font-medium text-cherry">
              {errors.privacy_acknowledged.message}
            </p>
          )}
        </div>
      </fieldset>

      <Honeypot register={register('website')} />

      {serverError && (
        <div role="alert" className="flex gap-3 rounded-md border border-cherry/40 bg-cherry/5 p-4 text-charcoal-900">
          <AlertCircle className="h-5 w-5 shrink-0 text-cherry" aria-hidden="true" />
          <p>{serverError}</p>
        </div>
      )}

      <Button type="submit" variant="accent" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Sending registration…
          </>
        ) : (
          'Submit registration'
        )}
      </Button>
    </form>
  );
}

export default function Register() {
  const { settings } = useSettings();
  const [reference, setReference] = useState<string | null>(null);

  return (
    <>
      <Seo
        title="Register for Trials"
        description="Register for cricket trials at Swat Kings Cricket Academy. Cricket training for beginners and youth players in Swat."
      />
      <PageHeader
        title="Register for trials"
        intro="Tell us about the player and we will contact you with trial dates and the next steps. There is no payment online."
      />
      <Container className="max-w-3xl py-12">
        {reference ? (
          <Success reference={reference} />
        ) : !settings.registration_open ? (
          <div className="rounded-md border-l-4 border-accent-500 bg-white p-6">
            <h2 className="text-3xl font-extrabold text-navy-900">Registrations are closed for now</h2>
            <p className="mt-2 text-charcoal-600">
              We are not accepting new registrations at the moment. Send us a message and we will let you know when
              trials open.
            </p>
            <LinkButton to="/contact" variant="navy" className="mt-5">
              Contact the academy
            </LinkButton>
          </div>
        ) : (
          <>
            {!isSupabaseConfigured && (
              <p role="note" className="mb-8 rounded-md bg-accent-300/30 p-4 text-sm">
                Online registration will be available once the website database is connected.
              </p>
            )}
            <RegistrationForm onSuccess={setReference} />
          </>
        )}
      </Container>
    </>
  );
}
