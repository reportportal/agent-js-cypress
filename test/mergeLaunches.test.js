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

const mergeLaunches = require('./../lib/mergeLaunches');
const mergeLaunchesUtils = require('./../lib/mergeLaunchesUtils');

describe('mergeLaunches', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('no launches in progress: should call callClientMergeLaunches immediately', () => {
    jest.spyOn(mergeLaunchesUtils, 'isLaunchesInProgress').mockImplementation(() => false);
    const spyCallClientMergeLaunches = jest
      .spyOn(mergeLaunchesUtils, 'callClientMergeLaunches')
      .mockImplementation(() => {});
    const launch = 'foo-launchName';

    mergeLaunches.mergeLaunches({ launch });

    expect(spyCallClientMergeLaunches).toHaveBeenCalled();
  });

  it('launches will stop in 5 ms: should return promise', () => {
    jest.spyOn(mergeLaunchesUtils, 'isLaunchesInProgress').mockImplementation(() => true);

    setTimeout(() => {
      jest.spyOn(mergeLaunchesUtils, 'isLaunchesInProgress').mockImplementation(() => false);
    }, 1);

    const spyCallClientMergeLaunches = jest
      .spyOn(mergeLaunchesUtils, 'callClientMergeLaunches')
      .mockImplementation(() => Promise.resolve());
    const launch = 'foo-launchName';

    const promise = mergeLaunches.mergeLaunches({ launch });

    expect(spyCallClientMergeLaunches).not.toHaveBeenCalled();

    expect(promise.then).toBeDefined();

    return promise.then(() => expect(spyCallClientMergeLaunches).toHaveBeenCalled());
  });
});
