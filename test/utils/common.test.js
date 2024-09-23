/*
 *  Copyright 2024 EPAM Systems
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
