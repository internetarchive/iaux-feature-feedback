import {
  html,
  css,
  LitElement,
  nothing,
  CSSResultGroup,
  PropertyValues,
  TemplateResult,
} from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { msg } from '@lit/localize';

import type {
  SharedResizeObserverInterface,
  SharedResizeObserverResizeHandlerInterface,
} from '@internetarchive/shared-resize-observer';
import type {
  RecaptchaManagerInterface,
  RecaptchaWidgetInterface,
} from '@internetarchive/recaptcha-manager';
import type { FeatureFeedbackServiceInterface } from './feature-feedback-service';
import type { SurveyQuestion, SurveyQuestionResponse, Vote } from './models';
import { timedPromise } from './util/timed-promise';

import { thumbsUp } from './img/thumb-up';
import { thumbsDown } from './img/thumb-down';

@customElement('ia-feedback-survey')
export class FeedbackSurvey
  extends LitElement
  implements SharedResizeObserverResizeHandlerInterface
{
  /**
   * Internal identifier of the survey.
   */
  @property({ type: String }) surveyIdentifier?: string;

  /**
   * List of survey questions to render.
   */
  @property({ type: Array }) questions: SurveyQuestion[] = [];

  /**
   * What text to display on the button that opens the survey popup.
   */
  @property({ type: String }) buttonText = 'Feedback';

  /**
   * Whether to show the up/down thumbs beside the feedback button text (default `false`).
   */
  @property({ type: Boolean }) showButtonThumbs = false;

  /**
   * Whether to show question numbers beside each survey question (default `false`).
   */
  @property({ type: Boolean }) showQuestionNumbers = false;

  /**
   * Whether the widget is disabled, preventing it from opening (default `false`).
   */
  @property({ type: Boolean }) disabled = false;

  /**
   * Time-out threshold, in milliseconds for submit operations (default `8000`).
   */
  @property({ type: Number }) submitTimeout = 8000;

  /**
   * Feature Feedback Service instance to handle survey submissions.
   */
  @property({ type: Object })
  featureFeedbackService?: FeatureFeedbackServiceInterface;

  /**
   * Recaptcha Manager instance for generating the Recaptcha widget and tokens.
   */
  @property({ type: Object }) recaptchaManager?: RecaptchaManagerInterface;

  /**
   * Shared Resize Observer instance to reposition the popup when the page is resized.
   */
  @property({ type: Object }) resizeObserver?: SharedResizeObserverInterface;

  /**
   * Map from survey questions to their response models.
   */
  @state() private responses: Map<SurveyQuestion, SurveyQuestionResponse> =
    new Map();

  /**
   * Whether the popup is currently open.
   */
  @state() private isOpen = false;

  /**
   * Whether a survey submission is currently in progress.
   */
  @state() private processing = false;

  /**
   * X-coordinate of the popup's top left corner.
   */
  @state() private popupTopX = 0;

  /**
   * Y-coordinate of the popup's top left corner.
   */
  @state() private popupTopY = 0;

  /**
   * Whether the survey has been successfully submitted.
   */
  @state() private surveySubmitted = false;

  /**
   * Whether the last survey submission attempt was missing required fields.
   */
  @state() private missingRequiredInput = false;

  /**
   * Error message to display.
   */
  @state() private error?: TemplateResult;

  /**
   * The feedback button's container element.
   */
  @query('#container') private container!: HTMLDivElement;

  /**
   * The outer container element of the popup.
   */
  @query('#popup') private popup!: HTMLDivElement;

  /**
   * Promise for any currently loading Recaptcha widget, resolving to the widget when
   * it is finished loading.
   */
  private recaptchaWidgetPromise?: Promise<RecaptchaWidgetInterface>;

  private resizingElement = document.body;

  /**
   * Default placeholder text for required comment boxes.
   */
  private static readonly DEFAULT_COMMENT_PLACEHOLDER_REQUIRED =
    msg('Comments');

  /**
   * Default placeholder text for optional comment boxes.
   */
  private static readonly DEFAULT_COMMENT_PLACEHOLDER_OPTIONAL = msg(
    'Comments (optional)'
  );

  /**
   * Error message to show when some required questions do not have responses.
   */
  private static readonly ERROR_MESSAGE_MISSING_REQUIRED_INPUT = msg(
    'Please respond to the indicated questions.'
  );

  /**
   * Error message to show when the survey submission encounters an error response.
   */
  private static readonly ERROR_MESSAGE_SUBMIT_REQUEST_FAILED = msg(
    'There was an error submitting your feedback.'
  );

  //
  // METHODS
  //

  render() {
    return html`<div id="container">${this.feedbackButtonTemplate}</div>`;
  }

  updated(changed: PropertyValues): void {
    if (changed.has('questions')) {
      this.resetSubmissionState();
      this.regenerateResponseMap();
    }

    if (changed.has('resizeObserver')) {
      const oldObserver = changed.get(
        'resizeObserver'
      ) as SharedResizeObserverInterface;
      this.disconnectResizeObserver(oldObserver);
    }
  }

  disconnectedCallback(): void {
    this.removeEscapeListener();
    this.disconnectResizeObserver(this.resizeObserver);
  }

  /**
   * Repositions any open popup when the window resizes.
   */
  handleResize() {
    if (this.isOpen) {
      this.positionPopup();
    }
  }

  /**
   * Repositions any open popup to account for the new scroll position.
   *
   * (Uses an arrow function to achieve lexical `this` binding, so that we don't
   * need to manually bind it)
   */
  private handleScroll = () => {
    if (this.isOpen) {
      this.positionPopup();
    }
  };

  /**
   * Handles Escape key events by closing the popup as though the Cancel button
   * were clicked.
   *
   * (Uses an arrow function to achieve lexical `this` binding, so that we don't
   * need to manually bind it)
   */
  private handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.cancel(e);
    }
  };

  private setupEscapeListener() {
    document.addEventListener('keyup', this.handleEscape);
  }

  private removeEscapeListener() {
    document.removeEventListener('keyup', this.handleEscape);
  }

  private setupScrollObserver() {
    document.addEventListener('scroll', this.handleScroll);
  }

  private stopScrollObserver() {
    document.removeEventListener('scroll', this.handleScroll);
  }

  private setupResizeObserver() {
    if (!this.resizeObserver) return;
    this.resizeObserver.addObserver({
      handler: this,
      target: this.resizingElement,
    });
  }

  private disconnectResizeObserver(observer?: SharedResizeObserverInterface) {
    const observerToRemove = observer ?? this.resizeObserver;
    observerToRemove?.removeObserver({
      handler: this,
      target: this.resizingElement,
    });
  }

  /**
   * Requests the Recaptcha Manager generate the Recaptcha widget if possible.
   *
   * Returns `undefined` if no Recaptcha Manager is available.
   *
   * If this method has been called already, it will return the Promise generated
   * by the previous call.
   *
   * Otherwise, a new widget is requested, with the resulting Promise returned
   * and saved to `this.recaptchaWidgetPromise` for other consumers to await.
   */
  private getRecaptchaWidget(): Promise<RecaptchaWidgetInterface> | undefined {
    // If we've already started generating a widget, return the previous Promise.
    if (this.recaptchaWidgetPromise) return this.recaptchaWidgetPromise;

    if (!this.recaptchaManager) return undefined;
    this.recaptchaWidgetPromise = this.recaptchaManager.getRecaptchaWidget();

    return this.recaptchaWidgetPromise;
  }

  /**
   * Rebuilds the map of survey responses to match the current list of questions.
   * This will erase any previously-entered survey responses.
   */
  private regenerateResponseMap(): void {
    this.responses = new Map(
      this.questions.map((question, index) => [
        question,
        {
          question,
          index,
          vote: undefined,
          comment: question.type === 'extra' ? question.extraInfo : undefined,
        },
      ]) as [SurveyQuestion, SurveyQuestionResponse][]
    );
  }

  /**
   * Gets the survey response model for the given question.
   * Returns `undefined` if no such response exists.
   */
  private responseFor(
    question: SurveyQuestion
  ): SurveyQuestionResponse | undefined {
    return this.responses.get(question);
  }

  /**
   * Gets the survey response model for the question at the given index.
   * Returns `undefined` if no such response exists.
   */
  private responseAtIndex(
    index?: number | string
  ): SurveyQuestionResponse | undefined {
    const numericIndex = Number(index);
    return [...this.responses.values()].find(r => r.index === numericIndex);
  }

  /**
   * Resets the widget submission/error state back to defaults.
   * Questions and responses are unaffected.
   */
  private resetSubmissionState(): void {
    this.surveySubmitted = false;
    this.error = undefined;
    this.missingRequiredInput = false;
  }

  /**
   * Opens the popup pane, provided the survey has not already been submitted.
   *
   * This will also trigger the Recaptcha widget to begin loading, if it has not already.
   */
  private async showPopup(): Promise<void> {
    if (this.surveySubmitted) return;

    this.setupResizeObserver();
    this.setupScrollObserver();
    this.setupEscapeListener();
    this.positionPopup();
    this.isOpen = true;
    this.getRecaptchaWidget();
  }

  /**
   * Closes the popup pane and removes any listeners.
   */
  private closePopup(): void {
    this.disconnectResizeObserver();
    this.stopScrollObserver();
    this.removeEscapeListener();
    this.isOpen = false;
  }

  /**
   * Positions the popup pane so that it resides entirely within the viewport, if possible.
   */
  private positionPopup(): void {
    const containerRect = this.container.getBoundingClientRect();
    const popupRect = this.popup.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowCenterX = windowWidth / 2;
    const windowCenterY = windowHeight / 2;
    if (containerRect.left < windowCenterX) {
      this.popupTopX = containerRect.right - 20;
    } else {
      this.popupTopX = containerRect.left + 20 - popupRect.width;
    }
    this.popupTopX = Math.max(0, this.popupTopX);
    if (this.popupTopX + popupRect.width > windowWidth) {
      this.popupTopX = windowWidth - popupRect.width;
    }

    if (containerRect.top < windowCenterY) {
      this.popupTopY = containerRect.bottom - 10;
    } else {
      this.popupTopY = containerRect.top + 10 - popupRect.height;
    }
  }

  /**
   * Template for the feedback button's up/down thumb icons, if they are to be shown.
   */
  private get feedbackButtonThumbsTemplate() {
    if (!this.showButtonThumbs) return nothing;

    return html`
      <span class="beta-button-icon">${thumbsUp}</span>
      <span class="beta-button-icon">${thumbsDown}</span>
    `;
  }

  /**
   * Template for the feedback button's success checkmark.
   */
  private get feedbackButtonCheckTemplate() {
    return html`<span class="beta-button-icon success">&check;</span>`;
  }

  /**
   * Template for the feedback button that opens the survey when clicked.
   */
  private get feedbackButtonTemplate() {
    return html`
      <button
        id="beta-button"
        tabindex="0"
        ?disabled=${this.disabled}
        @click=${this.showPopup}
      >
        <span id="button-text">${this.buttonText}</span>
        ${this.surveySubmitted
          ? this.feedbackButtonCheckTemplate
          : this.feedbackButtonThumbsTemplate}
      </button>
      ${this.popupTemplate}
    `;
  }

  /**
   * Generates a template for up/down voting buttons for the given survey question,
   * if it requires them (i.e., if it has `type: 'vote'`). The vote selection is
   * determined by the question's current repsonse.
   */
  private voteQuestionTemplate(question: SurveyQuestion) {
    if (question.type !== 'vote') return nothing;

    const response = this.responseFor(question);
    if (!response) return nothing;

    const upvoteSelected = response.vote === 'up';
    const downvoteSelected = response.vote === 'down';
    const voteNotSelected = response.vote === undefined;
    const hasError =
      this.missingRequiredInput && !!question.required && voteNotSelected;

    const voteButtonBaseClasses = {
      'vote-button': true,
      noselection: voteNotSelected,
      error: hasError,
    };

    const upvoteButtonClassMap = classMap({
      ...voteButtonBaseClasses,
      'upvote-button': true,
      selected: upvoteSelected,
      unselected: downvoteSelected,
    });

    const downvoteButtonClassMap = classMap({
      ...voteButtonBaseClasses,
      'downvote-button': true,
      selected: downvoteSelected,
      unselected: upvoteSelected,
    });

    return html`
      <label
        class=${upvoteButtonClassMap}
        tabindex="0"
        role="button"
        aria-pressed=${upvoteSelected}
        data-index=${response.index}
        @click=${this.upvoteButtonSelected}
        @keyup=${this.upvoteKeypressed}
      >
        <input
          type="radio"
          name="vote"
          value="up"
          data-index=${response.index}
          ?checked=${upvoteSelected}
          @click=${this.upvoteButtonSelected}
        />
        ${thumbsUp}
      </label>

      <label
        class=${downvoteButtonClassMap}
        tabindex="0"
        role="button"
        aria-pressed=${downvoteSelected}
        data-index=${response.index}
        @click=${this.downvoteButtonSelected}
        @keyup=${this.downvoteKeypressed}
      >
        <input
          type="radio"
          name="vote"
          value="down"
          data-index=${response.index}
          ?checked=${downvoteSelected}
          @click=${this.downvoteButtonSelected}
        />
        ${thumbsDown}
      </label>
    `;
  }

  /**
   * Generates a template for a comment text area for the given survey question, if one
   * is required (i.e., if it has `allowComments: true`). Its value is determined by
   * the question's current response.
   */
  private commentBoxTemplate(question: SurveyQuestion) {
    if (question.type === 'extra' || !question.allowComments) return nothing;

    const response = this.responseFor(question);
    if (!response) return nothing;

    const defaultPlaceholder =
      question.required && question.type === 'comment'
        ? FeedbackSurvey.DEFAULT_COMMENT_PLACEHOLDER_REQUIRED
        : FeedbackSurvey.DEFAULT_COMMENT_PLACEHOLDER_OPTIONAL;

    const placeholder = question.commentPlaceholder ?? defaultPlaceholder;
    const hasError =
      this.missingRequiredInput &&
      !!question.required &&
      question.type === 'comment' &&
      !response.comment;

    const { commentHeight, commentResize } = question;
    const commentStyles = styleMap({
      height: commentHeight ? `${commentHeight}px` : null,
      resize: commentResize ?? null,
    });

    return html`<div class="comments-container">
      <textarea
        placeholder=${placeholder}
        class="comments ${hasError ? 'error' : ''}"
        name="comments"
        tabindex="0"
        data-index=${response.index}
        style=${commentStyles}
        ?disabled=${this.processing}
        .value=${response.comment ?? ''}
        @input=${this.saveComment}
      ></textarea>
    </div>`;
  }

  /**
   * Generates a template for the given survey question, including its prompt
   * and any vote buttons or comment field required.
   */
  private questionTemplate(question: SurveyQuestion, questionIndex: number) {
    const response = this.responseFor(question);
    if (!response) return nothing;

    // Note this rendered number excludes 'extra'-type fields, and therefore may
    // differ from the internal response indices.
    const questionNumber = this.showQuestionNumbers
      ? `${questionIndex + 1}. `
      : '';

    const voteTemplate = this.voteQuestionTemplate(question);
    const commentBox = this.commentBoxTemplate(question);

    return html`
      <li class="question" data-index=${response.index}>
        <div class="prompt">
          <div class="prompt-text">
            ${questionNumber}${question.questionText}
          </div>
          ${voteTemplate}
        </div>
        ${commentBox}
      </li>
    `;
  }

  /**
   * Template for the full popup survey that appears when the feedback
   * button is clicked.
   */
  private get popupTemplate() {
    return html`
      <div
        id="popup-background"
        class=${this.isOpen ? 'open' : 'closed'}
        @click=${this.backgroundClicked}
        @keyup=${this.backgroundClicked}
      >
        <div
          id="popup"
          style="left: ${this.popupTopX}px; top: ${this.popupTopY}px"
        >
          <form
            id="form"
            ?disabled=${this.processing || this.surveySubmitted}
            @submit=${this.submit}
          >
            <ol id="question-list">
              ${repeat(
                this.questions.filter(q => q.type !== 'extra'),
                q => this.responseFor(q)?.index,
                this.questionTemplate.bind(this)
              )}
            </ol>
            ${this.error ? html`<div id="error">${this.error}</div>` : nothing}
            <div id="actions">
              <button
                id="cancel-button"
                class="cta-button"
                tabindex="0"
                ?disabled=${this.processing}
                @click=${this.cancel}
              >
                ${msg('Cancel')}
              </button>
              <input
                type="submit"
                id="submit-button"
                class="cta-button"
                tabindex="0"
                ?disabled=${this.processing}
                .value=${this.processing ? 'Submitting...' : 'Submit feedback'}
              />
            </div>
          </form>
        </div>
      </div>
    `;
  }

  private upvoteKeypressed(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      this.upvoteButtonSelected(e);
    }
  }

  private downvoteKeypressed(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      this.downvoteButtonSelected(e);
    }
  }

  private upvoteButtonSelected(e: Event) {
    this.handleVoteButtonSelection(e, 'up');
  }

  private downvoteButtonSelected(e: Event) {
    this.handleVoteButtonSelection(e, 'down');
  }

  /**
   * Saves the entered vote for the survey question that was interacted with.
   */
  private async handleVoteButtonSelection(e: Event, vote: Vote) {
    if (this.processing || this.surveySubmitted) return;
    const target = e.target as HTMLElement;
    const response = this.responseAtIndex(target?.dataset.index);
    if (response) response.vote = vote;
    this.requestUpdate();
  }

  /**
   * Saves the entered comment for the survey question that was interacted with.
   */
  private saveComment(e: InputEvent): void {
    if (this.processing || this.surveySubmitted) return;
    const target = e.target as HTMLTextAreaElement;
    const response = this.responseAtIndex(target?.dataset.index);
    if (response) response.comment = target?.value;
  }

  /**
   * Handler for when the background layer outside the popup is clicked, treated
   * as though the Cancel button were clicked.
   */
  private backgroundClicked(e: MouseEvent) {
    if (!(e.target instanceof Node)) return;
    if (this.popup?.contains(e.target)) return;
    this.cancel(e);
  }

  /**
   * Closes the survey popup and resets any submission error state.
   */
  private cancel(e: Event) {
    e.preventDefault();
    this.closePopup();
    if (!this.surveySubmitted) this.resetSubmissionState();
  }

  /**
   * Returns a boolean indicating whether all required survey questions have received a
   * valid response.
   *
   * - Questions with `required: true` and `type: 'vote'` must have an up/down vote recorded.
   * - Questions with `required: true` and `type: 'comment'` must have a comment recorded.
   * - Questions without `required: true`, or having `type: 'extra'`, are always valid.
   */
  private validate(): boolean {
    // No required questions are missing a response
    return [...this.responses.values()].every(resp => {
      const isRequired = resp.question.required;
      if (!isRequired) return true;

      const questionType = resp.question.type;
      switch (questionType) {
        case 'extra':
          return true;
        case 'vote':
          return !!resp.vote;
        case 'comment':
          return !!resp.comment;
        default:
          return false;
      }
    });
  }

  /**
   * Handles survey form submit events by attempting to submit the responses
   * to the server, provided all required responses have been entered.
   */
  private async submit(e?: Event) {
    e?.preventDefault();

    if (!this.validate()) {
      this.missingRequiredInput = true;
      this.error = html`${FeedbackSurvey.ERROR_MESSAGE_MISSING_REQUIRED_INPUT}`;
      return;
    }

    const { surveyIdentifier, submitTimeout, featureFeedbackService } = this;

    if (!surveyIdentifier) {
      throw new Error('surveyIdentifier is required');
    }

    if (!featureFeedbackService) {
      throw new Error('featureFeedbackService is required');
    }

    const recaptchaWidgetPromise = this.getRecaptchaWidget();
    let recaptchaWidget: RecaptchaWidgetInterface | undefined;
    try {
      recaptchaWidget = await timedPromise(
        recaptchaWidgetPromise,
        submitTimeout
      );
    } catch (err) {
      throw new Error(`recaptchaWidget load failed: ${err}`);
    }

    if (!recaptchaWidget) {
      throw new Error('recaptchaWidget is required');
    }

    const popupWasOpen = this.isOpen;
    this.processing = true;

    try {
      const token = await timedPromise(
        recaptchaWidget.execute(),
        submitTimeout
      );

      const response = await timedPromise(
        featureFeedbackService.submitSurvey({
          surveyIdentifier,
          responses: [...this.responses.values()],
          recaptchaToken: token,
        }),
        submitTimeout
      );

      if (response.success) {
        this.surveySubmitted = true;
        if (popupWasOpen) this.closePopup();
      } else {
        this.error = html`${FeedbackSurvey.ERROR_MESSAGE_SUBMIT_REQUEST_FAILED}`;
      }
    } catch (err) {
      this.error = html`${FeedbackSurvey.ERROR_MESSAGE_SUBMIT_REQUEST_FAILED}
        <br />
        ${msg('Error: ')}${err instanceof Error ? err.message : err}`;
    }

    this.processing = false;
  }

  static get styles(): CSSResultGroup {
    const blueColor = css`var(--featureFeedbackBlueColor, #194880)`;
    const darkGrayColor = css`var(--featureFeedbackDarkGrayColor, #767676)`;
    const darkGrayColorSvgFilter = css`var(--defaultColorSvgFilter, invert(52%) sepia(0%) saturate(1%) hue-rotate(331deg) brightness(87%) contrast(89%))`;

    const backdropZindex = css`var(--featureFeedbackBackdropZindex, 5)`;
    const modalZindex = css`var(--featureFeedbackModalZindex, 6)`;

    const popupMaxWidth = css`var(--featureFeedbackPopupMaxWidth, 300px)`;
    const popupBorderColor = css`var(--featureFeedbackPopupBorderColor, ${blueColor})`;
    const submitButtonColor = css`var(--featureFeedbackSubmitButtonColor, ${blueColor})`;
    const betaButtonBorderColor = css`var(--featureFeedbackBetaButtonBorderColor, ${blueColor})`;
    const betaButtonTextColor = css`var(--featureFeedbackBetaButtonTextColor, ${blueColor})`;
    const betaButtonSvgFilter = css`var(--featureFeedbackBetaButtonSvgFilter, ${darkGrayColorSvgFilter})`;

    const cancelButtonColor = css`var(--featureFeedbackCancelButtonColor, #515151)`;
    const popupBlockerColor = css`var(--featureFeedbackPopupBlockerColor, rgba(255, 255, 255, 0.3))`;

    const popupBackgroundColor = css`var(--featureFeedbackPopupBackgroundColor, #F5F5F7)`;

    const promptFontWeight = css`var(--featureFeedbackPromptFontWeight, bold)`;
    const promptFontSize = css`var(--featureFeedbackPromptFontSize, 1.4rem)`;

    const defaultColor = css`var(--defaultColor, ${darkGrayColor});`;
    const defaultColorSvgFilter = css`var(--defaultColorSvgFilter, ${darkGrayColorSvgFilter});`;

    const upvoteColor = css`var(--upvoteColor, #23765D);`;
    const upvoteColorSvgFilter = css`var(--upvoteColorSvgFilter, invert(34%) sepia(72%) saturate(357%) hue-rotate(111deg) brightness(97%) contrast(95%));`;

    const downvoteColor = css`var(--downvoteColor, #720D11);`;
    const downvoteColorSvgFilter = css`var(--downvoteColorSvgFilter, invert(5%) sepia(81%) saturate(5874%) hue-rotate(352deg) brightness(105%) contrast(95%));`;

    const unselectedColor = css`var(--unselectedColor, #CCCCCC);`;
    const unselectedColorSvgFilter = css`var(--unselectedColorSvgFilter, invert(100%) sepia(0%) saturate(107%) hue-rotate(138deg) brightness(89%) contrast(77%));`;

    return css`
      #container {
        display: inline-block;
      }

      #beta-button {
        font-size: 12px;
        font-weight: bold;
        font-style: italic;
        color: ${betaButtonTextColor};
        border: 1px solid ${betaButtonBorderColor};
        border-radius: 4px;
        padding: 1px 5px;
      }

      .beta-button-icon {
        line-height: 100%;
      }

      .beta-button-icon svg {
        height: 10px;
        width: 10px;
        filter: ${betaButtonSvgFilter};
      }

      .beta-button-icon.success {
        filter: ${upvoteColorSvgFilter};
      }

      #error {
        margin-bottom: 10px;
        color: red;
        font-size: 14px;
        text-align: center;
        font-weight: bold;
      }

      #popup-background {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: ${backdropZindex};
        background-color: ${popupBlockerColor};
        overflow: hidden;
      }

      #popup-background.closed {
        visibility: hidden;
        top: -100%;
        left: -100%;
      }

      #popup {
        position: absolute;
        padding: 10px;
        background-color: ${popupBackgroundColor};
        border: 1px ${popupBorderColor} solid;
        border-radius: 5px;
        box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        z-index: ${modalZindex};
        max-width: ${popupMaxWidth};
        margin-left: 10px;
        margin-right: 10px;
      }

      button,
      input,
      a,
      textarea {
        font-family: inherit;
      }

      button,
      input[type='submit'] {
        background: none;
        cursor: pointer;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        border: none;
      }

      button:disabled,
      input[type='submit']:disabled {
        cursor: default;
        opacity: 0.5;
      }

      #form > div:last-child {
        margin-bottom: 0;
      }

      #question-list {
        list-style-type: none;
        margin: 0;
        padding: 0;
      }

      .question {
        margin-bottom: 15px;
      }

      .question:last-of-type {
        margin-bottom: 10px;
      }

      .prompt {
        display: flex;
        align-items: center;
        margin-bottom: 5px;
        font-size: ${promptFontSize};
        font-weight: ${promptFontWeight};
      }

      .prompt > label {
        flex: none;
        cursor: pointer;
      }

      .prompt-text {
        text-align: left;
      }

      .comments {
        width: 100%;
        height: 50px;
        background-color: #ffffff;
        border: 1px #2c2c2c solid;
        border-radius: 4px;
        padding: 7px;
        -webkit-box-sizing: border-box;
        -moz-box-sizing: border-box;
        box-sizing: border-box;
        resize: none;
      }

      .comments::placeholder {
        color: #767676;
      }

      #actions {
        display: flex;
        justify-content: center;
      }

      .cta-button {
        color: white;
        font-size: 14px;
        border-radius: 4px;
        height: 30px;
        margin: 0;
      }

      #cancel-button {
        background-color: ${cancelButtonColor};
      }

      #submit-button {
        background-color: ${submitButtonColor};
        margin-left: 10px;
      }

      .vote-button {
        background-color: #ffffff;
        border: 1px solid #767676;
        border-radius: 2px;
        padding: 0;
        width: 25px;
        height: 25px;
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-left: 10px;
      }

      .vote-button svg {
        width: 15px;
        height: 15px;
      }

      .vote-button input {
        margin: 0;
        padding: 0;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
      }

      .vote-button.noselection {
        border-color: ${defaultColor};
      }

      .vote-button.noselection svg {
        filter: ${defaultColorSvgFilter};
      }

      .vote-button.unselected {
        border-color: ${unselectedColor};
      }

      .vote-button.unselected svg {
        filter: ${unselectedColorSvgFilter};
      }

      .upvote-button.selected {
        border-color: ${upvoteColor};
      }

      .upvote-button.selected svg {
        filter: ${upvoteColorSvgFilter};
      }

      .downvote-button.selected {
        border-color: ${downvoteColor};
      }

      .downvote-button.selected svg {
        filter: ${downvoteColorSvgFilter};
      }

      .vote-button.error,
      .comments.error {
        box-shadow: 0 0 4px red;
      }

      form[disabled] .vote-button.unselected {
        cursor: not-allowed;
      }
    `;
  }
}
