/* eslint-disable import/no-duplicates */
import { html, fixture, expect } from '@open-wc/testing';
import { IASurveyExtra } from '../../../src/survey/questions/ia-survey-extra';
import '../../../src/survey/questions/ia-survey-extra';

describe('IASurveyComment', () => {
  it('renders basic component', async () => {
    const el = (await fixture(html`
      <ia-survey-extra></ia-survey-extra>
    `)) as IASurveyExtra;

    // Component has no shadow root and no children
    expect(el.shadowRoot).not.to.exist;
    expect(el.children.length).to.equal(0);
  });

  it('returns its assigned name & value as its response', async () => {
    const el = (await fixture(html`
      <ia-survey-extra name="foo" value="bar"></ia-survey-extra>
    `)) as IASurveyExtra;

    expect(el.response).to.deep.equal({
      name: 'foo',
      comment: 'bar',
    });
  });

  it('is always excluded from numbering', async () => {
    const el = (await fixture(html`
      <ia-survey-extra name="foo"></ia-survey-extra>
    `)) as IASurveyExtra;

    expect(el.numbered).to.be.false;
  });

  it('always validates successfully', async () => {
    const el = (await fixture(html`
      <ia-survey-extra name="foo"></ia-survey-extra>
    `)) as IASurveyExtra;

    expect(el.validate()).to.be.true;
  });
});
