
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
