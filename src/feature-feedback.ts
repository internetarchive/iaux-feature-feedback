import {
  RecaptchaManager,
  RecaptchaManagerInterface,
} from '@internetarchive/recaptcha-manager';
import { html, css, LitElement } from 'lit';
import { property, customElement, query, state } from 'lit/decorators.js';

type Vote = 'up' | 'down';

@customElement('feature-feedback')
export class FeatureFeedback extends LitElement {
  @property({ type: String }) featureIdentifier: string = 'foo';

  @property({ type: String }) recaptchaManager?: RecaptchaManagerInterface;

  @query('#beta-button') betaButton!: HTMLButtonElement;

  @query('#popup') popup!: HTMLDivElement;

  @state() isOpen = false;

  @state() popupPosition = '';

  @state() popupTopX = 0;

  @state() popupTopY = 0;

  @state() vote?: Vote;

  @query('#comments') comments!: HTMLTextAreaElement;

  render() {
    return html`
      <button id="beta-button" @click=${this.showPopup}>Beta</button>
      ${this.isOpen ? this.popupTemplate : ''}
    `;
  }

  private async setupRecaptcha() {
    if (this.recaptchaManager) return;
    this.recaptchaManager = await RecaptchaManager.getRecaptchaManager({
      siteKey: '',
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
        <p>
          What did you think?
          <button
            @click=${() => {
              this.vote = 'up';
            }}
            class="vote"
          >
            👍
          </button>
          <button
            @click=${() => {
              this.vote = 'down';
            }}
            class="vote"
          >
            👎
          </button>
        </p>
        <p>
          <textarea placeholder="Comments (optional)" id="comments"></textarea>
        </p>
        <button @click=${this.closePopup}>Close</button>
        <button @click=${this.submit}>Submit</button>
      </div>
    `;
  }

  private closePopup() {
    this.isOpen = false;
  }

  private async submit() {
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

  static styles = css`
    #popup {
      position: absolute;
      padding: 5px;
      background-color: rgba(0, 0, 0, 0.5);
      -webkit-backdrop-filter: blur(10px);
      backdrop-filter: blur(10px);
      border-radius: 5px;
    }

    p {
      margin: 0;
    }

    .vote {
      font-size: 2rem;
    }
  `;
}
