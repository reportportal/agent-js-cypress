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
