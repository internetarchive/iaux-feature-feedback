import {
  RecaptchaManager,
  RecaptchaManagerInterface,
} from '@internetarchive/recaptcha-manager';
import {
  html,
  css,
  LitElement,
  nothing,
  CSSResultGroup,
  PropertyValues,
  TemplateResult,
} from 'lit';
import { property, customElement, query, state } from 'lit/decorators.js';

import { thumbsUp } from './img/thumb-up';
import { thumbsDown } from './img/thumb-down';

type Vote = 'up' | 'down';

@customElement('feature-feedback')
export class FeatureFeedback extends LitElement {
  @property({ type: String }) featureIdentifier?: string;

  @property({ type: String }) recaptchaManager?: RecaptchaManagerInterface;

  @property({ type: String }) recaptchaSiteKey?: string;

  @property({ type: String }) featureFeedbackServiceUrl?: string;

  @query('#beta-button') private betaButton!: HTMLButtonElement;

  @query('#popup') private popup?: HTMLDivElement;

  @state() private isOpen = false;

  @state() private popupPosition = '';

  @state() private processing = false;

  @state() private popupTopX = 0;

  @state() private popupTopY = 0;

  @state() private vote?: Vote;

  @state() private error?: TemplateResult;

  @query('#comments') private comments!: HTMLTextAreaElement;

  private boundEscapeListener?: (this: Document, ev: KeyboardEvent) => any;

  render() {
    return html`
      <button id="beta-button" @click=${this.showPopup} tabindex="0">
        Beta
        <span class="beta-button-thumb upvote-button ${this.upvoteButtonClass}"
          >${thumbsUp}</span
        >
        <span
          class="beta-button-thumb downvote-button ${this.downvoteButtonClass}"
          id="beta-button-thumb-down"
          >${thumbsDown}</span
        >
      </button>
      ${this.isOpen ? this.popupTemplate : nothing}
    `;
  }

  firstUpdated(): void {
    this.boundEscapeListener = this.handleEscape.bind(this);
  }

  updated(changed: PropertyValues): void {
    if (changed.has('vote') && this.vote) this.error = undefined;
  }

  private async setupRecaptcha() {
    if (this.recaptchaManager || !this.recaptchaSiteKey) return;
    this.recaptchaManager = await RecaptchaManager.getRecaptchaManager({
      siteKey: this.recaptchaSiteKey,
    });
    const elementId = `#recaptcha-${this.featureIdentifier}`;
    let element: HTMLDivElement | null = document.querySelector(elementId);
    if (!element) {
      element = document.createElement('div');
      element.id = elementId;
      element.style.position = 'fixed';
      element.style.top = '50%';
      element.style.left = '50%';
      element.style.zIndex = '10';
      document.body.insertBefore(element, document.body.firstChild);
    }
    this.recaptchaManager.setup(element, 0, 'light', 'image');
  }

  private async showPopup() {
    const boundingRect = this.betaButton.getBoundingClientRect();
    this.popupTopX = boundingRect.right - 10;
    this.popupTopY = boundingRect.bottom - 10;
    this.isOpen = true;
    this.setupEscapeListener();
    await this.setupRecaptcha();
  }

  private setupEscapeListener() {
    if (!this.boundEscapeListener) return;
    document.addEventListener('keyup', this.boundEscapeListener);
  }

  private removeEscapeListener() {
    if (!this.boundEscapeListener) return;
    document.removeEventListener('keyup', this.boundEscapeListener);
  }

  private handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.closePopup();
    }
  }

  private get popupTemplate() {
    return html`
      <div
        id="popup-background"
        @click=${this.backgroundClicked}
        @keyup=${this.backgroundClicked}
      >
        <div
          id="popup"
          style="left: ${this.popupTopX}px; top: ${this.popupTopY}px"
        >
          <form @submit=${this.submit} id="form" ?disabled=${this.processing}>
            <div id="prompt">
              <div id="prompt-text">Do you find this feature useful?</div>
              <button
                @click=${(e: Event) => {
                  e.preventDefault();
                  this.vote = this.vote === 'up' ? undefined : 'up';
                }}
                ?disabled=${this.processing}
                class="vote-button upvote-button ${this
                  .upvoteButtonClass} ${this.error ? 'error' : ''}"
                tabindex="0"
              >
                ${thumbsUp}
              </button>
              <button
                @click=${(e: Event) => {
                  e.preventDefault();
                  this.vote = this.vote === 'down' ? undefined : 'down';
                }}
                ?disabled=${this.processing}
                class="vote-button downvote-button ${this
                  .downvoteButtonClass} ${this.error ? 'error' : ''}"
                tabindex="0"
              >
                ${thumbsDown}
              </button>
            </div>
            <div>
              <textarea
                placeholder="Comments (optional)"
                id="comments"
                tabindex="0"
                ?disabled=${this.processing}
              ></textarea>
            </div>
            ${this.error ? html`<div id="error">${this.error}</div>` : nothing}
            <div id="actions">
              <button
                @click=${this.cancel}
                id="cancel-button"
                class="cta-button"
                tabindex="0"
                ?disabled=${this.processing}
              >
                Cancel
              </button>
              <input
                type="submit"
                id="submit-button"
                class="cta-button"
                .value=${this.processing ? 'Submitting...' : 'Submit feedback'}
                tabindex="0"
                ?disabled=${this.processing}
              />
            </div>
          </form>
        </div>
      </div>
    `;
  }

  private get upvoteButtonClass(): string {
    switch (this.vote) {
      case 'up':
        return 'selected';
      case 'down':
        return 'unselected';
      default:
        return 'noselection';
    }
  }

  private get downvoteButtonClass(): string {
    switch (this.vote) {
      case 'up':
        return 'unselected';
      case 'down':
        return 'selected';
      default:
        return 'noselection';
    }
  }

  private backgroundClicked(e: MouseEvent) {
    if (!(e.target instanceof Node)) return;
    if (this.popup?.contains(e.target)) return;
    this.closePopup();
  }

  private cancel() {
    this.vote = undefined;
    this.closePopup();
  }

  private closePopup() {
    this.removeEscapeListener();
    this.isOpen = false;
  }

  private async submit(e: Event) {
    e.preventDefault();

    if (!this.featureIdentifier) return;
    if (!this.vote) {
      this.error = html`Please select a vote.`;
      return;
    }

    this.processing = true;
    if (!this.recaptchaManager || !this.featureFeedbackServiceUrl) return;
    const token = await this.recaptchaManager.execute();

    const url = new URL(this.featureFeedbackServiceUrl);
    url.searchParams.append('featureId', this.featureIdentifier);
    url.searchParams.append('rating', this.vote!);
    url.searchParams.append('comment', this.comments.value);
    url.searchParams.append('token', token);
    try {
      await fetch(url.href);
      this.closePopup();
    } catch (err) {
      this.error = html`There was an error submitting your feedback.<br />Error:
        ${err instanceof Error ? err.message : err}`;
    }
    this.processing = false;
  }

  static get styles(): CSSResultGroup {
    const blueColor = css`var(--featureFeedbackBlueColor, #194880)`;
    const darkGrayColor = css`var(--featureFeedbackDarkGrayColor, #767676)`;
    const darkGrayColorSvgFilter = css`var(--defaultColorSvgFilter, invert(52%) sepia(0%) saturate(1%) hue-rotate(331deg) brightness(87%) contrast(89%))`;

    const popupBorderColor = css`var(--featureFeedbackPopupBorderColor, ${blueColor})`;
    const submitButtonColor = css`var(--featureFeedbackSubmitButtonColor, ${blueColor})`;
    const betaButtonBorderColor = css`var(--featureFeedbackBetaButtonBorderColor, ${blueColor})`;
    const betaButtonTextColor = css`var(--featureFeedbackBetaButtonTextColor, ${blueColor})`;
    const betaButtonSvgFilter = css`var(--featureFeedbackBetaButtonSvgFilter, ${darkGrayColorSvgFilter})`;

    const cancelButtonColor = css`var(--featureFeedbackCancelButtonColor, #515151)`;
    const popupBlockerColor = css`var(--featureFeedbackPopupBlockerColor, rgba(255, 255, 255, 0.3))`;

    const popupBackgroundColor = css`var(--featureFeedbackPopupBackgroundColor, #F5F5F7)`;

    const promptFont = css`var(--featureFeedbackPromptFont, bold 14px "Helvetica Neue bold", sans-serif)`;

    const defaultColor = css`var(--defaultColor, ${darkGrayColor});`;
    const defaultColorSvgFilter = css`var(--defaultColorSvgFilter, ${darkGrayColorSvgFilter});`;

    const upvoteColor = css`var(--upvoteColor, #23765D);`;
    const upvoteColorSvgFilter = css`var(--upvoteColorSvgFilter, invert(34%) sepia(72%) saturate(357%) hue-rotate(111deg) brightness(97%) contrast(95%));`;

    const downvoteColor = css`var(--downvoteColor, #720D11);`;
    const downvoteColorSvgFilter = css`var(--downvoteColorSvgFilter, invert(5%) sepia(81%) saturate(5874%) hue-rotate(352deg) brightness(105%) contrast(95%));`;

    const unselectedColor = css`var(--unselectedColor, #CCCCCC);`;
    const unselectedColorSvgFilter = css`var(--unselectedColorSvgFilter, invert(100%) sepia(0%) saturate(107%) hue-rotate(138deg) brightness(89%) contrast(77%));`;

    return css`
      #beta-button {
        font-size: 12px;
        font-weight: bold;
        font-style: italic;
        color: ${betaButtonTextColor};
        border: 1px solid ${betaButtonBorderColor};
        border-radius: 4px;
        padding: 1px 5px;
      }

      .beta-button-thumb svg {
        height: 10px;
        width: 10px;
        filter: ${betaButtonSvgFilter};
      }

      .beta-button-thumb.unselected svg {
        filter: ${unselectedColorSvgFilter};
      }

      #error {
        color: red;
        font-size: 14px;
        text-align: center;
      }

      #popup-background {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        background-color: ${popupBlockerColor};
      }

      #popup {
        position: absolute;
        padding: 10px;
        background-color: ${popupBackgroundColor};
        border: 2px ${popupBorderColor} solid;
        border-radius: 5px;
        box-shadow: 1px 1px 2px #000000;
        z-index: 2;
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

      #form > div {
        margin-bottom: 10px;
      }

      #form > div:last-child {
        margin-bottom: 0;
      }

      #prompt {
        display: flex;
        align-items: center;
        font: ${promptFont};
      }

      #comments {
        width: 100%;
        height: 50px;
        background-color: #ffffff;
        border: 1px #2c2c2c solid;
        border-radius: 4px;
        padding: 7px;
        -webkit-box-sizing: border-box;
        -moz-box-sizing: border-box;
        box-sizing: border-box;
      }

      #comments::placeholder {
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
        font-family: sans-serif;
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
        padding: 5px;
        width: 25px;
        height: 25px;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-left: 10px;
      }

      .vote-button svg {
        width: 15px;
        height: 15px;
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

      .vote-button.error {
        box-shadow: 0 0 4px red;
      }
    `;
  }
}
