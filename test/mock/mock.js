class RPClient {
  constructor(config) {
    this.config = config;
    this.headers = {
      foo: 'bar',
    };
    this.startLaunch = jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
      tempId: 'tempLaunchId',
    });

    this.finishLaunch = jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
    });

    this.startTestItem = jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
      tempId: 'testItemId',
    });

    this.finishTestItem = jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
    });

    this.sendLog = jest.fn().mockReturnValue({
      promise: Promise.resolve('ok'),
    });
  }
}

const getDefaultConfig = () => ({
  reporter: '@kormachevt/agent-js-cypress',
  reporterOptions: {
    token: '00000000-0000-0000-0000-000000000000',
    endpoint: 'https://reportportal.server/api/v1',
    project: 'ProjectName',
    launch: 'LauncherName',
    description: 'Launch description',
    attributes: [],
  },
});

const currentDate = new Date().valueOf();
const RealDate = Date;

const MockedDate = (...attrs) =>
  attrs.length ? new RealDate(...attrs) : new RealDate(currentDate);

module.exports = {
  RPClient,
  getDefaultConfig,
  MockedDate,
  RealDate,
  currentDate,
};
