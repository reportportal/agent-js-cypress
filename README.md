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
    "reporter": "agent-js-cypress/rp-reporter.js",
    "reporterOptions": {
        "endpoint": "http://your-instance.com:8080/api/v1",
        "token": "00000000-0000-0000-0000-000000000000",
        "launch": "LAUNCH_NAME",
        "project": "PROJECT_NAME",
        "description": "PROJECT_DESCRIPTION"
    }
}

```


#### Options

Runs support following options:

| Parameter | Description                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| token     | User's Report Portal toke from which you want to send requests. It can be found on the profile page of this user. |
| endpoint  | URL of your server. For example 'https://server:8080/api/v1'.                                                     |
| launch    | Name of launch at creation.                                                                                       |
| project   | The name of the project in which the launches will be created.                                                    |
| debug     | Determines whether newman's run should be logged in details.                                                      |

#### Screenshot support

Curently supported only default usage of Cypress screenshot function. Using custom filename **is not supported** yet. Will be added in future versions. 

```javascript

cy.screenshot()
cy.get('.post').screenshot()

```

# Copyright Notice

Licensed under the [Apache License v2.0](LICENSE)

# Contribution and Support

<img src="img/ahold-delhaize-logo-green.jpg" width="250">

**Implemented and supported by Ahold Delheize**
