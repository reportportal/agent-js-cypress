const fs = require('fs');
const glob = require('glob');

const base64Encode = (file) => {
  const bitmap = fs.readFileSync(file);

  return Buffer.from(bitmap).toString('base64');
};

const getBase64FileObject = (testTitle) => {
  const pattern = `**/*${testTitle}*.png`;
  const files = glob.sync(pattern);
  const image = base64Encode(files[0]);

  return {
    name: 'Screenshot',
    type: 'image/png',
    content: image,
  };
};

module.exports = {
  getBase64FileObject,
};
