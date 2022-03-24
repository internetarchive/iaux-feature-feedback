import type { Result } from '@internetarchive/result-type';
import { Vote } from './models';

export interface FeatureFeedbackServiceInterface {
  submitFeedback(options: {
    featureIdentifier: string;
    vote: Vote;
    comments?: string;
    recaptchaToken: string;
  }): Promise<Result<boolean, Error>>;
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
  }): Promise<Result<boolean, Error>> {
    const url = new URL(this.serviceUrl);
    url.searchParams.append('featureId', options.featureIdentifier);
    url.searchParams.append('rating', options.vote);
    if (options.comments) {
      url.searchParams.append('comment', options.comments);
    }
    url.searchParams.append('token', options.recaptchaToken);
    try {
      const response = await fetch(url.href);
      const json = await response.json();
      return json as Result<boolean, Error>;
    } catch (error) {
      let err: Error;
      if (error instanceof Error) {
        err = error;
      } else if (typeof error === 'string') {
        err = new Error(error);
      } else {
        err = new Error('Unknown error');
      }

      return {
        success: false,
        error: err,
      };
    }
  }
}
