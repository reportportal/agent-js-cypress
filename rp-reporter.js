const { reporters } = require('mocha'),
    RPClient = require('reportportal-client'),

    { testItemStatuses, logLevels } = require('./src/constants'),
    { promiseErrorHandler, getStartLaunchObject, getSuiteStartObject,
        getTestStartObject, getBase64FileObject } = require('./src/reporter-utilities');

const { PASSED, FAILED, SKIPPED } = testItemStatuses,
    { ERROR } = logLevels;

let runnerSuiteId = null,
    runnerTestId = null;

class ReportPortalReporter extends reporters.Base {
    constructor (runner, config) {
        super(runner);
        this.runner = runner;
        this.client = new RPClient(config.reporterOptions);
        this.currentSuiteId = null;
        this.currentTestId = null;
        this.list = [];

        runner.on('start', () => {
            let requestObj = getStartLaunchObject(config.reporterOptions);
            const { tempId, promise } = this.client.startLaunch(requestObj);

            promiseErrorHandler(promise);
            this.tempLaunchId = tempId;
            this.list.push(tempId);
        });

        runner.on('suite', suite => {
            runnerSuiteId = `suite${Date.now().toString()}`;
            suite.cid = runnerSuiteId;
            this.suiteStart(suite);
        });

        runner.on('suite end', suite => {
            suite.cid = runnerSuiteId;
            this.suiteEnd(suite);
        });

        runner.on('test', test => {
            runnerTestId = Date.now().toString();
            test.cid = runnerTestId;
            this.testStart(test);
        });

        runner.on('test pending', test => {
            test.cid = runnerTestId;
            this.testFinishedSkip(test, SKIPPED, { issue_type: 'NOT_ISSUE' });
        });

        runner.on('pass', test => {
            test.cid = runnerTestId;
            this.testFinishedPass(test);
        });

        runner.on('fail', test => {
            test.cid = runnerTestId;
            this.testFinishedFail(test);
        });

        runner.on('end', () => {
            this.finishLaunch();
        });

        runner.on('rp:log', (level, message) => {
            this.sendLog(level, message);
        });
    }

    finishLaunch () {
        let launchId = this.list.pop();
        const { promise } = this.client.finishLaunch(launchId);
        let done = false;

        promise.then(() => {
            done = true;
        });
        require('deasync').loopWhile(() => !done);
    }

    suiteStart (suite) {
        if (!suite.title) {
            return;
        }

        const suiteStartObj = getSuiteStartObject(suite);

        this.currentSuiteId = suite.cid;
        if (this.list.length === 1) {
            const { tempId, promise } = this.client.startTestItem(suiteStartObj,
                this.tempLaunchId);

            promiseErrorHandler(promise);
            this.currentSuiteId = tempId;
            this.list.push(tempId);
        }
        else {
            let parentId = this.list[this.list.length - 1];
            const { tempId, promise } = this.client.startTestItem(suiteStartObj,
                this.tempLaunchId,
                parentId);

            promiseErrorHandler(promise);
            this.currentSuiteId = tempId;
            this.list.push(tempId);
        }
    }

    suiteEnd (suite) {
        if (!suite.title) {
            return;
        }
        let suiteId = this.list.pop();
        const { promise } = this.client.finishTestItem(suiteId, {});

        promiseErrorHandler(promise);
    }

    testStart (test) {
        if (!test.title) {
            return;
        }
        let suiteid = this.list[this.list.length - 1];
        const testStartObj = getTestStartObject(test.title),

            { tempId, promise } = this.client.startTestItem(testStartObj,
                this.tempLaunchId,
                suiteid);

        this.list.push(tempId);
        promiseErrorHandler(promise);
        this.currentTestId = tempId;
    }

    testFinishedPass (test, issue) {
        let finishTestObj = { PASSED, issue };

        this.testFinished(test, finishTestObj);
    }

    testFinishedSkip (test, issue) {
        let finishTestObj = { SKIPPED, issue };

        this.testFinished(test, finishTestObj);
    }

    testFinishedFail (test, issue) {
        let parentId = this.list[this.list.length - 1],
            screenShotObj = getBase64FileObject(test.title),
            message = `Stacktrace: ${test.err.stack}\n`,
            finishTestObj = {
                status: FAILED,
                issues: issue,
                description: `${test.file}\n\`\`\`error\n${message}\n\`\`\``
            };

        this.client.sendLog(parentId, {
            message: message,
            level: ERROR,
            time: new Date().valueOf()
        }, screenShotObj);

        this.testFinished(test, finishTestObj);
    }

    testFinished (test, finishTestObj) {
        const testID = this.list.pop(),
            { promise } = this.client.finishTestItem(testID, finishTestObj);

        promiseErrorHandler(promise);
    }

    sendLog (level, message) {
        const { promise } = this.client.sendLog(this.currentTestId, {
            message: String(message),
            level: level,
            time: new Date().valueOf() + 1
        });

        promiseErrorHandler(promise);
    }
}

module.exports = ReportPortalReporter;
