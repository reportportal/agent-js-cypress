const fs = require('fs'),
    glob = require('glob'),

    { entityType } = require('./constants');


const promiseErrorHandler = promise => {
        promise.catch(err => {
            console.error(err);
        });
    },

    base64_encode = file => {
        var bitmap = fs.readFileSync(file);

        return new Buffer.from(bitmap).toString('base64');
    },

    getBase64FileObject = testTitle => {
        let pattern = `**/*${testTitle}*.png`,
            files = glob.sync(pattern),
            image = base64_encode(files[0]);

        return {
            name: 'Screenshot',
            type: 'image/png',
            content: image
        };
    },

    getStartLaunchObject = reporterOptions => ({
        name: reporterOptions.launch,
        start_time: new Date().valueOf(),
        description: reporterOptions.description
    }),

    getSuiteStartObject = suite => {
        const suiteStartObj = { type: entityType.SUITE, name: suite.title.slice(0, 255).toString() };

        if (suite.tags && suite.tags.length > 0) {
            suiteStartObj.tags = suite.tags.map(tag => tag.name);
        }

        if (suite.description) {
            suiteStartObj.description = suite.description;
        }

        return suiteStartObj;
    },

    getTestStartObject = testTitle => ({
        type: entityType.TEST,
        name: testTitle.slice(0, 255).toString()
    });

module.exports = {
    getBase64FileObject,
    getStartLaunchObject,
    getSuiteStartObject,
    getTestStartObject,
    promiseErrorHandler
};
