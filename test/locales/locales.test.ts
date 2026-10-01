import { html, fixture, expect } from '@open-wc/testing';
import { configureLocalization } from '@lit/localize';
import { templates } from '../../src/locales/es';
import type { FeatureFeedback } from '../../src/feature-feedback';
import type { IAFeedbackSurvey } from '../../src/survey/ia-feedback-survey';
import type { IASurveyVote } from '../../src/survey/questions/ia-survey-vote';
import type { IASurveyComment } from '../../src/survey/questions/ia-survey-comment';
import '../../src/feature-feedback';
import '../../src/survey/ia-feedback-survey';
import '../../src/survey/questions/ia-survey-vote';
import '../../src/survey/questions/ia-survey-comment';

// This package never configures localization. The app that uses it does, once,
// and this file stands in for that app.
const { setLocale } = configureLocalization({
  sourceLocale: 'en',
  targetLocales: ['es'],
  loadLocale: () => import('../../src/locales/es'),
});

/** Ids of the units in the XLIFF with a non-blank target. */
async function translatedIds(): Promise<string[]> {
  const xliff = await (await fetch('/xliff/es.xlf')).text();
  return [
    ...xliff.matchAll(
      /<trans-unit id="([^"]+)"[^>]*>([\s\S]*?)<\/trans-unit>/g
    ),
  ]
    .filter(([, , unit]) => {
      const target = /<target>([\s\S]*?)<\/target>/.exec(unit);
      return target !== null && target[1].trim() !== '';
    })
    .map(([, id]) => id);
}

describe('published es locale', () => {
  afterEach(async () => {
    await setLocale('en');
  });

  it('has exactly the translated units in the XLIFF', async () => {
    // An untranslated message has to be missing, not English. The app merges
    // this module with others, and an English entry would override a real
    // translation of the same text.
    const ids = await translatedIds();
    expect(ids).to.not.be.empty;
    expect(Object.keys(templates).sort()).to.deep.equal(ids.sort());
  });

  it('re-renders the survey in Spanish when the app switches locale', async () => {
    const el = await fixture<IAFeedbackSurvey>(html`
      <ia-feedback-survey>
        <ia-survey-vote prompt="Foo?"></ia-survey-vote>
        <ia-survey-comment prompt="Bar?"></ia-survey-comment>
      </ia-feedback-survey>
    `);
    el.shadowRoot?.querySelector<HTMLButtonElement>('#beta-button')?.click();
    await el.updateComplete;
    const vote = el.querySelector<IASurveyVote>('ia-survey-vote');
    const comment = el.querySelector<IASurveyComment>('ia-survey-comment');

    const text = (host: Element | null, selector: string) =>
      host?.shadowRoot?.querySelector(selector)?.textContent?.trim();
    const placeholder = () =>
      comment?.shadowRoot?.querySelector('textarea')?.placeholder;

    expect(text(el, '#button-text')).to.equal('Feedback');
    expect(text(el, '#submit-button')).to.equal('Submit feedback');

    await setLocale('es');
    await Promise.all([
      el.updateComplete,
      vote?.updateComplete,
      comment?.updateComplete,
    ]);

    expect(text(el, '#button-text')).to.equal('Comentarios');
    expect(text(el, '#survey-heading')).to.equal('Encuesta de opinión');
    expect(text(el, '#cancel-button')).to.equal('Cancelar');
    expect(text(el, '#submit-button')).to.equal('Enviar comentarios');
    expect(text(vote, '#upvote .sr-only')).to.equal('Votar a favor');
    expect(text(vote, '#downvote .sr-only')).to.equal('Votar en contra');
    expect(placeholder()).to.equal('Comentarios (opcional)');
  });

  it('re-renders feature-feedback in Spanish when the app switches locale', async () => {
    const el = await fixture<FeatureFeedback>(html`
      <feature-feedback displayMode="vote-prompt"></feature-feedback>
    `);
    const root = el.shadowRoot;
    const text = (selector: string) =>
      root?.querySelector(selector)?.textContent?.trim();
    const placeholder = () =>
      root?.querySelector<HTMLTextAreaElement>('#comments')?.placeholder;
    const submitValue = () =>
      root?.querySelector<HTMLInputElement>('#submit-button')?.value;

    expect(text('.prompt-text')).to.equal('Do you find this feature useful?');
    expect(text('#cancel-button')).to.equal('Cancel');

    root?.querySelector<HTMLInputElement>('#submit-button')?.click();
    await el.updateComplete;
    expect(text('#error')).to.equal('Please select a vote.');

    await setLocale('es');
    await el.updateComplete;

    expect(text('.prompt-text')).to.equal('¿Te resulta útil esta función?');
    expect(text('#comment-button')).to.equal('Deja un comentario');
    expect(text('#cancel-button')).to.equal('Cancelar');
    expect(submitValue()).to.equal('Enviar comentarios');
    expect(placeholder()).to.equal('Comentarios (opcional)');
    expect(text('#error')).to.equal('Selecciona un voto.');
  });
});
