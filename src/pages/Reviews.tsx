import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Loader2, MessageSquareQuote, Star } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '../components/ui/Button';
import { describedBy } from '../components/ui/aria';
import { Field, Honeypot } from '../components/ui/Field';
import { Container, PageHeader } from '../components/ui/Section';
import { Seo } from '../components/ui/Seo';
import { AsyncBlock, EmptyState } from '../components/ui/States';
import { formatDate } from '../lib/format';
import { fetchReviews } from '../lib/queries';
import { submitReview } from '../lib/submissions';
import { isSupabaseConfigured } from '../lib/supabase';
import type { Review } from '../lib/types';
import { useAsync } from '../lib/useAsync';
import { REVIEW_RELATIONSHIPS, reviewSchema, type ReviewData, type ReviewInput } from '../lib/validation';

const STAR_LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

function Stars({ rating, className = 'h-5 w-5' }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex text-accent-500" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${className} ${n <= Math.round(rating) ? 'fill-current' : 'text-charcoal-400/50'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function relationshipLabel(value: string) {
  return REVIEW_RELATIONSHIPS.find((r) => r.value === value)?.label ?? '';
}

function Summary({ reviews }: { reviews: Review[] }) {
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const counts = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => r.rating === n).length }));
  return (
    <div className="grid gap-6 rounded-lg bg-white p-6 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="text-center sm:pr-6">
        <p className="font-display text-6xl font-black text-navy-900">{average.toFixed(1)}</p>
        <Stars rating={average} className="h-6 w-6" />
        <p className="mt-1 text-sm text-charcoal-600">
          {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
        </p>
      </div>
      <ul className="space-y-1.5" aria-label="Ratings breakdown">
        {counts.map(({ n, count }) => (
          <li key={n} className="flex items-center gap-3 text-sm">
            <span className="w-12 shrink-0">{n} star</span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-chalk" aria-hidden="true">
              <span className="block h-full bg-accent-500" style={{ width: `${(count / reviews.length) * 100}%` }} />
            </span>
            <span className="w-8 text-right text-charcoal-600">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewList({ reviews }: { reviews: Review[] }) {
  return (
    <div className="space-y-6">
      <Summary reviews={reviews} />
      <ul className="space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-lg border-l-4 border-sky-500 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Stars rating={r.rating} />
              <span className="text-sm text-charcoal-600">{formatDate(r.created_at)}</span>
            </div>
            <p className="mt-3 whitespace-pre-line text-charcoal-800">{r.comment}</p>
            <p className="mt-3 font-semibold text-navy-900">
              {r.name}
              {relationshipLabel(r.relationship) && (
                <span className="font-normal text-charcoal-600"> · {relationshipLabel(r.relationship)}</span>
              )}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ReviewInput, unknown, ReviewData>({
    resolver: zodResolver(reviewSchema),
    mode: 'onTouched',
    defaultValues: { name: '', relationship: 'parent', comment: '', website: '' },
  });
  const chosen = Number(useWatch({ control, name: 'rating' })) || 0;

  const onSubmit = async (data: ReviewData) => {
    setServerError(null);
    try {
      await submitReview(data);
      setSent(true);
      reset();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  const err = (name: keyof ReviewInput) => errors[name]?.message;

  if (sent) {
    return (
      <div role="status" className="border-t-4 border-sky-500 bg-white p-7">
        <CheckCircle2 className="h-12 w-12 text-sky-500" aria-hidden="true" />
        <h2 className="mt-3 text-3xl font-extrabold text-navy-900">Thank you for your review</h2>
        <p className="mt-2 text-charcoal-600">
          The academy checks every review for spam before it appears on this page, usually within a few days.
        </p>
        <Button variant="outline-dark" className="mt-6" onClick={() => setSent(false)}>
          Write another review
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative space-y-5 bg-white p-6 sm:p-7">
      <h2 className="text-3xl font-extrabold text-navy-900">Write a review</h2>
      {!isSupabaseConfigured && (
        <p role="note" className="rounded-md bg-accent-300/30 p-4 text-sm">
          The review form will work once the website database is connected.
        </p>
      )}
      <fieldset aria-describedby={describedBy('rating', err('rating'))}>
        <legend className="mb-1.5 block font-semibold text-charcoal-900">
          Your rating
          <span className="text-cherry" aria-hidden="true">
            {' '}
            *
          </span>
        </legend>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded p-0.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-navy-700">
              <input type="radio" value={n} className="sr-only" {...register('rating')} />
              <Star
                className={`h-9 w-9 transition-colors ${n <= chosen ? 'fill-accent-500 text-accent-500' : 'text-charcoal-400'}`}
                aria-hidden="true"
              />
              <span className="sr-only">
                {n} {n === 1 ? 'star' : 'stars'}, {STAR_LABELS[n - 1]}
              </span>
            </label>
          ))}
          {chosen > 0 && <span className="ml-2 text-sm font-semibold text-charcoal-600">{STAR_LABELS[chosen - 1]}</span>}
        </div>
        {err('rating') && (
          <p id="rating-error" className="mt-1 text-sm font-medium text-cherry" role="alert">
            {err('rating')}
          </p>
        )}
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="review-name" label="Your name" required error={err('name')}>
          <input
            id="review-name"
            className="field-input"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy('review-name', err('name'))}
            {...register('name')}
          />
        </Field>
        <Field id="relationship" label="I am a" required error={err('relationship')}>
          <select
            id="relationship"
            className="field-input"
            aria-invalid={Boolean(errors.relationship)}
            aria-describedby={describedBy('relationship', err('relationship'))}
            {...register('relationship')}
          >
            {REVIEW_RELATIONSHIPS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="comment" label="Your review" required hint="Tell others about the coaching, training and your experience." error={err('comment')}>
        <textarea
          id="comment"
          rows={5}
          className="field-input"
          aria-invalid={Boolean(errors.comment)}
          aria-describedby={describedBy('comment', err('comment'), true)}
          {...register('comment')}
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
        Your name, rating and review will be shown publicly after the academy approves it. Please do not include phone
        numbers or other private details.
      </p>
      <Button type="submit" variant="navy" size="lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Sending…
          </>
        ) : (
          'Submit review'
        )}
      </Button>
    </form>
  );
}

export default function Reviews() {
  const state = useAsync(() => fetchReviews(), [], 'reviews');
  return (
    <>
      <Seo
        title="Cricket Academy Reviews in Swat"
        description="Reviews from players and parents of Swat Kings Cricket Academy, the cricket academy in Takhtaband, Mingora, Swat, Khyber Pakhtunkhwa."
      />
      <PageHeader title="Cricket academy reviews" intro="Honest reviews from parents, players and visitors. Every review is written by a real person." />
      <Container className="grid gap-10 py-12 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="reviews-heading">
          <h2 id="reviews-heading" className="sr-only">
            What people say
          </h2>
          <AsyncBlock
            state={state}
            empty={(d) => d.length === 0}
            emptyView={
              <EmptyState title="No reviews yet" icon={<MessageSquareQuote className="h-8 w-8" aria-hidden="true" />}>
                Be the first to share your experience with Swat Kings Cricket Academy.
              </EmptyState>
            }
          >
            {(reviews) => <ReviewList reviews={reviews} />}
          </AsyncBlock>
        </section>
        <div className="self-start lg:sticky lg:top-24">
          <ReviewForm />
        </div>
      </Container>
    </>
  );
}
