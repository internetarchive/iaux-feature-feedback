![Build Status](https://github.com/internetarchive/iaux-feature-feedback/actions/workflows/ci.yml/badge.svg)

# Internet Archive Feature Feedback Component

This is a widget that lets us collect feedback on features that we release. Written in LitElement.

![Feature Feedback](/assets/screenshot.png "Screenshot")


## Installation

```shell
> npm i @internetarchive/feature-feedback
```

## Usage

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
