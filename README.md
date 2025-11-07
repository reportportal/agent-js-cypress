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
    endpoint: 'https://your.reportportal.server/api/v2',
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
    "endpoint": "https://your.reportportal.server/api/v2",
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

### Authentication Options

The agent supports two authentication methods:
1. **API Key Authentication** (default)
2. **OAuth 2.0 Password Grant** (recommended for enhanced security)

**Note:**\
If both authentication methods are provided, OAuth 2.0 will be used.\
Either API key or complete OAuth 2.0 configuration is required to connect to ReportPortal.

| Option | Necessity   | Default | Description                                                                                                                                                    |
|--------|-------------|---------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| apiKey | Conditional |         | User's ReportPortal API key from which you want to send requests. It can be found on the profile page of this user. *Required only if OAuth is not configured. |
| oauth  | Conditional |         | OAuth 2.0 configuration object. When provided, OAuth authentication will be used instead of API key. See OAuth Configuration below.                            |

#### OAuth Configuration

The `oauth` object supports the following properties:

| Property              | Necessity  | Default  | Description                                                                                                                                                                                                                                                                                                                     |
|-----------------------|------------|----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| tokenEndpoint         | Required   |          | OAuth 2.0 token endpoint URL for password grant flow.                                                                                                                                                                                                                                                                           |
| username              | Required   |          | Username for OAuth 2.0 password grant.                                                                                                                                                                                                                                                                                          |
| password              | Required   |          | Password for OAuth 2.0 password grant.                                                                                                                                                                                                                                                                                          |
| clientId              | Required   |          | OAuth 2.0 client ID.                                                                                                                                                                                                                                                                                                            |
| clientSecret          | Optional   |          | OAuth 2.0 client secret (optional, depending on your OAuth server configuration).                                                                                                                                                                                                                                               |
| scope                 | Optional   |          | OAuth 2.0 scope (optional, space-separated list of scopes).                                                                                                                                                                                                                                                                     |

**Note:** The OAuth interceptor automatically handles token refresh when the token is about to expire (1 minute before expiration).

##### OAuth 2.0 configuration example

```javascript
const rpConfig = {
  endpoint: 'https://your.reportportal.server/api/v2',
  project: 'Your reportportal project name',
  launch: 'Your launch name',
  oauth: {
    tokenEndpoint: 'https://your-oauth-server.com/oauth/token',
    username: 'your-username',
    password: 'your-password',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret', // optional
    scope: 'reportportal', // optional
  }
};
```

### General options

| Option                      | Necessity  | Default   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|-----------------------------|------------|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
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
| uploadVideo                 | Optional   | false     | Whether to upload the Cypress video. Uploads videos for failed specs only. Since videos are recorded for the entire spec run, they can be found on the log page associated with the spec in the ReportPortal UI. To upload videos for specs with other statuses, set also the `uploadVideoForNonFailedSpec` to `true`.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| uploadVideoForNonFailedSpec | Optional   | false     | Whether to upload the Cypress video for a non-failed specs. Works only if `uploadVideo` set to `true`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| waitForVideoTimeout         | Optional   | 10000     | Value in `ms`. Since Cypress video processing may take extra time after the spec is complete, there is a timeout to wait for the video file readiness. Works only if `uploadVideo` set to `true`.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| waitForVideoInterval        | Optional   | 500       | Value in `ms`. Interval to check if the video file is ready. The interval is used until `waitForVideoTimeout` is reached.  Works only if `uploadVideo` set to `true`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| videoCompression            | Optional   | false     | Whether to compress the Cypress video by the agent before uploading it to the ReportPortal. Settings the same as for [Cypress video compression](https://docs.cypress.io/guides/references/configuration#Videos:~:text=cypress%20run.-,videoCompression,-false). The quality setting for the video compression, in Constant Rate Factor (CRF). The value can be `false` or `0` to disable compression or a CRF between `1` and `51`, where a lower value results in better quality (at the expense of a higher file size). Setting this option to `true` will result in a default CRF of 32. Works only if `uploadVideo` set to `true`. |
| autoMerge                   | Optional   | false     | Enable automatic report test items of all run spec into one launch. You should install plugin or setup additional settings in reporterOptions. See [Automatically merge launch](#automatically-merge-launches).                                                                                                                                                                                                                                                                                                                                                                                                                         |
| reportHooks                 | Optional   | false     | Determines report before and after hooks or not.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| isLaunchMergeRequired       | Optional   | false     | Allows to merge Cypress run's into one launch at the end of the run. Needs additional setup. See [Manual merge launches](#manual-merge-launches).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| parallel                    | Optional   | false     | Indicates to the reporter that spec files will be executed in parallel on different machines. Parameter could be equal boolean values. See [Parallel execution](#parallel-execution).                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| debugIpc                    | Optional   | false     | This flag allows seeing the debug logs of the internal node-ipc server and client.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| retryIpcInterval            | Optional   | 1500      | Value in `ms`. Interval for node-ipc client to retry connection to node-ipc server. Retry count is unlimited.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

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

| Option | ENV variable | Note |
|--------|--------------|------|
| apiKey | RP_API_KEY   |      |

## Asynchronous API

The client supports an asynchronous reporting (via the ReportPortal asynchronous API).
If you want the client to report through the asynchronous API, change `v1` to `v2` in the `endpoint` address.

**Note:** It is highly recommended to use the `v2` endpoint for reporting, especially for extensive test suites.

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

#### Custom log levels

For more flexibility, you can use the generic log commands that accept custom log level strings:

* cy.customLog(*level*, *message*, *file*). Reports *message* and optional *file* as a log of the current test with the specified log level.<br/>
*level* can be one of the predefined log levels: _TRACE_, _DEBUG_, _INFO_, _WARN_, _ERROR_, _FATAL_, or any custom log level string (e.g., 'CUSTOM', 'MY_LEVEL').<br/>

**Example:**
```javascript
cy.customLog('INFO', 'This is an info log');
cy.customLog('CUSTOM_LEVEL', 'This is a custom log level', {
  name: 'attachment.png',
  type: 'image/png',
  content: 'base64string'
});
```

* cy.customLaunchLog(*level*, *message*, *file*). Reports *message* and optional *file* as a log of the launch with the specified log level.<br/>
*level* can be one of the predefined log levels: _TRACE_, _DEBUG_, _INFO_, _WARN_, _ERROR_, _FATAL_, or any custom log level string (e.g., 'CUSTOM', 'MY_LEVEL').<br/>

**Example:**
```javascript
cy.customLaunchLog('INFO', 'This is a launch info log');
cy.customLaunchLog('CUSTOM_LAUNCH_LEVEL', 'This is a custom launch log level', {
  name: 'launch-attachment.png',
  type: 'image/png',
  content: 'base64string'
});
```

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

To use custom filename in `cy.screenshot` function you should [setup ReportRortal custom commands](#setup-reportportal-custom-commands).
Default usage of Cypress screenshot function is supported without additional setup.

## Report a single launch

By default, Cypress create a separate run for each test file.
This section describe how to report test items of different specs into the single launch.

The agent supports the `launchId` parameter to specify the ID of the already started launch.<br/>
This way, you can start the launch using `@reportportal/client-javascript` before the test run and then specify its ID in the config.

With launch ID provided, the agent will attach all test results to that launch. So it won't be finished by the agent and should be finished separately.

All necessary adjustments are performed in the `setupNodeEvents` function.

```javascript
const { defineConfig } = require('cypress');
const registerReportPortalPlugin = require('@reportportal/agent-js-cypress/lib/plugin');
const rpClient = require('@reportportal/client-javascript');

const reportportalOptions = {
  autoMerge: false, // please note that `autoMerge` should be disabled
  //...
};

export default defineConfig({
  //...
  reporter: '@reportportal/agent-js-cypress',
  reporterOptions: reportportalOptions,
  e2e: {
    //...
    async setupNodeEvents(on, config) {
      const client = new rpClient(reportportalOptions);

      async function startLaunch() {
        // see https://github.com/reportportal/client-javascript?tab=readme-ov-file#startlaunch for the details
        const { tempId, promise } = client.startLaunch({
          name: options.launch,
          attributes: options.attributes,
          // etc.
        });
        const response = await promise;

        return { tempId, launchId: response.id };
      }
      const { tempId, launchId } = await startLaunch();

      on('after:run', async () => {
        const finishLaunch = async () => {
          // see https://github.com/reportportal/client-javascript?tab=readme-ov-file#finishlaunch for the details
          await client.finishLaunch(tempId, {}).promise;
        };

        await finishLaunch();
      });

      registerReportPortalPlugin(on, config);

      // return the `launchId` from `setupNodeEvents` to allow Cypress merge it with the existing config (https://docs.cypress.io/api/node-events/overview#setupNodeEvents:~:text=If%20you%20return%20or%20resolve%20with%20an%20object%2C)
      return {
        reporterOptions: {
          launchId,
        },
      };
    },
    //...
  },
});
```

That's it, now all test results will be attached to the single launch.

**Note:** This approach will likely be incorporated into the plugin in future versions of the agent.

## Automatically merge launches

Unstable. See [Report a single launch](#report-a-single-launch) for the recommended approach.

By default, Cypress create a separate run for each test file. This section describe how to report test items of different specs into the single launch.
This feature needs information about Cypress configuration. To provide it to the reporter you need to install reportPortal plugin (see how to in [this section](#register-reportportal-plugin-cypresspluginsindexjs)).

**Enable autoMerge in reporterOptions as shown below:**

```json

{
  ...
  "reporterOptions": {
    ...
    "autoMerge": true
  }
}
```

**Please note**, that `autoMerge` feature is unstable in some cases (e.g. when using `cypress-grep` or `--spec` CLI argument to specify the test amount that should be executed) and may lead to unfinished launches in ReportPortal.

If this is the case, please specify `specPattern` in the config directly. You can also use the [Report a single launch](#manual-merge-launches) instead.

## Manual merge launches

Deprecated. See [Report a single launch](#report-a-single-launch) for the actual approach.

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

## Usage with sharded tests

Since Cypress tests can run on multiple machines as isolated processes, they will create a launch for each machine by default.

Thus, in order to have a single launch in ReportPortal for sharded tests, additional customization is required.
There are several options to achieve this:

- [Using the `launchId` config option](#using-the-launchid-config-option)
- [Merging launches based on the build ID](#merging-launches-based-on-the-build-id)

**Note:** The [`@reportportal/client-javascript`](https://github.com/reportportal/client-javascript) SDK used here as a reference, but of course the same actions can be performed by sending requests to the ReportPortal API directly.

### Using the `launchId` config option

The agent supports the `launchId` parameter to specify the ID of the already started launch.
This way, you can start the launch using `@reportportal/client-javascript` before the test run and then specify its ID in the config or via environment variable.

1. Trigger a launch before all tests.

The `@reportportal/client-javascript` `startLaunch` method can be used.

```javascript
/*
 * startLaunch.js
 * */
const rpClient = require('@reportportal/client-javascript');

const rpConfig = {
  // ...
};

async function startLaunch() {
  const client = new rpClient(rpConfig);
  // see https://github.com/reportportal/client-javascript?tab=readme-ov-file#startlaunch for the details
  const response = await client.startLaunch({
    name: rpConfig.launch,
    attributes: rpConfig.attributes,
    // etc.
  }).promise;

  return response.id;
}

const launchId = await startLaunch();
```

Received `launchId` can be exported e.g. as an environment variable to your CI job.

2. Specify the launch ID for each job.
   This step depends on your CI provider and the available ways to path some values to the Node.js process.
   The launch ID can be set directly to the [reporter config](https://github.com/reportportal/agent-js-cypress#:~:text=Useful%20for%20debugging.-,launchId,-Optional).

```javascript
/*
 * cypress.config.js
 * */
const rpConfig = {
  // ...
  launchId: process.env.RP_LAUNCH_ID,
};
```

With launch ID provided, the agent will attach all test results to that launch.
So it won't be finished by the agent and should be finished separately.

3. As a run post-step (when all tests finished), launch also needs to be finished separately.

The `@reportportal/client-javascript` `finishLaunch` method can be used.

```javascript
/*
 * finishLaunch.js
 * */
const RPClient = require('@reportportal/client-javascript');

const rpConfig = {
  // ...
};

const finishLaunch = async () => {
  const client = new RPClient(rpConfig);
  const launchTempId = client.startLaunch({ id: process.env.RP_LAUNCH_ID }).tempId;
  // see https://github.com/reportportal/client-javascript?tab=readme-ov-file#finishlaunch for the details
  await client.finishLaunch(launchTempId, {}).promise;
};

await finishLaunch();
```

### Merging launches based on the build ID

This approach offers a way to merge several launches reported from different shards into one launch after the entire test execution completed and launches are finished.

- With this option the Auto-analysis, Pattern-analysis and Quality Gates will be triggered for each sharded launch individually.
- The launch numbering will be changed as each sharded launch will have its own number.
- The merged launch will be treated as a new launch with its own number.

This approach is equal to merging launches via [ReportPortal UI](https://reportportal.io/docs/work-with-reports/OperationsUnderLaunches/#merge-launches).

1. Specify a unique CI build ID as a launch attribute, which will be the same for different jobs in the same run (this could be a commit hash or something else).
   This step depends on your CI provider and the available ways to path some values to the Node.js process.

```javascript
/*
 * cypress.config.js
 * */
const rpConfig = {
  // ...
  attributes: [
    {
      key: 'CI_BUILD_ID',
      // e.g.
      value: process.env.GITHUB_COMMIT_SHA,
    },
  ],
};
```

2. Collect the launch IDs and call the merge operation.

The ReportPortal API can be used to filter the required launches by the provided attribute to collect their IDs.

```javascript
/*
 * mergeRpLaunches.js
 * */
const rpClient = require('@reportportal/client-javascript');

const rpConfig = {
  // ...
};

const client = new rpClient(rpConfig);

async function mergeLaunches() {
  const ciBuildId = process.env.CI_BUILD_ID;
  if (!ciBuildId) {
    console.error('To merge multiple launches, CI_BUILD_ID must not be empty');
    return;
  }
  try {
    // 1. Send request to get all launches with the same CI_BUILD_ID attribute value
    const params = new URLSearchParams({
      'filter.has.attributeValue': ciBuildId,
    });
    const launchSearchUrl = `launch?${params.toString()}`;
    const response = await client.restClient.retrieveSyncAPI(launchSearchUrl);
    // 2. Filter them to find launches that are in progress
    const launchesInProgress = response.content.filter((launch) => launch.status === 'IN_PROGRESS');
    // 3. If exists, just return. The steps can be repeated in some interval if needed
    if (launchesInProgress.length) {
      return;
    }
    // 4. If not, merge all found launches with the same CI_BUILD_ID attribute value
    const launchIds = response.content.map((launch) => launch.id);
    const request = client.getMergeLaunchesRequest(launchIds);
    request.description = rpConfig.description;
    request.extendSuitesDescription = false;
    const mergeURL = 'launch/merge';
    await client.restClient.create(mergeURL, request);
  } catch (err) {
    console.error('Fail to merge launches', err);
  }
}

mergeLaunches();
```

Using a merge operation for huge launches can increase the load on ReportPortal's API.
See the details and other parameters available for merge operation in [ReportPortal API docs](https://developers.reportportal.io/api-docs/service-api/merge-launches-1).

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
