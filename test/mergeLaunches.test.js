const mergeLaunches = require('./../lib/mergeLaunches');
const mergeLaunchesUtils = require('./../lib/mergeLaunchesUtils');

describe('mergeLaunches', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('no launches in progress: should call callClientMergeLaunches immediately', () => {
    jest.spyOn(mergeLaunchesUtils, 'isLaunchesInProgress').mockImplementation(() => false);
    const spyCallClientMergeLaunches = jest
      .spyOn(mergeLaunchesUtils, 'callClientMergeLaunches')
      .mockImplementation(() => {});
    const launch = 'foo-launchName';

    mergeLaunches.mergeLaunches({ launch });

    expect(spyCallClientMergeLaunches).toHaveBeenCalled();
  });

  it('launches will stop in 5 ms: should return promise', () => {
    jest.spyOn(mergeLaunchesUtils, 'isLaunchesInProgress').mockImplementation(() => true);

    setTimeout(() => {
      jest.spyOn(mergeLaunchesUtils, 'isLaunchesInProgress').mockImplementation(() => false);
    }, 1);

    const spyCallClientMergeLaunches = jest
      .spyOn(mergeLaunchesUtils, 'callClientMergeLaunches')
      .mockImplementation(() => Promise.resolve());
    const launch = 'foo-launchName';

    const promise = mergeLaunches.mergeLaunches({ launch });

    expect(spyCallClientMergeLaunches).not.toHaveBeenCalled();

    expect(promise.then).toBeDefined();

    return promise.then(() => expect(spyCallClientMergeLaunches).toHaveBeenCalled());
  });
});
