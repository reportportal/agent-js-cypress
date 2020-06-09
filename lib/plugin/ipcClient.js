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
 * Reporter creates IPC server that recived info from the plugin.
 */

const ipc = require('node-ipc');
const { IPC_EVENTS } = require('./../ipcEvents');

const connectIPCClient = (config) => {
  ipc.config.id = 'reportPortalReporter';
  ipc.config.retry = 1500;
  ipc.config.silent = true;

  ipc.connectTo('reportportal', () => {
    ipc.of.reportportal.on('connect', () => {
      ipc.log('***connected to reportportal***');
      ipc.of.reportportal.emit(IPC_EVENTS.CONFIG, config);
    });
    ipc.of.reportportal.on('disconnect', () => {
      ipc.log('disconnected from reportportal');
    });
  });
};

module.exports = { connectIPCClient };
