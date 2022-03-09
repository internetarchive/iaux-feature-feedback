import { html, css, LitElement } from 'lit';
import { property, customElement, query, state } from 'lit/decorators.js';

@customElement('feature-feedback')
export class FeatureFeedback extends LitElement {
  @property({ type: String }) featureIdentifier?: string;

  @query('#beta-button') betaButton!: HTMLButtonElement;

  @query('#popup') popup!: HTMLDivElement;

  @state() isOpen = false;

  @state() popupPosition = '';

  @state() popupTopX = 0;

  @state() popupTopY = 0;

  render() {
    return html`
      <button id="beta-button" @click=${this.showPopup}>Beta</button>
      ${this.isOpen ? this.popupTemplate : ''}
    `;
  }

  private showPopup() {
    const boundingRect = this.betaButton.getBoundingClientRect();
    this.popupTopX = boundingRect.right - 10;
    this.popupTopY = boundingRect.bottom - 10;
    this.isOpen = true;
  }

  private get popupTemplate() {
    return html`
      <div
        id="popup"
        style="left: ${this.popupTopX}px; top: ${this.popupTopY}px"
      >
        <p>What did you think? 👍 👎</p>
        <p><textarea placeholder="Comments (optional)"></textarea></p>
        <button @click=${this.closePopup}>Close</button>
        <button @click=${this.submit}>Submit</button>
      </div>
    `;
  }

  private closePopup() {
    this.isOpen = false;
  }

  private submit() {}

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
  `;
}
