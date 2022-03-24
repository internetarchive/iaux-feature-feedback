import { Result } from '@internetarchive/result-type';
import { FeatureFeedbackServiceInterface } from '../../src/feature-feedback-service';
import { Vote } from '../../src/models';

export class MockFeatureFeedbackService
  implements FeatureFeedbackServiceInterface
{
  submissionOptions?: {
    featureIdentifier: string;
    vote: Vote;
    comments?: string | undefined;
    recaptchaToken: string;
  };

  async submitFeedback(options: {
    featureIdentifier: string;
    vote: Vote;
    comments?: string | undefined;
    recaptchaToken: string;
  }): Promise<Result<boolean, Error>> {
    this.submissionOptions = options;
    return {
      success: true,
    };
  }
}
