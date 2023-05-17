/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2020 Mickael Jeanroy
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

/**
 * This module is used as a wrapper for NPM commands.
 * Each functions will returned a promise:
 *  - Resolved with the desired result.
 *  - Rejected with the error returned from NPM.
 */
var semver = require('semver');
var _require = require('child_process'),
  execSync = _require.execSync;

/**
 * Get the relative path to version specific npm tools
 *
 * @return {string} The relative path to version specific npm tools
 */
function _getRequirePath() {
  var version = execSync('npm -v').toString();
  if (semver.lt(version, '8.0.0')) {
    return './npm/';
  }
  return './npm8_plus/';
}
module.exports = {
  get: function get() {
    return require(_getRequirePath() + '/npm-utils');
  },
  getCache: function getCache() {
    return require(_getRequirePath() + '/cache');
  },
  getConfig: function getConfig() {
    return require(_getRequirePath() + '/_config');
  },
  getLoad: function getLoad() {
    return require(_getRequirePath() + '/_load');
  },
  getVersions: function getVersions() {
    return require(_getRequirePath() + '/versions');
  }
};