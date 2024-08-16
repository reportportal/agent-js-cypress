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

const glob = require('glob');
const path = require('path');
const minimatch = require('minimatch');

const getFixtureFolderPattern = (config) => {
  return [].concat(config.fixturesFolder ? path.join(config.fixturesFolder, '**', '*') : []);
};

const getExcludeSpecPattern = (config) => {
  // Return cypress >= 10 pattern.
  if (config.excludeSpecPattern) {
    const excludePattern = Array.isArray(config.excludeSpecPattern)
      ? config.excludeSpecPattern
      : [config.excludeSpecPattern];
    return [...excludePattern];
  }

  // Return cypress <= 9 pattern
  const ignoreTestFilesPattern = Array.isArray(config.ignoreTestFiles)
    ? config.ignoreTestFiles
    : [config.ignoreTestFiles] || [];

  return [...ignoreTestFilesPattern];
};

const getSpecPattern = (config) => {
  if (config.specPattern) return [].concat(config.specPattern);

  return Array.isArray(config.testFiles)
    ? config.testFiles.map((file) => path.join(config.integrationFolder, file))
    : [].concat(path.join(config.integrationFolder, config.testFiles));
};

const getTotalSpecs = (config) => {
  if (!config.testFiles && !config.specPattern)
    throw new Error('Configuration property not set! Neither for cypress <= 9 nor cypress >= 10');

  const specPattern = getSpecPattern(config);

  const excludeSpecPattern = getExcludeSpecPattern(config);

  const options = {
    sort: true,
    absolute: true,
    nodir: true,
    ignore: [config.supportFile].concat(getFixtureFolderPattern(config)),
  };

  const doesNotMatchAllIgnoredPatterns = (file) =>
    excludeSpecPattern.every(
      (pattern) => !minimatch(file, pattern, { dot: true, matchBase: true }),
    );

  const globResult = specPattern.reduce(
    (files, pattern) => files.concat(glob.sync(pattern, options) || []),
    [],
  );

  return globResult.filter(doesNotMatchAllIgnoredPatterns).length;
};

module.exports = {
  getTotalSpecs,
  getExcludeSpecPattern,
  getFixtureFolderPattern,
  getSpecPattern,
};
