![Build Status](https://github.com/internetarchive/iaux-feature-feedback/actions/workflows/ci.yml/badge.svg)

# Internet Archive Feature Feedback Component

This is a collection of widgets that let us collect feedback on features that we release. Written in LitElement.

![Feature Feedback](/assets/screenshot.png "Screenshot")


## Installation

```shell
> npm i @internetarchive/feature-feedback
```

## Usage

### Feature Feedback widget for single-question feedback

```ts
import { RecaptchaManager } from '@internetarchive/recaptcha-manager';
import { SharedResizeObserver } from '@internetarchive/shared-resize-observer';
import { FeatureFeedbackService } from '@internetarchive/feature-feedback';
import '@internetarchive/feature-feedback';

const recaptchaManager = new RecaptchaManager({
  defaultSiteKey: '',
});
const featureFeedbackService = new FeatureFeedbackService({
  serviceUrl: 'http://local.archive.org:5000',
});
const resizeObserver = new SharedResizeObserver();

html`
  <feature-feedback
    .recaptchaManager=${recaptchaManager}
    .featureFeedbackService=${featureFeedbackService}
    .resizeObserver=${resizeObserver}
    .featureIdentifier=${'demo-feature'}
    .prompt=${'Do you find foos to be better than bars?'}
  ></feature-feedback>`;
```

### Feedback Survey widget for multi-question feedback

```ts
  import { RecaptchaManager } from '@internetarchive/recaptcha-manager';
  import { SharedResizeObserver } from '@internetarchive/shared-resize-observer';
  import { FeatureFeedbackService } from '@internetarchive/feature-feedback';
  import '@internetarchive/feature-feedback';

  const recaptchaManager = new RecaptchaManager({
    defaultSiteKey: '',
  });
  const featureFeedbackService = new FeatureFeedbackService({
    serviceUrl: 'http://local.archive.org:5000',
  });
  const resizeObserver = new SharedResizeObserver();

  html`
    <ia-feedback-survey
      .recaptchaManager=${recaptchaManager}
      .featureFeedbackService=${featureFeedbackService}
      .resizeObserver=${resizeObserver}
      .surveyIdentifier=${'demo-survey'}
      .buttonText=${'Take the survey'}
      showButtonThumbs
      showQuestionNumbers
    >
      <ia-survey-vote
        prompt="Do you find foos better than bars?"
        showComments
        required
      ></ia-survey-vote>
      <ia-survey-vote
        prompt="Would you recommend foos to a friend?"
      ></ia-survey-vote>
      <ia-survey-comment
        prompt="Anything else to add?"
        placeholder="Add optional comments..."
      ></ia-survey-comment>
      <ia-survey-extra name="Search query" value=${this.query}>
    </ia-feedback-survey>
  `;
```

#### Feedback survey question components

Currently this package defines three subcomponents that can be used as survey "questions":
 - `<ia-survey-vote>`: Seeks an up/down vote, optionally with a freeform text comment too -- like the single-question feature feedback widget.
Accepts the following attributes/properties:
   - `prompt` (string): The question text to display beside the vote buttons. If not provided, no prompt text will be rendered.
   - `vote` ("up" | "down"): Optionally allows setting the initial up/down vote state of the question if desired.
   - `comment` (string): Optionally allows setting the comment response for the question if desired.
   - `showComments` (boolean): If true, shows a freeform textarea beneath the vote buttons.
   - `commentPlaceholder` (string): The placeholder text to render in the textarea when it is empty (see `placeholder` for `<ia-survey-comment>` below).
   - `required` (boolean): If true, ensures that the survey cannot be submitted unless a vote is entered for this question.
   A text comment is never required for these questions, even when shown. To require text input, use a separate `<ia-survey-comment>` question.
   - `disabled` (boolean): If true, the question will not allow the vote to be changed or the comment to be edited by the user.
   - `skipNumber` (boolean): If true, this question will not participate in question numbering -- it will neither display a number itself nor increment the
   number used for the next question.

 - `<ia-survey-comment>`: Seeks a freeform text comment alone. Accepts the following attributes/properties:
   - `prompt` (string): The question text to display above the textarea. If not provided, no prompt text will be rendered.
   - `value` (string): Optionally allows setting the comment response for the question if desired.
   - `placeholder` (string): The placeholder text to render in the textarea when it is empty.
   If not provided, a default of either `Comments` or `Comments (optional)` will be used, depending on the `required` state of this component.
   - `required` (boolean): If true, ensures that the survey cannot be submitted unless a non-empty comment is entered for this question.
   - `disabled` (boolean): If true, the question will not allow the user to edit the comment.
   - `skipNumber` (boolean): If true, this question will not participate in question numbering -- it will neither display a number itself nor increment the
   number used for the next question.

 - `<ia-survey-extra>`: Does not render a question to the user, but instead defines additional info to be submitted with survey responses for context.
 Accepts the following attributes/properties:
   - `name` (string): A name to associate with this extra info field.
   - `value` (string): The value of this field to be submitted in the survey response.

One may define additional question components that can participate in survey responses, as long as they conform to the `IASurveyQuestionInterface`.

Other arbitrary elements may also be included presentationally within the survey, to be slotted into the popup alongside any questions.
Such elements will generally not have any effect on submitted survey responses unless they conform to the interface noted above.

#### Styling

Both the `<ia-survey-vote>` and `<ia-survey-comment>` components accept optional CSS variables to adjust the height or resizability of their comment textareas:
 - `--commentHeight` (defaults to `50px`)
 - `--commentResize` (`none`, `horizontal`, `vertical`, or `both` -- defaults to `none`). See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/resize) for more details.


## Local Demo with `web-dev-server`
```bash
yarn start
```
To run a local development server that serves the basic demo located in `demo/index.html`

## Testing with Web Test Runner
To run the suite of Web Test Runner tests, run
```bash
yarn run test
```

To run the tests in watch mode (for &lt;abbr title=&#34;test driven development&#34;&gt;TDD&lt;/abbr&gt;, for example), run

```bash
yarn run test:watch
```

## Linting with ESLint, Prettier, and Types
To scan the project for linting errors, run
```bash
yarn run lint
```

You can lint with ESLint and Prettier individually as well
```bash
yarn run lint:eslint
```
```bash
yarn run lint:prettier
```

To automatically fix many linting errors, run
```bash
yarn run format
```

You can format using ESLint and Prettier individually as well
```bash
yarn run format:eslint
```
```bash
yarn run format:prettier
```

## Tooling configs

For most of the tools, the configuration is in the `package.json` to reduce the amount of files in your project.

If you customize the configuration a lot, you can consider moving them to individual files.
