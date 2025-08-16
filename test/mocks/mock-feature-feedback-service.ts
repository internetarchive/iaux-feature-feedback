import { Result } from '@internetarchive/result-type';
import { FeatureFeedbackServiceInterface } from '../../src/feature-feedback-service';
import { SurveyQuestionResponse, Vote } from '../../src/models';

export class MockFeatureFeedbackService
  implements FeatureFeedbackServiceInterface
{
  submissionOptions?: {
    featureIdentifier: string;
    vote: Vote;
    comments?: string | undefined;
    recaptchaToken: string;
  };

  surveySubmissionOptions?: {
    surveyIdentifier: string;
    responses: SurveyQuestionResponse[];
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

  async submitSurvey(options: {
    surveyIdentifier: string;
    responses: SurveyQuestionResponse[];
    recaptchaToken: string;
  }): Promise<Result<boolean, Error>> {
    this.surveySubmissionOptions = options;
    return { success: true };
  }
}
