const fs = require("fs");
const glob = require("glob");

const base64_encode = file => {
  const bitmap = fs.readFileSync(file);

  return new Buffer.from(bitmap).toString("base64");
};

const getBase64FileObject = testTitle => {
  const pattern = `**/*${testTitle}*.png`;
  const files = glob.sync(pattern);
  const image = base64_encode(files[0]);

  return {
    name: "Screenshot",
    type: "image/png",
    content: image
  };
};

module.exports = {
  getBase64FileObject,
};
