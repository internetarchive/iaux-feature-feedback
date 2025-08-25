/* eslint-disable import/no-duplicates */
import { html, fixture, expect } from '@open-wc/testing';
import Sinon from 'sinon';
import { IASurveyVote } from '../../../src/survey/questions/ia-survey-vote';
import { IASurveyComment } from '../../../src/survey/questions/ia-survey-comment';
import '../../../src/survey/questions/ia-survey-vote';

describe('IASurveyVote', () => {
  it('renders basic component', async () => {
    const el = (await fixture(html`
      <ia-survey-vote></ia-survey-vote>
    `)) as IASurveyVote;

    const upvoteButton = el.shadowRoot!.querySelector(
      '#upvote'
    ) as HTMLLabelElement;
    expect(upvoteButton).to.exist;

    const downvoteButton = el.shadowRoot!.querySelector(
      '#downvote'
    ) as HTMLLabelElement;
    expect(downvoteButton).to.exist;
  });

  it('renders prompt text if provided', async () => {
    const el = (await fixture(html`
      <ia-survey-vote prompt="foo"></ia-survey-vote>
    `)) as IASurveyVote;

    const promptText = el.shadowRoot!.querySelector(
      '#prompt-text'
    ) as HTMLDivElement;
    expect(promptText.textContent?.trim()).to.equal('foo');
  });

  it('does not render prompt text if no prompt provided', async () => {
    const el = (await fixture(html`
      <ia-survey-vote></ia-survey-vote>
    `)) as IASurveyVote;

    const promptText = el.shadowRoot!.querySelector(
      '#prompt-text'
    ) as HTMLDivElement;
    expect(promptText).not.to.exist;
  });

  it('can vote by clicking up/down buttons', async () => {
    const el = (await fixture(html`
      <ia-survey-vote prompt="foo"></ia-survey-vote>
    `)) as IASurveyVote;

    const upvoteButton = el.shadowRoot!.querySelector(
      '#upvote'
    ) as HTMLLabelElement;
    const downvoteButton = el.shadowRoot!.querySelector(
      '#downvote'
    ) as HTMLLabelElement;

    upvoteButton.click();
    await el.updateComplete;
    expect(el.vote).to.equal('up');
    expect(upvoteButton.classList.contains('selected')).to.be.true;
    expect(downvoteButton.classList.contains('unselected')).to.be.true;

    downvoteButton.click();
    await el.updateComplete;
    expect(el.vote).to.equal('down');
    expect(upvoteButton.classList.contains('unselected')).to.be.true;
    expect(downvoteButton.classList.contains('selected')).to.be.true;
  });

  it('cannot vote by clicking buttons when disabled', async () => {
    const el = (await fixture(html`
      <ia-survey-vote prompt="foo" disabled></ia-survey-vote>
    `)) as IASurveyVote;

    const upvoteButton = el.shadowRoot!.querySelector(
      '#upvote'
    ) as HTMLLabelElement;
    const downvoteButton = el.shadowRoot!.querySelector(
      '#downvote'
    ) as HTMLLabelElement;

    upvoteButton.click();
    await el.updateComplete;
    expect(el.vote).to.equal(undefined);
    expect(upvoteButton.classList.contains('noselection')).to.be.true;
    expect(downvoteButton.classList.contains('noselection')).to.be.true;

    downvoteButton.click();
    await el.updateComplete;
    expect(el.vote).to.equal(undefined);
    expect(upvoteButton.classList.contains('noselection')).to.be.true;
    expect(downvoteButton.classList.contains('noselection')).to.be.true;
  });

  it('can vote with Enter key', async () => {
    const el = (await fixture(html`
      <ia-survey-vote prompt="foo"></ia-survey-vote>
    `)) as IASurveyVote;

    const upvoteButton = el.shadowRoot!.querySelector(
      '#upvote'
    ) as HTMLLabelElement;
    const downvoteButton = el.shadowRoot!.querySelector(
      '#downvote'
    ) as HTMLLabelElement;

    upvoteButton.control?.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
      })
    );
    await el.updateComplete;
    expect(el.vote).to.equal('up');
    expect(upvoteButton.classList.contains('selected')).to.be.true;
    expect(downvoteButton.classList.contains('unselected')).to.be.true;

    downvoteButton.control?.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
      })
    );
    await el.updateComplete;
    expect(el.vote).to.equal('down');
    expect(upvoteButton.classList.contains('unselected')).to.be.true;
    expect(downvoteButton.classList.contains('selected')).to.be.true;
  });

  it('cannot vote with Enter key when disabled', async () => {
    const el = (await fixture(html`
      <ia-survey-vote prompt="foo" disabled></ia-survey-vote>
    `)) as IASurveyVote;

    const upvoteButton = el.shadowRoot!.querySelector(
      '#upvote'
    ) as HTMLLabelElement;
    const downvoteButton = el.shadowRoot!.querySelector(
      '#downvote'
    ) as HTMLLabelElement;

    upvoteButton.control?.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
      })
    );
    await el.updateComplete;
    expect(el.vote).to.equal(undefined);
    expect(upvoteButton.classList.contains('noselection')).to.be.true;
    expect(downvoteButton.classList.contains('noselection')).to.be.true;

    downvoteButton.control?.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
      })
    );
    await el.updateComplete;
    expect(el.vote).to.equal(undefined);
    expect(upvoteButton.classList.contains('noselection')).to.be.true;
    expect(downvoteButton.classList.contains('noselection')).to.be.true;
  });

  it('can vote with Space key', async () => {
    const el = (await fixture(html`
      <ia-survey-vote prompt="foo"></ia-survey-vote>
    `)) as IASurveyVote;

    const upvoteButton = el.shadowRoot!.querySelector(
      '#upvote'
    ) as HTMLLabelElement;
    const downvoteButton = el.shadowRoot!.querySelector(
      '#downvote'
    ) as HTMLLabelElement;

    upvoteButton.control?.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: ' ',
      })
    );
    await el.updateComplete;
    expect(el.vote).to.equal('up');
    expect(upvoteButton.classList.contains('selected')).to.be.true;
    expect(downvoteButton.classList.contains('unselected')).to.be.true;

    downvoteButton.control?.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: ' ',
      })
    );
    await el.updateComplete;
    expect(el.vote).to.equal('down');
    expect(upvoteButton.classList.contains('unselected')).to.be.true;
    expect(downvoteButton.classList.contains('selected')).to.be.true;
  });

  it('cannot vote with Space key when disabled', async () => {
    const el = (await fixture(html`
      <ia-survey-vote prompt="foo" disabled></ia-survey-vote>
    `)) as IASurveyVote;

    const upvoteButton = el.shadowRoot!.querySelector(
      '#upvote'
    ) as HTMLLabelElement;
    const downvoteButton = el.shadowRoot!.querySelector(
      '#downvote'
    ) as HTMLLabelElement;

    upvoteButton.control?.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: ' ',
      })
    );
    await el.updateComplete;
    expect(el.vote).to.equal(undefined);
    expect(upvoteButton.classList.contains('noselection')).to.be.true;
    expect(downvoteButton.classList.contains('noselection')).to.be.true;

    downvoteButton.control?.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: ' ',
      })
    );
    await el.updateComplete;
    expect(el.vote).to.equal(undefined);
    expect(upvoteButton.classList.contains('noselection')).to.be.true;
    expect(downvoteButton.classList.contains('noselection')).to.be.true;
  });

  it('renders comment box when showComments is true', async () => {
    const el = (await fixture(html`
      <ia-survey-vote prompt="foo" showComments></ia-survey-vote>
    `)) as IASurveyVote;

    const commentField = el.shadowRoot!.querySelector(
      '#comments'
    ) as IASurveyComment;
    expect(commentField).to.exist;
  });

  it('does not render comment box when showComments is not true', async () => {
    const el = (await fixture(html`
      <ia-survey-vote prompt="foo"></ia-survey-vote>
    `)) as IASurveyVote;

    const commentField = el.shadowRoot!.querySelector(
      '#comments'
    ) as IASurveyComment;
    expect(commentField).not.to.exist;
  });

  it('cannot change comment when disabled', async () => {
    const el = (await fixture(html`
      <ia-survey-vote prompt="foo" showComments disabled></ia-survey-vote>
    `)) as IASurveyVote;

    const commentField = el.shadowRoot!.querySelector(
      '#comments'
    ) as IASurveyComment;
    commentField.value = 'bar';
    commentField.dispatchEvent(
      new CustomEvent('responseChanged', {
        detail: {
          name: '',
          comment: 'bar',
        },
      })
    );
    await el.updateComplete;

    expect(el.comment).to.be.undefined;
  });

  it('applies placeholder to comment box', async () => {
    const el = (await fixture(html`
      <ia-survey-vote
        prompt="foo"
        showComments
        commentPlaceholder="foobar"
      ></ia-survey-vote>
    `)) as IASurveyVote;

    const commentField = el.shadowRoot!.querySelector(
      '#comments'
    ) as IASurveyComment;
    expect(commentField.placeholder).to.equal('foobar');
  });

  it('emits a responseChanged event when vote changes', async () => {
    const spy = Sinon.spy();
    const callableSpy = spy as Function; // Just to silence an overzealous lit-analyzer lint error
    const el = (await fixture(html`
      <ia-survey-vote
        prompt="foo"
        @responseChanged=${callableSpy}
      ></ia-survey-vote>
    `)) as IASurveyVote;

    const upvoteButton = el.shadowRoot!.querySelector(
      '#upvote'
    ) as HTMLLabelElement;
    const downvoteButton = el.shadowRoot!.querySelector(
      '#downvote'
    ) as HTMLLabelElement;

    upvoteButton.click();
    await el.updateComplete;
    expect(spy.callCount).to.equal(1);
    expect(spy.lastCall.firstArg?.detail).to.deep.equal({
      name: 'foo',
      rating: 'up',
    });

    downvoteButton.click();
    await el.updateComplete;
    expect(spy.callCount).to.equal(2);
    expect(spy.lastCall.firstArg?.detail).to.deep.equal({
      name: 'foo',
      rating: 'down',
    });
  });

  it('emits a responseChanged event when comment changes', async () => {
    const spy = Sinon.spy();
    const callableSpy = spy as Function; // Just to silence an overzealous lit-analyzer lint error
    const el = (await fixture(html`
      <ia-survey-vote
        prompt="foo"
        showComments
        @responseChanged=${callableSpy}
      ></ia-survey-vote>
    `)) as IASurveyVote;

    const commentField = el.shadowRoot!.querySelector(
      '#comments'
    ) as IASurveyComment;
    commentField.value = 'bar';
    commentField.dispatchEvent(
      new CustomEvent('responseChanged', {
        detail: {
          name: '',
          comment: 'bar',
        },
      })
    );
    await el.updateComplete;

    expect(spy.callCount).to.equal(1);
    expect(spy.lastCall.firstArg?.detail).to.deep.equal({
      name: 'foo',
      rating: undefined,
      comment: 'bar',
    });
  });

  it('returns its vote value in its response', async () => {
    const el = (await fixture(html`
      <ia-survey-vote prompt="foo" vote="up"></ia-survey-vote>
    `)) as IASurveyVote;

    expect(el.response).to.deep.equal({
      name: 'foo',
      rating: 'up',
    });
  });

  it('returns both its vote & comment values in its response, if applicable', async () => {
    const el = (await fixture(html`
      <ia-survey-vote
        prompt="foo"
        vote="down"
        comment="bar"
        showComments
      ></ia-survey-vote>
    `)) as IASurveyVote;

    expect(el.response).to.deep.equal({
      name: 'foo',
      rating: 'down',
      comment: 'bar',
    });
  });

  it('validates successfully if not required', async () => {
    const el = (await fixture(html`
      <ia-survey-vote prompt="foo"></ia-survey-vote>
    `)) as IASurveyVote;

    expect(el.validate()).to.be.true;
  });

  it('validates successfully if required with vote selected', async () => {
    const el = (await fixture(html`
      <ia-survey-vote prompt="foo" vote="up" required></ia-survey-vote>
    `)) as IASurveyVote;

    expect(el.validate()).to.be.true;
  });

  it('does not validate successfully if required with no vote selected', async () => {
    const el = (await fixture(html`
      <ia-survey-vote prompt="foo" required></ia-survey-vote>
    `)) as IASurveyVote;

    expect(el.validate()).to.be.false;
  });

  it('shows error styling after failing validation', async () => {
    const el = (await fixture(html`
      <ia-survey-vote prompt="foo" required></ia-survey-vote>
    `)) as IASurveyVote;

    el.validate();
    await el.updateComplete;

    const upvoteButton = el.shadowRoot!.querySelector(
      '#upvote'
    ) as HTMLLabelElement;
    const downvoteButton = el.shadowRoot!.querySelector(
      '#downvote'
    ) as HTMLLabelElement;
    expect(getComputedStyle(upvoteButton).boxShadow).not.to.equal('none');
    expect(getComputedStyle(downvoteButton).boxShadow).not.to.equal('none');
  });
});
