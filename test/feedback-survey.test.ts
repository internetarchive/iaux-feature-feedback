/* eslint-disable import/no-duplicates */
import { html, fixture, expect, aTimeout } from '@open-wc/testing';
import { SharedResizeObserver } from '@internetarchive/shared-resize-observer';
import { FeedbackSurvey } from '../src/feedback-survey';
import { SurveyQuestion } from '../src/models';
import { MockFeatureFeedbackService } from './mocks/mock-feature-feedback-service';
import { MockRecaptchaManager } from './mocks/mock-recaptcha-manager';
import '../src/feedback-survey';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const longSurveyQuestions: SurveyQuestion[] = [
  {
    questionText: 'extra info',
    type: 'extra',
    extraInfo: 'foo-extra-1',
  },
  {
    questionText: 'required vote without comment',
    type: 'vote',
    required: true,
  },
  {
    questionText: 'required vote with comment',
    type: 'vote',
    required: true,
    allowComments: true,
  },
  {
    questionText: 'required comment',
    type: 'comment',
    required: true,
    allowComments: true,
  },
  {
    questionText: 'more extra info',
    type: 'extra',
    extraInfo: 'foo-extra-2',
  },
  {
    questionText: 'optional vote without comment',
    type: 'vote',
  },
  {
    questionText: 'optional vote with comment',
    type: 'vote',
    allowComments: true,
  },
  {
    questionText: 'optional comment',
    type: 'comment',
  },
  {
    questionText: 'yet more extra info',
    type: 'extra',
    extraInfo: 'foo-extra-3',
  },
];

describe('FeedbackSurvey', () => {
  it('shows a button that defaults to text Feedback', async () => {
    const el = (await fixture(html`
      <ia-feedback-survey></ia-feedback-survey>
    `)) as FeedbackSurvey;

    const textContainer = el.shadowRoot!.querySelector(
      '#button-text'
    ) as HTMLSpanElement;
    expect(textContainer.innerText).to.equal('Feedback');
  });

  it('shows up/down thumbs on the button if specified', async () => {
    const el = (await fixture(html`
      <ia-feedback-survey showButtonThumbs></ia-feedback-survey>
    `)) as FeedbackSurvey;

    const thumbIcons = el.shadowRoot!.querySelectorAll('.beta-button-icon');
    expect(thumbIcons.length).to.equal(2);
  });

  it('can customize the button text', async () => {
    const el = (await fixture(html`
      <ia-feedback-survey .buttonText=${'Boop'}></ia-feedback-survey>
    `)) as FeedbackSurvey;

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
    `)) as FeedbackSurvey;

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
    `)) as FeedbackSurvey;

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
    `)) as FeedbackSurvey;

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
    `)) as FeedbackSurvey;

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

  it('renders upvote/downvote buttons for vote-type questions', async () => {
    const questions: SurveyQuestion[] = [
      {
        questionText: 'foo',
        type: 'vote',
      },
    ];

    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        .questions=${questions}
      ></ia-feedback-survey>
    `)) as FeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const upvoteButton = el.shadowRoot!.querySelector(
      'label.vote-button.upvote-button'
    ) as HTMLLabelElement;
    expect(upvoteButton).to.exist;

    const downvoteButton = el.shadowRoot!.querySelector(
      'label.vote-button.downvote-button'
    ) as HTMLLabelElement;
    expect(downvoteButton).to.exist;
  });

  it('can vote with Enter key', async () => {
    const questions: SurveyQuestion[] = [
      {
        questionText: 'foo',
        type: 'vote',
      },
    ];

    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        .questions=${questions}
      ></ia-feedback-survey>
    `)) as FeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const upvoteButton = el.shadowRoot!.querySelector(
      'label.vote-button.upvote-button'
    ) as HTMLLabelElement;
    const downvoteButton = el.shadowRoot!.querySelector(
      'label.vote-button.downvote-button'
    ) as HTMLLabelElement;

    upvoteButton.dispatchEvent(
      new KeyboardEvent('keyup', {
        key: 'Enter',
      })
    );
    await el.updateComplete;
    expect(upvoteButton.classList.contains('selected')).to.be.true;
    expect(downvoteButton.classList.contains('unselected')).to.be.true;

    downvoteButton.dispatchEvent(
      new KeyboardEvent('keyup', {
        key: 'Enter',
      })
    );
    await el.updateComplete;
    expect(upvoteButton.classList.contains('unselected')).to.be.true;
    expect(downvoteButton.classList.contains('selected')).to.be.true;
  });

  it('can vote with Space key', async () => {
    const questions: SurveyQuestion[] = [
      {
        questionText: 'foo',
        type: 'vote',
      },
    ];

    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        .questions=${questions}
      ></ia-feedback-survey>
    `)) as FeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const upvoteButton = el.shadowRoot!.querySelector(
      'label.vote-button.upvote-button'
    ) as HTMLLabelElement;
    const downvoteButton = el.shadowRoot!.querySelector(
      'label.vote-button.downvote-button'
    ) as HTMLLabelElement;

    upvoteButton.dispatchEvent(
      new KeyboardEvent('keyup', {
        key: ' ',
      })
    );
    await el.updateComplete;
    expect(upvoteButton.classList.contains('selected')).to.be.true;
    expect(downvoteButton.classList.contains('unselected')).to.be.true;

    downvoteButton.dispatchEvent(
      new KeyboardEvent('keyup', {
        key: ' ',
      })
    );
    await el.updateComplete;
    expect(upvoteButton.classList.contains('unselected')).to.be.true;
    expect(downvoteButton.classList.contains('selected')).to.be.true;
  });

  it('renders comment box on vote-type questions when allowComments is true', async () => {
    const questions: SurveyQuestion[] = [
      {
        questionText: 'foo',
        type: 'vote',
        allowComments: true,
      },
    ];

    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        .questions=${questions}
      ></ia-feedback-survey>
    `)) as FeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const commentField = el.shadowRoot!.querySelector(
      'textarea.comments'
    ) as HTMLTextAreaElement;
    expect(commentField).to.exist;
  });

  it('does not render comment box on vote-type questions when allowComments is not true', async () => {
    const questions: SurveyQuestion[] = [
      {
        questionText: 'foo',
        type: 'vote',
      },
    ];

    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        .questions=${questions}
      ></ia-feedback-survey>
    `)) as FeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const commentField = el.shadowRoot!.querySelector(
      'textarea.comments'
    ) as HTMLTextAreaElement;
    expect(commentField).not.to.exist;
  });

  it('renders comment box on comment-type questions when allowComments is true', async () => {
    const questions: SurveyQuestion[] = [
      {
        questionText: 'foo',
        type: 'comment',
        allowComments: true,
      },
    ];

    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        .questions=${questions}
      ></ia-feedback-survey>
    `)) as FeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const commentField = el.shadowRoot!.querySelector(
      'textarea.comments'
    ) as HTMLTextAreaElement;
    expect(commentField).to.exist;
  });

  it('does not render comment box on comment-type questions when allowComments is not true', async () => {
    const questions: SurveyQuestion[] = [
      {
        questionText: 'foo',
        type: 'comment',
      },
    ];

    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        .questions=${questions}
      ></ia-feedback-survey>
    `)) as FeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const commentField = el.shadowRoot!.querySelector(
      'textarea.comments'
    ) as HTMLTextAreaElement;
    expect(commentField).not.to.exist;
  });

  it('does not render extra-type questions at all', async () => {
    const questions: SurveyQuestion[] = [
      {
        questionText: 'extras!',
        type: 'extra',
      },
      {
        questionText: 'foo',
        type: 'comment',
        allowComments: true,
      },
    ];

    const el = (await fixture(html`
      <ia-feedback-survey
        showQuestionNumbers
        surveyIdentifier="foo-survey"
        .questions=${questions}
      ></ia-feedback-survey>
    `)) as FeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const promptTexts = el.shadowRoot!.querySelectorAll('.prompt-text');
    expect(promptTexts.length).to.equal(1); // Only the comment question, not the extra
    expect(promptTexts[0].textContent).to.match(/1\.\s+foo/);
  });

  it('uses provided placeholder for comment box', async () => {
    const questions: SurveyQuestion[] = [
      {
        questionText: 'foo',
        type: 'comment',
        allowComments: true,
        commentPlaceholder: 'bar',
      },
    ];

    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        .questions=${questions}
      ></ia-feedback-survey>
    `)) as FeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const commentField = el.shadowRoot!.querySelector(
      'textarea.comments'
    ) as HTMLTextAreaElement;
    expect(commentField.placeholder).to.equal('bar');
  });

  it('uses provided height for comment box', async () => {
    const questions: SurveyQuestion[] = [
      {
        questionText: 'foo',
        type: 'comment',
        allowComments: true,
        commentHeight: 123,
      },
    ];

    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        .questions=${questions}
      ></ia-feedback-survey>
    `)) as FeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const commentField = el.shadowRoot!.querySelector(
      'textarea.comments'
    ) as HTMLTextAreaElement;
    expect(getComputedStyle(commentField).height).to.equal('123px');
  });

  it('uses provided resize rule for comment box', async () => {
    const questions: SurveyQuestion[] = [
      {
        questionText: 'foo',
        type: 'comment',
        allowComments: true,
        commentResize: 'vertical',
      },
    ];

    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        .questions=${questions}
      ></ia-feedback-survey>
    `)) as FeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const commentField = el.shadowRoot!.querySelector(
      'textarea.comments'
    ) as HTMLTextAreaElement;
    expect(getComputedStyle(commentField).resize).to.equal('vertical');
  });

  it('shows error-styled vote buttons if user tries to submit without responding to a required vote question', async () => {
    const questions: SurveyQuestion[] = [
      {
        questionText: 'foo',
        type: 'vote',
        required: true,
      },
    ];

    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        .questions=${questions}
      ></ia-feedback-survey>
    `)) as FeedbackSurvey;

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

    const upvoteButton = el.shadowRoot!.querySelector(
      'label.vote-button.upvote-button'
    ) as HTMLLabelElement;
    expect(upvoteButton.classList.contains('error')).to.be.true;

    const errorMessage = el.shadowRoot!.querySelector(
      '#error'
    ) as HTMLDivElement;
    expect(errorMessage.textContent).to.equal(
      'Please respond to the indicated questions.'
    );
  });

  it('shows error-styled comment box if user tries to submit without responding to a required comment question', async () => {
    const questions: SurveyQuestion[] = [
      {
        questionText: 'bar',
        type: 'comment',
        required: true,
        allowComments: true,
      },
    ];

    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        .questions=${questions}
      ></ia-feedback-survey>
    `)) as FeedbackSurvey;

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

    const commentField = el.shadowRoot!.querySelector(
      'textarea.comments'
    ) as HTMLTextAreaElement;
    expect(commentField.classList.contains('error')).to.be.true;

    const errorMessage = el.shadowRoot!.querySelector(
      '#error'
    ) as HTMLDivElement;
    expect(errorMessage.textContent).to.equal(
      'Please respond to the indicated questions.'
    );
  });

  it('submits the responses to the service when submit button is clicked', async () => {
    const service = new MockFeatureFeedbackService();
    const recaptchaManager = new MockRecaptchaManager();
    const questions: SurveyQuestion[] = [
      {
        questionText: 'foo',
        type: 'vote',
        allowComments: true,
      },
    ];

    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        .questions=${questions}
        .featureFeedbackService=${service}
        .recaptchaManager=${recaptchaManager}
      ></ia-feedback-survey>
    `)) as FeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const upvoteButton = el.shadowRoot!.querySelector(
      'label.vote-button.upvote-button'
    ) as HTMLLabelElement;
    upvoteButton.click();
    await el.updateComplete;

    const commentField = el.shadowRoot!.querySelector(
      'textarea.comments'
    ) as HTMLTextAreaElement;
    commentField.value = 'bar';
    // Manually dispatch an input event for the comment field,
    // as though the user typed into it.
    commentField.dispatchEvent(new InputEvent('input'));

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
          question: questions[0],
          index: 0,
          vote: 'up',
          comment: 'bar',
        },
      ],
      recaptchaToken: 'boop',
    });
  });

  it('submits extra info as comment', async () => {
    const service = new MockFeatureFeedbackService();
    const recaptchaManager = new MockRecaptchaManager();
    const questions: SurveyQuestion[] = [
      {
        questionText: 'foo',
        type: 'vote',
      },
      {
        questionText: 'foo',
        type: 'extra',
        extraInfo: 'bar',
      },
    ];

    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        .questions=${questions}
        .featureFeedbackService=${service}
        .recaptchaManager=${recaptchaManager}
      ></ia-feedback-survey>
    `)) as FeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const downvoteButton = el.shadowRoot!.querySelector(
      'label.vote-button.downvote-button'
    ) as HTMLLabelElement;
    downvoteButton.click();
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
          question: questions[0],
          index: 0,
          vote: 'down',
          comment: undefined,
        },
        {
          question: questions[1],
          index: 1,
          vote: undefined,
          comment: 'bar', // from extraInfo
        },
      ],
      recaptchaToken: 'boop',
    });
  });

  it('does not submit if no survey ID specified', async () => {
    const service = new MockFeatureFeedbackService();
    const recaptchaManager = new MockRecaptchaManager();
    const questions: SurveyQuestion[] = [
      {
        questionText: 'foo',
        type: 'vote',
      },
    ];

    const el = (await fixture(html`
      <ia-feedback-survey
        .questions=${questions}
        .featureFeedbackService=${service}
        .recaptchaManager=${recaptchaManager}
      ></ia-feedback-survey>
    `)) as FeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const upvoteButton = el.shadowRoot!.querySelector(
      'label.vote-button.upvote-button'
    ) as HTMLLabelElement;
    upvoteButton.click();
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
    const questions: SurveyQuestion[] = [
      {
        questionText: 'foo',
        type: 'vote',
      },
    ];

    const el = (await fixture(html`
      <ia-feedback-survey
        surveyIdentifier="foo-survey"
        .questions=${questions}
        .featureFeedbackService=${service}
        .submitTimeout=${100}
      ></ia-feedback-survey>
    `)) as FeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    const upvoteButton = el.shadowRoot!.querySelector(
      'label.vote-button.upvote-button'
    ) as HTMLLabelElement;
    upvoteButton.click();
    await el.updateComplete;

    const submitButton = el.shadowRoot!.querySelector(
      '#submit-button'
    ) as HTMLInputElement;
    submitButton.click();
    await el.updateComplete;
    await aTimeout(0);

    expect(service.surveySubmissionOptions).not.to.exist;
  });
});
