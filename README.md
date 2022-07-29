# @kormachevt/agent-js-cypress

agent-js-cypress is a runtime reporter for the [Report Portal](https://github.com/reportportal/reportportal) which provides information about collection run.

## Install

```console
$ npm install @kormachevt/agent-js-cypress
```

## Usage

#### Cypress.json

Add the following options to cypress.json

```json

{
  "reporter": "@kormachevt/agent-js-cypress",
  "reporterOptions": {
    "endpoint": "http://your-instance.com:8080/api/v1",
    "token": "00000000-0000-0000-0000-000000000000",
    "launch": "LAUNCH_NAME",
    "project": "PROJECT_NAME",
    "description": "LAUNCH_DESCRIPTION"
  }
}

```

#### Register ReportPortal plugin (cypress/plugins/index.js):

```javascript

const registerReportPortalPlugin = require('@kormachevt/agent-js-cypress/lib/plugin');

module.exports = (on, config) => registerReportPortalPlugin(on, config);

```

#### Setup [ReportPortal custom commands](#reportportal-custom-commands)

Add the following to your custom commands file (cypress/support/commands.js):

```javascript

require('@kormachevt/agent-js-cypress/lib/commands/reportPortalCommands');

```

See examples of usage [here](https://github.com/reportportal/examples-js/tree/master/example-cypress).

## Options

Runs support following options:

| Parameter             | Description                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| token                 | User's Report Portal token from which you want to send requests. It can be found on the profile page of this user.|
| endpoint              | URL of your server. For example 'https://server:8080/api/v1'.                                                     |
| launch                | Name of launch at creation.                                                                                       |
| project               | The name of the project in which the launches will be created.                                                    |
| rerun                 | Enable [rerun](https://github.com/reportportal/documentation/blob/master/src/md/src/DevGuides/rerun.md)           |
| rerunOf               | UUID of launch you want to rerun. If not specified, report portal will update the latest launch with the same name|
| mode                  | *Default: "default".* Results will be submitting to Launches tab<br> *"debug"* - Results will be submitting to Debug tab. |
| debug                 | This flag allows seeing the logs of the client-javascript. Useful for debugging. Parameter could be equal boolean values. |
| autoMerge             | Enable automatical report test items of all runned spec into one launch. You should install plugin or setup additional settings in reporterOptions. See [Automatically merge launch](#automatically-merge-launches). |
| reportHooks           | Determines report before and after hooks or not.                                                                  |
| skippedIssue          | ReportPortal provides feature to mark skipped tests as not 'To Investigate' items on WS side.<br> Parameter could be equal boolean values:<br> *TRUE* - skipped tests considered as issues and will be marked as 'To Investigate' on Report Portal (default value).<br> *FALSE* - skipped tests will not be marked as 'To Investigate' on application.|
| isLaunchMergeRequired | Allows to merge Cypress run's into one launch in the end of the run. Needs additional setup. See [Manual merge launches](#manual-merge-launches).  |
| parallel              | Indicates to the reporter that spec files will be executed in parallel. Parameter could be equal boolean values. See [Parallel execution](#parallel-execution) |
| restClientConfig      | Optional property.<br/> The object with `agent` property for configure [http(s)](https://nodejs.org/api/https.html#https_https_request_url_options_callback) client, may contain other client options eg. `timeout`.<br/> Visit [client-javascript](https://github.com/reportportal/client-javascript) for more details. |
| forceEndSkippedTests               | Default: `false`. Mocha doesn't emit `test end` event for skipped tests (or sometimes just for a single last one in a suite). If set to `true` reporter will finish this dangling tests with `skipped` status.

### Overwrite options from config file

**If you run Cypress tests programmatically, you can simply overwrite them:**

```javascript
const updatedConfig = {
  ...config,
  reporterOptions: {
    ...config.reporterOptions,
    token: process.env.RP_TOKEN,
  },
};

```

**Overwrite by env variables:**

| Parameter          | Env variable |
| ------------------ | ---------- |
| token              | RP_TOKEN |


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
This feature needs information about Cypress configuration. To provide it to the reporter you need to install reportPortal plugin (see how to in [this section](#register-reportportal-plugin-cypresspluginsindexjs)) or to copy the following Cypress config options to the reporterOptions:
* ignoreTestFiles
* testFiles
* integrationFolder
* fixturesFolder
* supportFile

*Note: you need to specify only those options that are not the default.*

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


## Manual merge launches

There is a possibility to merge all launches into a single launch in the end of the run.
We advice to use [autoMerge option](#automatically-merge-launches) to merge results in one launch but you can use this alternative option in case of you need to perform some additional actions before merge.

#### Set corresponding reporter options

Edit cypress.json file. Set isLaunchMergeRequired option to **true** as shown below:

```json

{
  ...
  "reporterOptions": {
    ...
    "isLaunchMergeRequired": true
  }
}

```

#### Add file to run Cypress with custom behavior

Create folder "scripts" on project folder. Copy the following script into "cypress.js" file and put it to "scripts"
folder.

```javascript

const cypress = require('cypress');
const fs = require('fs');
const glob = require('glob');
const { mergeLaunches } = require('@kormachevt/agent-js-cypress/lib/mergeLaunches');

const cypressConfigFile = 'cypress.json';

const getLaunchTempFiles = () => {
  return glob.sync('rplaunch-*.tmp');
};

const deleteTempFile = (filename) => {
  fs.unlinkSync(filename);
};

cypress.run().then(
  () => {
    fs.readFile(cypressConfigFile, 'utf8', (err, data) => {
      if (err) {
        throw err;
      }

      const config = JSON.parse(data);

      if (config.reporterOptions.isLaunchMergeRequired) {
        mergeLaunches(config.reporterOptions)
          .then(() => {
            const files = getLaunchTempFiles();
            files.forEach(deleteTempFile);
            console.log('Launches successfully merged!');
            process.exit(0);
          })
          .catch((err) => {
            console.error(error);
            process.exit(1);
          });
      } else {
        process.exit(0);
      }
    });
  },
  (error) => {
    console.error(error);
    const files = getLaunchTempFiles();
    files.forEach(deleteTempFile);
    process.exit(1);
  },
);

```

#### Update package.json "scripts" section

```json

"scripts": {
  ...
  "cypress": "node scripts/cypress.js",
  ...
},

```

## Parallel execution

Cypress can run recorded tests in parallel across multiple machines since version 3.1.0 ([Cypress docs](https://docs.cypress.io/guides/guides/parallelization)). <br/>
By default Cypress create a separate run for each test file. To merge all runs into one launch in Report Portal you need to provide [autoMerge](#automatically-merge-launches) option together with parallel flag. <br/>
Since Cypress does not provide the ci_build_id to the reporter, you need to provide it manually using the CI_BUILD_ID environment variable (see [Cypress docs](https://docs.cypress.io/guides/guides/parallelization#CI-Build-ID-environment-variables-by-provider) for details).

**Enable parallel in reporterOptions as shown below:**

```json

{
  ...
  "reporterOptions": {
    ...
    "parallel": true
  }
}

```

**Here's an example of setting up parallel Cypress execution using GitHub Actions:**

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

# Copyright Notice

Licensed under the [Apache License v2.0](LICENSE)
