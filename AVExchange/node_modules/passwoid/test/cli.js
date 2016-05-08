// Copyright 2015, 2016 Mark Cornick
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/* eslint-env mocha */

'use strict';

var chai = require('chai');
var stream = require('mock-utf8-stream');
var cli = require('../lib/cli');

describe('passwoid', function () {
  it('default length', function () {
    var stdout = new stream.MockWritableStream();
    stdout.startCapture();
    cli({argv: ['node', 'bin.js'], stdout: stdout});
    chai.expect(
      stdout.capturedData.trim().length
    ).to.equal(16);
  });

  it('specific length', function () {
    var stdout = new stream.MockWritableStream();
    stdout.startCapture();
    cli({argv: ['node', 'bin.js', 8], stdout: stdout});
    chai.expect(
      stdout.capturedData.trim().length
    ).to.equal(8);
  });

  it('bogus length', function () {
    var stdout = new stream.MockWritableStream();
    stdout.startCapture();
    cli({argv: ['node', 'bin.js', 'pants'], stdout: stdout});
    chai.expect(
      stdout.capturedData.trim().length
    ).to.equal(16);
  });

  it('length too short', function () {
    var stdout = new stream.MockWritableStream();
    stdout.startCapture();
    chai.expect(function () {
      cli({argv: ['node', 'bin.js', 1], stdout: stdout});
    }).to.throw('Cannot generate password of length 1');
  });
});
