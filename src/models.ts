export type Vote = 'up' | 'down';

export type FeatureFeedbackDisplayMode = 'button' | 'vote-prompt';

/**
 * Available types of survey questions. Currently only supports:
 *  - `comment` for rendering comment-only questions without any rating buttons.
 *  - `vote` for rendering up/down thumb voting buttons (optionally with a comment box).
 *  - `extra` for including additional information in survey responses, such as a search query.
 *    These questions are not rendered visually, simply submitting the contents of their `extraInfo` field.
 *
 * Could be extended to support a wider variety of question types, like rating scales.
 */
export type SurveyQuestionType = 'comment' | 'vote' | 'extra';

/**
 * Details about a question to be asked within a feedback survey.
 */
export type SurveyQuestion = {
  /**
   * The text of the question being asked.
   */
  questionText: string;

  /**
   * Which type of survey question (e.g., `vote` for up/down voting, `comment` for comment-only).
   */
  type: SurveyQuestionType;

  /**
   * Whether this question must receive a response before the form can be submitted.
   *
   * What kind of response is required depends on the question type:
   *  - For questions with `type: 'vote'`, an up/down vote is required. Comments on these questions are still optional, if present.
   *  - For questions with `type: 'comment'`, a non-empty comment is required.
   *  - For questions with `type: 'extra'`, nothing is required and this field is ignored.
   */
  required?: boolean;

  /**
   * Whether to render a comment box for this question.
   */
  allowComments?: boolean;

  /**
   * Text to use as a placeholder for the comment box, if applicable.
   * The placeholder defaults to "Comments (optional)" if not specified.
   */
  commentPlaceholder?: string;

  /**
   * Optional height (in pixels) of the comment box, if applicable.
   * The box defaults to a height of 50px if not specified.
   */
  commentHeight?: number;

  /**
   * Which directions the user should optionally be able to resize the comment box in.
   * Defaults to `none` if not specified.
   */
  commentResize?: 'none' | 'vertical' | 'horizontal' | 'both';

  /**
   * Additional text that should be included with the survey response for questions with `type: 'extra'`.
   * This text will be submitted as the "comment" for such questions.
   */
  extraInfo?: string;
};

/**
 * Details about a user's current response to a feedback survey question.
 */
export type SurveyQuestionResponse = {
  /**
   * The survey question that this response corresponds to.
   */
  question: SurveyQuestion;

  /**
   * The index of this survey question in the list.
   */
  index: number;

  /**
   * The user's text comment response to the question, if applicable.
   */
  comment?: string;

  /**
   * The user's up/down vote response to the question, if applicable.
   */
  vote?: Vote;
};
