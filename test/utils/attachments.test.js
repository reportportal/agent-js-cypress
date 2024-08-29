const fsPromises = require('fs/promises');
const mockFs = require('mock-fs');
const path = require('path');
const glob = require('glob');
const attachmentUtils = require('../../lib/utils/attachments');

const {
  getScreenshotAttachment,
  getVideoFile,
  waitForVideoFile,
  getFilePathByGlobPattern,
  checkVideoFileReady,
} = attachmentUtils;

const sep = path.sep;

describe('attachment utils', () => {
  describe('getScreenshotAttachment', () => {
    beforeEach(() => {
      mockFs({
        '/example/screenshots/example.spec.js': {
          'suite name -- test name (failed).png': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
          'suite name -- test name.png': Buffer.from([1, 2, 3, 4, 5, 6, 7]),
          'suite name -- test name (1).png': Buffer.from([8, 7, 6, 5, 4, 3, 2]),
          'customScreenshot1.png': Buffer.from([1, 1, 1, 1, 1, 1, 1]),
        },
      });
    });

    afterEach(() => {
      mockFs.restore();
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

  describe('getFilePathByGlobPattern', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('returns the path of the first file if files are found', async () => {
      const mockFiles = ['path/to/first/file.mp4', 'path/to/second/file.mp4'];
      jest.spyOn(glob, 'glob').mockResolvedValueOnce(mockFiles);

      const result = await getFilePathByGlobPattern('*.mp4');
      expect(result).toBe('path/to/first/file.mp4');
    });

    test('returns null if no files are found', async () => {
      jest.spyOn(glob, 'glob').mockResolvedValueOnce([]);

      const result = await getFilePathByGlobPattern('*.mp4');
      expect(result).toBeNull();
    });
  });

  describe('checkVideoFileReady', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('returns true if the video file contains "moov" atom', async () => {
      const mockFileData = Buffer.from('some data with moov in it');
      jest.spyOn(fsPromises, 'readFile').mockResolvedValueOnce(mockFileData);

      const result = await checkVideoFileReady('path/to/video.mp4');
      expect(result).toBe(true);
    });

    test('returns false if the video file does not contain "moov" atom', async () => {
      const mockFileData = Buffer.from('some data without the keyword');
      jest.spyOn(fsPromises, 'readFile').mockResolvedValueOnce(mockFileData);

      const result = await checkVideoFileReady('path/to/video.mp4');
      expect(result).toBe(false);
    });

    test('throws an error if there is an error reading the file', async () => {
      jest.spyOn(fsPromises, 'readFile').mockRejectedValueOnce(new Error('Failed to read file'));

      await expect(checkVideoFileReady('path/to/video.mp4')).rejects.toThrow(
        'Error reading file: Failed to read file',
      );
    });
  });

  // TODO: Fix the tests
  describe.skip('waitForVideoFile', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.clearAllMocks();
    });

    test('resolves with the file path if the video file is found and ready', async () => {
      jest
        .spyOn(attachmentUtils, 'getFilePathByGlobPattern')
        .mockImplementation(async () => 'path/to/video.mp4');
      // .mockResolvedValueOnce('path/to/video.mp4');
      jest.spyOn(attachmentUtils, 'checkVideoFileReady').mockImplementation(async () => true);

      const promise = waitForVideoFile('*.mp4');
      jest.runAllTimers();

      await expect(promise).resolves.toBe('path/to/video.mp4');
    }, 20000);

    test('retries until the video file is ready or timeout occurs', async () => {
      jest
        .spyOn(attachmentUtils, 'getFilePathByGlobPattern')
        .mockResolvedValueOnce('path/to/video.mp4');
      jest
        .spyOn(attachmentUtils, 'checkVideoFileReady')
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const promise = waitForVideoFile('*.mp4');
      jest.advanceTimersByTime(3000);

      await expect(promise).resolves.toBe('path/to/video.mp4');
    }, 20000);

    test('rejects with a timeout error if the timeout is reached without finding a ready video file', async () => {
      jest
        .spyOn(attachmentUtils, 'getFilePathByGlobPattern')
        .mockResolvedValueOnce('path/to/video.mp4');
      jest.spyOn(attachmentUtils, 'checkVideoFileReady').mockResolvedValueOnce(false);

      const promise = waitForVideoFile('*.mp4', 3000, 1000);
      jest.advanceTimersByTime(3000);

      await expect(promise).rejects.toThrow(
        'Timeout of 3000ms reached, file *.mp4 not found or not ready yet.',
      );
    }, 20000);

    afterEach(() => {
      jest.useRealTimers();
    });
  });

  describe.skip('getVideoFile', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('returns the correct video file object if a valid video file is found and read successfully', async () => {
      const mockVideoFilePath = 'path/to/video.mp4';
      const mockFileContent = 'base64encodedcontent';
      jest.spyOn(attachmentUtils, 'waitForVideoFile').mockResolvedValueOnce(mockVideoFilePath);
      jest.spyOn(fsPromises, 'readFile').mockResolvedValueOnce(mockFileContent);

      const result = await getVideoFile('video', '**', 5000, 1000);

      expect(result).toEqual({
        name: 'video.mp4',
        type: 'video/mp4',
        content: mockFileContent,
      });
    });

    test('returns null if no video file name is provided', async () => {
      const result = await getVideoFile('');
      expect(result).toBeNull();
    });

    test('returns null and logs a warning if there is an error during the video file search', async () => {
      jest
        .spyOn(attachmentUtils, 'waitForVideoFile')
        .mockRejectedValueOnce(new Error('File not found'));
      jest.spyOn(console, 'warn').mockImplementationOnce(() => {});

      const result = await getVideoFile('video');
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('File not found');
    });

    test('handles file read errors gracefully', async () => {
      const mockVideoFilePath = 'path/to/video.mp4';
      jest.spyOn(attachmentUtils, 'waitForVideoFile').mockResolvedValueOnce(mockVideoFilePath);
      jest.spyOn(fsPromises, 'readFile').mockRejectedValueOnce(new Error('Failed to read file'));
      jest.spyOn(console, 'warn').mockImplementationOnce(() => {});

      const result = await getVideoFile('video');
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('Failed to read file');
    });
  });
});
