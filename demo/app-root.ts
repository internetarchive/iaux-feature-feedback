import { RecaptchaManager } from '@internetarchive/recaptcha-manager';
import { SharedResizeObserver } from '@internetarchive/shared-resize-observer';
import { html, css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { FeatureFeedbackService } from '../src/feature-feedback-service';
import '../src/feature-feedback';
import '../src/survey/ia-feedback-survey';
import '../src/survey/questions/ia-survey-vote';
import '../src/survey/questions/ia-survey-comment';
import '../src/survey/questions/ia-survey-extra';

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
        .recaptchaManager=${this.recaptchaManager}
        .featureFeedbackService=${this.featureFeedbackService}
        .resizeObserver=${this.resizeObserver}
      >
        <ia-survey-vote
          prompt="How do you feel about foo?"
          required
        ></ia-survey-vote>
        <ia-survey-extra name="foo" value="bar"></ia-survey-extra>
        <p>
          This is some embedded explanatory text. The above question requires a
          response, but the next question is optional.
        </p>
        <ia-survey-vote
          prompt="How do you feel about bar?"
          showComments
          commentPlaceholder="You may enter an optional comment as well..."
        ></ia-survey-vote>
        <p>The following question should be disabled.</p>
        <ia-survey-vote
          prompt="How do you feel about baz?"
          disabled
        ></ia-survey-vote>
        <p>The following question should not be numbered.</p>
        <ia-survey-vote
          prompt="How do you feel about quux?"
          skipNumber
        ></ia-survey-vote>
        <ia-survey-comment
          prompt="What does foobar mean to you?"
          placeholder="You must answer this question."
          required
        ></ia-survey-comment>
        <ia-survey-comment
          prompt="Anything else to add?"
          placeholder="Please share... (optional)"
          style="--commentResize: vertical;"
        ></ia-survey-comment>
      </ia-feedback-survey>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    .right {
      float: right;
    }

    ia-feedback-survey > p {
      font-size: 12px;
    }
  `;
}
