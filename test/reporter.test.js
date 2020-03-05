const { getDefaultConfig, RPClient, MockedDate, RealDate, currentDate } = require('./mock/mock');
const Reporter = require('./../src/reporter');

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
    global.Date = RealDate;
    jest.clearAllMocks();
  });
  it('constructor: client should be defined', () => {
    expect(reporter.client).toBeDefined();
  });

  it('runStart: startLaunch should be called with parameters', () => {
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

  it('runEnd: finishLaunch should be called with parameters', () => {
    const spyFinishLaunch = jest.spyOn(reporter.client, 'finishLaunch');
    reporter.tempLaunchId = 'tempLaunchId';
    reporter.runEnd();
    expect(spyFinishLaunch).toHaveBeenCalledTimes(1);
    expect(spyFinishLaunch).toHaveBeenCalledWith('tempLaunchId', { endTime: currentDate });
  });

  it('suiteStart: startTestItem should be called with parameters', () => {
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

  it('suiteStart for nested suite: startTestItem should be called with parameters', () => {
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

  it('suiteEnd: finishTestItem should be called with parameters', function() {
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

  describe('test items reporting', function() {
    beforeEach(function() {
      reporter.tempLaunchId = 'tempLaunchId';
      reporter.testItemIds.set('suiteId', 'suiteTempId');
    });
    afterEach(function() {
      reporter.testItemIds.clear();
      jest.clearAllMocks();
    });
    it('testStart: startTestItem should be called with parameters', function() {
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
      reporter.testStart(testInfoObject);
      expect(spyStartTestItem).toHaveBeenCalledTimes(1);
      expect(spyStartTestItem).toHaveBeenCalledWith(
        expectedTestStartObject,
        'tempLaunchId',
        'suiteTempId',
      );
    });

    it('testEnd: finishTestItem should be called with parameters', function() {
      const spyFinishTestItem = jest.spyOn(reporter.client, 'finishTestItem');
      const testInfoObject = {
        id: 'testId',
        title: 'test name',
        status: 'failed',
        parentId: 'suiteId',
        err: 'error message',
      };
      reporter.testItemIds.set('testId', 'tempTestItemId');
      reporter.testEnd(testInfoObject);
      const expectedTestFinishObj = {
        endTime: currentDate,
        status: 'failed',
      };
      expect(spyFinishTestItem).toHaveBeenCalledTimes(1);
      expect(spyFinishTestItem).toHaveBeenCalledWith('tempTestItemId', expectedTestFinishObj);
    });

    it('sendLog: sendLog should be called with parameters', function() {
      const spySendLog = jest.spyOn(reporter.client, 'sendLog');
      const testInfoObject = {
        id: 'testId',
        title: 'test name',
        status: 'failed',
        parentId: 'suiteId',
        err: 'error message',
      };
      reporter.testItemIds.set('testId', 'tempTestItemId');
      reporter.sendLog(testInfoObject, 'tempTestItemId');
      const expectedLogObj = {
        level: 'error',
        message: 'error message',
        time: currentDate,
      };
      expect(spySendLog).toHaveBeenCalledWith('tempTestItemId', expectedLogObj, undefined);
    });

    it('testEnd: should call sendLog on test fail', function() {
      const spySendLog = jest.spyOn(reporter, 'sendLog');
      const testInfoObject = {
        id: 'testId',
        title: 'test name',
        status: 'failed',
        parentId: 'suiteId',
        err: 'error message',
      };
      reporter.testItemIds.set('testId', 'tempTestItemId');
      reporter.testEnd(testInfoObject);

      expect(spySendLog).toHaveBeenCalledTimes(1);
      expect(spySendLog).toHaveBeenCalledWith(testInfoObject, 'tempTestItemId');
    });

    it('testEnd: finishTestItem should be called with  failed status', function() {
      const spyFinishTestItem = jest.spyOn(reporter.client, 'finishTestItem');
      const testInfoObject = {
        id: 'testId',
        title: 'test name',
        status: 'failed',
        parentId: 'suiteId',
        err: 'error message',
      };
      reporter.testItemIds.set('testId', 'tempTestItemId');
      reporter.testEnd(testInfoObject);
      const expectedTestFinishObj = {
        endTime: currentDate,
        status: 'failed',
      };
      expect(spyFinishTestItem).toHaveBeenCalledWith('tempTestItemId', expectedTestFinishObj);
    });
  });

  describe('reporting hooks', function() {
    beforeEach(function() {
      reporter.tempLaunchId = 'tempLaunchId';
      reporter.testItemIds.set('suiteId', 'suiteTempId');
    });
    afterEach(function() {
      reporter.testItemIds.clear();
      reporter.hooks.clear();
      jest.clearAllMocks();
    });

    it('hookStart: should put hook start object in the map', function() {
      const hookInfoObject = {
        id: 'hookId_testId',
        hookName: 'before each',
        title: '"before each" hook: hook name',
        status: 'pending',
        parentId: 'suiteId',
      };
      reporter.hookStart(hookInfoObject);
      const expectedHookStartObject = {
        name: 'hook name',
        startTime: currentDate,
        type: 'BEFORE_METHOD',
      };
      expect(reporter.hooks.get('hookId_testId')).toEqual(expectedHookStartObject);
    });

    it('hookEnd: finishTestItem should be called with parameters', function() {
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
      reporter.hooks.set('hookId_testId', hookStartObject);
      const expectedHookFinishObj = {
        status: 'passed',
        endTime: currentDate,
      };
      reporter.hookEnd(hookInfoObject);
      expect(reporter.hooks.get('hookId_testId')).toBeUndefined();
      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedHookFinishObj);
    });

    it('hookEnd: sendLog and finishTestItem should be called with parameters', function() {
      const spyFinishTestItem = jest.spyOn(reporter.client, 'finishTestItem');
      const spySendLog = jest.spyOn(reporter, 'sendLog');
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
      reporter.hooks.set(hookInfoObject.id, hookStartObject);
      const expectedHookFinishObj = {
        status: 'failed',
        endTime: currentDate,
      };
      reporter.hookEnd(hookInfoObject, 'error message');
      expect(spySendLog).toHaveBeenCalledWith(hookInfoObject, 'testItemId');
      expect(spyFinishTestItem).toHaveBeenCalledWith('testItemId', expectedHookFinishObj);
    });
  });
});
