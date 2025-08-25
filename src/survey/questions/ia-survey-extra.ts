import { LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { IASurveyQuestionInterface, IASurveyQuestionResponse } from '../models';

@customElement('ia-survey-extra')
export class IASurveyExtra
  extends LitElement
  implements IASurveyQuestionInterface
{
  /**
   * The name associated with this extra info field.
   */
  @property({ type: String, reflect: true }) name = '';

  /**
   * The value of this field to be submitted in the survey response.
   */
  @property({ type: String, reflect: true }) value?: string;

  /**
   * @inheritdoc
   */
  readonly visible = false;

  /**
   * (Unused for extras)
   * @inheritdoc
   */
  disabled = false;

  protected createRenderRoot() {
    // We don't need a shadow root for this component
    return this;
  }

  render() {
    return nothing;
  }

  /**
   * @inheritdoc
   */
  validate(): boolean {
    return true;
  }

  /**
   * @inheritdoc
   */
  get numbered(): boolean {
    return false;
  }

  /**
   * @inheritdoc
   */
  get response(): IASurveyQuestionResponse {
    return {
      name: this.name,
      comment: this.value,
    };
  }
}
