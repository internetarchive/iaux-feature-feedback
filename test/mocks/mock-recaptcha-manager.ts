import {
  RecaptchaManagerInterface,
  RecaptchaWidgetInterface,
} from '@internetarchive/recaptcha-manager';
import { MockRecaptchaWidget } from './mock-recaptcha-widget';

export class MockRecaptchaManager implements RecaptchaManagerInterface {
  getWidgetOptions?: {
    siteKey?: string | undefined;
    recaptchaParams?: ReCaptchaV2.Parameters | undefined;
  };

  async getRecaptchaWidget(options?: {
    siteKey?: string | undefined;
    recaptchaParams?: ReCaptchaV2.Parameters | undefined;
  }): Promise<RecaptchaWidgetInterface> {
    this.getWidgetOptions = options;
    return new MockRecaptchaWidget();
  }
}
