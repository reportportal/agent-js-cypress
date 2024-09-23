/*
 *  Copyright 2024 EPAM Systems
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const path = require('path');
const helpers = require('@reportportal/client-javascript/lib/helpers');
const {
  getSystemAttributes,
  getLaunchStartObject,
  getSuiteStartInfo,
  getSuiteEndInfo,
  getSuiteStartObject,
  getSuiteEndObject,
  getTestInfo,
  getTestStartObject,
  getTestEndObject,
  getHookInfo,
  getHookStartObject,
  getAgentInfo,
  getConfig,
} = require('../../lib/utils/objectCreators');
const pjson = require('../../package.json');

const sep = path.sep;

const { currentDate, getDefaultConfig } = require('../mock/mocks');
const { testItemStatuses, entityType } = require('../../lib/constants');

describe('object creators', () => {
  jest.spyOn(helpers, 'now').mockReturnValue(currentDate);

  const testFileName = `test${sep}example.spec.js`;

  describe('getAgentInfo', () => {
    it('getAgentInfo: should contain version and name properties', () => {
      const agentInfo = getAgentInfo();

      expect(Object.keys(agentInfo)).toContain('version');
      expect(Object.keys(agentInfo)).toContain('name');
    });
  });

  describe('getSystemAttributes', () => {
    it('skippedIssue undefined. Should return attribute with agent name and version', function () {
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

    it('skippedIssue = true. Should return attribute with agent name and version', function () {
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

    it('skippedIssue = false. Should return 2 attribute: with agent name/version and skippedIssue', function () {
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
    const baseReporterOptions = {
      endpoint: 'https://reportportal.server/api/v1',
      project: 'ProjectName',
      launch: 'LauncherName',
      description: 'Launch description',
      attributes: [],
    };

    describe('CI_BUILD_ID attribute providing', () => {
      afterEach(() => {
        delete process.env.CI_BUILD_ID;
      });

      it('should not add an attribute with the CI_BUILD_ID value in case of parallel reporter option is false', function () {
        process.env.CI_BUILD_ID = 'buildId';
        const initialConfig = {
          reporter: '@reportportal/agent-js-cypress',
          reporterOptions: {
            ...baseReporterOptions,
            apiKey: '123',
            autoMerge: true,
            parallel: false,
          },
        };
        const expectedConfig = initialConfig;

        const config = getConfig(initialConfig);

        expect(config).toEqual(expectedConfig);
      });

      it('should not add an attribute with the CI_BUILD_ID value in case of autoMerge reporter option is false', function () {
        process.env.CI_BUILD_ID = 'buildId';
        const initialConfig = {
          reporter: '@reportportal/agent-js-cypress',
          reporterOptions: {
            ...baseReporterOptions,
            apiKey: '123',
            autoMerge: false,
            parallel: true,
          },
        };
        const expectedConfig = initialConfig;

        const config = getConfig(initialConfig);

        expect(config).toEqual(expectedConfig);
      });

      it('should not add an attribute with the value CI_BUILD_ID if the env variable CI_BUILD_ID does not exist', function () {
        process.env.CI_BUILD_ID = undefined;
        const initialConfig = {
          reporter: '@reportportal/agent-js-cypress',
          reporterOptions: {
            ...baseReporterOptions,
            apiKey: '123',
            autoMerge: false,
            parallel: true,
          },
        };
        const expectedConfig = initialConfig;

        const config = getConfig(initialConfig);

        expect(config).toEqual(expectedConfig);
      });

      it('should return config with updated attributes (including attribute with CI_BUILD_ID value)', function () {
        process.env.CI_BUILD_ID = 'buildId';
        const initialConfig = {
          reporter: '@reportportal/agent-js-cypress',
          reporterOptions: {
            ...baseReporterOptions,
            apiKey: '123',
            autoMerge: true,
            parallel: true,
          },
        };
        const expectedConfig = {
          reporter: '@reportportal/agent-js-cypress',
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
      });
    });

    describe('apiKey option priority', () => {
      afterEach(() => {
        delete process.env.RP_TOKEN;
        delete process.env.RP_API_KEY;
      });

      it('should override token property if the ENV variable RP_TOKEN exists', function () {
        process.env.RP_TOKEN = 'secret';
        const initialConfig = {
          reporter: '@reportportal/agent-js-cypress',
          reporterOptions: {
            ...baseReporterOptions,
            token: '123',
          },
        };
        const expectedConfig = {
          reporter: '@reportportal/agent-js-cypress',
          reporterOptions: {
            ...baseReporterOptions,
            apiKey: 'secret',
          },
        };

        const config = getConfig(initialConfig);

        expect(config).toEqual(expectedConfig);
      });

      it('should override apiKey property if the ENV variable RP_API_KEY exists', function () {
        process.env.RP_API_KEY = 'secret';
        const initialConfig = {
          reporter: '@reportportal/agent-js-cypress',
          reporterOptions: {
            ...baseReporterOptions,
            apiKey: '123',
          },
        };
        const expectedConfig = {
          reporter: '@reportportal/agent-js-cypress',
          reporterOptions: {
            ...baseReporterOptions,
            apiKey: 'secret',
          },
        };

        const config = getConfig(initialConfig);

        expect(config).toEqual(expectedConfig);
      });

      it('should prefer apiKey property over deprecated token', function () {
        const initialConfig = {
          reporter: '@reportportal/agent-js-cypress',
          reporterOptions: {
            ...baseReporterOptions,
            apiKey: '123',
            token: '345',
          },
        };
        const expectedConfig = {
          reporter: '@reportportal/agent-js-cypress',
          reporterOptions: {
            ...baseReporterOptions,
            apiKey: '123',
          },
        };

        const config = getConfig(initialConfig);

        expect(config).toEqual(expectedConfig);
      });
    });
  });

  describe('getLaunchStartObject', () => {
    it('should return start launch object with correct values', () => {
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
        mode: undefined,
      };

      const startLaunchObject = getLaunchStartObject(getDefaultConfig());

      expect(startLaunchObject).toBeDefined();
      expect(startLaunchObject).toEqual(expectedStartLaunchObject);
    });
  });

  describe('getSuiteStartInfo', () => {
    it('root suite: should return suite start info with undefined parentId', () => {
      const suite = {
        id: 'suite1',
        title: 'suite name',
        description: 'suite description',
        root: true,
        titlePath: () => ['suite name'],
      };
      const expectedSuiteStartInfo = {
        id: 'suite1',
        title: 'suite name',
        startTime: currentDate,
        description: 'suite description',
        codeRef: 'test/example.spec.js/suite name',
        parentId: undefined,
        testFileName: 'example.spec.js',
      };

      const suiteStartInfo = getSuiteStartInfo(suite, testFileName);

      expect(suiteStartInfo).toBeDefined();
      expect(suiteStartInfo).toEqual(expectedSuiteStartInfo);
    });

    it('nested suite: should return suite start info with parentId', () => {
      const suite = {
        id: 'suite1',
        title: 'suite name',
        description: 'suite description',
        parent: {
          id: 'parentSuiteId',
        },
        titlePath: () => ['parent suite name', 'suite name'],
      };
      const expectedSuiteStartInfo = {
        id: 'suite1',
        title: 'suite name',
        startTime: currentDate,
        description: 'suite description',
        codeRef: 'test/example.spec.js/parent suite name/suite name',
        parentId: 'parentSuiteId',
        testFileName: 'example.spec.js',
      };

      const suiteStartInfo = getSuiteStartInfo(suite, testFileName);

      expect(suiteStartInfo).toBeDefined();
      expect(suiteStartInfo).toEqual(expectedSuiteStartInfo);
    });
  });

  describe('getSuiteEndInfo', () => {
    it('no tests inside suite: should return suite end info without status', () => {
      const suite = {
        id: 'suite1',
        title: 'suite name',
        description: 'suite description',
        parent: {
          id: 'parentSuiteId',
        },
      };
      const expectedSuiteEndInfo = {
        id: 'suite1',
        title: 'suite name',
        endTime: currentDate,
      };

      const suiteEndInfo = getSuiteEndInfo(suite);

      expect(suiteEndInfo).toBeDefined();
      expect(suiteEndInfo).toEqual(expectedSuiteEndInfo);
    });

    it('no failed tests inside suite: should return suite end info with undefined status', () => {
      const suite = {
        id: 'suite1',
        title: 'suite name',
        description: 'suite description',
        parent: {
          id: 'parentSuiteId',
        },
        tests: [{ state: 'passed' }, { state: 'skipped' }],
      };
      const expectedSuiteEndInfo = {
        id: 'suite1',
        title: 'suite name',
        endTime: currentDate,
        status: undefined,
      };

      const suiteEndInfo = getSuiteEndInfo(suite);

      expect(suiteEndInfo).toBeDefined();
      expect(suiteEndInfo).toEqual(expectedSuiteEndInfo);
    });

    it('there are failed tests inside suite: should return suite end info with failed status', () => {
      const suite = {
        id: 'suite1',
        title: 'suite name',
        description: 'suite description',
        parent: {
          id: 'parentSuiteId',
        },
        tests: [{ state: 'failed' }, { state: 'passed' }],
      };
      const expectedSuiteEndInfo = {
        id: 'suite1',
        title: 'suite name',
        endTime: currentDate,
        status: testItemStatuses.FAILED,
      };

      const suiteEndInfo = getSuiteEndInfo(suite);

      expect(suiteEndInfo).toBeDefined();
      expect(suiteEndInfo).toEqual(expectedSuiteEndInfo);
    });
  });

  describe('getSuiteStartObject', () => {
    it('should return suite start object', () => {
      const suite = {
        id: 'suite1',
        title: 'suite name',
        startTime: currentDate,
        description: 'suite description',
        codeRef: 'test/example.spec.js/suite name',
        testFileName: 'example.spec.js',
      };
      const expectedSuiteStartObject = {
        type: entityType.SUITE,
        name: 'suite name',
        startTime: currentDate,
        description: 'suite description',
        codeRef: 'test/example.spec.js/suite name',
        attributes: [],
      };

      const suiteStartObject = getSuiteStartObject(suite);

      expect(suiteStartObject).toBeDefined();
      expect(suiteStartObject).toEqual(expectedSuiteStartObject);
    });
  });

  describe('getSuiteEndObject', () => {
    it('should return suite end object', () => {
      const suite = {
        id: 'suite1',
        title: 'suite name',
        endTime: currentDate,
        status: testItemStatuses.FAILED,
      };
      const expectedSuiteEndObject = {
        status: testItemStatuses.FAILED,
        endTime: currentDate,
      };

      const suiteEndObject = getSuiteEndObject(suite);

      expect(suiteEndObject).toBeDefined();
      expect(suiteEndObject).toEqual(expectedSuiteEndObject);
    });
  });

  describe('getTestInfo', () => {
    it('passed test: should return test info with passed status', () => {
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

    it('pending test: should return test info with skipped status', () => {
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

    it('should return test info with specified status and error', () => {
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
        err: { message: 'error message' },
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
    it('should return test start object', () => {
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
    it('skippedIssue is not defined: should return test end object without issue', () => {
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

    it('skippedIssue = true: should return test end object without issue', () => {
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

    it('skippedIssue = false: should return test end object with issue NOT_ISSUE', () => {
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

    it('testCaseId is defined: should return test end object with testCaseId', () => {
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
    it('passed before each hook: should return hook info with passed status', () => {
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

    it('passed before all hook: should return correct hook info', () => {
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

    it('failed test: should return hook info with failed status', () => {
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
    it('should return hook start object', () => {
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
