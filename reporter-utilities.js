const fs = require('fs')
const glob = require('glob')

const { entityType } = require('./constants');


const promiseErrorHandler = (promise) => {
    promise.catch(err => {
      console.error(err);
    });
};

const base64_encode = (file) => {
    var bitmap = fs.readFileSync(file);
    return new Buffer(bitmap).toString('base64');
};

const getBase64FileObject = (testTitle) => {
  let pattern = `${__dirname}/../cypress/screenshots/*/* -- ${testTitle}*.png`;
  let files = glob.sync(pattern)
  let image = base64_encode(files[0]);
  
  return { 
    name: "Screenshot", 
    type: "image/png", 
    content: image 
  }
}

const getStartLaunchObject = (reporterOptions) => {
  return {
      name: reporterOptions.launch,
      start_time: new Date().valueOf(),
      description: reporterOptions.description,
  }
}

const getSuiteStartObject = (suite) => {
  const suiteStartObj = { type: entityType.SUITE, name: suite.title.slice(0, 255).toString() };
  if (suite.tags && suite.tags.length > 0) {
      suiteStartObj.tags = suite.tags.map(tag => tag.name);
  }

  if (suite.description) {
      suiteStartObj.description = suite.description;
  }
  return suiteStartObj
}

const getTestStartObject = (testTitle) => {
  return { 
    type: entityType.TEST, 
    name: testTitle.slice(0, 255).toString() 
  };
}

module.exports = { 
  getBase64FileObject,
  getStartLaunchObject, 
  getSuiteStartObject, 
  getTestStartObject,
  promiseErrorHandler
}