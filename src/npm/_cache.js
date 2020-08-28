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

const path = require('path');
const requireg = require('requireg');
const npm = requireg('npm');
const Q = require('q');
const semver = require('semver');
const load = require('./_load');

/**
 * Executes `npm cache-add` command with passed arguments.
 * Arguments is the name of the cache to download.
 * So if cmd command was `npm cache-add bower@1.7.7 versions`, then argument
 * would be `['bower@1.7.7', 'versions']`.
 *
 * The returned promise will be resolved with the result of the cache command (i.e
 * object with all informations about the package).
 *
 * @param {Array} pkg THe package to download.
 * @return {Promise} The promise object
 */
function cache(pkg) {
  return load().then((meta) => (
    runCache(pkg, meta)
  ));
}

/**
 * Run `npm cache` command.
 *
 * @param {Array} pkg The package to download.
 * @param {Object} meta NPM metadata.
 * @return {Promise} The promise resolved with command result.
 */
function runCache(pkg, meta) {
  if (semver.lt(meta.version, '5.0.0')) {
    return oldNpmCache(pkg);
  } else {
    return newNpmCache(pkg);
  }
}

/**
 * Run npm cache command and resolve the deferred object with the returned
 * metadata.
 *
 * @param {string} pkg NPM Package id (i.e `bower@1.8.0`).
 * @return {void}
 */
function oldNpmCache(pkg) {
  return Q.Promise((resolve, reject) => {
    npm.commands.cache(['add', pkg], (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          cache: npm.cache,
          name: data.name,
          version: data.version,
          path: path.resolve(npm.cache, data.name, data.version, 'package.tgz'),
          integrity: null,
        });
      }
    });
  });
}

/**
 * Run npm cache command and resolve the deferred object with the returned
 * metadata.
 *
 * @param {string} pkg NPM Package id (i.e `bower@1.8.0`).
 * @return {void}
 */
function newNpmCache(pkg) {
  const promise = Q.promise((resolve, reject) => {
    npm.commands.cache(['add', pkg], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  return promise
      .then((info) => info ? info : getManifest(pkg))
      .then((info) => ({
        cache: path.join(npm.cache, '_cacache'),
        name: info.manifest.name,
        version: info.manifest.version,
        integrity: info.integrity,
        path: null,
      }));
}

/**
 * Fetch package manifest using `pacote` dependency.
 * With npm < 5.6.0, the manifest object was automatically returned by
 * the `cache.add` command. This function is here to deal with npm >= 5.6.0
 * to get the `integrity` checksum used to download the tarball using `cacache`.
 *
 * @param {string} pkg Package identifier.
 * @return {Promise<Object>} The manifest object.
 */
function getManifest(pkg) {
  // Use npm config to detect custom registry and user auth info
  const opts = {
    registry: npm.config.get('registry'),
  };

  // https://github.com/npm/npm/blob/latest/lib/config/pacote.js
  npm.config.keys.forEach(function(k) {
    opts[k] = npm.config.get(k);
  });

  return require('pacote').manifest(pkg, opts).then((pkgJson) => ({
    integrity: pkgJson._integrity,
    manifest: {
      name: pkgJson.name,
      version: pkgJson.version,
    },
  }));
}

cache(process.argv.slice(2).join(''))
    .then((result) => {
      process.send({result});
      process.exit(0);
    })
    .catch((err) => {
      process.send({err});
      process.exit(1);
    });
