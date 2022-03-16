import { Vote } from './models';

export interface FeatureFeedbackServiceInterface {
  submitFeedback(options: {
    featureIdentifier: string;
    vote: Vote;
    comments?: string;
    recaptchaToken: string;
  }): Promise<void>;
}

export class FeatureFeedbackService implements FeatureFeedbackServiceInterface {
  private serviceUrl: string;

  constructor(options: { serviceUrl: string }) {
    this.serviceUrl = options.serviceUrl;
  }

  async submitFeedback(options: {
    featureIdentifier: string;
    vote: Vote;
    comments?: string | undefined;
    recaptchaToken: string;
  }): Promise<void> {
    const url = new URL(this.serviceUrl);
    url.searchParams.append('featureId', options.featureIdentifier);
    url.searchParams.append('rating', options.vote);
    if (options.comments) {
      url.searchParams.append('comment', options.comments);
    }
    url.searchParams.append('token', options.recaptchaToken);
    await fetch(url.href);
  }
}
