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

const currentDate = '2024-09-23T12:20:59.392987Z';

class RPClient {
  constructor(config) {
    this.config = config;
    this.headers = {
      foo: 'bar',
    };
    this.startLaunch = jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
      tempId: 'tempLaunchId',
    });

    this.finishLaunch = jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
    });

    this.startTestItem = jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
      tempId: 'testItemId',
    });

    this.finishTestItem = jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
    });

    this.sendLog = jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
    });
  }
}

const getDefaultConfig = () => ({
  reporter: '@reportportal/agent-js-cypress',
  reporterOptions: {
    apiKey: 'reportportalApiKey',
    endpoint: 'https://reportportal.server/api/v1',
    project: 'ProjectName',
    launch: 'LauncherName',
    description: 'Launch description',
    attributes: [],
  },
});

const RealDate = Date;

const MockedDate = (...attrs) =>
  attrs.length ? new RealDate(...attrs) : new RealDate(currentDate);

module.exports = {
  RPClient,
  getDefaultConfig,
  MockedDate,
  RealDate,
  currentDate,
};
