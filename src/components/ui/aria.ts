/** Returns the id of the error or hint element that describes a form control. */
export function describedBy(id: string, error?: string, hint?: boolean) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}
