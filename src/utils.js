const fs = require('fs');
const glob = require('glob');

const base64Encode = (file) => {
  const bitmap = fs.readFileSync(file);

  return Buffer.from(bitmap).toString('base64');
};

const getPassedScreenshots = (testTitle) => {
  const pattern = `**/*${testTitle}.png`;
  const files = glob.sync(pattern);
  return (files || []).map((file, index) => ({
    name: `${testTitle}-${index + 1}`,
    type: 'image/png',
    content: base64Encode(file),
  }));
};

const getFailedScreenshot = (testTitle) => {
  const pattern = `**/*${testTitle} (failed).png`;
  const files = glob.sync(pattern);
  return files.length
    ? {
        name: `${testTitle} (failed)`,
        type: 'image/png',
        content: base64Encode(files[0]),
      }
    : undefined;
};

module.exports = {
  getFailedScreenshot,
  getPassedScreenshots,
};
