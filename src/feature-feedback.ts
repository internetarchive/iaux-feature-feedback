import {
  RecaptchaManager,
  RecaptchaManagerInterface,
} from '@internetarchive/recaptcha-manager';
import { html, css, LitElement, nothing, CSSResultGroup } from 'lit';
import { property, customElement, query, state } from 'lit/decorators.js';

import { thumbsUp } from './img/thumb-up';
import { thumbsDown } from './img/thumb-down';

type Vote = 'up' | 'down';

@customElement('feature-feedback')
export class FeatureFeedback extends LitElement {
  @property({ type: String }) featureIdentifier?: string;

  @property({ type: String }) recaptchaManager?: RecaptchaManagerInterface;

  @query('#beta-button') private betaButton!: HTMLButtonElement;

  @query('#popup') private popup!: HTMLDivElement;

  @state() private isOpen = true;

  @state() private popupPosition = '';

  @state() private popupTopX = 0;

  @state() private popupTopY = 0;

  @state() private vote?: Vote;

  @query('#comments') private comments!: HTMLTextAreaElement;

  render() {
    return html`
      <button id="beta-button" @click=${this.showPopup}>Beta</button>
      ${this.isOpen ? this.popupTemplate : nothing}
    `;
  }

  private async setupRecaptcha() {
    if (this.recaptchaManager) return;
    this.recaptchaManager = await RecaptchaManager.getRecaptchaManager({
      // don't commit this key to git
      siteKey: '6LeTUvYUAAAAAPTvW98MaXyS8c6vxk4-9n8DI1ve',
    });
    const element = document.querySelector('#recaptcha') as HTMLDivElement;
    this.recaptchaManager.setup(element, 0, 'light', 'image');
  }

  private async showPopup() {
    const boundingRect = this.betaButton.getBoundingClientRect();
    this.popupTopX = boundingRect.right - 10;
    this.popupTopY = boundingRect.bottom - 10;
    this.isOpen = true;
    await this.setupRecaptcha();
  }

  private get popupTemplate() {
    return html`
      <div
        id="popup"
        style="left: ${this.popupTopX}px; top: ${this.popupTopY}px"
      >
        <div id="prompt">
          <div id="prompt-text">Do you find this feature useful?</div>
          <button
            id="upvote"
            @click=${() => {
              this.vote = this.vote === 'up' ? undefined : 'up';
            }}
            class="vote-button ${this.upvoteButtonClass}"
          >
            ${thumbsUp}
          </button>
          <button
            id="downvote"
            @click=${() => {
              this.vote = this.vote === 'down' ? undefined : 'down';
            }}
            class="vote-button ${this.downvoteButtonClass}"
          >
            ${thumbsDown}
          </button>
        </div>
        <div>
          <textarea placeholder="Comments (optional)" id="comments"></textarea>
        </div>
        <div id="actions">
          <button @click=${this.closePopup}>Close</button>
          <button @click=${this.submit}>Submit</button>
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

  private closePopup() {
    this.isOpen = false;
  }

  private async submit() {
    if (!this.featureIdentifier) {
      console.error('please set featureIdentifier');
      return;
    }
    await this.setupRecaptcha();
    if (!this.recaptchaManager) return;
    const token = await this.recaptchaManager.execute();

    const url = new URL('http://localhost:5000');
    url.searchParams.append('featureId', this.featureIdentifier);
    url.searchParams.append('rating', this.vote!);
    url.searchParams.append('comment', this.comments.value);
    url.searchParams.append('token', token);
    await fetch(url.href);
  }

  static get styles(): CSSResultGroup {
    const popupBackgroundColor = css`var(--featureFeedbackPopupBackgroundColor, #F5F5F7)`;

    const promptFont = css`var(--featureFeedbackPromptFont, bold 14px "Helvetica Neue bold", sans-serif)`;

    const defaultColor = css`var(--defaultColor, #767676);`;
    const defaultColorSvgFilter = css`var(--defaultColorSvgFilter, invert(52%) sepia(0%) saturate(1%) hue-rotate(331deg) brightness(87%) contrast(89%));`;

    const upvoteColor = css`var(--upvoteColor, #23765D);`;
    const upvoteColorSvgFilter = css`var(--upvoteColorSvgFilter, invert(34%) sepia(72%) saturate(357%) hue-rotate(111deg) brightness(97%) contrast(95%));`;

    const downvoteColor = css`var(--downvoteColor, #720D11);`;
    const downvoteColorSvgFilter = css`var(--downvoteColorSvgFilter, invert(5%) sepia(81%) saturate(5874%) hue-rotate(352deg) brightness(105%) contrast(95%));`;

    const unselectedColor = css`var(--unselectedColor, #CCCCCC);`;
    const unselectedColorSvgFilter = css`var(--unselectedColorSvgFilter, invert(100%) sepia(0%) saturate(107%) hue-rotate(138deg) brightness(89%) contrast(77%));`;

    return css`
      #popup {
        position: absolute;
        padding: 10px;
        background-color: ${popupBackgroundColor};
        border: 2px #194880 solid;
        border-radius: 5px;
        box-shadow: 1px 1px 2px #000000;
      }

      #popup > div {
        margin-bottom: 10px;
      }

      #popup > div:last-child {
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
        -webkit-box-sizing: border-box;
        -moz-box-sizing: border-box;
        box-sizing: border-box;
      }

      .vote-button {
        background: none;
        background-color: #ffffff;
        color: inherit;
        border: 1px solid #767676;
        border-radius: 2px;
        padding: 5px;
        font: inherit;
        cursor: pointer;
        outline: inherit;
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

      #upvote.selected {
        border-color: ${upvoteColor};
      }

      #upvote.selected svg {
        filter: ${upvoteColorSvgFilter};
      }

      #downvote.selected {
        border-color: ${downvoteColor};
      }

      #downvote.selected svg {
        filter: ${downvoteColorSvgFilter};
      }
    `;
  }
}
