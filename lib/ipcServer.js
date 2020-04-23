/*
 * IPC server is used to communicate between ReportPortal plugin for Cypress and ReportPortal reporter
 * Plugin inits IPC client that send events to the reporter when processing custom ReportPortal commands
 * Reporter creates IPC server that recived info from the plugin.
 */
const ipc = require('node-ipc');

const startIPCServer = (subscribeServerEvents) => {
  if (ipc.server) {
    subscribeServerEvents(ipc.server);
    return;
  }
  ipc.config.id = 'reportportal';
  ipc.config.retry = 1500;
  ipc.config.silent = true;

  ipc.serve(() => {
    ipc.server.on('socket.disconnected', (socket, destroyedSocketID) => {
      ipc.log(`client ${destroyedSocketID} has disconnected!`);
    });
    ipc.server.on('destroy', () => {
      ipc.log('server destroyed');
    });
    subscribeServerEvents(ipc.server);
    process.on('exit', () => {
      ipc.server.stop();
    });
  });
  ipc.server.start();
};

module.exports = { startIPCServer };
