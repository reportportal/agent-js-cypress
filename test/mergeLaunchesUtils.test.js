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

const fs = require('fs');
const mockFS = require('mock-fs');

const mergeLaunchesUtils = require('./../lib/mergeLaunchesUtils');

describe('merge launches script', () => {
  describe('getLaunchLockFileName', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should return file name with launch name and temp id', () => {
      const launchName = 'launchName';
      const tempID = 'tempId';
      const expectedFileName = 'rplaunchinprogress-launchName-tempId.tmp';

      const fileName = mergeLaunchesUtils.getLaunchLockFileName(launchName, tempID);

      expect(fileName).toEqual(expectedFileName);
    });
  });

  describe('createMergeLaunchLockFile', () => {
    it('should create lock file', () => {
      const spyFSOpen = jest.spyOn(fs, 'open').mockImplementation(() => {});
      const launchName = 'launchName';
      const tempID = 'tempId';

      mergeLaunchesUtils.createMergeLaunchLockFile(launchName, tempID);

      expect(spyFSOpen).toHaveBeenCalled();
    });
  });

  describe('deleteMergeLaunchLockFile', () => {
    it('should delete lock file', () => {
      const spyFSOpen = jest.spyOn(fs, 'unlink').mockImplementation(() => {});
      const launchName = 'launchName';
      const tempID = 'tempId';

      mergeLaunchesUtils.deleteMergeLaunchLockFile(launchName, tempID);

      expect(spyFSOpen).toHaveBeenCalled();
    });
  });

  describe('isLaunchesInProgress', () => {
    afterEach(() => {
      mockFS.restore();
    });
    it('should return true if lock files exist', () => {
      mockFS({
        'rplaunchinprogress-launchName-tempId.tmp': '',
      });
      const launchName = 'launchName';

      const isInProgress = mergeLaunchesUtils.isLaunchesInProgress(launchName);

      expect(isInProgress).toEqual(true);
    });

    it("should return false if lock files don't exist", () => {
      mockFS({
        'foo-launchName.tmp': '',
      });
      const launchName = 'launchName';

      const isInProgress = mergeLaunchesUtils.isLaunchesInProgress(launchName);

      expect(isInProgress).toEqual(false);
    });
  });
});
