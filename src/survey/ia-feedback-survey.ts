import {
  html,
  css,
  LitElement,
  nothing,
  CSSResultGroup,
  PropertyValues,
  TemplateResult,
} from 'lit';
import {
  customElement,
  property,
  state,
  query,
  queryAssignedElements,
} from 'lit/decorators.js';
import { msg } from '@lit/localize';

import type {
  SharedResizeObserverInterface,
  SharedResizeObserverResizeHandlerInterface,
} from '@internetarchive/shared-resize-observer';
import type {
  RecaptchaManagerInterface,
  RecaptchaWidgetInterface,
} from '@internetarchive/recaptcha-manager';
import { iaButtonStyles } from '@internetarchive/ia-styles';

import type { FeatureFeedbackServiceInterface } from '../feature-feedback-service';
import {
  canBeDisabled,
  canBeValidated,
  hasSurveyResponse,
  SurveySubmissionState,
} from './models';
import { timedPromise } from '../util/timed-promise';

import { thumbsUp } from '../img/thumb-up';
import { thumbsDown } from '../img/thumb-down';

@customElement('ia-feedback-survey')
export class IAFeedbackSurvey
  extends LitElement
  implements SharedResizeObserverResizeHandlerInterface
{
  /**
   * Internal identifier of the survey.
   */
  @property({ type: String }) surveyIdentifier?: string;

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
   * Whether the popup is currently open.
   */
  @state() private isOpen = false;

  /**
   * The current state of the widget's survey submission.
   *  - `idle`: No submit has succeeded or been attempted since the popup was last toggled.
   *  - `processing`: The widget is currently submitting a response.
   *  - `submitted`: The widget has successfully submitted a response.
   *  - `error`: The widget encountered an error while submitting its last response,
   *    and the popup has not yet been closed.
   */
  @state() private submissionState: SurveySubmissionState = 'idle';

  /**
   * X-coordinate of the popup's top left corner.
   */
  @state() private popupTopX = 0;

  /**
   * Y-coordinate of the popup's top left corner.
   */
  @state() private popupTopY = 0;

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
   * The popup form's submit button
   */
  @query('#submit-button') private submitButton!: HTMLInputElement;

  /**
   * All elements assigned to the default slot
   */
  @queryAssignedElements() private assignedElements!: HTMLElement[];

  /**
   * Promise for any currently loading Recaptcha widget, resolving to the widget when
   * it is finished loading.
   */
  private recaptchaWidgetPromise?: Promise<RecaptchaWidgetInterface>;

  private resizingElement = document.body;

  /**
   * Text to show on the submit button when idle.
   */
  private static readonly SUBMIT_BUTTON_NORMAL_TEXT = msg('Submit feedback');

  /**
   * Text to show on the submit button while submitting a response.
   */
  private static readonly SUBMIT_BUTTON_PROCESSING_TEXT = msg('Submitting...');

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

  willUpdate(changed: PropertyValues): void {
    if (changed.has('submissionState')) {
      if (this.isProcessing || this.isSubmitted) {
        this.disableSlottedChildren();
      } else {
        this.restoreSlottedChildrenDisabledStates();
      }
    }

    if (changed.has('resizeObserver')) {
      const oldObserver = changed.get(
        'resizeObserver'
      ) as SharedResizeObserverInterface;
      this.disconnectResizeObserver(oldObserver);
    }
  }

  updated(changed: PropertyValues): void {
    const priorSubmissionState = changed.get('submissionState');
    if (priorSubmissionState) {
      if (
        this.submissionState === 'error' ||
        priorSubmissionState === 'error'
      ) {
        // Transitioning to or from the `error` state can change the height of the popup,
        // so we may need to reposition.
        this.positionPopup();
      }
    }

    if (changed.has('isOpen') && this.isOpen) {
      this.focusFirstFormElement();
    }
  }

  disconnectedCallback(): void {
    this.removeEscapeListener();
    this.disconnectResizeObserver(this.resizeObserver);
  }

  /**
   * Sets all disableable slotted children to be disabled, and sets their `originallyDisabled`
   * data property to `true` if they were already disabled.
   */
  private disableSlottedChildren(): void {
    this.assignedElements.filter(canBeDisabled).forEach(elmt => {
      elmt.dataset.originallyDisabled = elmt.disabled ? 'true' : 'false';
      elmt.disabled = true;
    });
  }

  /**
   * Sets all disableable slotted children to their original disabled state if possible.
   * Will only mutate any children that have an `originallyDisabled` data property set,
   * and will subsequently remove it from the dataset if found.
   */
  private restoreSlottedChildrenDisabledStates(): void {
    this.assignedElements.filter(canBeDisabled).forEach(elmt => {
      const { originallyDisabled } = elmt.dataset;
      if (originallyDisabled === undefined) return;

      const originalState = originallyDisabled === 'true';
      delete elmt.dataset.originallyDisabled;
      elmt.disabled = originalState;
    });
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
   * Resets the widget submission/error state back to defaults.
   * Questions and responses are unaffected.
   */
  private resetSubmissionState(): void {
    this.setSubmissionState('idle');
    this.error = undefined;
  }

  /**
   * Sets the submission state to the given value, emitting a state change event
   * if it differs from the old state.
   */
  private setSubmissionState(newState: SurveySubmissionState): void {
    if (this.submissionState === newState) return;

    this.submissionState = newState;
    this.emitSubmissionStateChanged();
  }

  /**
   * Emits a `submissionStateChanged` event with the current submission state.
   */
  private emitSubmissionStateChanged(): void {
    this.dispatchEvent(
      new CustomEvent('submissionStateChanged', {
        detail: this.submissionState,
      })
    );
  }

  /**
   * Whether the survey is currently submitting its responses.
   */
  private get isProcessing(): boolean {
    return this.submissionState === 'processing';
  }

  /**
   * Whether the survey has been successfully submitted.
   */
  private get isSubmitted(): boolean {
    return this.submissionState === 'submitted';
  }

  /**
   * Opens the popup pane, provided the survey has not already been submitted.
   *
   * This will also trigger the Recaptcha widget to begin loading, if it has not already.
   */
  private showPopup(): void {
    if (this.isSubmitted) return;

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
    const bufferX = 5;
    const bufferY = 5;

    if (containerRect.left < windowCenterX) {
      this.popupTopX = containerRect.right - 20;
    } else {
      this.popupTopX = containerRect.left + 20 - popupRect.width;
    }
    if (this.popupTopX + popupRect.width > windowWidth) {
      this.popupTopX = windowWidth - popupRect.width - bufferX;
    }

    if (containerRect.top < windowCenterY) {
      this.popupTopY = containerRect.bottom - 10;
    } else {
      this.popupTopY = containerRect.top + 10 - popupRect.height;
    }
    if (this.popupTopY + popupRect.height > windowHeight) {
      this.popupTopY = windowHeight - popupRect.height - bufferY;
    }

    this.popupTopX = Math.max(bufferX, this.popupTopX);
    this.popupTopY = Math.max(bufferY, this.popupTopY);
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
        aria-haspopup="dialog"
        ?disabled=${this.disabled}
        @click=${this.showPopup}
      >
        <span id="button-text">${this.buttonText}</span>
        ${this.isSubmitted
          ? this.feedbackButtonCheckTemplate
          : this.feedbackButtonThumbsTemplate}
      </button>
      ${this.popupTemplate}
    `;
  }

  /**
   * Template for the full popup survey that appears when the feedback
   * button is clicked.
   */
  private get popupTemplate() {
    const shouldDisableControls = this.isProcessing || this.isSubmitted;
    const submitButtonText = this.isProcessing
      ? IAFeedbackSurvey.SUBMIT_BUTTON_PROCESSING_TEXT
      : IAFeedbackSurvey.SUBMIT_BUTTON_NORMAL_TEXT;

    return html`
      <div
        id="popup-background"
        class=${this.isOpen ? 'open' : 'closed'}
        @click=${this.backgroundClicked}
        @keydown=${this.backgroundClicked}
      >
        <div
          class="focus-trap"
          tabindex="0"
          @focus=${this.focusSubmitButton}
        ></div>
        <div
          id="popup"
          role="dialog"
          aria-modal="true"
          aria-labelledby="survey-heading"
          style="left: ${this.popupTopX}px; top: ${this.popupTopY}px"
        >
          <h2 id="survey-heading" class="sr-only">${msg('Feedback Survey')}</h2>
          <form
            id="form"
            ?disabled=${shouldDisableControls}
            @click=${(e: Event) => e.stopPropagation()}
            @keydown=${(e: Event) => e.stopPropagation()}
            @submit=${this.submit}
          >
            <slot id="questions-slot"></slot>
            ${this.error ? html`<div id="error">${this.error}</div>` : nothing}
            <div id="actions">
              <button
                type="button"
                id="cancel-button"
                class="cta-button ia-button dark"
                tabindex="0"
                ?disabled=${shouldDisableControls}
                @click=${this.cancel}
              >
                ${msg('Cancel')}
              </button>
              <button
                type="submit"
                id="submit-button"
                class="cta-button ia-button primary"
                tabindex="0"
                ?disabled=${shouldDisableControls}
              >
                ${submitButtonText}
              </button>
            </div>
          </form>
        </div>
        <div
          class="focus-trap"
          tabindex="0"
          @focus=${this.focusFirstFormElement}
        ></div>
      </div>
    `;
  }

  /**
   * Assigns focus to the first slotted element in the form.
   */
  private focusFirstFormElement(): void {
    this.assignedElements[0]?.focus();
  }

  /**
   * Assigns focus to the submit button at the end of the form.
   */
  private focusSubmitButton(): void {
    this.submitButton?.focus();
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
    if (this.submissionState !== 'submitted') this.resetSubmissionState();
  }

  /**
   * Returns a boolean indicating whether all required survey questions have received a
   * valid response.
   *
   * Questions intended to participate in constraint validation must expose a `validate()`
   * method that performs whatever checks make sense for that question type. For instance,
   * required vote questions must have an up/down vote entered, while required comment-only
   * questions must have non-empty comment text.
   *
   * Any slotted children that do not have a `validate()` method will be ignored (i.e., they
   * are assumed to be valid).
   */
  private validate(): boolean {
    return this.assignedElements
      .filter(canBeValidated)
      .map(elmt => elmt.validate())
      .every(v => v);
  }

  /**
   * Handles survey form submit events by attempting to submit the responses
   * to the server, provided all required responses have been entered.
   */
  private async submit(e?: Event) {
    e?.preventDefault();

    if (!this.validate()) {
      this.error = html`${IAFeedbackSurvey.ERROR_MESSAGE_MISSING_REQUIRED_INPUT}`;
      this.setSubmissionState('error');
      return;
    }

    const { surveyIdentifier, submitTimeout, featureFeedbackService } = this;
    this.error = undefined;

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
    this.setSubmissionState('processing');

    try {
      const token = await timedPromise(
        recaptchaWidget.execute(),
        submitTimeout
      );

      const response = await timedPromise(
        featureFeedbackService.submitSurvey({
          surveyIdentifier,
          responses: this.assignedElements
            .filter(hasSurveyResponse)
            .map(elmt => elmt.response),
          recaptchaToken: token,
        }),
        submitTimeout
      );

      if (response.success) {
        this.setSubmissionState('submitted');
        if (popupWasOpen) this.closePopup();
      } else {
        this.error = html`${IAFeedbackSurvey.ERROR_MESSAGE_SUBMIT_REQUEST_FAILED}`;
        this.setSubmissionState('error');
      }
    } catch (err) {
      this.error = html`${IAFeedbackSurvey.ERROR_MESSAGE_SUBMIT_REQUEST_FAILED}
        <br />
        ${msg('Error: ')}${err instanceof Error ? err.message : err}`;
      this.setSubmissionState('error');
    }
  }

  static get styles(): CSSResultGroup {
    const blueColor = css`var(--featureFeedbackBlueColor, #194880)`;
    const darkGrayColorSvgFilter = css`var(--defaultColorSvgFilter, invert(52%) sepia(0%) saturate(1%) hue-rotate(331deg) brightness(87%) contrast(89%))`;

    const backdropZindex = css`var(--featureFeedbackBackdropZindex, 5)`;
    const modalZindex = css`var(--featureFeedbackModalZindex, 6)`;

    const popupMaxWidth = css`var(--featureFeedbackPopupMaxWidth, 300px)`;
    const popupVerticalPadding = css`var(--featureFeedbackPopupVerticalPadding, 10px)`;
    const popupHorizontalPadding = css`var(--featureFeedbackPopupHorizontalPadding, 10px)`;
    const popupPadding = css`
      ${popupVerticalPadding} ${popupHorizontalPadding}
    `;
    const popupBorderColor = css`var(--featureFeedbackPopupBorderColor, ${blueColor})`;
    const betaButtonBorderColor = css`var(--featureFeedbackBetaButtonBorderColor, ${blueColor})`;
    const betaButtonTextColor = css`var(--featureFeedbackBetaButtonTextColor, ${blueColor})`;
    const betaButtonSvgFilter = css`var(--featureFeedbackBetaButtonSvgFilter, ${darkGrayColorSvgFilter})`;

    const popupBlockerColor = css`var(--featureFeedbackPopupBlockerColor, rgba(255, 255, 255, 0.3))`;
    const popupBackgroundColor = css`var(--featureFeedbackPopupBackgroundColor, #FBFBFD)`;

    const upvoteColorSvgFilter = css`var(--upvoteColorSvgFilter, invert(34%) sepia(72%) saturate(357%) hue-rotate(111deg) brightness(97%) contrast(95%))`;

    const surveyStyles = css`
      :host {
        counter-reset: questions;
      }

      ::slotted(:not(:first-child)) {
        --surveyQuestionMargin: 15px 0;
      }

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
        background: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        cursor: pointer;
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
        max-width: ${popupMaxWidth};
        max-height: calc(100vh - 2 * ${popupVerticalPadding} - 10px);
        padding: ${popupPadding};
        border: 1px ${popupBorderColor} solid;
        border-radius: 5px;
        background-color: ${popupBackgroundColor};
        box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        z-index: ${modalZindex};
        margin-left: 10px;
        margin-right: 10px;
        overflow-y: auto;
        scrollbar-width: thin;
      }

      button,
      input,
      a,
      textarea {
        font-family: inherit;
      }

      #form > div:last-child {
        margin-bottom: 0;
      }

      #actions {
        display: flex;
        justify-content: center;
        align-items: center;
        column-gap: 10px;
      }

      .cta-button {
        color: white;
        font-size: 14px;
        border-radius: 4px;
        height: 30px;
        margin: 0;
      }

      .sr-only,
      .focus-trap {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        margin: -1px !important;
        padding: 0 !important;
        border: 0 !important;
        overflow: hidden !important;
        white-space: nowrap !important;
        clip: rect(1px, 1px, 1px, 1px) !important;
        -webkit-clip-path: inset(50%) !important;
        clip-path: inset(50%) !important;
        user-select: none !important;
      }
    `;

    return [iaButtonStyles, surveyStyles];
  }
}
