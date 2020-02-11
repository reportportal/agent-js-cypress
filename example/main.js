const cypress = require('cypress');
const RPClient = require('reportportal-client');
const fs = require('fs');
const glob = require('glob');

const cypressConfigFile = 'cypress.json';

const getLaunchTempFiles = () => {
  return glob.sync('rplaunch-*.tmp');
};

const deleteTempFile = (filename) => {
  fs.unlinkSync(filename);
};

cypress.run().then(
  () => {
    fs.readFile(cypressConfigFile, 'utf8', (err, data) => {
      if (err) {
        throw err;
      }

      const config = JSON.parse(data);

      if (config.reporterOptions.isLaunchMergeRequired) {
        const client = new RPClient(config.reporterOptions);
        client.mergeLaunches();
        const files = getLaunchTempFiles();
        files.map(deleteTempFile);
      }
    });
    process.exit(0);
  },
  (error) => {
    console.error(error);
    const files = getLaunchTempFiles();
    files.map(deleteTempFile);
    process.exit(1);
  },
);
