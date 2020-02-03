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

To run example tests also add the following settings to cypress.json, replace `"reporter": "agent-js-cypress"` by `"reporter": "index.js"` and use command `npm test`.

```json

{
  ...
  "integrationFolder": "example/integration",
  "screenshotsFolder": "example/screenshots"
}

```

#### Add file to run Cypress with custom behavior

Create folder "scripts" on project folder. Copy the following script into "cypress.js" file and put it to "scripts"
folder.

```javascript

const cypress = require('cypress'),
    RPClient = require('reportportal-client')
    fs = require('fs'),
    glob = require("glob");

const cypressConfigFile = "cypress.json";


const getLaunchTempFiles = () => {
    return glob.sync("rplaunch-*.tmp");
}

const deleteTempFile = (filename) => {
    fs.unlinkSync(filename);
}

cypress.run().then(
    () => {
      fs.readFile(cypressConfigFile, 'utf8', function (err, data) {
        if (err) {
            throw err;
        }

        const config = JSON.parse(data);

        if (config.reporterOptions.isLaunchMergeRequired) {
            const client = new RPClient(config.reporterOptions);
            client.mergeLaunches();
            const files = getLaunchTempFiles();
            files.map(deleteTempFile);
        }
      });
    },
    error => {
      console.error(error)

      const files = getLaunchTempFiles();
      files.map(deleteTempFile);
      process.exit(1)
    }
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

## Options

Runs support following options:

| Parameter             | Description                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| token                 | User's Report Portal token from which you want to send requests. It can be found on the profile page of this user. |
| endpoint              | URL of your server. For example 'https://server:8080/api/v1'.                                                     |
| launch                | Name of launch at creation.                                                                                       |
| project               | The name of the project in which the launches will be created.                                                    |
| isLaunchMergeRequired | Determines merge Cypress run's in to one launch or not                                                            |
| rerun                 | Enable [rerun](https://github.com/reportportal/documentation/blob/master/src/md/src/DevGuides/rerun.md)           |
| rerunOf               | UUID of launch you want to rerun. If not specified, report portal will update the latest launch with the same name|

## Screenshot support

Curently supported only default usage of Cypress screenshot function. Using custom filename **is not supported** yet. Will be added in future versions.

```javascript

cy.screenshot()
cy.get('.post').screenshot()

```

# Copyright Notice

Licensed under the [Apache License v2.0](LICENSE)

# Contribution

<img src="img/ahold-delhaize-logo-green.jpg" width="250">
