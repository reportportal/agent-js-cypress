/*
 * IPC server is used to communicate between ReportPortal plugin for Cypress and ReportPortal reporter
 * Plugin inits IPC client that send events to the reporter when processing custom ReportPortal commands
 * Reporter creates IPC server that recived info from the plugin.
 */

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
