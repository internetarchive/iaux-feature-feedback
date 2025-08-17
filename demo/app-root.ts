import { RecaptchaManager } from '@internetarchive/recaptcha-manager';
import { SharedResizeObserver } from '@internetarchive/shared-resize-observer';
import { html, css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { FeatureFeedbackService } from '../src/feature-feedback-service';
import { SurveyQuestion } from '../src/models';
import '../src/feature-feedback';
import '../src/ia-feedback-survey';

const SESSION_ID_STORAGE_KEY = 'feature-feedback-demo-session-id';
const getSessionId = (): string => {
  const existingSessionId = window.sessionStorage.getItem(
    SESSION_ID_STORAGE_KEY
  );
  if (existingSessionId) return existingSessionId;

  const newSessionId = `${Math.floor(Math.random() * 1000000000)}`;
  window.sessionStorage.setItem(SESSION_ID_STORAGE_KEY, newSessionId);
  return newSessionId;
};

const surveyQuestions: SurveyQuestion[] = [
  {
    questionText: 'Session ID',
    type: 'extra',
    extraInfo: getSessionId(),
  },
  {
    questionText: 'User Agent',
    type: 'extra',
    extraInfo: navigator.userAgent,
  },
  {
    questionText: 'What is your favorite animal?',
    type: 'comment',
    required: true,
    allowComments: true,
    commentPlaceholder: 'Ex: zebra',
    commentHeight: 32,
  },
  {
    questionText: 'How do you feel about foos?',
    type: 'vote',
    required: true,
    allowComments: true,
    commentPlaceholder: 'Why? (optional)',
    commentHeight: 32,
  },
  {
    questionText: 'What do you think of foobars?',
    type: 'vote',
    required: true,
    allowComments: false,
  },
  {
    questionText: 'Any other thoughts?',
    type: 'comment',
    required: false,
    allowComments: true,
  },
];

@customElement('app-root')
export class AppRoot extends LitElement {
  recaptchaManager = new RecaptchaManager({
    defaultSiteKey: 'foo',
  });

  featureFeedbackService = new FeatureFeedbackService({
    serviceUrl: 'http://local.archive.org:5000',
  });

  resizeObserver = new SharedResizeObserver();

  render() {
    return html`
      <p>
        Esse consectetur veniam qui consectetur est esse do ipsum. Et labore non
        proident et irure culpa amet voluptate laboris eu in. Dolore incididunt
        duis do minim sint occaecat reprehenderit esse sit aliqua.
      </p>

      <feature-feedback
        class="right"
        .recaptchaManager=${this.recaptchaManager}
        .featureFeedbackService=${this.featureFeedbackService}
        .resizeObserver=${this.resizeObserver}
        .featureIdentifier=${'demo-feature'}
        .prompt=${'Do you find foos to be better than bars?'}
        disabled
      >
      </feature-feedback>
      <p>
        Et esse sunt officia velit. Excepteur non sint irure non consectetur
        labore deserunt aliqua elit. Commodo cupidatat tempor minim
        reprehenderit pariatur aliqua fugiat fugiat Lorem anim est nisi culpa
        ea. Sint fugiat aute reprehenderit ullamco magna ullamco exercitation ea
        sunt reprehenderit. Incididunt commodo sunt velit consequat elit amet ea
        aute et tempor. Amet qui ut nostrud ullamco labore tempor.
      </p>

      <feature-feedback
        .recaptchaManager=${this.recaptchaManager}
        .featureFeedbackService=${this.featureFeedbackService}
        .resizeObserver=${this.resizeObserver}
        .featureIdentifier=${'demo-feature'}
      >
      </feature-feedback>

      <p>
        Reprehenderit exercitation ipsum mollit cillum non esse. Laborum
        adipisicing ea et et nulla qui aliqua proident velit cillum. Ut magna
        non quis do laboris elit elit dolor est aliquip dolore nostrud tempor
        Lorem. Duis irure id anim ea cupidatat consequat sint. Laboris occaecat
        enim adipisicing qui anim ex ullamco do laborum laboris exercitation
        excepteur excepteur sint. Sit duis est enim Lorem Lorem elit nisi
        deserunt id in cillum pariatur.
      </p>

      <feature-feedback
        displayMode="vote-prompt"
        .recaptchaManager=${this.recaptchaManager}
        .featureFeedbackService=${this.featureFeedbackService}
        .resizeObserver=${this.resizeObserver}
        .featureIdentifier=${'demo-feature'}
      >
      </feature-feedback>

      <p>
        Ea labore laborum proident eiusmod nostrud non do nisi sunt do consequat
        exercitation. Incididunt cillum cupidatat laboris eu enim dolor magna et
        qui cupidatat in. Elit adipisicing excepteur eiusmod voluptate eu dolore
        sunt voluptate do. Ad duis id qui dolor.
      </p>

      <feature-feedback
        class="right"
        .recaptchaManager=${this.recaptchaManager}
        .featureFeedbackService=${this.featureFeedbackService}
        .resizeObserver=${this.resizeObserver}
        .featureIdentifier=${'demo-feature'}
      >
      </feature-feedback>

      <p>
        Nulla reprehenderit et consequat cupidatat reprehenderit pariatur anim
        aute nulla. Sunt labore mollit nulla irure laboris sunt occaecat. Ea
        velit laboris in dolore do nulla Lorem irure exercitation aute et. Ea id
        ut eiusmod eiusmod commodo sunt proident sunt cillum cupidatat nisi
        irure. Non amet non mollit id ex tempor ipsum fugiat pariatur minim ex
        fugiat. Aute excepteur enim ad consectetur duis eu aute sint fugiat.
        Nulla cillum fugiat tempor esse non eu dolore adipisicing magna.
      </p>

      <ia-feedback-survey
        showButtonThumbs
        showQuestionNumbers
        .surveyIdentifier=${'demo-survey'}
        .questions=${surveyQuestions}
        .recaptchaManager=${this.recaptchaManager}
        .featureFeedbackService=${this.featureFeedbackService}
        .resizeObserver=${this.resizeObserver}
      ></ia-feedback-survey>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    .right {
      float: right;
    }
  `;
}
