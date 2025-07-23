/* eslint-disable import/no-duplicates */
import { html, fixture, expect, nextFrame } from '@open-wc/testing';
import { FeatureFeedback } from '../src/feature-feedback';
import '../src/feature-feedback';
import { MockFeatureFeedbackService } from './mocks/mock-feature-feedback-service';
import { MockRecaptchaManager } from './mocks/mock-recaptcha-manager';

describe('FeatureFeedback', () => {
  it('shows a button that defaults to text Beta', async () => {
    const el = (await fixture(html`
      <feature-feedback></feature-feedback>
    `)) as FeatureFeedback;
    const textContainer = el.shadowRoot!.querySelector(
      '#button-text'
    ) as HTMLSpanElement;
    expect(textContainer.innerText).to.equal('Beta');
  });

  it('can customize the button text', async () => {
    const el = (await fixture(html`
      <feature-feedback .buttonText=${'Boop'}></feature-feedback>
    `)) as FeatureFeedback;
    const textContainer = el.shadowRoot!.querySelector(
      '#button-text'
    ) as HTMLSpanElement;
    expect(textContainer.innerText).to.equal('Boop');
  });

  it('shows the popup when button is clicked', async () => {
    const el = (await fixture(html`
      <feature-feedback></feature-feedback>
    `)) as FeatureFeedback;
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
      <feature-feedback></feature-feedback>
    `)) as FeatureFeedback;
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
      <feature-feedback></feature-feedback>
    `)) as FeatureFeedback;
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

  it('submits the response to the service', async () => {
    const service = new MockFeatureFeedbackService();
    const recaptchaManager = new MockRecaptchaManager();

    const el = (await fixture(html`
      <feature-feedback
        featureIdentifier="foo-feature"
        .featureFeedbackService=${service}
        .recaptchaManager=${recaptchaManager}
      ></feature-feedback>
    `)) as FeatureFeedback;
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
    expect(service.submissionOptions).to.deep.equal({
      featureIdentifier: 'foo-feature',
      vote: 'up',
      comments: '',
      recaptchaToken: 'boop',
    });
  });

  it('shows an error if user tries to submit without selecting a vote', async () => {
    const el = (await fixture(html`
      <feature-feedback featureIdentifier="foo-feature"></feature-feedback>
    `)) as FeatureFeedback;
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
  });

  it('in vote-prompt mode, shows the prompt with vote/comment buttons', async () => {
    const el = (await fixture(html`
      <feature-feedback
        displayMode="vote-prompt"
        prompt="foobar"
      ></feature-feedback>
    `)) as FeatureFeedback;

    const promptContainer = el.shadowRoot!.querySelector('.prompt');
    const promptText = promptContainer!.querySelector(
      '.prompt-text'
    ) as HTMLSpanElement;
    expect(promptText.innerText).to.equal('foobar');

    const voteButtons = promptContainer!.querySelectorAll('.vote-button');
    expect(voteButtons.length).to.equal(2);

    const commentButton = promptContainer!.querySelector(
      '#comment-button'
    ) as HTMLButtonElement;
    expect(commentButton).to.exist;
  });

  it('in vote-prompt mode, submits feedback when clicking a vote button outside the popup', async () => {
    const service = new MockFeatureFeedbackService();
    const recaptchaManager = new MockRecaptchaManager();

    const el = (await fixture(html`
      <feature-feedback
        displayMode="vote-prompt"
        featureIdentifier="foo-feature"
        .featureFeedbackService=${service}
        .recaptchaManager=${recaptchaManager}
      ></feature-feedback>
    `)) as FeatureFeedback;

    const upvoteButton = el.shadowRoot!.querySelector(
      ':not(#popup) .upvote-button'
    ) as HTMLLabelElement;
    upvoteButton.click();

    await el.updateComplete;
    await nextFrame();
    expect(service.submissionOptions).to.deep.equal({
      featureIdentifier: 'foo-feature',
      vote: 'up',
      comments: '',
      recaptchaToken: 'boop',
    });
  });

  it('in vote-prompt mode, shows the popup when "Leave a comment" is clicked', async () => {
    const el = (await fixture(html`
      <feature-feedback displayMode="vote-prompt"></feature-feedback>
    `)) as FeatureFeedback;

    const commentButton = el.shadowRoot!.querySelector(
      '#comment-button'
    ) as HTMLButtonElement;
    const background = el.shadowRoot!.querySelector(
      '#popup-background'
    ) as HTMLDivElement;

    const classes = background.classList;
    expect(classes.contains('closed')).to.be.true;
    expect(classes.contains('open')).to.be.false;

    commentButton.click();
    await el.updateComplete;
    expect(classes.contains('open')).to.be.true;
    expect(classes.contains('closed')).to.be.false;
  });
});
