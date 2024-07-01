const mockFS = require('mock-fs');
const path = require('path');
const { getDefaultConfig, RPClient, MockedDate, RealDate, currentDate } = require('./mock/mock');
const Reporter = require('./../lib/reporter');

const sep = path.sep;

const tempLaunchId = 'temp-launch-id';
const tempTestId = 'temp-test-id';
const tempStepId = 'temp-step-id';
const testStepId = 'test-step-id';

const mockInputStep = {
  testStepId,
  pickleStep: {
    type: 'Action',
    text: 'step-name',
  },
};
const mockStep = {
  tempId: tempStepId,
  parentId: tempTestId,
  testStepId,
};
const mockCurrentTestTempInfo = {
  tempId: tempTestId,
  codeRef: 'test-code-ref',
  startTime: currentDate,
  cucumberStepIds: new Set(),
};
const mockCurrentTestTempInfoWithStep = {
  ...mockCurrentTestTempInfo,
  cucumberStepIds: new Set(testStepId),
};

describe('reporter script', () => {
  let reporter;

  beforeAll(() => {
    const options = getDefaultConfig();
    reporter = new Reporter(options);
    reporter.client = new RPClient(options);
  });

  beforeEach(() => {
    global.Date = jest.fn(MockedDate);
    Object.assign(Date, RealDate);
  });

  afterEach(() => {
    reporter.testItemIds.clear();
    reporter.tempLaunchId = undefined;
    global.Date = RealDate;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('constructor: client should be defined', () => {
      expect(reporter.client).toBeDefined();
    });
  });

  describe('runStart', () => {
    it('startLaunch should be called with parameters', () => {
      const spyLaunchStart = jest.spyOn(reporter.client, 'startLaunch');
      const launchObj = {
        launch: 'LauncherName',
        description: 'Launch description',
        attributes: [],
        rerun: undefined,
        rerunOf: undefined,
        startTime: currentDate,
      };

      reporter.runStart(launchObj);

      expect(reporter.tempLaunchId).toEqual('tempLaunchId');
      expect(spyLaunchStart).toHaveBeenCalledTimes(1);
      expect(spyLaunchStart).toHaveBeenCalledWith(launchObj);
    });
  });

  describe('runEnd', () => {
    it('finishLaunch should be called with parameters', () => {
      const spyFinishLaunch = jest.spyOn(reporter.client, 'finishLaunch');
      reporter.tempLaunchId = 'tempLaunchId';

      reporter.runEnd();

      expect(spyFinishLaunch).toHaveBeenCalledTimes(1);
      expect(spyFinishLaunch).toHaveBeenCalledWith('tempLaunchId', { endTime: currentDate });
    });

    it('set custom launch status: finishLaunch should be called with parameters', () => {
      const spyFinishLaunch = jest.spyOn(reporter.client, 'finishLaunch');
      reporter.tempLaunchId = 'tempLaunchId';
      reporter.setLaunchStatus({ status: 'warn' });

      reporter.runEnd();

      expect(spyFinishLaunch).toHaveBeenCalledTimes(1);
      expect(spyFinishLaunch).toHaveBeenCalledWith('tempLaunchId', {
        endTime: currentDate,
        status: 'warn',
      });
    });
  });

  describe('suiteStart', () => {
    it('root suite: startTestItem should be called with undefined parentId', () => {
      const spyStartTestItem = jest.spyOn(reporter.client, 'startTestItem');
      reporter.tempLaunchId = 'tempLaunchId';
      const suiteStartObject = {
        id: 'suite1',
        name: 'suite name',
        type: 'suite',
        startTime: currentDate,
        description: 'suite description',
        attributes: [],
        parentId: undefined,
      };

      reporter.suiteStart(suiteStartObject);

      expect(spyStartTestItem).toHaveBeenCalledTimes(1);
      expect(spyStartTestItem).toHaveBeenCalledWith(suiteStartObject, 'tempLaunchId', undefined);
    });

    it('nested suite: startTestItem should be called with defined parentId', () => {
      const spyStartTestItem = jest.spyOn(reporter.client, 'startTestItem');
      reporter.tempLaunchId = 'tempLaunchId';
      reporter.testItemIds.set('parentSuiteId', 'tempParentSuiteId');
      const suiteStartObject = {
        id: 'suite1',
        name: 'suite name',
        type: 'suite',
        startTime: currentDate,
        description: 'suite description',
        attributes: [],
        parentId: 'parentSuiteId',
      };

      reporter.suiteStart(suiteStartObject);

      expect(spyStartTestItem).toHaveBeenCalledTimes(1);
      expect(spyStartTestItem).toHaveBeenCalledWith(
        suiteStartObject,
        'tempLaunchId',
        'tempParentSuiteId',
      );
    });
  });

  describe('suiteEnd', () => {
    it('finishTestItem should be called with parameters', function () {
      const spyFinishTestItem = jest.spyOn(reporter.client, 'finishTestItem');
      reporter.testItemIds.set('suiteId', 'tempSuiteId');
      const suiteEndObject = {
        id: 'suiteId',
        endTime: currentDate,
      };

      reporter.suiteEnd(suiteEndObject);

      expect(spyFinishTestItem).toHaveBeenCalledTimes(1);
      expect(spyFinishTestItem).toHaveBeenCalledWith('tempSuiteId', { endTime: currentDate });
    });
    it('end suite with testCaseId: finishTestItem should be called with testCaseId', function () {
      const spyFinishTestItem = jest.spyOn(reporter.client, 'finishTestItem');
      reporter.testItemIds.set('suiteId', 'tempSuiteId');
      reporter.suiteTestCaseIds.set('suite title', 'testCaseId');
      const suiteEndObject = {
        id: 'suiteId',
        title: 'suite title',
        endTime: currentDate,
      };

      reporter.suiteEnd(suiteEndObject);

      expect(spyFinishTestItem).toHaveBeenCalledTimes(1);
      expect(spyFinishTestItem).toHaveBeenCalledWith('tempSuiteId', {
        endTime: currentDate,
        testCaseId: 'testCaseId',
      });

      reporter.suiteTestCaseIds.clear();
    });
    it('end suite with custom status: finishTestItem should be called with custom status', function () {
      const spyFinishTestItem = jest.spyOn(reporter.client, 'finishTestItem');
      reporter.testItemIds.set('suiteId', 'tempSuiteId');
      reporter.setTestItemStatus({ status: 'failed', suiteTitle: 'suite title' });
      const suiteEndObject = {
        id: 'suiteId',
        title: 'suite title',
        endTime: currentDate,
      };

      reporter.suiteEnd(suiteEndObject);

      expect(spyFinishTestItem).toHaveBeenCalledTimes(1);
      expect(spyFinishTestItem).toHaveBeenCalledWith('tempSuiteId', {
        endTime: currentDate,
        status: 'failed',
      });

      reporter.suiteStatuses.clear();
    });
  });

  describe('testStart', function () {
    it('startTestItem should be called with parameters', function () {
      const spyStartTestItem = jest.spyOn(reporter.client, 'startTestItem');
      const testInfoObject = {
        id: 'testId',
        title: 'test name',
        status: 'pending',
        parentId: 'suiteId',
      };
      const expectedTestStartObject = {
        name: 'test name',
        startTime: currentDate,
        attributes: [],
        type: 'step',
      };
      reporter.tempLaunchId = 'tempLaunchId';
      reporter.testItemIds.set('suiteId', 'suiteTempId');

      reporter.testStart(testInfoObject);

      expect(spyStartTestItem).toHaveBeenCalledTimes(1);
      expect(spyStartTestItem).toHaveBeenCalledWith(
        expectedTestStartObject,
        'tempLaunchId',
        'suiteTempId',
      );
    });
  });

  describe('testEnd', function () {
    beforeAll(() => {
      mockFS();
    });
    afterAll(() => {
      mockFS.restore();
    });
    beforeEach(function () {
      reporter.tempLaunchId = 'tempLaunchId';
      reporter.testItemIds.set('suiteId', 'suiteTempId');
    });

    afterEach(function () {
      reporter.resetCurrentTestFinishParams();
    });

    it('end passed test: finishTestItem should be called with parameters', function () {
      const spyFinishTestItem = jest.spyOn(reporter.client, 'finishTestItem');
      const testInfoObject = {
        id: 'testId',
        title: 'test name',
        status: 'passed',
        parentId: 'suiteId',
        err: undefined,
      };
      reporter.testItemIds.set('testId', 'tempTestItemId');
      const expectedTestFinishObj = {
        endTime: currentDate,
        status: 'passed',
        attributes: [],
        description: '',
      };

      reporter.testEnd(testInfoObject);

      expect(spyFinishTestItem).toHaveBeenCalledTimes(1);
      expect(spyFinishTestItem).toHaveBeenCalledWith('tempTestItemId', expectedTestFinishObj);
    });

    it('end failed test: finishTestItem should be called with failed status', function () {
      const spyFinishTestItem = jest.spyOn(reporter.client, 'finishTestItem');
      const testInfoObject = {
        id: 'testId',
        title: 'test name',
        status: 'failed',
        parentId: 'suiteId',
        err: 'error message',
      };
      reporter.testItemIds.set('testId', 'tempTestItemId');
      const expectedTestFinishObj = {
        endTime: currentDate,
        status: 'failed',
        attributes: [],
        description: '',
      };

      reporter.testEnd(testInfoObject);

      expect(spyFinishTestItem).toHaveBeenCalledWith('tempTestItemId', expectedTestFinishObj);
    });

    it('end failed test: should call sendLog on test fail', function () {
      const spySendLogOnFinishFailedItem = jest.spyOn(reporter, 'sendLogOnFinishFailedItem');
      const testInfoObject = {
        id: 'testId',
        title: 'test name',
        status: 'failed',
        parentId: 'suiteId',
        err: 'error message',
      };
      reporter.testItemIds.set('testId', 'tempTestItemId');

      reporter.testEnd(testInfoObject);

      expect(spySendLogOnFinishFailedItem).toHaveBeenCalledTimes(1);
      expect(spySendLogOnFinishFailedItem).toHaveBeenCalledWith(testInfoObject, 'tempTestItemId');
    });

    it('end passed test with attributes: finishTestItem should be called with attributes', function () {
      const spyFinishTestItem = jest.spyOn(reporter.client, 'finishTestItem');
      const testInfoObject = {
        id: 'testId',
        title: 'test name',
        status: 'passed',
        parentId: 'suiteId',
        err: undefined,
      };
      reporter.testItemIds.set('testId', 'tempTestItemId');
      reporter.addAttributes([
        {
          key: 'attr1Key',
          value: 'attr1Value',
        },
        {
          value: 'attr2Value',
        },
      ]);
      const expectedTestFinishObj = {
        endTime: currentDate,
        status: 'passed',
        description: '',
        attributes: [
          {
            key: 'attr1Key',
            value: 'attr1Value',
          },
          {
            value: 'attr2Value',
          },
        ],
      };

      reporter.testEnd(testInfoObject);

      expect(spyFinishTestItem).toHaveBeenCalledTimes(1);
      expect(spyFinishTestItem).toHaveBeenCalledWith('tempTestItemId', expectedTestFinishObj);
    });

    it('end passed test with description: finishTestItem should be called with description', function () {
      const spyFinishTestItem = jest.spyOn(reporter.client, 'finishTestItem');
      const testInfoObject = {
        id: 'testId',
        title: 'test name',
        status: 'passed',
        parentId: 'suiteId',
        err: undefined,
      };
      reporter.testItemIds.set('testId', 'tempTestItemId');
      reporter.setDescription('test description');
      const expectedTestFinishObj = {
        endTime: currentDate,
        status: 'passed',
        description: 'test description',
        attributes: [],
      };

      reporter.testEnd(testInfoObject);

      expect(spyFinishTestItem).toHaveBeenCalledTimes(1);
      expect(spyFinishTestItem).toHaveBeenCalledWith('tempTestItemId', expectedTestFinishObj);
    });

    it('end passed test with testCaseId: finishTestItem should be called with testCaseId', function () {
      const spyFinishTestItem = jest.spyOn(reporter.client, 'finishTestItem');
      const testInfoObject = {
        id: 'testId',
        title: 'test name',
        status: 'passed',
        parentId: 'suiteId',
        err: undefined,
      };
      reporter.testItemIds.set('testId', 'tempTestItemId');
      reporter.setTestCaseId({ testCaseId: 'testCaseId' });
      const expectedTestFinishObj = {
        endTime: currentDate,
        status: 'passed',
        description: '',
        attributes: [],
        testCaseId: 'testCaseId',
      };

      reporter.testEnd(testInfoObject);

      expect(spyFinishTestItem).toHaveBeenCalledTimes(1);
      expect(spyFinishTestItem).toHaveBeenCalledWith('tempTestItemId', expectedTestFinishObj);
    });

    it('end passed test with custom status: finishTestItem should be called with custom status', function () {
      const spyFinishTestItem = jest.spyOn(reporter.client, 'finishTestItem');
      const testInfoObject = {
        id: 'testId',
        title: 'test name',
        status: 'passed',
        parentId: 'suiteId',
        err: undefined,
      };
      reporter.testItemIds.set('testId', 'tempTestItemId');
      reporter.setTestItemStatus({ status: 'failed' });
      const expectedTestFinishObj = {
        endTime: currentDate,
        status: 'failed',
        description: '',
        attributes: [],
      };

      reporter.testEnd(testInfoObject);

      expect(spyFinishTestItem).toHaveBeenCalledTimes(1);
      expect(spyFinishTestItem).toHaveBeenCalledWith('tempTestItemId', expectedTestFinishObj);
    });
  });

  describe('testPending', function () {
    it('testPending should call testEnd if test has been started', function () {
      const spyTestEnd = jest.spyOn(reporter, 'testEnd');

      const testInfoObject = {
        id: 'testId',
        title: 'test name',
        status: 'skipped',
        parentId: 'suiteId',
      };

      reporter.testItemIds.set(testInfoObject.id, 'tempid');
      reporter.testPending(testInfoObject);

      expect(spyTestEnd).toHaveBeenCalledTimes(1);
      expect(spyTestEnd).toHaveBeenCalledWith(testInfoObject);
    });

    it('testPending should mark test as pending if not started', function () {
      const spyTestEnd = jest.spyOn(reporter, 'testEnd');

      const testInfoObject = {
        id: 'testId',
        title: 'test name',
        status: 'skipped',
        parentId: 'suiteId',
      };

      reporter.testPending(testInfoObject);

      expect(spyTestEnd).not.toHaveBeenCalled();
      expect(reporter.pendingTestsIds).toContainEqual(testInfoObject.id);
    });

    it('testStart should call testEnd if item is pending', function () {
      const spyStartTestItem = jest.spyOn(reporter.client, 'startTestItem');
      const spyTestEnd = jest.spyOn(reporter, 'testEnd');

      const testInfoObject = {
        id: 'testId',
        title: 'test name',
        status: 'skipped',
        parentId: 'suiteId',
      };

      reporter.pendingTestsIds = [testInfoObject.id];

      reporter.testStart(testInfoObject);

      expect(spyStartTestItem).toHaveBeenCalledTimes(1);
      expect(spyTestEnd).toHaveBeenCalledTimes(1);
      expect(spyTestEnd).toHaveBeenCalledWith(testInfoObject);
    });
  });

  describe('cucumberStepStart', function () {
    it('startTestItem should be called with parameters', function () {
      const spyStartTestItem = jest.spyOn(reporter.client, 'startTestItem');

      reporter.currentTestTempInfo = mockCurrentTestTempInfo;
      reporter.tempLaunchId = tempLaunchId;

      reporter.cucumberStepStart(mockInputStep);

      expect(spyStartTestItem).toHaveBeenCalledTimes(1);
      expect(spyStartTestItem).toHaveBeenCalledWith(
        {
          name: 'When step-name',
          startTime: currentDate,
          type: 'step',
          codeRef: 'test-code-ref/step-name',
          hasStats: false,
        },
        tempLaunchId,
        tempTestId,
      );
    });
  });

  describe('cucumberStepEnd', function () {
    beforeEach(function () {
      reporter.currentTestTempInfo = mockCurrentTestTempInfoWithStep;
      reporter.cucumberSteps.set(testStepId, mockStep);
    });

    it('end passed step: finishTestItem should be called with parameters', function () {
      const spyFinishTestItem = jest.spyOn(reporter.client, 'finishTestItem');

      reporter.cucumberStepEnd(mockInputStep);

      expect(spyFinishTestItem).toHaveBeenCalledTimes(1);
      expect(spyFinishTestItem).toHaveBeenCalledWith(tempStepId, {
        status: 'passed',
        endTime: currentDate,
      });
    });

    it('end failed step: finishTestItem should be called with failed status', function () {
      const spyFinishTestItem = jest.spyOn(reporter.client, 'finishTestItem');
      const errorMessage = 'error-message';

      reporter.cucumberStepEnd({
        ...mockInputStep,
        testStepResult: { status: 'failed', message: errorMessage },
      });

      expect(spyFinishTestItem).toHaveBeenCalledWith(tempStepId, {
        status: 'failed',
        endTime: currentDate,
      });
    });

    it('end failed step: should call sendLog on step fail', function () {
      const spySendLog = jest.spyOn(reporter, 'sendLog');
      const errorMessage = 'error-message';

      reporter.cucumberStepEnd({
        ...mockInputStep,
        testStepResult: { status: 'failed', message: errorMessage },
      });

      expect(spySendLog).toHaveBeenCalledTimes(1);
      expect(spySendLog).toHaveBeenCalledWith(tempStepId, {
        time: currentDate,
        level: 'error',
        message: errorMessage,
      });
    });
  });

  describe('hookStart', function () {
    beforeEach(function () {
      reporter.tempLaunchId = 'tempLaunchId';
      reporter.testItemIds.set('suiteId', 'suiteTempId');
    });

    afterEach(function () {
      reporter.testItemIds.clear();
      reporter.hooks.clear();
    });

    it('start before each hook: should put hook start object in the map', function () {
      const hookInfoObject = {
        id: 'hookId_testId',
        hookName: 'before each',
        title: '"before each" hook: hook name',
        status: 'pending',
        parentId: 'suiteId',
      };
      const expectedHookStartObject = {
        name: 'hook name',
        startTime: currentDate - 1,
        type: 'BEFORE_METHOD',
      };

      reporter.hookStart(hookInfoObject);

      expect(reporter.hooks.get('hookId_testId')).toEqual(expectedHookStartObject);
    });

    it('start before all hook: should put hook start object in the map', function () {
      const hookInfoObject = {
        id: 'hookId_testId',
        hookName: 'before all',
        title: '"before all" hook: hook name',
        status: 'pending',
        parentId: 'suiteId',
      };
      reporter.suitesStackTempInfo.push({
        tempId: 'suiteTempId',
        startTime: currentDate,
      });
      const expectedHookStartObject = {
        name: 'hook name',
        startTime: currentDate - 1,
        type: 'BEFORE_SUITE',
      };

      reporter.hookStart(hookInfoObject);

      expect(reporter.hooks.get('hookId_testId')).toEqual(expectedHookStartObject);
      reporter.suitesStackTempInfo = [];
    });
  });

  describe('hookEnd', () => {
    beforeAll(() => {
      mockFS();
    });
    afterAll(() => {
      mockFS.restore();
    });
    beforeEach(function () {
      reporter.tempLaunchId = 'tempLaunchId';
      reporter.testItemIds.set('suiteId', 'suiteTempId');
    });

    afterEach(function () {
      reporter.testItemIds.clear();
      reporter.hooks.clear();
    });

    it('passed hook ends: finishTestItem should be called with parameters', function () {
      const spyFinishTestItem = jest.spyOn(reporter.client, 'finishTestItem');
      const hookInfoObject = {
        id: 'hookId_testId',
        title: '"before each" hook: hook name',
        status: 'passed',
        parentId: 'suiteId',
        err: undefined,
      };
      const hookStartObject = {
        name: 'hook name',
        startTime: currentDate,
        type: 'BEFORE_METHOD',
      };
      const expectedHookFinishObj = {
        status: 'passed',
        endTime: currentDate,
      };
      reporter.hooks.set('hookId_testId', hookStartObject);

      reporter.hookEnd(hookInfoObject);

      expect(reporter.hooks.get('hookId_testId')).toBeUndefined();
      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedHookFinishObj);
    });

    it('failed hook ends: sendLog and finishTestItem should be called with parameters', function () {
      const spyFinishTestItem = jest.spyOn(reporter.client, 'finishTestItem');
      const spySendLogOnFinishFailedItem = jest.spyOn(reporter, 'sendLogOnFinishFailedItem');
      const hookInfoObject = {
        id: 'hookId_testId',
        title: '"before each" hook: hook name',
        status: 'failed',
        parentId: 'suiteId',
        err: 'error message',
      };
      const hookStartObject = {
        name: 'hook name',
        startTime: currentDate,
        type: 'BEFORE_METHOD',
      };
      const expectedHookFinishObj = {
        status: 'failed',
        endTime: currentDate,
      };
      reporter.hooks.set(hookInfoObject.id, hookStartObject);

      reporter.hookEnd(hookInfoObject, 'error message');

      expect(spySendLogOnFinishFailedItem).toHaveBeenCalledWith(hookInfoObject, 'testItemId');
      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedHookFinishObj);
    });
  });
  describe('send log', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      reporter.currentTestTempInfo = mockCurrentTestTempInfo;
    });
    it('sendLog: client.sendLog should be called with parameters', function () {
      const spySendLog = jest.spyOn(reporter.client, 'sendLog');
      const logObj = {
        level: 'error',
        message: 'error message',
      };
      const expectedLogObj = {
        level: 'error',
        message: 'error message',
        time: currentDate,
      };

      reporter.sendLog('tempTestItemId', logObj);

      expect(spySendLog).toHaveBeenCalledWith('tempTestItemId', expectedLogObj, undefined);
    });
    it('sendLogToCurrentItem: client.sendLog should be called with parameters', function () {
      const spySendLog = jest.spyOn(reporter.client, 'sendLog');
      const logObj = {
        level: 'error',
        message: 'error message',
      };
      const expectedLogObj = {
        level: 'error',
        message: 'error message',
        time: currentDate,
      };

      reporter.sendLogToCurrentItem(logObj);

      expect(spySendLog).toHaveBeenCalledWith(
        mockCurrentTestTempInfo.tempId,
        expectedLogObj,
        undefined,
      );
    });
    it('sendLogToCurrentItem: client.sendLog rejected promise should be handled', async function () {
      const spyConsoleError = jest.spyOn(global.console, 'error').mockImplementation();
      const clientError = new Error('client call failed');
      jest
        .spyOn(reporter.client, 'sendLog')
        .mockReturnValue({ promise: Promise.reject(clientError) });
      await reporter.sendLogToCurrentItem({
        level: 'error',
        message: 'error message',
      });
      expect(spyConsoleError).toHaveBeenCalledWith('Fail to send log to current item', clientError);
    });
    it('sendLaunchLog: client.sendLog should be called with parameters', function () {
      const spySendLog = jest.spyOn(reporter.client, 'sendLog');
      const logObj = {
        level: 'error',
        message: 'error message',
      };
      const expectedLogObj = {
        level: 'error',
        message: 'error message',
        time: currentDate,
      };
      reporter.tempLaunchId = 'tempLaunchId';

      reporter.sendLaunchLog(logObj);

      expect(spySendLog).toHaveBeenCalledWith('tempLaunchId', expectedLogObj, undefined);
    });
    it('sendLaunchLog: client.sendLog rejected promise should be handled', async function () {
      const spyConsoleError = jest.spyOn(global.console, 'error').mockImplementation();
      const clientError = new Error('client call failed');
      jest
        .spyOn(reporter.client, 'sendLog')
        .mockReturnValue({ promise: Promise.reject(clientError) });
      await reporter.sendLaunchLog({
        level: 'error',
        message: 'error message',
      });
      expect(spyConsoleError).toHaveBeenCalledWith('Fail to send launch log', clientError);
    });
  });
  describe('addAttributes', () => {
    afterEach(() => {
      reporter.resetCurrentTestFinishParams();
    });

    it('should set attributes on the first call', () => {
      const attributes = [
        {
          key: 'attr1Key',
          value: 'attr1Value',
        },
        {
          value: 'attr2Value',
        },
      ];

      reporter.addAttributes(attributes);

      expect(reporter.currentTestFinishParams.attributes).toEqual(attributes);
    });

    it('should append attributes in case of already existed attributes', () => {
      reporter.currentTestFinishParams.attributes = [
        {
          key: 'attr1Key',
          value: 'attr1Value',
        },
      ];
      const newAttributes = [
        {
          value: 'attr2Value',
        },
        {
          key: 'attr3Key',
          value: 'attr3Value',
        },
      ];
      const expectedAttributes = [
        {
          key: 'attr1Key',
          value: 'attr1Value',
        },
        {
          value: 'attr2Value',
        },
        {
          key: 'attr3Key',
          value: 'attr3Value',
        },
      ];

      reporter.addAttributes(newAttributes);

      expect(reporter.currentTestFinishParams.attributes).toEqual(expectedAttributes);
    });
  });
  describe('setDescription', () => {
    it('should set description', () => {
      const description = 'test description';

      reporter.setDescription(description);

      expect(reporter.currentTestFinishParams.description).toEqual(description);

      reporter.resetCurrentTestFinishParams();
    });
  });
  describe('setTestCaseId', () => {
    it('suite parameter is empty: should set test case Id to current test', () => {
      const testCaseId = 'test_testCaseID';

      reporter.setTestCaseId({ testCaseId });

      expect(reporter.currentTestFinishParams.testCaseId).toEqual(testCaseId);

      reporter.resetCurrentTestFinishParams();
    });

    it('suite parameter is defined: should put test case Id to the map by suite title', () => {
      const testCaseId = 'test_testCaseID';
      const suiteTitle = 'suite title';

      reporter.setTestCaseId({ testCaseId, suiteTitle });

      expect(reporter.suiteTestCaseIds.has(suiteTitle)).toEqual(true);
      expect(reporter.suiteTestCaseIds.get(suiteTitle)).toEqual(testCaseId);

      reporter.suiteTestCaseIds.clear();
    });
  });

  describe('screenshot', () => {
    const screenshotInfo = {
      testAttemptIndex: 0,
      size: 295559,
      takenAt: '2023-01-15T11:26:14.674Z',
      dimensions: { width: 1280, height: 2194 },
      multipart: true,
      pixelRatio: 1,
      specName: 'example.spec.js',
      scaled: false,
      blackout: [],
      duration: 905,
    };
    const screenshotDate = new Date(screenshotInfo.takenAt).valueOf();

    const expectedTempId = { tempId: 'tempTestItemId' };

    beforeAll(() => {
      mockFS({
        '/example/screenshots/example.spec.js': {
          'suite name -- test name (failed).png': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
          'suite name -- test name.png': Buffer.from([1, 2, 3, 4, 5, 6, 7]),
          'suite name -- test name (1).png': Buffer.from([8, 7, 6, 5, 4, 3, 2]),
          'customScreenshot1.png': Buffer.from([1, 1, 1, 1, 1, 1, 1]),
        },
      });
    });
    afterAll(() => {
      mockFS.restore();
    });

    it('should not send screenshot for undefined path', () => {
      const spySendLog = jest.spyOn(reporter.client, 'sendLog');
      reporter.sendScreenshot(screenshotInfo);
      expect(spySendLog).not.toHaveBeenCalled();
    });

    it('should send screenshot from screenshotInfo', () => {
      const spySendLog = jest.spyOn(reporter.client, 'sendLog');

      screenshotInfo.path = `${sep}example${sep}screenshots${sep}example.spec.js${sep}suite name -- test name.png`;

      reporter.currentTestTempInfo = expectedTempId;
      reporter.sendScreenshot(screenshotInfo);

      expect(spySendLog).toHaveBeenCalledTimes(1);
      expect(spySendLog).toHaveBeenCalledWith(
        expectedTempId.tempId,
        {
          level: 'info',
          message: `screenshot suite name -- test name.png`,
          time: screenshotDate,
        },
        {
          name: 'suite name -- test name.png',
          type: 'image/png',
          content: Buffer.from([1, 2, 3, 4, 5, 6, 7]).toString('base64'),
        },
      );
    });

    it('should send screenshot from screenshotInfo - error level', () => {
      const spySendLog = jest.spyOn(reporter.client, 'sendLog');

      screenshotInfo.path = `${sep}example${sep}screenshots${sep}example.spec.js${sep}suite name -- test name (failed).png`;

      reporter.currentTestTempInfo = expectedTempId;
      reporter.sendScreenshot(screenshotInfo);

      expect(spySendLog).toHaveBeenCalledTimes(1);
      expect(spySendLog).toHaveBeenCalledWith(
        expectedTempId.tempId,
        {
          level: 'error',
          message: `screenshot suite name -- test name (failed).png`,
          time: screenshotDate,
        },
        {
          name: 'suite name -- test name (failed).png',
          type: 'image/png',
          content: Buffer.from([8, 6, 7, 5, 3, 0, 9]).toString('base64'),
        },
      );
    });

    it('should send screenshot from screenshotInfo - custom log message', () => {
      const spySendLog = jest.spyOn(reporter.client, 'sendLog');

      screenshotInfo.path = `${sep}example${sep}screenshots${sep}example.spec.js${sep}customScreenshot1.png`;
      const message = `screenshot\n${JSON.stringify(screenshotInfo, undefined, 2)}`;

      reporter.currentTestTempInfo = expectedTempId;
      reporter.sendScreenshot(screenshotInfo, message);

      expect(spySendLog).toHaveBeenCalledTimes(1);
      expect(spySendLog).toHaveBeenCalledWith(
        expectedTempId.tempId,
        {
          level: 'info',
          message,
          time: screenshotDate,
        },
        {
          name: 'customScreenshot1.png',
          type: 'image/png',
          content: Buffer.from([1, 1, 1, 1, 1, 1, 1]).toString('base64'),
        },
      );
    });
  });

  describe('get current suite info', () => {
    afterEach(() => {
      reporter.suitesStackTempInfo = [];
    });

    it('getCurrentSuiteInfo, suite exists: should return tempId of current suite', () => {
      reporter.suitesStackTempInfo = [
        { tempId: 'firstSuiteTempId', startTime: currentDate },
        { tempId: 'suiteTempId', startTime: currentDate },
      ];

      const currentSuiteTempId = reporter.getCurrentSuiteInfo();

      expect(currentSuiteTempId).toEqual({ tempId: 'suiteTempId', startTime: currentDate });
    });

    it('getCurrentSuiteInfo, suite not exist: should return undefined', () => {
      const currentSuiteTempId = reporter.getCurrentSuiteInfo();

      expect(currentSuiteTempId).toBeUndefined();
    });
    it('getCurrentSuiteId, suite exists: should return tempId of current suite', () => {
      reporter.suitesStackTempInfo = [{ tempId: 'firstSuiteTempId' }, { tempId: 'suiteTempId' }];

      const currentSuiteTempId = reporter.getCurrentSuiteId();

      expect(currentSuiteTempId).toEqual('suiteTempId');
    });

    it('getCurrentSuiteId, suite not exist: should return undefined', () => {
      const currentSuiteTempId = reporter.getCurrentSuiteId();

      expect(currentSuiteTempId).toBeUndefined();
    });
  });
});
