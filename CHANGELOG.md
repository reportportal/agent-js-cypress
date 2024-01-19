### Changed
- **Breaking change** Drop support of Node.js 10. The version [5.1.5](https://github.com/reportportal/agent-js-cypress/releases/tag/v5.1.5) is the latest that supports it.
- `@reportportal/client-javascript` bumped to version `5.1.0`.

## [5.1.5] - 2024-01-19
### Deprecated
- Node.js 10 usage. This version is the latest that supports Node.js 10.

## [5.1.4] - 2023-10-23
### Fixed
- `launchId` option is not recognized - resolves [#171](https://github.com/reportportal/agent-js-cypress/issues/171).
### Changed
- `@reportportal/client-javascript` bumped to version `5.0.14`. `launchUuidPrint` and `launchUuidPrintOutput` configuration options introduced.

## [5.1.3] - 2023-07-18
### Added
- TypeScript declarations for `reportPortalCommands`. Thanks to [thomaswinkler](https://github.com/thomaswinkler).
### Changed
- `token` configuration option was renamed to `apiKey` to maintain common convention.
- `@reportportal/client-javascript` bumped to version `5.0.12`.

## [5.1.2] - 2023-02-27
### Fixed
- Screenshots are missing in some cases. The mechanism for attaching screenshots has been completely rewritten. Thanks to [thomaswinkler](https://github.com/thomaswinkler).
- Unhandled promise rejections while sending logs. Thanks to [Nigui](https://github.com/Nigui).
### Security
- Updated versions of vulnerable packages (minimatch, nanoid, jsdom, json5, node-notifier).

## [5.1.1] - 2023-01-24
### Added
- `mergeOptions` parameter to `mergeLaunches`.
### Fixed
- Pending Cypress tests are now marked as skipped in the ReportPortal and finishes correctly. Thanks to [thomaswinkler](https://github.com/thomaswinkler).
- `mode` option proper handling. Thanks to [thomaswinkler](https://github.com/thomaswinkler).
### Updated
- `@reportportal/client-javascript` bumped to version `5.0.8`.
### Security
- Updated versions of vulnerable packages (qs, minimatch, decode-uri-component).

## [5.1.0] - 2022-09-22
### Added
- Cypress 10.x versions support (closes [116](https://github.com/reportportal/agent-js-cypress/issues/116) and [115](https://github.com/reportportal/agent-js-cypress/issues/115)). Thanks to [orgads](https://github.com/orgads) and [dwentland24](https://github.com/dwentland24).
- The Readme file and examples in [examples repository](https://github.com/reportportal/examples-js) have been updated accordingly.
### Security
- Updated version of vulnerable `ansi-regex` package.

## [5.0.4] - 2022-07-12
### Fixed
- 'Error: cannot read property toString of undefined' for _log_ command.
- Vulnerabilities (minimist, follow-redirects).

## [5.0.3] - 2022-01-27
### Fixed
- [#76](https://github.com/reportportal/agent-js-cypress/issues/76) Custom screenshot command doesn't wait for image to be taken.
- [95](https://github.com/reportportal/agent-js-cypress/issues/95) and [97](https://github.com/reportportal/agent-js-cypress/issues/97) with 9.* cypress versions support.
### Changed
- Package size reduced

## [5.0.2] - 2021-05-18
### Added
- [#65](https://github.com/reportportal/agent-js-cypress/issues/65) Merge launches for parallel run.
### Fixed
- Vulnerabilities (axios, acorn, ini, y18n, hosted-git-info).

## [5.0.1] - 2020-06-30
### Fixed
- [#53](https://github.com/reportportal/agent-js-cypress/issues/53) Fix merge launches for `isLaunchMergeRequired` option.

## [5.0.0] - 2020-06-22
### Added
- Full compatibility with ReportPortal version 5.* (see [reportportal releases](https://github.com/reportportal/reportportal/releases))
- Cypress plugin to extend the functionality of the reporter (see [ReportPortal custom commands](https://github.com/reportportal/agent-js-cypress#reportportal-custom-commands))
### Deprecated
- Previous package version [agent-js-cypress](https://www.npmjs.com/package/agent-js-cypress) will no longer supported by reportportal.io
