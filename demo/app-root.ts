import { html, css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../src/feature-feedback';

@customElement('app-root')
export class AppRoot extends LitElement {
  render() {
    return html`
      <feature-feedback featureId="foo"> </feature-feedback>
      <slot name="recaptcha"></slot>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
  `;
}
