const fs = require("fs");
const glob = require("glob");

const base64_encode = file => {
  var bitmap = fs.readFileSync(file);

  return new Buffer.from(bitmap).toString("base64");
};

const getBase64FileObject = testTitle => {
  let pattern = `**/*${testTitle}*.png`,
    files = glob.sync(pattern),
    image = base64_encode(files[0]);

  return {
    name: "Screenshot",
    type: "image/png",
    content: image
  };
};

module.exports = {
  getBase64FileObject,
};
