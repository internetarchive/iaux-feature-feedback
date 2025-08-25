/* eslint-disable import/no-duplicates */
import { html, fixture, expect } from '@open-wc/testing';
import Sinon from 'sinon';
import { IASurveyComment } from '../../../src/survey/questions/ia-survey-comment';
import '../../../src/survey/questions/ia-survey-comment';

describe('IASurveyComment', () => {
  it('renders basic component', async () => {
    const el = (await fixture(html`
      <ia-survey-comment></ia-survey-comment>
    `)) as IASurveyComment;

    const commentBox = el.shadowRoot!.querySelector(
      '#comments'
    ) as HTMLTextAreaElement;
    expect(commentBox).to.exist;
  });

  it('renders prompt text if provided', async () => {
    const el = (await fixture(html`
      <ia-survey-comment prompt="foo"></ia-survey-comment>
    `)) as IASurveyComment;

    const promptText = el.shadowRoot!.querySelector(
      '#prompt-text'
    ) as HTMLDivElement;
    expect(promptText.textContent?.trim()).to.equal('foo');

    const commentBox = el.shadowRoot!.querySelector(
      '#comments'
    ) as HTMLTextAreaElement;
    expect(commentBox).to.exist;
  });

  it('does not render prompt text if no prompt provided', async () => {
    const el = (await fixture(html`
      <ia-survey-comment></ia-survey-comment>
    `)) as IASurveyComment;

    const promptText = el.shadowRoot!.querySelector(
      '#prompt-text'
    ) as HTMLDivElement;
    expect(promptText).not.to.exist;
  });

  it('updates its comment value when textarea changed', async () => {
    const el = (await fixture(html`
      <ia-survey-comment prompt="foo"></ia-survey-comment>
    `)) as IASurveyComment;

    const commentBox = el.shadowRoot!.querySelector(
      '#comments'
    ) as HTMLTextAreaElement;
    commentBox.value = 'bar';
    commentBox.dispatchEvent(new Event('change'));
    await el.updateComplete;
    expect(el.value).to.equal('bar');
  });

  it('cannot change comment value when disabled', async () => {
    const el = (await fixture(html`
      <ia-survey-comment prompt="foo" disabled></ia-survey-comment>
    `)) as IASurveyComment;

    const commentBox = el.shadowRoot!.querySelector(
      '#comments'
    ) as HTMLTextAreaElement;
    commentBox.value = 'bar';
    commentBox.dispatchEvent(new Event('change'));
    await el.updateComplete;
    expect(el.value).to.equal('');
  });

  it('emits a responseChanged event when textarea changed', async () => {
    const spy = Sinon.spy();
    const callableSpy = spy as Function; // Just to silence an overzealous lit-analyzer lint error
    const el = (await fixture(html`
      <ia-survey-comment
        prompt="foo"
        @responseChanged=${callableSpy}
      ></ia-survey-comment>
    `)) as IASurveyComment;

    const commentBox = el.shadowRoot!.querySelector(
      '#comments'
    ) as HTMLTextAreaElement;
    commentBox.value = 'bar';
    commentBox.dispatchEvent(new Event('change'));
    await el.updateComplete;
    expect(spy.callCount).to.equal(1);
    expect(spy.lastCall.firstArg?.detail).to.deep.equal({
      name: 'foo',
      comment: 'bar',
    });
  });

  it('applies placeholder to comment box', async () => {
    const el = (await fixture(html`
      <ia-survey-comment prompt="foo" placeholder="bar"></ia-survey-comment>
    `)) as IASurveyComment;

    const commentField = el.shadowRoot!.querySelector(
      '#comments'
    ) as HTMLTextAreaElement;
    expect(commentField.placeholder).to.equal('bar');
  });

  it('returns its comment value in its response, if applicable', async () => {
    const el = (await fixture(html`
      <ia-survey-comment prompt="foo" value="bar"></ia-survey-comment>
    `)) as IASurveyComment;

    expect(el.response).to.deep.equal({
      name: 'foo',
      comment: 'bar',
    });
  });

  it('validates successfully if not required', async () => {
    const el = (await fixture(html`
      <ia-survey-comment prompt="foo"></ia-survey-comment>
    `)) as IASurveyComment;

    expect(el.validate()).to.be.true;
  });

  it('validates successfully if required with non-empty comment', async () => {
    const el = (await fixture(html`
      <ia-survey-comment prompt="foo" value="bar" required></ia-survey-comment>
    `)) as IASurveyComment;

    expect(el.validate()).to.be.true;
  });

  it('does not validate successfully if required with empty comment', async () => {
    const el = (await fixture(html`
      <ia-survey-comment prompt="foo" required></ia-survey-comment>
    `)) as IASurveyComment;

    expect(el.validate()).to.be.false;
  });

  it('shows error styling after failing validation', async () => {
    const el = (await fixture(html`
      <ia-survey-comment prompt="foo" required></ia-survey-comment>
    `)) as IASurveyComment;

    el.validate();

    const commentField = el.shadowRoot!.querySelector(
      '#comments'
    ) as HTMLTextAreaElement;
    expect(getComputedStyle(commentField).boxShadow).not.to.equal('none');
  });
});
