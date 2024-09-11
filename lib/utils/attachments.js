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
const glob = require('glob');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeStatic = require('ffprobe-static');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const fsPromises = fs.promises;

const DEFAULT_WAIT_FOR_FILE_TIMEOUT = 10000;
const DEFAULT_WAIT_FOR_FILE_INTERVAL = 500;
const DEFAULT_CRF = 32;
const MIN_CRF = 1;
const MAX_CRF = 52;

const getScreenshotAttachment = async (absolutePath) => {
  if (!absolutePath) return absolutePath;
  const name = absolutePath.split(path.sep).pop();
  return {
    name,
    type: 'image/png',
    content: await fsPromises.readFile(absolutePath, { encoding: 'base64' }),
  };
};

async function getFilePathByGlobPattern(globFilePattern) {
  const files = await glob.glob(globFilePattern);

  if (files.length) {
    return files[0];
  }

  return null;
}
/*
 * The moov atom in an MP4 file is a crucial part of the file’s structure. It contains metadata about the video, such as the duration, display characteristics, and timing information.
 * Function check for the moov atom in file content and ensure is video file ready.
 */
const checkVideoFileReady = async (videoFilePath) => {
  try {
    const fileData = await fsPromises.readFile(videoFilePath);

    if (fileData.includes('moov')) {
      return true;
    }
  } catch (e) {
    throw new Error(`Error reading file: ${e.message}`);
  }

  return false;
};

const waitForVideoFile = (
  globFilePattern,
  timeout = DEFAULT_WAIT_FOR_FILE_TIMEOUT,
  interval = DEFAULT_WAIT_FOR_FILE_INTERVAL,
) =>
  new Promise((resolve, reject) => {
    let filePath = null;
    let totalFileWaitingTime = 0;

    async function checkFileExistsAndReady() {
      if (!filePath) {
        filePath = await getFilePathByGlobPattern(globFilePattern);
      }
      let isVideoFileReady = false;

      if (filePath) {
        isVideoFileReady = await checkVideoFileReady(filePath);
      }

      if (isVideoFileReady) {
        resolve(filePath);
      } else if (totalFileWaitingTime >= timeout) {
        reject(
          new Error(
            `Timeout of ${timeout}ms reached, file ${globFilePattern} not found or not ready yet.`,
          ),
        );
      } else {
        totalFileWaitingTime += interval;
        setTimeout(checkFileExistsAndReady, interval);
      }
    }

    checkFileExistsAndReady().catch(reject);
  });

const compressVideo = (filePath, crfValue) => {
  return new Promise((resolve, reject) => {
    const outputFilePath = path.join(
      path.dirname(filePath),
      `compressed_${path.basename(filePath)}`,
    );

    ffmpeg(filePath)
      .outputOptions(`-crf ${crfValue}`)
      .save(outputFilePath)
      .on('end', () => {
        resolve(outputFilePath);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

const getVideoFile = async (
  specFileName,
  videoCompression = false,
  videosFolder = '**',
  timeout = DEFAULT_WAIT_FOR_FILE_TIMEOUT,
  interval = DEFAULT_WAIT_FOR_FILE_INTERVAL,
) => {
  if (!specFileName) {
    return null;
  }
  const fileName = specFileName.toLowerCase().endsWith('.mp4')
    ? specFileName
    : `${specFileName}.mp4`;
  const globFilePath = `**/${videosFolder}/${fileName}`;
  let videoFilePath;

  try {
    videoFilePath = await waitForVideoFile(globFilePath, timeout, interval);

    if (typeof videoCompression === 'boolean' && videoCompression) {
      videoFilePath = await compressVideo(videoFilePath, DEFAULT_CRF);
    } else if (
      typeof videoCompression === 'number' &&
      videoCompression >= MIN_CRF &&
      videoCompression < MAX_CRF
    ) {
      videoFilePath = await compressVideo(videoFilePath, videoCompression);
    }
  } catch (e) {
    console.warn(e.message);
    return null;
  }

  return {
    name: fileName,
    type: 'video/mp4',
    content: await fsPromises.readFile(videoFilePath, { encoding: 'base64' }),
  };
};

module.exports = {
  getScreenshotAttachment,
  getVideoFile,
  waitForVideoFile,
  getFilePathByGlobPattern,
  checkVideoFileReady,
  compressVideo,
};
