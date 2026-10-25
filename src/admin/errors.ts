/** Turns database errors into short, readable admin messages. */
export function friendlyDbError(message: string): string {
  if (/row-level security|permission denied/i.test(message))
    return 'You do not have permission to do this. Make sure your account has the admin role.';
  if (/duplicate key.*slug/i.test(message)) return 'That web address (slug) is already used. Choose a different one.';
  if (/duplicate key.*fixture_id/i.test(message)) return 'This fixture already has a result. Edit the existing result instead.';
  if (/coaches_qualifications_must_be_verified/.test(message))
    return 'Tick “Qualifications verified” before saving qualifications, or leave the qualifications empty.';
  if (/player_profiles_public_requires_consent/.test(message))
    return 'A player profile can only be public after consent has been confirmed.';
  if (/programmes_spots_within_capacity/.test(message)) return 'Places available cannot be more than the capacity.';
  if (/announcements_published_needs_date/.test(message)) return 'Published announcements need a publish date.';
  if (/violates check constraint/i.test(message)) return 'One of the values is not allowed. Check the form and try again.';
  return message;
}
