const mock = require('mock-fs');
const path = require('path');
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
  getCustomScreenshots,
  getAgentInfo,
  getCodeRef,
  getTotalSpecs,
  getConfig,
  getFixtureFolderPattern,
  getExcludeSpecPattern,
  getSpecPattern,
} = require('./../lib/utils');
const pjson = require('./../package.json');

const { RealDate, MockedDate, currentDate, getDefaultConfig } = require('./mock/mock');

describe('utils script', () => {
  describe('attachment utils', () => {
    beforeEach(() => {
      mock({
        'example/screenshots/example.spec.js': {
          'suite name -- test name (failed).png': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
          'suite name -- test name.png': Buffer.from([1, 2, 3, 4, 5, 6, 7]),
          'suite name -- test name (1).png': Buffer.from([8, 7, 6, 5, 4, 3, 2]),
          'customScreenshot1.png': Buffer.from([1, 1, 1, 1, 1, 1, 1]),
          customDir: {
            'customScreenshot2.png': Buffer.from([2, 2, 2, 2, 2, 2, 2]),
          },
        },
      });
    });

    afterEach(() => {
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

    it('getCustomScreenshots: should return custom screenshot', () => {
      jest.spyOn(path, 'parse').mockImplementation(() => ({
        base: 'example.spec.js',
      }));
      const testFileName = `test\\example.spec.js`;
      const customScreenshotNames = ['customScreenshot1', 'customDir/customScreenshot2'];
      const expectedAttachments = [
        {
          name: 'customScreenshot1',
          type: 'image/png',
          content: Buffer.from([1, 1, 1, 1, 1, 1, 1]).toString('base64'),
        },
        {
          name: 'customScreenshot2',
          type: 'image/png',
          content: Buffer.from([2, 2, 2, 2, 2, 2, 2]).toString('base64'),
        },
      ];

      const attachments = getCustomScreenshots(customScreenshotNames, testFileName);

      expect(attachments).toBeDefined();
      expect(attachments.length).toEqual(2);
      expect(attachments).toEqual(expectedAttachments);
      jest.clearAllMocks();
    });

    it('getCustomScreenshots: should return [] in case of no corresponding files', () => {
      jest.spyOn(path, 'parse').mockImplementation(() => ({
        base: 'example.spec.js',
      }));
      const testFileName = `test\\example.spec.js`;
      const customScreenshotNames = ['screenshotNotExist1', 'screenshotNotExist2'];

      const attachments = getCustomScreenshots(customScreenshotNames, testFileName);

      expect(attachments).toBeDefined();
      expect(attachments.length).toEqual(0);
      jest.clearAllMocks();
    });
  });

  describe('object creators', () => {
    const testFileName = `test\\example.spec.js`;

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

    describe('getConfig', () => {
      it('should not add an attribute with the CI_BUILD_ID value in case of parallel reporter option is false', function() {
        process.env.CI_BUILD_ID = 'buildId';
        const initialConfig = getDefaultConfig();
        initialConfig.reporterOptions = {
          ...initialConfig.reporterOptions,
          autoMerge: true,
          parallel: false,
        };
        const expectedConfig = {
          ...initialConfig,
          reporterOptions: {
            ...initialConfig.reporterOptions,
            attributes: [],
          },
        };

        const config = getConfig(initialConfig);

        expect(config).toEqual(expectedConfig);
        process.env.CI_BUILD_ID = undefined;
      });

      it('should not add an attribute with the CI_BUILD_ID value in case of autoMerge reporter option is false', function() {
        process.env.CI_BUILD_ID = 'buildId';
        const initialConfig = getDefaultConfig();
        initialConfig.reporterOptions = {
          ...initialConfig.reporterOptions,
          autoMerge: false,
          parallel: true,
        };
        const expectedConfig = {
          ...initialConfig,
          reporterOptions: {
            ...initialConfig.reporterOptions,
            attributes: [],
          },
        };

        const config = getConfig(initialConfig);

        expect(config).toEqual(expectedConfig);
        process.env.CI_BUILD_ID = undefined;
      });

      it('should not add an attribute with the value CI_BUILD_ID if the env variable CI_BUILD_ID does not exist', function() {
        process.env.CI_BUILD_ID = undefined;
        const initialConfig = getDefaultConfig();
        initialConfig.reporterOptions = {
          ...initialConfig.reporterOptions,
          autoMerge: false,
          parallel: true,
        };
        const expectedConfig = {
          ...initialConfig,
          reporterOptions: {
            ...initialConfig.reporterOptions,
            attributes: [],
          },
        };

        const config = getConfig(initialConfig);

        expect(config).toEqual(expectedConfig);
      });

      it('should return config with updated attributes (including attribute with CI_BUILD_ID value)', function() {
        process.env.CI_BUILD_ID = 'buildId';
        const initialConfig = getDefaultConfig();
        initialConfig.reporterOptions = {
          ...initialConfig.reporterOptions,
          autoMerge: true,
          parallel: true,
        };
        const expectedConfig = {
          ...initialConfig,
          reporterOptions: {
            ...initialConfig.reporterOptions,
            attributes: [
              {
                value: 'buildId',
              },
            ],
          },
        };

        const config = getConfig(initialConfig);

        expect(config).toEqual(expectedConfig);
        process.env.CI_BUILD_ID = undefined;
      });

      it('should update token property if the env variable RP_TOKEN exists', function() {
        process.env.RP_TOKEN = 'secret';
        const initialConfig = getDefaultConfig();
        const expectedConfig = {
          ...initialConfig,
          reporterOptions: {
            ...initialConfig.reporterOptions,
            attributes: [],
            token: 'secret',
          },
        };

        const config = getConfig(initialConfig);

        expect(config).toEqual(expectedConfig);
        process.env.RP_TOKEN = undefined;
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
          titlePath: () => ['suite name'],
        };
        const expectedSuiteStartObject = {
          id: 'suite1',
          name: 'suite name',
          type: 'suite',
          startTime: currentDate,
          description: 'suite description',
          attributes: [],
          codeRef: 'test/example.spec.js/suite name',
          parentId: undefined,
        };

        const suiteStartObject = getSuiteStartObject(suite, testFileName);

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
          titlePath: () => ['parent suite name', 'suite name'],
        };
        const expectedSuiteStartObject = {
          id: 'suite1',
          name: 'suite name',
          type: 'suite',
          startTime: currentDate,
          description: 'suite description',
          attributes: [],
          codeRef: 'test/example.spec.js/parent suite name/suite name',
          parentId: 'parentSuiteId',
        };

        const suiteStartObject = getSuiteStartObject(suite, testFileName);

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
          title: 'suite name',
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
          titlePath: () => ['suite name', 'test name'],
        };
        const expectedTestInfoObject = {
          id: 'testId1',
          title: 'test name',
          status: 'passed',
          parentId: 'parentSuiteId',
          codeRef: 'test/example.spec.js/suite name/test name',
          err: undefined,
          testFileName,
        };

        const testInfoObject = getTestInfo(test, testFileName);

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
          titlePath: () => ['suite name', 'test name'],
        };
        const expectedTestInfoObject = {
          id: 'testId1',
          title: 'test name',
          status: 'skipped',
          parentId: 'parentSuiteId',
          codeRef: 'test/example.spec.js/suite name/test name',
          err: undefined,
          testFileName,
        };

        const testInfoObject = getTestInfo(test, testFileName);

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
          titlePath: () => ['suite name', 'test name'],
        };
        const expectedTestInfoObject = {
          id: 'testId',
          title: 'test name',
          status: 'failed',
          parentId: 'parentSuiteId',
          codeRef: 'test/example.spec.js/suite name/test name',
          err: 'error message',
          testFileName,
        };

        const testInfoObject = getTestInfo(test, testFileName, 'failed', {
          message: 'error message',
        });

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
          codeRef: 'test/example.spec.js/suite name/test name',
        };
        const expectedTestStartObject = {
          name: 'test name',
          startTime: currentDate,
          attributes: [],
          type: 'step',
          codeRef: 'test/example.spec.js/suite name/test name',
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

      test('testCaseId is defined: should return test end object with testCaseId', () => {
        const testInfo = {
          id: 'testId1',
          title: 'test name',
          status: 'skipped',
          parent: {
            id: 'parentSuiteId',
          },
          testCaseId: 'testCaseId',
        };
        const expectedTestEndObject = {
          endTime: currentDate,
          status: testInfo.status,
          testCaseId: 'testCaseId',
        };
        const testEndObject = getTestEndObject(testInfo);

        expect(testEndObject).toEqual(expectedTestEndObject);
      });
    });

    describe('getHookInfo', () => {
      test('passed before each hook: should return hook info with passed status', () => {
        const hook = {
          id: 'testId',
          title: '"before each" hook: hook name',
          parent: {
            id: 'parentSuiteId',
          },
          state: 'passed',
          hookName: 'before each',
          hookId: 'hookId',
          titlePath: () => ['suite name', 'hook name'],
        };
        const expectedHookInfoObject = {
          id: 'hookId_testId',
          hookName: 'before each',
          title: '"before each" hook: hook name',
          status: 'passed',
          parentId: 'parentSuiteId',
          codeRef: 'test/example.spec.js/suite name/hook name',
          err: undefined,
          testFileName,
        };

        const hookInfoObject = getHookInfo(hook, testFileName);

        expect(hookInfoObject).toBeDefined();
        expect(hookInfoObject).toEqual(expectedHookInfoObject);
      });

      test('passed before all hook: should return correct hook info', () => {
        const hook = {
          id: 'testId',
          title: '"before all" hook: hook name',
          parent: {
            id: 'parentSuiteId',
            title: 'parent suite title',
            parent: {
              id: 'rootSuiteId',
              title: 'root suite title',
            },
          },
          state: 'passed',
          hookName: 'before all',
          hookId: 'hookId',
          titlePath: () => ['suite name', 'hook name'],
        };
        const expectedHookInfoObject = {
          id: 'hookId_testId',
          hookName: 'before all',
          title: '"before all" hook: hook name',
          status: 'passed',
          parentId: 'rootSuiteId',
          codeRef: 'test/example.spec.js/suite name/hook name',
          err: undefined,
          testFileName,
        };

        const hookInfoObject = getHookInfo(hook, testFileName);

        expect(hookInfoObject).toBeDefined();
        expect(hookInfoObject).toEqual(expectedHookInfoObject);
      });

      test('failed test: should return hook info with failed status', () => {
        const test = {
          id: 'testId',
          hookName: 'before each',
          title: '"before each" hook: hook name',
          parent: {
            id: 'parentSuiteId',
          },
          state: 'failed',
          failedFromHookId: 'hookId',
          titlePath: () => ['suite name', 'hook name'],
        };
        const expectedHookInfoObject = {
          id: 'hookId_testId',
          hookName: 'before each',
          title: '"before each" hook: hook name',
          status: 'failed',
          parentId: 'parentSuiteId',
          codeRef: 'test/example.spec.js/suite name/hook name',
          err: undefined,
          testFileName,
        };

        const hookInfoObject = getHookInfo(test, testFileName);

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
          titlePath: () => ['suite name', 'hook name'],
          err: undefined,
        };
        const expectedHookStartObject = {
          name: 'hook name',
          startTime: currentDate,
          type: 'BEFORE_METHOD',
        };

        const hookInfoObject = getHookStartObject(hookInfo, testFileName, 'failed', {
          message: 'error message',
        });

        expect(hookInfoObject).toBeDefined();
        expect(hookInfoObject).toEqual(expectedHookStartObject);
      });
    });
  });

  describe('common utils', () => {
    describe('getAgentInfo', () => {
      it('getAgentInfo: should contain version and name properties', () => {
        const agentInfo = getAgentInfo();

        expect(Object.keys(agentInfo)).toContain('version');
        expect(Object.keys(agentInfo)).toContain('name');
      });
    });
    describe('getCodeRef', () => {
      it('should return correct code ref for Windows paths', () => {
        jest.mock('path', () => ({
          sep: '\\',
        }));
        const file = `test\\example.spec.js`;
        const titlePath = ['rootDescribe', 'parentDescribe', 'testTitle'];

        const expectedCodeRef = `test/example.spec.js/rootDescribe/parentDescribe/testTitle`;

        const codeRef = getCodeRef(titlePath, file);

        expect(codeRef).toEqual(expectedCodeRef);

        jest.clearAllMocks();
      });

      it('should return correct code ref for POSIX paths', () => {
        jest.mock('path', () => ({
          sep: '/',
        }));
        const file = `test/example.spec.js`;
        const titlePath = ['rootDescribe', 'parentDescribe', 'testTitle'];

        const expectedCodeRef = `test/example.spec.js/rootDescribe/parentDescribe/testTitle`;

        const codeRef = getCodeRef(titlePath, file);

        expect(codeRef).toEqual(expectedCodeRef);

        jest.clearAllMocks();
      });
    });
  });

  describe('getTotalSpecs', () => {
    beforeEach(() => {
      mock({
        'cypress/tests': {
          'example1.spec.js': '',
          'example2.spec.js': '',
          'example3.spec.js': '',
          'example4.spec.ts': '',
          'example.ignore.spec.js': '',
        },
        'cypress/support': {
          'index.js': '',
        },
        'cypress/fixtures': {
          'fixtures1.js': '',
          'fixtures2.js': '',
        },
      });
    });

    afterEach(() => {
      mock.restore();
    });

    it('testFiles, integrationFolder, supportFile are specified: should count all files from integration folder', () => {
      let specConfig = {
        testFiles: '**/*.*',
        ignoreTestFiles: '*.hot-update.js',
        fixturesFolder: 'cypress/fixtures',
        integrationFolder: 'cypress/tests',
        supportFile: 'cypress/support/index.js',
      };

      let specCount = getTotalSpecs(specConfig);

      expect(specCount).toEqual(5);

      specConfig = {
        excludeSpecPattern: '*.hot-update.js',
        specPattern: 'cypress/tests/**/*.spec.{js,ts}',
        supportFile: 'cypress/support/index.js',
        fixturesFolder: 'cypress/fixtures',
      };

      specCount = getTotalSpecs(specConfig);

      expect(specCount).toEqual(5);
    });

    it('ignoreTestFiles are specified: should ignore specified files', () => {
      let specConfig = {
        testFiles: '**/*.*',
        ignoreTestFiles: ['*.hot-update.js', '*.ignore.*.*'],
        fixturesFolder: 'cypress/fixtures',
        integrationFolder: 'cypress/tests',
        supportFile: 'cypress/support/index.js',
      };

      let specCount = getTotalSpecs(specConfig);

      expect(specCount).toEqual(4);

      specConfig = {
        specPattern: 'cypress/tests/**/*.spec.{js,ts}',
        excludeSpecPattern: ['*.hot-update.js', '*.ignore.spec.*'],
        supportFile: 'cypress/support/index.js',
        fixturesFolder: 'cypress/fixtures',
      };

      specCount = getTotalSpecs(specConfig);

      expect(specCount).toEqual(4);
    });
  });

  describe('getFixtureFolderPattern', () => {
    it('returns a glob pattern forn fixtures folder', () => {
      const specConfig = { fixturesFolder: 'cypress/fixtures' };

      const specArray = getFixtureFolderPattern(specConfig);
      expect(specArray).toHaveLength(1);
      expect(specArray).toContain('cypress/fixtures/**/*');
    });
  });
  describe('getExcludeSpecPattern', () => {
    it('getExcludeSpecPattern returns required pattern for cypress version <= 9', () => {
      const specConfigString = {
        integrationFolder: 'cypress/integration',
        ignoreTestFiles: '*.hot-update.js',
        fixturesFolder: 'cypress/fixtures',
        supportFile: 'cypress/support/index.js',
      };

      const specConfigArray = {
        integrationFolder: 'cypress/integration',
        ignoreTestFiles: ['*.hot-update.js', '*.hot-update.ts'],
        fixturesFolder: 'cypress/fixtures',
        supportFile: 'cypress/support/index.js',
      };

      let patternArray = getExcludeSpecPattern(specConfigString);
      expect(patternArray).toHaveLength(1);
      expect(patternArray).toContain('*.hot-update.js');

      patternArray = getExcludeSpecPattern(specConfigArray);
      expect(patternArray).toHaveLength(2);
      expect(patternArray).toContain('*.hot-update.js');
      expect(patternArray).toContain('*.hot-update.ts');
    });
  });

  describe('getSpecPattern', () => {
    it('returns the required glob pattern for cypress <=9 config when testFiles is an array', () => {
      const specConfig = {
        integrationFolder: 'cypress/integration',
        testFiles: ['**/*.js', '**/*.ts'],
      };

      const patternArray = getSpecPattern(specConfig);
      expect(patternArray).toHaveLength(2);
      expect(patternArray[0]).toEqual(
        path.join(specConfig.integrationFolder, specConfig.testFiles[0]),
      );
      expect(patternArray[1]).toEqual(
        path.join(specConfig.integrationFolder, specConfig.testFiles[1]),
      );
    });

    it('getSpecPattern returns the required glob pattern for cypress >= 10 config when specPattern is an array', () => {
      const specConfig = {
        specPattern: ['cypress/integration/**/*.js', 'cypress/integration/**/*.js'],
      };

      const patternArray = getSpecPattern(specConfig);
      expect(patternArray).toHaveLength(2);
      expect(patternArray[0]).toEqual(specConfig.specPattern[0]);
      expect(patternArray[1]).toEqual(specConfig.specPattern[1]);
    });

    it('getSpecPattern returns the required glob pattern for cypress >= 10 config when specPattern is a string', () => {
      const specConfig = {
        specPattern: 'cypress/integration/**/*.js',
      };

      const patternArray = getSpecPattern(specConfig);
      expect(patternArray).toHaveLength(1);
      expect(patternArray[0]).toEqual(specConfig.specPattern);
    });

    it('getSpecPattern returns the required glob pattern for cypress <= 9 config when testFiles is a string', () => {
      const specConfig = {
        integrationFolder: 'cypress/integration',
        testFiles: '**/*.js',
      };

      const patternArray = getSpecPattern(specConfig);
      expect(patternArray).toHaveLength(1);
      expect(patternArray[0]).toEqual(
        path.join(specConfig.integrationFolder, specConfig.testFiles),
      );
    });
  });
});
