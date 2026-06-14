export const SELECT_CORPORATION_TITLE = 'Select corporation' as const;
export const SELECT_CEO_TITLE = 'Select CEO' as const;
export const SELECT_PROJECTS_TITLE = 'Select initial cards to buy' as const;

/** Title for the prelude selection step, with the required count. */
export function formatSelectPreludeTitle(count: number): string {
  if (count === 1) {
    return 'Select 1 Prelude card';
  }
  return `Select ${count} Prelude cards`;
}

/** Default prelude title for standard games (2 preludes). */
export const SELECT_PRELUDE_TITLE = formatSelectPreludeTitle(2);

/** Whether a select-card title is the prelude selection prompt. */
export function isSelectPreludeTitle(title: string): boolean {
  return title === 'Select 1 Prelude card' || /^Select \d+ Prelude cards$/.test(title);
}
