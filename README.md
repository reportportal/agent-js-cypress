# agent-js-cypress

Cypress js agent is runtime reporter for [EPAM report portal](https://github.com/reportportal/reportportal) which provides information about collection run.

## Install


```console
$ npm install agent-js-cypress --save-dev
```

## Usage


#### Cypress.json

Add the following options to cypress.json


```json

{
  "reporter": "agent-js-cypress",
  "reporterOptions": {
    "endpoint": "http://your-instance.com:8080/api/v1",
    "token": "00000000-0000-0000-0000-000000000000",
    "launch": "LAUNCH_NAME",
    "project": "PROJECT_NAME",
    "description": "PROJECT_DESCRIPTION",
    "isLaunchMergeRequired": false
  }
}

```

To run example tests also add the following settings to cypress.json, replace `"reporter": "agent-js-cypress"` by `"reporter": "index.js"` and use command `npm example`.

```json

{
  ...
  "integrationFolder": "example/integration",
  "screenshotsFolder": "example/screenshots",
  "fixturesFolder": "example/fixtures",
  "supportFile": "example/support/index.js",
  "pluginsFile": "example/plugins/index.js",
}

```

#### Setup [ReportPortal custom commands](#reportportal-custom-commands)

Add the following to your custom commands file (cypress/support/commands.js):

```javascript

require('agent-js-cypress/lib/commands/reportPortalCommands');

```

Register ReportPortal plugin (cypress/plugins/index.js):

```javascript

const registerReportPortalPlugin = require('agent-js-cypress/lib/plugin');

module.exports = (on) => registerReportPortalPlugin(on);

```

## Options

Runs support following options:

| Parameter             | Description                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| token                 | User's Report Portal token from which you want to send requests. It can be found on the profile page of this user.|
| endpoint              | URL of your server. For example 'https://server:8080/api/v1'.                                                     |
| launch                | Name of launch at creation.                                                                                       |
| project               | The name of the project in which the launches will be created.                                                    |
| isLaunchMergeRequired | Determines merge Cypress run's in to one launch or not. Need extra setup. See [Merge launches](#merge-launches).  |
| rerun                 | Enable [rerun](https://github.com/reportportal/documentation/blob/master/src/md/src/DevGuides/rerun.md)           |
| rerunOf               | UUID of launch you want to rerun. If not specified, report portal will update the latest launch with the same name|
| reportHooks           | Determines report before and after hooks or not.                                                                  |
| skippedIssue          | ReportPortal provides feature to mark skipped tests as not 'To Investigate' items on WS side.<br> Parameter could be equal boolean values:<br> *TRUE* - skipped tests considered as issues and will be marked as 'To Investigate' on Report Portal (default value).<br> *FALSE* - skipped tests will not be marked as 'To Investigate' on application.|

## ReportPortal custom commands

### Logging

ReportPortal provides the following custom commands for reporting logs into the current test.

* cy.log(*message*). Overrides standard Cypress `cy.log(log)`. Reports *message* as an info log of the current test.<br/>

You can use the following methods to report logs and attachments with different log levels:
* cy.trace (*message* , *file*). Reports *message* and optional *file* as a log of the current test with trace log level.
* cy.debug (*message* , *file*). Reports *message* and optional *file* as a log of the current test with debug log level.
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

Currently supported only default usage of Cypress screenshot function. Using custom filename **is not supported**.

```javascript

cy.screenshot()
cy.get('.post').screenshot()

```

## Merge launches

By default Cypress create a separate run for each test file. This section describe how to merge all this launches into a single launch in the end of run.

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
const { mergeLaunches } = require('agent-js-cypress/lib/mergeLaunches');

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

# Copyright Notice

Licensed under the [Apache License v2.0](LICENSE)

# Contribution

<img src="img/ahold-delhaize-logo-green.jpg" width="250">
