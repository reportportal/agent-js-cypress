const { getCodeRef } = require('../../lib/utils/common');

describe('common utils', () => {
  describe('getCodeRef', () => {
    it('should return correct code ref for Windows paths', () => {
      jest.mock('path', () => ({
        sep: '\\',
      }));
      const file = `test\\example.spec.js`;
      const titlePath = ['rootDescribe', 'parentDescribe', 'testTitle'];

      const expectedCodeRef = `test/example.spec.js/rootDescribe/parentDescribe/testTitle`;

      const codeRef = getCodeRef(titlePath, file);

      expect(codeRef).toEqual(expectedCodeRef);

      jest.clearAllMocks();
    });

    it('should return correct code ref for POSIX paths', () => {
      jest.mock('path', () => ({
        sep: '/',
      }));
      const file = `test/example.spec.js`;
      const titlePath = ['rootDescribe', 'parentDescribe', 'testTitle'];

      const expectedCodeRef = `test/example.spec.js/rootDescribe/parentDescribe/testTitle`;

      const codeRef = getCodeRef(titlePath, file);

      expect(codeRef).toEqual(expectedCodeRef);

      jest.clearAllMocks();
    });
  });
});
