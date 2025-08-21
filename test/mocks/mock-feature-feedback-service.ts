import { Result } from '@internetarchive/result-type';
import { aTimeout } from '@open-wc/testing';
import { FeatureFeedbackServiceInterface } from '../../src/feature-feedback-service';
import { Vote } from '../../src/models';
import { IASurveyQuestionResponse } from '../../src/survey/models';

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
    responses: IASurveyQuestionResponse[];
    recaptchaToken: string;
  };

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private options?: {
      delay?: number;
      returnValue?: Result<boolean, Error>;
    }
  ) {
    // Just setting the options property, nothing else
  }

  async submitFeedback(options: {
    featureIdentifier: string;
    vote: Vote;
    comments?: string | undefined;
    recaptchaToken: string;
  }): Promise<Result<boolean, Error>> {
    this.submissionOptions = options;
    if (this.options?.delay) await aTimeout(this.options.delay);
    return this.options?.returnValue ?? { success: true };
  }

  async submitSurvey(options: {
    surveyIdentifier: string;
    responses: IASurveyQuestionResponse[];
    recaptchaToken: string;
  }): Promise<Result<boolean, Error>> {
    this.surveySubmissionOptions = options;
    if (this.options?.delay) await aTimeout(this.options.delay);
    return this.options?.returnValue ?? { success: true };
  }
}
