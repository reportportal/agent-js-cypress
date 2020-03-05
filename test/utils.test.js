/* eslint-disable no-undef */
const mock = require('mock-fs');
const {
  getLaunchStartObject,
  getSuiteStartObject,
  getSuiteEndObject,
  getTestInfo,
  getTestStartObject,
  getHookInfo,
  getHookStartObject,
  getFailedScreenshot,
  getPassedScreenshots,
} = require('./../src/utils');

const { RealDate, MockedDate, currentDate, getDefaultConfig } = require('./mock/mock');

describe('utils script', () => {
  describe('attachment utils', () => {
    beforeAll(() => {
      mock({
        'example/screenshots': {
          'suite name -- test name (failed).png': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
          'suite name -- test name.png': Buffer.from([1, 2, 3, 4, 5, 6, 7]),
          'suite name -- test name (1).png': Buffer.from([8, 7, 6, 5, 4, 3, 2]),
        },
      });
    });
    it('should return failed attachment', () => {
      const testTitle = 'test name';
      const attachment = getFailedScreenshot(testTitle);
      expect(attachment).toBeDefined();
      const expectedAttachment = {
        name: 'test name (failed)',
        type: 'image/png',
        content: Buffer.from([8, 6, 7, 5, 3, 0, 9]).toString('base64'),
      };
      expect(attachment).toEqual(expectedAttachment);
    });
    it('should return passed attachments', () => {
      const testTitle = 'test name';
      const attachments = getPassedScreenshots(testTitle);
      expect(attachments).toBeDefined();
      expect(attachments.length).toEqual(2);
      const expectedAttachments = [
        {
          name: 'test name-1',
          type: 'image/png',
          content: Buffer.from([1, 2, 3, 4, 5, 6, 7]).toString('base64'),
        },
        {
          name: 'test name-2',
          type: 'image/png',
          content: Buffer.from([8, 7, 6, 5, 4, 3, 2]).toString('base64'),
        },
      ];
      expect(attachments).toEqual(expectedAttachments);
    });
    afterAll(() => {
      mock.restore();
    });
  });
  describe('object creators', () => {
    beforeEach(() => {
      global.Date = jest.fn(MockedDate);
      Object.assign(Date, RealDate);
    });

    afterEach(() => {
      jest.clearAllMocks();
      global.Date = RealDate;
    });

    test('should return start launch object with correct values', () => {
      const expectedStartLaunchObject = {
        launch: 'LauncherName',
        description: 'Launch description',
        attributes: [],
        startTime: currentDate,
        rerun: undefined,
        rerunOf: undefined,
      };

      const startLaunchObject = getLaunchStartObject(getDefaultConfig());

      expect(startLaunchObject).toBeDefined();
      expect(startLaunchObject).toEqual(expectedStartLaunchObject);
    });

    test('should return suite start object for root suite', () => {
      const suite = {
        id: 'suite1',
        title: 'suite name',
        description: 'suite description',
        root: true,
      };
      const expectedSuiteStartObject = {
        id: 'suite1',
        name: 'suite name',
        type: 'suite',
        startTime: currentDate,
        description: 'suite description',
        attributes: [],
        parentId: undefined,
      };

      const suiteStartObject = getSuiteStartObject(suite);

      expect(suiteStartObject).toBeDefined();
      expect(suiteStartObject).toEqual(expectedSuiteStartObject);
    });

    test('should return suite start object for nested suite', () => {
      const suite = {
        id: 'suite1',
        title: 'suite name',
        description: 'suite description',
        parent: {
          id: 'parentSuiteId',
        },
      };
      const expectedSuiteStartObject = {
        id: 'suite1',
        name: 'suite name',
        type: 'suite',
        startTime: currentDate,
        description: 'suite description',
        attributes: [],
        parentId: 'parentSuiteId',
      };

      const suiteStartObject = getSuiteStartObject(suite);

      expect(suiteStartObject).toBeDefined();
      expect(suiteStartObject).toEqual(expectedSuiteStartObject);
    });

    test('should return suite end object', () => {
      const suite = {
        id: 'suite1',
        title: 'suite name',
        description: 'suite description',
        parent: {
          id: 'parentSuiteId',
        },
      };
      const expectedSuiteEndObject = {
        id: 'suite1',
        endTime: currentDate,
      };

      const suiteEndObject = getSuiteEndObject(suite);

      expect(suiteEndObject).toBeDefined();
      expect(suiteEndObject).toEqual(expectedSuiteEndObject);
    });

    test('should return test info for passed test', () => {
      const test = {
        id: 'testId1',
        title: 'test name',
        parent: {
          id: 'parentSuiteId',
        },
        state: 'passed',
      };
      const expectedTestInfoObject = {
        id: 'testId1',
        title: 'test name',
        status: 'passed',
        parentId: 'parentSuiteId',
        err: undefined,
      };

      const testInfoObject = getTestInfo(test);

      expect(testInfoObject).toBeDefined();
      expect(testInfoObject).toEqual(expectedTestInfoObject);
    });

    test('should return test info for pending test', () => {
      const test = {
        id: 'testId1',
        title: 'test name',
        parent: {
          id: 'parentSuiteId',
        },
        state: 'pending',
      };
      const expectedTestInfoObject = {
        id: 'testId1',
        title: 'test name',
        status: 'skipped',
        parentId: 'parentSuiteId',
        err: undefined,
      };

      const testInfoObject = getTestInfo(test);

      expect(testInfoObject).toBeDefined();
      expect(testInfoObject).toEqual(expectedTestInfoObject);
    });

    test('should return test info with specified status and error', () => {
      const test = {
        id: 'testId',
        title: 'test name',
        parent: {
          id: 'parentSuiteId',
        },
        state: 'pending',
      };
      const expectedTestInfoObject = {
        id: 'testId',
        title: 'test name',
        status: 'failed',
        parentId: 'parentSuiteId',
        err: 'error message',
      };

      const testInfoObject = getTestInfo(test, 'failed', { message: 'error message' });

      expect(testInfoObject).toBeDefined();
      expect(testInfoObject).toEqual(expectedTestInfoObject);
    });

    test('should return test start object', () => {
      const test = {
        id: 'testId1',
        title: 'test name',
        parent: {
          id: 'parentSuiteId',
        },
      };
      const expectedTestStartObject = {
        name: 'test name',
        startTime: currentDate,
        attributes: [],
        type: 'step',
      };

      const testInfoObject = getTestStartObject(test);

      expect(testInfoObject).toBeDefined();
      expect(testInfoObject).toEqual(expectedTestStartObject);
    });

    test('should return hook info for passed hook', () => {
      const hook = {
        id: 'testId',
        title: '"before each" hook: hook name',
        parent: {
          id: 'parentSuiteId',
        },
        state: 'passed',
        hookName: 'before each',
        hookId: 'hookId',
      };
      const expectedHookInfoObject = {
        id: 'hookId_testId',
        hookName: 'before each',
        title: '"before each" hook: hook name',
        status: 'passed',
        parentId: 'parentSuiteId',
        err: undefined,
      };

      const hookInfoObject = getHookInfo(hook);

      expect(hookInfoObject).toBeDefined();
      expect(hookInfoObject).toEqual(expectedHookInfoObject);
    });

    test('should return hook info for failed test', () => {
      const test = {
        id: 'testId',
        title: '"before each" hook: hook name',
        parent: {
          id: 'parentSuiteId',
        },
        state: 'failed',
        failedFromHookId: 'hookId',
      };
      const expectedHookInfoObject = {
        id: 'hookId_testId',
        title: '"before each" hook: hook name',
        status: 'failed',
        parentId: 'parentSuiteId',
        err: undefined,
      };

      const hookInfoObject = getHookInfo(test);

      expect(hookInfoObject).toBeDefined();
      expect(hookInfoObject).toEqual(expectedHookInfoObject);
    });

    test('should return hook start object', () => {
      const hookInfo = {
        id: 'hookId_testId',
        hookName: 'before each',
        title: '"before each" hook: hook name',
        status: 'passed',
        parentId: 'parentSuiteId',
        err: undefined,
      };
      const expectedHookStartObject = {
        name: 'hook name',
        startTime: currentDate,
        type: 'BEFORE_METHOD',
      };

      const hookInfoObject = getHookStartObject(hookInfo, 'failed', { message: 'error message' });

      expect(hookInfoObject).toBeDefined();
      expect(hookInfoObject).toEqual(expectedHookStartObject);
    });
  });
});
