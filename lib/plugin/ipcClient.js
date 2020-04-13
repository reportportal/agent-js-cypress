const ipc = require('node-ipc');

const connectIPCClient = () => {
  ipc.config.id = 'reportPortalReporter';
  ipc.config.retry = 1500;
  ipc.config.silent = true;

  ipc.connectTo('reportportal', () => {
    ipc.of.reportportal.on('connect', () => {
      ipc.log('***connected to reportportal***');
    });
    ipc.of.reportportal.on('disconnect', () => {
      ipc.log('disconnected from reportportal');
    });
  });
};

module.exports = { connectIPCClient };
