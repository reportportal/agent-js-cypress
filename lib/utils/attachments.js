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

const fsPromises = fs.promises;

const DEFAULT_WAIT_FOR_FILE_TIMEOUT = 10000;
const DEFAULT_WAIT_FOR_FILE_INTERVAL = 500;

const base64Encode = async (filePath) => {
  const bitmap = await fsPromises.readFile(filePath);
  return Buffer.from(bitmap).toString('base64');
};

const getScreenshotAttachment = async (absolutePath) => {
  if (!absolutePath) return absolutePath;
  const name = absolutePath.split(path.sep).pop();
  return {
    name,
    type: 'image/png',
    content: await base64Encode(absolutePath),
  };
};

const waitForFile = (
  globFilePattern,
  timeout = DEFAULT_WAIT_FOR_FILE_TIMEOUT,
  interval = DEFAULT_WAIT_FOR_FILE_INTERVAL,
) =>
  new Promise((resolve, reject) => {
    let totalTime = 0;

    async function checkFileExistence() {
      const files = await glob(globFilePattern);

      if (files.length) {
        resolve(files[0]);
      } else if (totalTime >= timeout) {
        reject(new Error(`Timeout of ${timeout}ms reached, file ${globFilePattern} not found.`));
      } else {
        totalTime += interval;
        setTimeout(checkFileExistence, interval);
      }
    }

    checkFileExistence().catch(reject);
  });

const getVideoFile = async (
  specFileName,
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
    videoFilePath = await waitForFile(globFilePath, timeout, interval);
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
  waitForFile,
};
