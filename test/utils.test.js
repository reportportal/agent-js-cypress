const mock = require('mock-fs');
const {
  getSystemAttributes,
  getLaunchStartObject,
  getSuiteStartObject,
  getSuiteEndObject,
  getTestInfo,
  getTestStartObject,
  getTestEndObject,
  getHookInfo,
  getHookStartObject,
  getFailedScreenshot,
  getPassedScreenshots,
  getAgentInfo,
} = require('./../lib/utils');
const pjson = require('./../package.json');

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

    afterAll(() => {
      mock.restore();
    });

    it('getFailedScreenshot: should return failed attachment', () => {
      const testTitle = 'test name';
      const expectedAttachment = {
        name: 'test name (failed)',
        type: 'image/png',
        content: Buffer.from([8, 6, 7, 5, 3, 0, 9]).toString('base64'),
      };

      const attachment = getFailedScreenshot(testTitle);

      expect(attachment).toBeDefined();
      expect(attachment).toEqual(expectedAttachment);
    });

    it('getPassedScreenshots: should return passed attachments', () => {
      const testTitle = 'test name';
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

      const attachments = getPassedScreenshots(testTitle);

      expect(attachments).toBeDefined();
      expect(attachments.length).toEqual(2);
      expect(attachments).toEqual(expectedAttachments);
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

    describe('getSystemAttributes', () => {
      it('skippedIssue undefined. Should return attribute with agent name and version', function() {
        const options = getDefaultConfig();
        const expectedSystemAttributes = [
          {
            key: 'agent',
            value: `${pjson.name}|${pjson.version}`,
            system: true,
          },
        ];

        const systemAttributes = getSystemAttributes(options);

        expect(systemAttributes).toEqual(expectedSystemAttributes);
      });

      it('skippedIssue = true. Should return attribute with agent name and version', function() {
        const options = getDefaultConfig();
        options.reporterOptions.skippedIssue = true;
        const expectedSystemAttributes = [
          {
            key: 'agent',
            value: `${pjson.name}|${pjson.version}`,
            system: true,
          },
        ];

        const systemAttributes = getSystemAttributes(options);

        expect(systemAttributes).toEqual(expectedSystemAttributes);
      });

      it('skippedIssue = false. Should return 2 attribute: with agent name/version and skippedIssue', function() {
        const options = getDefaultConfig();
        options.reporterOptions.skippedIssue = false;
        const expectedSystemAttributes = [
          {
            key: 'agent',
            value: `${pjson.name}|${pjson.version}`,
            system: true,
          },
          {
            key: 'skippedIssue',
            value: 'false',
            system: true,
          },
        ];

        const systemAttributes = getSystemAttributes(options);

        expect(systemAttributes).toEqual(expectedSystemAttributes);
      });
    });

    describe('getLaunchStartObject', () => {
      test('should return start launch object with correct values', () => {
        const expectedStartLaunchObject = {
          launch: 'LauncherName',
          description: 'Launch description',
          attributes: [
            {
              key: 'agent',
              system: true,
              value: `${pjson.name}|${pjson.version}`,
            },
          ],
          startTime: currentDate,
          rerun: undefined,
          rerunOf: undefined,
        };

        const startLaunchObject = getLaunchStartObject(getDefaultConfig());

        expect(startLaunchObject).toBeDefined();
        expect(startLaunchObject).toEqual(expectedStartLaunchObject);
      });
    });

    describe('getSuiteStartObject', () => {
      test('root suite: should return suite start object with undefined parentId', () => {
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

      test('nested suite: should return suite start object with parentId', () => {
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
    });

    describe('getSuiteEndObject', () => {
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
    });

    describe('getTestInfo', () => {
      test('passed test: should return test info with passed status', () => {
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

      test('pending test: should return test info with skipped status', () => {
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
    });

    describe('getTestStartObject', () => {
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
    });

    describe('getTestEndObject', () => {
      test('skippedIssue is not defined: should return test end object without issue', () => {
        const testInfo = {
          id: 'testId1',
          title: 'test name',
          status: 'skipped',
          parent: {
            id: 'parentSuiteId',
          },
        };
        const expectedTestEndObject = {
          endTime: currentDate,
          status: testInfo.status,
        };
        const testEndObject = getTestEndObject(testInfo);

        expect(testEndObject).toBeDefined();
        expect(testEndObject).toEqual(expectedTestEndObject);
      });

      test('skippedIssue = true: should return test end object without issue', () => {
        const testInfo = {
          id: 'testId1',
          title: 'test name',
          status: 'skipped',
          parent: {
            id: 'parentSuiteId',
          },
        };
        const expectedTestEndObject = {
          endTime: currentDate,
          status: testInfo.status,
        };
        const testEndObject = getTestEndObject(testInfo, true);

        expect(testEndObject).toBeDefined();
        expect(testEndObject).toEqual(expectedTestEndObject);
      });

      test('skippedIssue = false: should return test end object with issue NOT_ISSUE', () => {
        const testInfo = {
          id: 'testId1',
          title: 'test name',
          status: 'skipped',
          parent: {
            id: 'parentSuiteId',
          },
        };
        const expectedTestEndObject = {
          endTime: currentDate,
          status: testInfo.status,
          issue: {
            issueType: 'NOT_ISSUE',
          },
        };
        const testEndObject = getTestEndObject(testInfo, false);

        expect(testEndObject).toBeDefined();
        expect(testEndObject).toEqual(expectedTestEndObject);
      });
    });

    describe('getHookInfo', () => {
      test('passed hook: should return hook info with passed status', () => {
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

      test('failed test: should return hook info with failed status', () => {
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
    });
    describe('getHookStartObject', () => {
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

  describe('common utils', () => {
    describe('getAgentInfo', () => {
      it('should contain version and name properties', () => {
        const agentInfo = getAgentInfo();

        expect(Object.keys(agentInfo)).toContain('version');
        expect(Object.keys(agentInfo)).toContain('name');
      });
    });
  });
});
