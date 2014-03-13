'use strict';
/*jshint expr: true */

var compile = require('../').compile;
var extract = require('../').extract;
var gutil = require('gulp-util');
var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');
var PO = require('pofile');

var fixturesDir = __dirname + '/fixtures';

describe('gulp-angular-gettext', function () {
  describe('extract()', function () {

    it('should work with no arguments', function (done) {
      var partial = new gutil.File({
        cwd: __dirname,
        base: fixturesDir,
        path: fixturesDir + '/partial.html',
        contents: new Buffer('<div translate>Hello</div><div translate>Goodbye</div>')
      });

      var stream = extract();
      stream.on('error', done);
      stream.on('data', function (file) {
        expect(file.path).to.equal(fixturesDir + '/partial.pot');

        PO.load(__dirname + '/fixtures/test.pot', function (err, expected) {
          if (err) {
            done(err);
            return;
          }
          var actual = PO.parse(file.contents.toString());

          // clear file references that depend on abolute paths
          var actualItems = actual.items.map(function (i) {
            i.references = [];
          });
          var expectedItems = expected.items.map(function (i) {
            i.references = [];
          });

          expect(actualItems).to.deep.equal(expectedItems);

          done();
        });
      });

      stream.write(partial);
      stream.end();
    });

    var relativizeHeaders = function (po) {
      po.items.forEach(function (item) {
        item.references = item.references.map(function (ref) {
          return path.relative(path.join(__dirname, 'fixtures'), ref)
            .replace(/\\/g, '/'); // replace any Windows-style paths
        });
      });
    };

    it('should work with a single input file', function (done) {
      var partial = new gutil.File({
        cwd: __dirname,
        base: fixturesDir,
        path: fixturesDir + '/partial.html',
        contents: new Buffer('<div translate>Hello</div><div translate>Goodbye</div>')
      });

      var stream = extract({
        postProcess: relativizeHeaders
      });
      stream.on('error', done);
      stream.on('data', function (file) {
        expect(file.isNull()).to.be.false;

        fs.readFile(__dirname + '/fixtures/test.pot', {encoding: 'utf8'}, function (err, pot) {
          if (err) {
            done(err);
            return;
          }

          expect(file.contents.toString()).to.equal(pot);

          done();
        });
      });
      stream.write(partial);
      stream.end();
    });

    it('should work with multiple input files', function (done) {
      var partial1 = new gutil.File({
        cwd: __dirname,
        base: fixturesDir,
        path: fixturesDir + '/partial1.html',
        contents: new Buffer('<div translate>Hello</div>')
      });
      var partial2 = new gutil.File({
        cwd: __dirname,
        base: fixturesDir,
        path: fixturesDir + '/partial2.html',
        contents: new Buffer('<div translate>world</div>')
      });

      var stream = extract('out.pot', {
        postProcess: relativizeHeaders
      });
      stream.on('error', done);
      stream.on('data', function (file) {
        expect(file.isNull()).to.be.false;

        fs.readFile(__dirname + '/fixtures/multiple.pot', {encoding: 'utf8'}, function (err, pot) {
          if (err) {
            done(err);
            return;
          }

          expect(file.contents.toString()).to.equal(pot);

          done();
        });
      });
      stream.write(partial1);
      stream.write(partial2);
      stream.end();
    });

    it('should merge duplicate strings with references', function (done) {
      var partial1 = new gutil.File({
        cwd: __dirname,
        base: fixturesDir,
        path: fixturesDir + '/partial1.html',
        contents: new Buffer('<div translate>Hello</div><div translate>Hello</div>')
      });
      var partial2 = new gutil.File({
        cwd: __dirname,
        base: fixturesDir,
        path: fixturesDir + '/partial2.html',
        contents: new Buffer('<div translate>Hello</div><div translate>world</div>')
      });

      var stream = extract('out.pot', {
        postProcess: relativizeHeaders
      });
      stream.on('error', done);
      stream.on('data', function (file) {
        fs.readFile(__dirname + '/fixtures/merge-duplicates.pot', {encoding: 'utf8'}, function (err, pot) {
          if (err) {
            done(err);
            return;
          }

          expect(file.contents.toString()).to.equal(pot);

          done();
        });
      });
      stream.write(partial1);
      stream.write(partial2);
      stream.end();
    });

    it('should extract plural strings', function (done) {
      var partial1 = new gutil.File({
        cwd: __dirname,
        base: fixturesDir,
        path: fixturesDir + '/partial1.html',
        contents: new Buffer('<div translate translate-n="count" translate-plural="Birds">Bird</div>')
      });

      var stream = extract('out.pot', {
        postProcess: relativizeHeaders
      });
      stream.on('error', done);
      stream.on('data', function (file) {
        fs.readFile(__dirname + '/fixtures/plural.pot', {encoding: 'utf8'}, function (err, pot) {
          if (err) {
            done(err);
            return;
          }

          expect(file.contents.toString()).to.equal(pot);

          done();
        });
      });
      stream.write(partial1);
      stream.end();
    });

    it('should merge singular and plural strings', function (done) {
      var partial1 = new gutil.File({
        cwd: __dirname,
        base: fixturesDir,
        path: fixturesDir + '/partial1.html',
        contents: new Buffer('<div translate translate-n="count" translate-plural="Birds">Bird</div>' +
          '<div translate>Bird</div>')
      });

      var stream = extract('out.pot', {
        postProcess: relativizeHeaders
      });
      stream.on('error', done);
      stream.on('data', function (file) {
        fs.readFile(__dirname + '/fixtures/plural.pot', {encoding: 'utf8'}, function (err, pot) {
          if (err) {
            done(err);
            return;
          }

          expect(file.contents.toString()).to.equal(pot);

          done();
        });
      });
      stream.write(partial1);
      stream.end();
    });
  });

  describe('compile()', function () {
    var createFile = function (contents) {
      return new gutil.File({
        cwd: __dirname,
        base: fixturesDir,
        path: fixturesDir + '/es.po',
        contents: contents
      });
    };

    it('should match es.po', function (done) {
      fs.readFile(__dirname + '/fixtures/es.po', function (err, esPo) {
        if (err) {
          done(err);
          return;
        }
        var stream = compile({
          format: 'json'
        });
        stream.on('error', done);
        stream.on('data', function (file) {
          expect(file.isNull()).to.be.false;
          expect(file.contents.toString()).to.equal(JSON.stringify({
            es: {
              'Hello world': '¡Hola, mundo',
              'Goodbye': 'Adios'
            }
          }));

          done();
        });
        stream.write(createFile(esPo));
        stream.end();
      });
    });
  });
});
