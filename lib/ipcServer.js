/*
 *  Copyright 2020 EPAM Systems
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

/*
 * IPC server is used to communicate between ReportPortal plugin for Cypress and ReportPortal reporter
 * Plugin inits IPC client that send events to the reporter when processing custom ReportPortal commands
 * Reporter creates IPC server that receives events from the plugin.
 */
const ipc = require('node-ipc');
const { DEFAULT_IPC_RETRY_INTERVAL } = require('./constants');

const startIPCServer = (
  subscribeServerEvents,
  unsubscribeServerEvents,
  { debugIpc, retryIpcInterval } = {
    debugIpc: false,
    retryIpcInterval: DEFAULT_IPC_RETRY_INTERVAL,
  },
) => {
  if (ipc.server) {
    unsubscribeServerEvents(ipc.server);
    subscribeServerEvents(ipc.server);
    return;
  }
  ipc.config.id = 'reportportal';
  ipc.config.retry = retryIpcInterval || DEFAULT_IPC_RETRY_INTERVAL;

  if (!debugIpc) {
    ipc.config.silent = true;
  }

  ipc.serve(() => {
    ipc.server.on('socket.disconnected', (socket, destroyedSocketID) => {
      ipc.log(`client ${destroyedSocketID} has disconnected!`);
    });
    ipc.server.on('destroy', () => {
      ipc.log('server destroyed');
    });
    subscribeServerEvents(ipc.server);
    process.on('exit', () => {
      unsubscribeServerEvents(ipc.server);
      ipc.server.stop();
    });
  });
  ipc.server.start();
};

module.exports = { startIPCServer };
