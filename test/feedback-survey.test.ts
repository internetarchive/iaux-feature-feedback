/* eslint-disable import/no-duplicates */
import { html, fixture, expect, aTimeout } from '@open-wc/testing';
import { SharedResizeObserver } from '@internetarchive/shared-resize-observer';
import { FeedbackSurvey } from '../src/feedback-survey';
import { SurveyQuestion } from '../src/models';
import { MockFeatureFeedbackService } from './mocks/mock-feature-feedback-service';
import { MockRecaptchaManager } from './mocks/mock-recaptcha-manager';
import '../src/feedback-survey';

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

  it('correctly handles many different questions & questions types simultaneously', async () => {
    const service = new MockFeatureFeedbackService();
    const recaptchaManager = new MockRecaptchaManager();

    const longSurveyQuestions: SurveyQuestion[] = [
      {
        questionText: 'extra info',
        type: 'extra',
        extraInfo: 'foo-extra-1',
      },
      {
        questionText: 'required vote, no comment',
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
        questionText: 'optional vote, no comment',
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
        allowComments: true,
      },
      {
        questionText: 'yet more extra info',
        type: 'extra',
        extraInfo: 'foo-extra-3',
      },
    ];

    const el = (await fixture(html`
      <ia-feedback-survey
        showQuestionNumbers
        surveyIdentifier="foo-survey"
        .questions=${longSurveyQuestions}
        .featureFeedbackService=${service}
        .recaptchaManager=${recaptchaManager}
      ></ia-feedback-survey>
    `)) as FeedbackSurvey;

    const button = el.shadowRoot!.querySelector(
      '#beta-button'
    ) as HTMLButtonElement;
    button.click();
    await el.updateComplete;

    // Ensure it renders the 6 non-extra questions
    const questions = el.shadowRoot!.querySelectorAll('.question');
    expect(questions.length).to.equal(6);

    // Define some helpers for conciseness
    const getPromptText = (elmt: Element) =>
      elmt.querySelector('.prompt-text') as HTMLDivElement;

    const getUpvoteButton = (elmt: Element) =>
      elmt.querySelector('.vote-button.upvote-button') as HTMLLabelElement;

    const getDownvoteButton = (elmt: Element) =>
      elmt.querySelector('.vote-button.downvote-button') as HTMLLabelElement;

    const getCommentBox = (elmt: Element) =>
      elmt.querySelector('.comments') as HTMLTextAreaElement;

    const getSurveyElements = (
      elmt: Element
    ): [
      HTMLDivElement,
      HTMLLabelElement,
      HTMLLabelElement,
      HTMLTextAreaElement
    ] => [
      getPromptText(elmt),
      getUpvoteButton(elmt),
      getDownvoteButton(elmt),
      getCommentBox(elmt),
    ];

    const [q1Prompt, q1Up, q1Down, q1Comment] = getSurveyElements(questions[0]);
    const [q2Prompt, q2Up, q2Down, q2Comment] = getSurveyElements(questions[1]);
    const [q3Prompt, q3Up, q3Down, q3Comment] = getSurveyElements(questions[2]);
    const [q4Prompt, q4Up, q4Down, q4Comment] = getSurveyElements(questions[3]);
    const [q5Prompt, q5Up, q5Down, q5Comment] = getSurveyElements(questions[4]);
    const [q6Prompt, q6Up, q6Down, q6Comment] = getSurveyElements(questions[5]);

    // Answer some but not all of the required questions
    q1Up.click();

    q2Comment.value = 'foo-comment';
    q2Comment.dispatchEvent(new InputEvent('input'));

    // Try to submit and check what gets the error styling
    await el.updateComplete;
    const submitButton = el.shadowRoot!.querySelector(
      '#submit-button'
    ) as HTMLInputElement;
    submitButton.click();
    await el.updateComplete;

    // Q1 had all required responses, so no error styling
    expect(q1Prompt.textContent).to.match(/1\.\s+required vote, no comment/);
    expect(q1Up.classList.contains('error')).to.be.false;
    expect(q1Down.classList.contains('error')).to.be.false;
    expect(q1Comment).not.to.exist;

    // Q2 was missing a required vote, so the vote buttons should be error-styled
    expect(q2Prompt.textContent).to.match(/2\.\s+required vote with comment/);
    expect(q2Up.classList.contains('error')).to.be.true;
    expect(q2Down.classList.contains('error')).to.be.true;
    expect(q2Comment.classList.contains('error')).to.be.false;

    // Q3 was missing a required comment, so the comment box should be error-styled
    expect(q3Prompt.textContent).to.match(/3\.\s+required comment/);
    expect(q3Up).not.to.exist;
    expect(q3Down).not.to.exist;
    expect(q3Comment.classList.contains('error')).to.be.true;

    // Q4-Q6 are not required, so no error styling
    expect(q4Prompt.textContent).to.match(/4\.\s+optional vote, no comment/);
    expect(q4Up.classList.contains('error')).to.be.false;
    expect(q4Down.classList.contains('error')).to.be.false;
    expect(q4Comment).not.to.exist;

    expect(q5Prompt.textContent).to.match(/5\.\s+optional vote with comment/);
    expect(q5Up.classList.contains('error')).to.be.false;
    expect(q5Down.classList.contains('error')).to.be.false;
    expect(q5Comment.classList.contains('error')).to.be.false;

    expect(q6Prompt.textContent).to.match(/6\.\s+optional comment/);
    expect(q6Up).not.to.exist;
    expect(q6Down).not.to.exist;
    expect(q6Comment.classList.contains('error')).to.be.false;

    // Fill in the remaining required responses + some optional ones, and resubmit
    q2Down.click();

    q3Comment.value = 'bar-comment';
    q3Comment.dispatchEvent(new InputEvent('input'));

    q5Up.click();
    q5Comment.value = 'baz-comment';
    q5Comment.dispatchEvent(new InputEvent('input'));

    await el.updateComplete;
    submitButton.click();
    await el.updateComplete;
    await aTimeout(0);

    // Verify that the responses sent to the service are correct
    expect(service.surveySubmissionOptions).to.deep.equal({
      surveyIdentifier: 'foo-survey',
      responses: [
        {
          question: longSurveyQuestions[0],
          index: 0,
          vote: undefined,
          comment: 'foo-extra-1',
        },
        {
          question: longSurveyQuestions[1],
          index: 1,
          vote: 'up',
          comment: undefined,
        },
        {
          question: longSurveyQuestions[2],
          index: 2,
          vote: 'down',
          comment: 'foo-comment',
        },
        {
          question: longSurveyQuestions[3],
          index: 3,
          vote: undefined,
          comment: 'bar-comment',
        },
        {
          question: longSurveyQuestions[4],
          index: 4,
          vote: undefined,
          comment: 'foo-extra-2',
        },
        {
          question: longSurveyQuestions[5],
          index: 5,
          vote: undefined,
          comment: undefined,
        },
        {
          question: longSurveyQuestions[6],
          index: 6,
          vote: 'up',
          comment: 'baz-comment',
        },
        {
          question: longSurveyQuestions[7],
          index: 7,
          vote: undefined,
          comment: undefined,
        },
        {
          question: longSurveyQuestions[8],
          index: 8,
          vote: undefined,
          comment: 'foo-extra-3',
        },
      ],
      recaptchaToken: 'boop',
    });
  });
});
