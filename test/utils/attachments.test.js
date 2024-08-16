const mock = require('mock-fs');
const path = require('path');
const glob = require('glob');
const {
  getScreenshotAttachment,
  // getVideoFile,
  waitForFile,
} = require('../../lib/utils/attachments');

jest.mock('glob');

const sep = path.sep;

describe('attachment utils', () => {
  describe('getScreenshotAttachment', () => {
    beforeEach(() => {
      mock({
        '/example/screenshots/example.spec.js': {
          'suite name -- test name (failed).png': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
          'suite name -- test name.png': Buffer.from([1, 2, 3, 4, 5, 6, 7]),
          'suite name -- test name (1).png': Buffer.from([8, 7, 6, 5, 4, 3, 2]),
          'customScreenshot1.png': Buffer.from([1, 1, 1, 1, 1, 1, 1]),
        },
      });
    });

    afterEach(() => {
      mock.restore();
    });

    it('getScreenshotAttachment: should not fail on undefined', async () => {
      const testFile = undefined;
      const attachment = await getScreenshotAttachment(testFile);
      expect(attachment).not.toBeDefined();
    });

    it('getScreenshotAttachment: should return attachment for absolute path', async () => {
      const testFile = `${sep}example${sep}screenshots${sep}example.spec.js${sep}suite name -- test name (failed).png`;
      const expectedAttachment = {
        name: 'suite name -- test name (failed).png',
        type: 'image/png',
        content: Buffer.from([8, 6, 7, 5, 3, 0, 9]).toString('base64'),
      };

      const attachment = await getScreenshotAttachment(testFile);

      expect(attachment).toBeDefined();
      expect(attachment).toEqual(expectedAttachment);
    });
  });

  describe('waitForFile', () => {
    const TEST_TIMEOUT_BASED_ON_INTERVAL = 15000;
    beforeEach(() => {
      jest.useFakeTimers();
      glob.mockReset();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test(
      'resolves when file is found immediately',
      async () => {
        glob.mockResolvedValue(['file1.mp4']);

        const promise = waitForFile('*.mp4');
        jest.runOnlyPendingTimers();

        await expect(promise).resolves.toBe('file1.mp4');
      },
      TEST_TIMEOUT_BASED_ON_INTERVAL,
    );

    test(
      'resolves when file is found after some intervals',
      async () => {
        glob
          .mockResolvedValueOnce([]) // First call, no files
          .mockResolvedValueOnce([]) // Second call, no files
          .mockResolvedValue(['file1.mp4']); // Third call, file found

        const promise = waitForFile('*.mp4');
        jest.advanceTimersByTime(3000);

        await expect(promise).resolves.toBe('file1.mp4');
      },
      TEST_TIMEOUT_BASED_ON_INTERVAL,
    );

    test(
      'rejects when timeout is reached without finding the file with custom timeout and interval',
      async () => {
        glob.mockResolvedValue([]);

        const promise = waitForFile('*.mp4', 3000, 1000);
        jest.advanceTimersByTime(3000);

        await expect(promise).rejects.toThrow(`Timeout of 3000ms reached, file *.mp4 not found.`);
      },
      TEST_TIMEOUT_BASED_ON_INTERVAL,
    );
  });
});
