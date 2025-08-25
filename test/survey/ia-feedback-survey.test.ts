/* eslint-disable import/no-duplicates */
import { html, fixture, expect, aTimeout, waitUntil } from '@open-wc/testing';
import { SharedResizeObserver } from '@internetarchive/shared-resize-observer';
import { MockFeatureFeedbackService } from '../mocks/mock-feature-feedback-service';
import { MockRecaptchaManager } from '../mocks/mock-recaptcha-manager';
import { IAFeedbackSurvey } from '../../src/survey/ia-feedback-survey';
import { IASurveyVote } from '../../src/survey/questions/ia-survey-vote';
import { IASurveyComment } from '../../src/survey/questions/ia-survey-comment';
import '../../src/survey/ia-feedback-survey';
import '../../src/survey/questions/ia-survey-vote';
import '../../src/survey/questions/ia-survey-comment';
import '../../src/survey/questions/ia-survey-extra';
import { SurveySubmissionState } from '../../src/survey/models';

describe('IAFeedbackSurvey', () => {
  it('shows a button that defaults to text Feedback', async () => {
    const el = (await fixture(html`
      <ia-feedback-survey></ia-feedback-survey>
    `)) as IAFeedbackSurvey;

    const textContainer = el.shadowRoot!.querySelector(
      '#button-text'
    ) as HTMLSpanElement;
    expect(textContainer.innerText).to.equal('Feedback');
  });

  it('shows up/down thumbs on the button if specified', async () => {
    const el = (await fixture(html`
      <ia-feedback-survey showButtonThumbs></ia-feedback-survey>
    `)) as IAFeedbackSurvey;

    const thumbIcons = el.shadowRoot!.querySelectorAll('.beta-button-icon');
    expect(thumbIcons.length).to.equal(2);
  });

  it('can customize the button text', async () => {
    const el = (await fixture(html`
      <ia-feedback-survey .buttonText=${'Boop'}></ia-feedback-survey>
    `)) as IAFeedbackSurvey;

    const textContainer = el.shadowRoot!.querySelector(
      '#button-text'
    ) as HTMLSpanElement;
    expect(textContainer.innerText).to.equal('Boop');
  });

  it('shows the popup when button is clicked', async () => {
    const resizeObserver = new SharedResizeObserver();
    const el = (await fixture(html`
      <ia-feedback-survey
        .resizeObserver=${resizeObserver}
      ></ia-feedback-survey>
    `)) as IAFeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    const background = el.shadowRoot!.querySelector(
      '#popup-background'
    ) as HTMLDivElement;

    const classes = background.classList;
    expect(classes.contains('closed')).to.be.true;
    expect(classes.contains('open')).to.be.false;

    button.click();
    await el.updateComplete;
    expect(classes.contains('open')).to.be.true;
    expect(classes.contains('closed')).to.be.false;
  });

  it('closes the popup when the cancel button is clicked', async () => {
    const el = (await fixture(html`
      <ia-feedback-survey></ia-feedback-survey>
    `)) as IAFeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    const background = el.shadowRoot!.querySelector(
      '#popup-background'
    ) as HTMLDivElement;

    const classes = background.classList;
    button.click();
    await el.updateComplete;
    expect(classes.contains('open')).to.be.true;

    const cancelButton = el.shadowRoot!.querySelector(
      '#cancel-button'
    ) as HTMLButtonElement;
    cancelButton.click();
    await el.updateComplete;
    expect(classes.contains('closed')).to.be.true;
    expect(classes.contains('open')).to.be.false;
  });

  it('closes the popup when the background is clicked', async () => {
    const el = (await fixture(html`
      <ia-feedback-survey></ia-feedback-survey>
    `)) as IAFeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    const background = el.shadowRoot!.querySelector(
      '#popup-background'
    ) as HTMLDivElement;

    const classes = background.classList;
    button.click();
    await el.updateComplete;
    expect(classes.contains('open')).to.be.true;

    background.click();
    await el.updateComplete;
    expect(classes.contains('closed')).to.be.true;
    expect(classes.contains('open')).to.be.false;
  });

  it('closes the popup when the Escape key is pressed', async () => {
    const el = (await fixture(html`
      <ia-feedback-survey></ia-feedback-survey>
    `)) as IAFeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    const background = el.shadowRoot!.querySelector(
      '#popup-background'
    ) as HTMLDivElement;

    const classes = background.classList;
    button.click();
    await el.updateComplete;
    expect(classes.contains('open')).to.be.true;

    document.dispatchEvent(
      new KeyboardEvent('keyup', {
        key: 'Escape',
      })
    );
    await el.updateComplete;
    expect(classes.contains('closed')).to.be.true;
    expect(classes.contains('open')).to.be.false;
  });

  it('renders child questions in its default slot', async () => {
    const el = (await fixture(html`
      <ia-feedback-survey surveyIdentifier="foo-survey">
        <ia-survey-vote prompt="foo"></ia-survey-vote>
        <ia-survey-comment prompt="bar"></ia-survey-comment>
        <ia-survey-extra name="baz" value="boop"></ia-survey-extra>
      </ia-feedback-survey>
    `)) as IAFeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const questionsSlot = el.shadowRoot!.querySelector(
      '#questions-slot'
    ) as HTMLSlotElement;
    expect(questionsSlot).to.exist;
    expect(questionsSlot.assignedElements().length).to.equal(3);
  });

  it('applies :invalid styling to required questions with invalid responses upon submit', async () => {
    const el = (await fixture(html`
      <ia-feedback-survey surveyIdentifier="foo-survey">
        <ia-survey-vote prompt="foo" required></ia-survey-vote>
        <ia-survey-comment prompt="bar" required></ia-survey-comment>
        <ia-survey-vote prompt="baz"></ia-survey-vote>
        <ia-survey-comment prompt="boop"></ia-survey-comment>
      </ia-feedback-survey>
    `)) as IAFeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const submitButton = el.shadowRoot!.querySelector(
      '#submit-button'
    ) as HTMLInputElement;
    submitButton.click();
    await el.updateComplete;
    await aTimeout(0);

    const invalidVotes = el.querySelectorAll(
      'ia-survey-vote:invalid'
    ) as ArrayLike<IASurveyVote>;
    expect(invalidVotes.length, 'invalid votes').to.equal(1);
    expect(invalidVotes[0].prompt).to.equal('foo');

    const invalidComments = el.querySelectorAll(
      'ia-survey-comment:invalid'
    ) as ArrayLike<IASurveyComment>;
    expect(invalidComments.length, 'invalid comments').to.equal(1);
    expect(invalidComments[0].prompt).to.equal('bar');

    const validVotes = el.querySelectorAll(
      'ia-survey-vote:not(:invalid)'
    ) as ArrayLike<IASurveyVote>;
    expect(validVotes.length, 'valid votes').to.equal(1);
    expect(validVotes[0].prompt).to.equal('baz');

    const validComments = el.querySelectorAll(
      'ia-survey-comment:not(:invalid)'
    ) as ArrayLike<IASurveyComment>;
    expect(validComments.length, 'valid comments').to.equal(1);
    expect(validComments[0].prompt).to.equal('boop');

    const errorMessage = el.shadowRoot!.querySelector(
      '#error'
    ) as HTMLDivElement;
    expect(errorMessage.textContent).to.equal(
      'Please respond to the indicated questions.'
    );
  });

  it('disables questions while submitting', async () => {
    const service = new MockFeatureFeedbackService({ delay: 100 });
    const recaptchaManager = new MockRecaptchaManager();

    let submissionState: SurveySubmissionState;
    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        .featureFeedbackService=${service}
        .recaptchaManager=${recaptchaManager}
        @submissionStateChanged=${(e: CustomEvent<SurveySubmissionState>) => {
          submissionState = e.detail;
        }}
      >
        <ia-survey-vote prompt="foo"></ia-survey-vote>
        <ia-survey-comment prompt="bar"></ia-survey-comment>
      </ia-feedback-survey>
    `)) as IAFeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const submitButton = el.shadowRoot!.querySelector(
      '#submit-button'
    ) as HTMLInputElement;
    submitButton.click();
    await waitUntil(() => submissionState === 'processing');

    const voteQuestion = el.querySelector('ia-survey-vote') as IASurveyVote;
    const commentQuestion = el.querySelector(
      'ia-survey-comment'
    ) as IASurveyComment;

    expect(voteQuestion.disabled).to.be.true;
    expect(commentQuestion.disabled).to.be.true;
  });

  it('re-enables questions if submission errors out', async () => {
    const service = new MockFeatureFeedbackService({
      delay: 100,
      returnValue: { error: new Error() },
    });
    const recaptchaManager = new MockRecaptchaManager();

    let submissionState: SurveySubmissionState;
    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        .featureFeedbackService=${service}
        .recaptchaManager=${recaptchaManager}
        @submissionStateChanged=${(e: CustomEvent<SurveySubmissionState>) => {
          submissionState = e.detail;
        }}
      >
        <ia-survey-vote prompt="foo" disabled></ia-survey-vote>
        <ia-survey-comment prompt="bar"></ia-survey-comment>
      </ia-feedback-survey>
    `)) as IAFeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const submitButton = el.shadowRoot!.querySelector(
      '#submit-button'
    ) as HTMLInputElement;
    submitButton.click();
    await waitUntil(() => submissionState === 'processing');

    const voteQuestion = el.querySelector('ia-survey-vote') as IASurveyVote;
    const commentQuestion = el.querySelector(
      'ia-survey-comment'
    ) as IASurveyComment;

    // Both questions are disabled while processing
    expect(voteQuestion.disabled).to.be.true;
    expect(commentQuestion.disabled).to.be.true;

    // Wait for the submission to fail
    await waitUntil(() => submissionState === 'error');

    // First question was disabled originally, so it stays disabled
    expect(voteQuestion.disabled).to.be.true;
    // Second question was temporarily disabled while processing, but gets re-enabled after
    expect(commentQuestion.disabled).to.be.false;
  });

  it('submits responses to the service when submit button is clicked', async () => {
    const service = new MockFeatureFeedbackService();
    const recaptchaManager = new MockRecaptchaManager();

    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        .featureFeedbackService=${service}
        .recaptchaManager=${recaptchaManager}
      >
        <ia-survey-vote prompt="foo" vote="up"></ia-survey-vote>
        <ia-survey-comment prompt="bar" value="baz"></ia-survey-comment>
        <ia-survey-extra name="extra" value="quux"></ia-survey-extra>
      </ia-feedback-survey>
    `)) as IAFeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const submitButton = el.shadowRoot!.querySelector(
      '#submit-button'
    ) as HTMLInputElement;
    submitButton.click();
    await el.updateComplete;
    await aTimeout(0);

    expect(service.surveySubmissionOptions).to.deep.equal({
      surveyIdentifier: 'foo-survey',
      responses: [
        {
          name: 'foo',
          rating: 'up',
        },
        {
          name: 'bar',
          comment: 'baz',
        },
        {
          name: 'extra',
          comment: 'quux',
        },
      ],
      recaptchaToken: 'boop',
    });
  });

  it('does not submit if no survey ID specified', async () => {
    const service = new MockFeatureFeedbackService();
    const recaptchaManager = new MockRecaptchaManager();

    const el = (await fixture(html`
      <ia-feedback-survey
        .featureFeedbackService=${service}
        .recaptchaManager=${recaptchaManager}
      >
        <ia-survey-vote prompt="foo" vote="up"></ia-survey-vote>
        <ia-survey-comment prompt="bar" comment="baz"></ia-survey-comment>
        <ia-survey-extra name="extra" value="quux"></ia-survey-extra>
      </ia-feedback-survey>
    `)) as IAFeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const submitButton = el.shadowRoot!.querySelector(
      '#submit-button'
    ) as HTMLInputElement;
    submitButton.click();
    await el.updateComplete;
    await aTimeout(0);

    expect(service.surveySubmissionOptions).not.to.exist;
  });

  it('does not submit if no recaptcha manager provided', async () => {
    const service = new MockFeatureFeedbackService();

    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        .featureFeedbackService=${service}
      >
        <ia-survey-vote prompt="foo" vote="up"></ia-survey-vote>
        <ia-survey-comment prompt="bar" comment="baz"></ia-survey-comment>
        <ia-survey-extra name="extra" value="quux"></ia-survey-extra>
      </ia-feedback-survey>
    `)) as IAFeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const submitButton = el.shadowRoot!.querySelector(
      '#submit-button'
    ) as HTMLInputElement;
    submitButton.click();
    await el.updateComplete;
    await aTimeout(0);

    expect(service.surveySubmissionOptions).not.to.exist;
  });

  it('correctly handles many different questions & questions types simultaneously', async () => {
    const service = new MockFeatureFeedbackService();
    const recaptchaManager = new MockRecaptchaManager();

    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        showQuestionNumbers
        .featureFeedbackService=${service}
        .recaptchaManager=${recaptchaManager}
      >
        <ia-survey-extra
          name="extra info"
          value="foo-extra-1"
        ></ia-survey-extra>
        <ia-survey-vote
          prompt="required vote, no comment"
          required
        ></ia-survey-vote>
        <ia-survey-vote
          prompt="required vote with comment"
          showComments
          required
        ></ia-survey-vote>
        <ia-survey-comment
          prompt="required comment"
          required
        ></ia-survey-comment>
        <ia-survey-extra
          name="more extra info"
          value="foo-extra-2"
        ></ia-survey-extra>
        <ia-survey-vote prompt="optional vote, no comment"></ia-survey-vote>
        <ia-survey-vote
          prompt="optional vote with comment"
          showComments
        ></ia-survey-vote>
        <ia-survey-comment prompt="optional comment"></ia-survey-comment>
        <ia-survey-extra
          name="yet more extra info"
          value="foo-extra-3"
        ></ia-survey-extra>
      </ia-feedback-survey>
    `)) as IAFeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    // Ensure it has all the questions in its form slot
    const questionsSlot = el.shadowRoot!.querySelector(
      '#questions-slot'
    ) as HTMLSlotElement;
    expect(questionsSlot.assignedElements().length).to.equal(9);

    // Helper to get the visible survey questions at a given index
    // (so, excluding the extras which do not render anything visually or accept user input)
    const getVisibleSurveyQuestion = <T extends HTMLElement>(
      index: number
    ): T =>
      questionsSlot
        .assignedElements()
        .filter(elmt => 'visible' in elmt && elmt.visible)[index] as T;

    const [q1, q2, q3, q4, q5, q6] = [
      getVisibleSurveyQuestion<IASurveyVote>(0),
      getVisibleSurveyQuestion<IASurveyVote>(1),
      getVisibleSurveyQuestion<IASurveyComment>(2),
      getVisibleSurveyQuestion<IASurveyVote>(3),
      getVisibleSurveyQuestion<IASurveyVote>(4),
      getVisibleSurveyQuestion<IASurveyComment>(5),
    ];

    // Answer some but not all of the required questions
    q1.vote = 'up';
    q2.comment = 'foo-comment';

    // Try to submit and check what gets the error styling
    await el.updateComplete;
    const submitButton = el.shadowRoot!.querySelector(
      '#submit-button'
    ) as HTMLInputElement;
    submitButton.click();
    await el.updateComplete;

    // Q1 had all required responses
    expect(q1.matches(':invalid'), 'q1').to.be.false;

    // Q2 was missing a required vote
    expect(q2.matches(':invalid'), 'q2').to.be.true;

    // Q3 was missing a required comment
    expect(q3.matches(':invalid'), 'q3').to.be.true;

    // Q4-Q6 are not required
    expect(q4.matches(':invalid'), 'q4').to.be.false;
    expect(q5.matches(':invalid'), 'q5').to.be.false;
    expect(q6.matches(':invalid'), 'q6').to.be.false;

    // Fill in the remaining required responses + some optional ones, and resubmit
    q2.vote = 'down';

    q3.value = 'bar-comment';

    q5.vote = 'up';
    q5.comment = 'baz-comment';

    await el.updateComplete;
    submitButton.click();
    await el.updateComplete;
    await aTimeout(0);

    // Verify that the responses sent to the service are correct
    expect(service.surveySubmissionOptions).to.deep.equal({
      surveyIdentifier: 'foo-survey',
      responses: [
        {
          name: 'extra info',
          comment: 'foo-extra-1',
        },
        {
          name: 'required vote, no comment',
          rating: 'up',
        },
        {
          name: 'required vote with comment',
          rating: 'down',
          comment: 'foo-comment',
        },
        {
          name: 'required comment',
          comment: 'bar-comment',
        },
        {
          name: 'more extra info',
          comment: 'foo-extra-2',
        },
        {
          name: 'optional vote, no comment',
          rating: undefined,
        },
        {
          name: 'optional vote with comment',
          rating: 'up',
          comment: 'baz-comment',
        },
        {
          name: 'optional comment',
          comment: '',
        },
        {
          name: 'yet more extra info',
          comment: 'foo-extra-3',
        },
      ],
      recaptchaToken: 'boop',
    });
  });
});
