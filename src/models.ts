export type Vote = 'up' | 'down';

export type FeatureFeedbackDisplayMode = 'button' | 'vote-prompt';

/**
 * An error to show in the feedback popup. The message text comes from this at
 * render time, so it follows the current locale.
 */
export type FeatureFeedbackError =
  | { kind: 'noVote' }
  | { kind: 'submitFailed'; detail?: string };
