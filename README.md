# @reportportal/agent-js-cypress

Agent to integrate Cypress with ReportPortal.
* More about [Cypress](https://cypress.io/)
* More about [ReportPortal](http://reportportal.io/)

## Install

```console
$ npm install --save-dev @reportportal/agent-js-cypress
```

## Usage

### Cypress version => 10

There is a configuration guide for Cypress version 10 and above.

#### cypress.config.js

Add the following options to cypress.config.js.

```javascript

const { defineConfig } = require('cypress');
const registerReportPortalPlugin = require('@reportportal/agent-js-cypress/lib/plugin');

module.exports = defineConfig({
  reporter: '@reportportal/agent-js-cypress',
  reporterOptions: {
    apiKey: '<API_KEY>',
    endpoint: 'https://your.reportportal.server/api/v1',
    project: 'Your reportportal project name',
    launch: 'Your launch name',
    description: 'Your launch description',
    attributes: [
      {
        key: 'attributeKey',
        value: 'attributeValue',
      },
      {
        value: 'anotherAttributeValue',
      },
    ],
  },
  e2e: {
    setupNodeEvents(on, config) {
      return registerReportPortalPlugin(on, config);
    },
  },
});
```
To see more options refer [Options](#options).

#### Setup [ReportPortal custom commands](#reportportal-custom-commands)

Add the following to your custom commands file (cypress/support/commands.js):

```javascript

require('@reportportal/agent-js-cypress/lib/commands/reportPortalCommands');
```

See examples of usage [here](https://github.com/reportportal/examples-js/tree/master/example-cypress).

### Cypress version <= 9

There is a configuration guide for Cypress version 9 and below.

#### Cypress.json

Add the following options to cypress.json

```json

{
  "reporter": "@reportportal/agent-js-cypress",
  "reporterOptions": {
    "apiKey": "<API_KEY>",
    "endpoint": "https://your.reportportal.server/api/v1",
    "project": "Your reportportal project name",
    "launch": "Your launch name",
    "description": "Your launch description",
    "attributes": [
      {
        "key": "attributeKey",
        "value": "attributeValue"
      },
      {
        "value": "anotherAttributeValue"
      }
    ]
  }
}

```

To see more options refer [Options](#options).

#### Register ReportPortal plugin (cypress/plugins/index.js):

```javascript
const registerReportPortalPlugin = require('@reportportal/agent-js-cypress/lib/plugin');

module.exports = (on, config) => registerReportPortalPlugin(on, config);
```

#### Setup [ReportPortal custom commands](#reportportal-custom-commands)

Add the following to your custom commands file (cypress/support/commands.js):

```javascript
require('@reportportal/agent-js-cypress/lib/commands/reportPortalCommands');
```

## Options

The full list of available options presented below.

| Option                      | Necessity  | Default   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|-----------------------------|------------|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| apiKey                      | Required   |           | User's reportportal token from which you want to send requests. It can be found on the profile page of this user.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| endpoint                    | Required   |           | URL of your server. For example 'https://server:8080/api/v1'.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| launch                      | Required   |           | Name of launch at creation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| project                     | Required   |           | The name of the project in which the launches will be created.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| attributes                  | Optional   | []        | Launch attributes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| description                 | Optional   | ''        | Launch description.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| rerun                       | Optional   | false     | Enable [rerun](https://reportportal.io/docs/dev-guides/RerunDevelopersGuide)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| rerunOf                     | Optional   | Not set   | UUID of launch you want to rerun. If not specified, reportportal will update the latest launch with the same name                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| mode                        | Optional   | 'DEFAULT' | Results will be submitted to Launches page <br/> *'DEBUG'* - Results will be submitted to Debug page.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| skippedIssue                | Optional   | true      | reportportal provides feature to mark skipped tests as not 'To Investigate'. <br/> Option could be equal boolean values: <br/> *true* - skipped tests considered as issues and will be marked as 'To Investigate' on reportportal. <br/> *false* - skipped tests will not be marked as 'To Investigate' on application.                                                                                                                                                                                                                                                                                                                 |
| debug                       | Optional   | false     | This flag allows seeing the logs of the client-javascript. Useful for debugging.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| launchId                    | Optional   | Not set   | The _ID_ of an already existing launch. The launch must be in 'IN_PROGRESS' status while the tests are running. Please note that if this _ID_ is provided, the launch will not be finished at the end of the run and must be finished separately.                                                                                                                                                                                                                                                                                                                                                                                       |
| launchUuidPrint             | Optional   | false     | Whether to print the current launch UUID.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| launchUuidPrintOutput       | Optional   | 'STDOUT'  | Launch UUID printing output. Possible values: 'STDOUT', 'STDERR'. Works only if `launchUuidPrint` set to `true`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| restClientConfig            | Optional   | Not set   | `axios` like http client [config](https://github.com/axios/axios#request-config). May contain `agent` property for configure [http(s)](https://nodejs.org/api/https.html#https_https_request_url_options_callback) client, and other client options eg. `timeout`. For debugging and displaying logs you can set `debug: true`.                                                                                                                                                                                                                                                                                                         |
| uploadVideo                 | Optional   | false     | Whether to upload the Cypress video. Uploads videos for failed specs only. To upload videos for specs with other statuses, set also the `uploadVideoForNonFailedSpec` to `true`.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| uploadVideoForNonFailedSpec | Optional   | false     | Whether to upload the Cypress video for a non-failed specs. Works only if `uploadVideo` set to `true`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| waitForVideoTimeout         | Optional   | 10000     | Value in `ms`. Since Cypress video processing may take extra time after the spec is complete, there is a timeout to wait for the video file readiness. Works only if `uploadVideo` set to `true`.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| waitForVideoInterval        | Optional   | 500       | Value in `ms`. Interval to check if the video file is ready. The interval is used until `waitForVideoTimeout` is reached.  Works only if `uploadVideo` set to `true`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| videoCompression            | Optional   | false     | Whether to compress the Cypress video by the agent before uploading it to the ReportPortal. Settings the same as for [Cypress video compression](https://docs.cypress.io/guides/references/configuration#Videos:~:text=cypress%20run.-,videoCompression,-false). The quality setting for the video compression, in Constant Rate Factor (CRF). The value can be `false` or `0` to disable compression or a CRF between `1` and `51`, where a lower value results in better quality (at the expense of a higher file size). Setting this option to `true` will result in a default CRF of 32. Works only if `uploadVideo` set to `true`. |
| autoMerge                   | Optional   | false     | Enable automatic report test items of all run spec into one launch. You should install plugin or setup additional settings in reporterOptions. See [Automatically merge launch](#automatically-merge-launches).                                                                                                                                                                                                                                                                                                                                                                                                                         |
| reportHooks                 | Optional   | false     | Determines report before and after hooks or not.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| isLaunchMergeRequired       | Optional   | false     | Allows to merge Cypress run's into one launch at the end of the run. Needs additional setup. See [Manual merge launches](#manual-merge-launches).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| parallel                    | Optional   | false     | Indicates to the reporter that spec files will be executed in parallel on different machines. Parameter could be equal boolean values. See [Parallel execution](#parallel-execution).                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| token                       | Deprecated | Not set   | Use `apiKey` instead.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

### Overwrite options from config file

**If you run Cypress tests programmatically or use `cypress.config.js`, you can simply overwrite them:**

```javascript
const updatedConfig = {
  ...config,
  reporterOptions: {
    ...config.reporterOptions,
    apiKey: process.env.RP_API_KEY,
  },
};
```

**For security reasons, you can also set token as a part of Environment Variables, instead of sharing it in the config file:**

| Option      | ENV variable    | Note                                   |
|-------------|-----------------|----------------------------------------|
| apiKey      | RP_API_KEY      ||
| token       | RP_TOKEN        | *deprecated* Use `RP_API_KEY` instead. |

## ReportPortal custom commands

### Logging

ReportPortal provides the following custom commands for reporting logs into the current test.

* cy.log(*message*). Overrides standard Cypress `cy.log(log)`. Reports *message* as an info log of the current test.<br/>

You can use the following methods to report logs and attachments with different log levels:
* cy.trace (*message* , *file*). Reports *message* and optional *file* as a log of the current test with trace log level.
* cy.logDebug (*message* , *file*). Reports *message* and optional *file* as a log of the current test with debug log level.
* cy.info (*message* , *file*). Reports *message* and optional *file* as log of the current test with info log level.
* cy.warn (*message* , *file*). Reports *message* and optional *file* as a log of the current test with warning log level.
* cy.error (*message* , *file*). Reports *message* and optional *file* as a log of the current test with error log level.
* cy.fatal (*message* , *file*). Reports *message* and optional *file* as a log of the current test with fatal log level.
* cy.launchTrace (*message* , *file*). Reports *message* and optional *file* as a log of the launch with trace log level.
* cy.launchDebug (*message* , *file*). Reports *message* and optional *file* as a log of the launch with debug log level.
* cy.launchInfo (*message* , *file*). Reports *message* and optional *file* as log of the launch with info log level.
* cy.launchWarn (*message* , *file*). Reports *message* and optional *file* as a log of the launch with warning log level.
* cy.launchError (*message* , *file*). Reports *message* and optional *file* as a log of the launch with error log level.
* cy.launchFatal (*message* , *file*). Reports *message* and optional *file* as a log of the launch with fatal log level.

*file* should be an object: <br/>
```javascript
{
  name: "filename",
  type: "image/png",  // media type
  content: data,  // file content represented as 64base string
}
```

**Note:** The `cy.debug` RP command has been changed to `cy.logDebug` due to the command with the same name in Cypress 9.*.

### Report attributes for tests

**addTestAttributes (*attributes*)**. Add attributes(tags) to the current test. Should be called inside of corresponding test.<br/>
*attributes* is array of pairs of key and value:
```javascript
[{
  key: "attributeKey1",
  value: "attributeValue2",
}]
```
*Key* is optional field.

### Integration with Sauce Labs

To integrate with Sauce Labs just add attributes:

```javascript
[{
 "key": "SLID",
 "value": "# of the job in Sauce Labs"
}, {
 "key": "SLDC",
 "value": "EU (EU or US)"
}]
```

### Report description for tests

**setTestDescription (*description*)**. Set text description to the current test. Should be called inside of corresponding test.

### Report test case Id for tests and suites

**setTestCaseId (*id*, *suite*)**. Set test case id to the current test or suite. Should be called inside of corresponding test/suite.<br/>
*id* is a string test case Id.<br/>
*suite (optional)* is the title of the suite to which the specified test case id belongs. Should be provided just in case of reporting test case id for specified suite instead of current test.

### Finish launch/test item with status

ReportPortal provides the following custom commands for setting status to the current suite/spec.

* cy.setStatus(*status*, *suite*). Assign *status* to the current test or suite. Should be called inside of corresponding test/suite.<br/>
*status* should be equal to one of the following values: *passed*, *failed*, *stopped*, *skipped*, *interrupted*, *cancelled*, *info*, *warn*.<br/>
*suite (optional)* is the title of the suite to which you wish to set the status (all suite descriptions must be unique). Should be provided just in case of assign status for specified suite instead of current test. <br/>

You can use the shorthand forms of the cy.setStatus method:

* cy.setStatusPassed(*suite*). Assign *passed* status to the current test or suite.
* cy.setStatusFailed(*suite*). Assign *failed* status to the current test or suite.
* cy.setStatusSkipped(*suite*). Assign *skipped* status to the current test or suite.
* cy.setStatusStopped(*suite*). Assign *stopped* status to the current test or suite.
* cy.setStatusInterrupted(*suite*). Assign *interrupted* status to the current test or suite.
* cy.setStatusCancelled(*suite*). Assign *cancelled* status to the current test or suite.
* cy.setStatusInfo(*suite*). Assign *info* status to the current test or suite.
* cy.setStatusWarn(*suite*). Assign *warn* status to the current test or suite.

ReportPortal also provides the corresponding methods for setting status into the launch:
* setLaunchStatus(*status*). Assign *status* to the launch.<br/>
*status* should be equal to one of the following values: *passed*, *failed*, *stopped*, *skipped*, *interrupted*, *cancelled*, *info*, *warn*.<br/>
* cy.setLaunchStatusPassed(). Assign *passed* status to the launch.
* cy.setLaunchStatusFailed(). Assign *failed* status to the launch.
* cy.setLaunchStatusSkipped(). Assign *skipped* status to the launch.
* cy.setLaunchStatusStopped(). Assign *stopped* status to the launch.
* cy.setLaunchStatusInterrupted(). Assign *interrupted* status to the launch.
* cy.setLaunchStatusCancelled(). Assign *cancelled* status to the launch.
* cy.setLaunchStatusInfo(). Assign *info* status to the launch.

## Screenshots support

To use custom filename in cy.screenshot function you should [setup ReportRortal custom commands](#setup-reportportal-custom-commands).
Default usage of Cypress screenshot function is supported without additional setup.

## Automatically merge launches

By default Cypress create a separate run for each test file. This section describe how to report test items of different specs into the single launch.
This feature needs information about Cypress configuration. To provide it to the reporter you need to install reportPortal plugin (see how to in [this section](#register-reportportal-plugin-cypresspluginsindexjs)).

**Enable auto-merge in reporterOptions as shown below:**

```json

{
  ...
  "reporterOptions": {
    ...
    "autoMerge": true
  }
}
```

**Please note**, that `autoMerge` feature is unstable in some cases (f.e. when using `cypress-grep` or CLI arguments to specify the test amount that should be executed) and may lead to unfinished launches in ReportPortal.
If this is a case, try [Manual merge launches](#manual-merge-launches) instead.

## Manual merge launches

There is a possibility to merge all launches into a single launch at the end of the run.
We advise using [autoMerge option](#automatically-merge-launches) to merge results in one launch, but you can use this alternative option in case of you need to perform some additional actions before merge.

### Set corresponding reporter options

Edit cypress.config.js (or cypress.json for versions <=9) file. Set `isLaunchMergeRequired` option to **true** as shown below:

```javascript

{
  ...
  reporterOptions: {
    ...
    isLaunchMergeRequired: true
  }
}

```

### Merge the launches once the Cypress finished execution

Update the Cypress configuration file with the code presented below (referring the issue https://github.com/reportportal/agent-js-cypress/issues/135#issue-1461470158).

```javascript
const { defineConfig } = require('cypress');
const registerReportPortalPlugin = require('@reportportal/agent-js-cypress/lib/plugin');
const rpClient = require('@reportportal/client-javascript');
const glob = require('glob');

const delay = async (ms) => new Promise((res) => setTimeout(res, ms));

const reportportalOptions = {
  //...
  isLaunchMergeRequired: true,
  //...
};

export default defineConfig({
  //...
  reporter: '@reportportal/agent-js-cypress',
  reporterOptions: reportportalOptions,
  e2e: {
    //...
    setupNodeEvents(on, config) {
      // keep Cypress running until the ReportPortal reporter is finished. this is a
      // very critical step, as otherwise results might not be completely pushed into
      // ReportPortal, resulting in unfinsihed launches and failing merges
      on('after:run', async () => {
        console.log('Wait for reportportal agent to finish...');
        while (glob.sync('rplaunchinprogress*.tmp').length > 0) {
          await delay(2000);
        }
        console.log('reportportal agent finished');
        if (reportportalOptions.isLaunchMergeRequired) {
          try {
            console.log('Merging launches...');
            const client = new rpClient(reportportalOptions);

            // mergeOptions (https://github.com/reportportal/client-javascript?tab=readme-ov-file#mergelaunches) can be added here as a first argument if needed
            await client.mergeLaunches(); 
            console.log('Launches successfully merged!');
            deleteLaunchFiles();
          } catch (mergeError) {
            console.error(mergeError);
          }
        }
      });
      registerReportPortalPlugin(on, config);
      return config;
    },
    //...
  },
});
```

`deleteLaunchFiles` example:

```javascript
const fs = require("fs");
const glob = require("glob");

function deleteLaunchFiles() {
  const getLaunchTempFiles = () => {
    return glob.sync("rplaunch*.tmp");
  };
  const deleteTempFile = (filename) => {
    fs.unlinkSync(filename);
  };
  const files = getLaunchTempFiles();
  files.forEach(deleteTempFile);
}
```

## Parallel execution

Cypress can run recorded tests in parallel across multiple machines since version 3.1.0 ([Cypress docs](https://docs.cypress.io/guides/guides/parallelization)). <br/>
By default Cypress create a separate run for each test file. To merge all runs into one launch in Report Portal you need to provide [autoMerge](#automatically-merge-launches) option together with `parallel` flag. <br/>
Since Cypress does not provide the ci_build_id to the reporter, you need to provide it manually using the `CI_BUILD_ID` environment variable (see [Cypress docs](https://docs.cypress.io/guides/guides/parallelization#CI-Build-ID-environment-variables-by-provider) for details).

**Enable parallel in reporterOptions as shown below:**

```javascript

{
  ...
  reporterOptions: {
    ...
    parallel: true
  }
}

```

**Here's an example of setting up parallel Cypress execution on several machines using GitHub Actions:**

```yaml

name: CI-pipeline

on:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    container: cypress/browsers:node12.18.3-chrome87-ff82
    strategy:
      fail-fast: false
      matrix:
        containers: [1, 2, 3]
    env:
      CI_BUILD_ID: ${{ github.sha }}-${{ github.workflow }}-${{ github.event_name }}
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: 'UI Tests - Chrome'
        uses: cypress-io/github-action@v2
        with:
          config-file: cypress.json
          group: 'UI Tests - Chrome'
          spec: cypress/integration/*
          record: true
          parallel: true
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.RECORD_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ACTIONS_RUNNER_DEBUG: true

```

**Note:** The example provided for Cypress version <= 9. For Cypress version >= 10 usage of `cypress-io/github-action` may be changed.

## Cypress-cucumber-preprocessor execution

### Configuration:

Specify the options in the cypress.config.js:

```javascript
const { defineConfig } = require('cypress');
const createBundler = require('@bahmutov/cypress-esbuild-preprocessor');
const preprocessor = require('@badeball/cypress-cucumber-preprocessor');
const createEsbuildPlugin = require('@badeball/cypress-cucumber-preprocessor/esbuild').default;
const registerReportPortalPlugin = require('@reportportal/agent-js-cypress/lib/plugin');

module.exports = defineConfig({
  reporter: '@reportportal/agent-js-cypress',
  reporterOptions: {
    endpoint: 'http://your-instance.com:8080/api/v1',
    apiKey: 'reportportalApiKey',
    launch: 'LAUNCH_NAME',
    project: 'PROJECT_NAME',
    description: 'LAUNCH_DESCRIPTION',
  },
  e2e: {
    async setupNodeEvents(on, config) {
      await preprocessor.addCucumberPreprocessorPlugin(on, config);
      on(
        'file:preprocessor',
        createBundler({
          plugins: [createEsbuildPlugin(config)],
        }),
      );
      registerReportPortalPlugin(on, config);

      return config;
    },
    specPattern: 'cypress/e2e/**/*.feature',
    supportFile: 'cypress/support/e2e.js',
  },
});
```

### Scenario steps

At the moment it is not possible to subscribe to start and end of scenario steps events. To solve the problem with displaying steps in the ReportPortal, the agent provides special commands: `cucumberStepStart`, `cucumberStepEnd`.
To work correctly, these commands must be called in the `BeforeStep`/`AfterStep` hooks.

```javascript
import { BeforeStep, AfterStep } from '@badeball/cypress-cucumber-preprocessor';

BeforeStep((step) => {
  cy.cucumberStepStart(step);
});

AfterStep((step) => {
  cy.cucumberStepEnd(step);
});
```

You can avoid duplicating this logic in each step definitions. Instead, add it to the `cypress/support/step_definitions.js` file and include the path to this file in the [stepDefinitions](https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/step-definitions.md) array (if necessary) within cucumber-preprocessor config. These hooks will be used for all step definitions.

# Copyright Notice

Licensed under the [Apache License v2.0](LICENSE)
