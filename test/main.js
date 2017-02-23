'use strict';

var compile = require('../').compile;
var extract = require('../').extract;
var gutil = require('gulp-util');
var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');
var PO = require('pofile');

var fixturesDir = path.join(__dirname, 'fixtures');
var anotherDir = path.join(__dirname, 'another');

var createFixtureFile = function (filename, content) {
  return new gutil.File({
    cwd: __dirname,
    base: fixturesDir,
    path: path.join(fixturesDir, filename),
    contents: new Buffer(content)
  });
};

describe('gulp-angular-gettext', function () {
  describe('extract()', function () {

    it('should work with no arguments', function (done) {
      var partial = createFixtureFile('partial.html', '<div translate>Hello</div><div translate>Goodbye</div>');

      var stream = extract();
      stream.on('error', done);
      stream.on('data', function (file) {
        expect(file.path).to.equal(path.join(fixturesDir, 'partial.pot'));

        PO.load(path.join(fixturesDir, 'test.pot'), function (err, expected) {
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

    it('should work with just a string argument', function (done) {
      var partial = createFixtureFile('partial.html', '<div translate>Hello</div><div translate>Goodbye</div>');

      var stream = extract('foo.bar');
      stream.on('error', done);
      stream.on('data', function (file) {
        expect(file.path).to.equal(path.join(fixturesDir, 'foo.bar'));

        PO.load(path.join(fixturesDir, 'test.pot'), function (err, expected) {
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

    it('should work with just an object argument', function (done) {
      var partial = createFixtureFile('partial.html', '<div translate>Hello</div><div translate>Goodbye</div>');

      var stream = extract();
      stream.on('error', done);
      stream.on('data', function (file) {
        expect(file.path).to.equal(path.join(fixturesDir, 'partial.pot'));

        PO.load(path.join(fixturesDir, 'test.pot'), function (err, expected) {
          if (err) {
            done(err);
            return;
          }
          var actual = PO.parse(file.contents.toString());
          expect(actual).to.deep.equal(expected);

          done();
        });
      });

      stream.write(partial);
      stream.end();
    });

    it('should work with a single input file', function (done) {
      var partial = createFixtureFile('partial.html', '<div translate>Hello</div><div translate>Goodbye</div>');

      var stream = extract();
      stream.on('error', done);
      stream.on('data', function (file) {
        expect(file.isNull()).to.be.false;

        fs.readFile(path.join(fixturesDir, 'test.pot'), {encoding: 'utf8'}, function (err, pot) {
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
      var partial1 = createFixtureFile('partial1.html', '<div translate>Hello</div>');
      var partial2 = createFixtureFile('partial2.html', '<div translate>world</div>');

      var stream = extract('out.pot');
      stream.on('error', done);
      stream.on('data', function (file) {
        expect(file.isNull()).to.be.false;

        fs.readFile(path.join(fixturesDir, 'multiple.pot'), {encoding: 'utf8'}, function (err, pot) {
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

    it('should support relative paths properly', function (done) {
      var partial1 = new gutil.File({
        cwd: __dirname,
        base: anotherDir,
        path: path.join(fixturesDir, 'partial1.html'),
        contents: new Buffer('<div translate>Hello</div>')
      });
      var partial2 = new gutil.File({
        cwd: __dirname,
        base: anotherDir,
        path: path.join(fixturesDir, 'partial2.html'),
        contents: new Buffer('<div translate>world</div>')
      });

      var stream = extract('out.pot');
      stream.on('error', done);
      stream.on('data', function (file) {
        expect(file.isNull()).to.be.false;

        fs.readFile(path.join(fixturesDir, 'relative.pot'), {encoding: 'utf8'}, function (err, pot) {
          if (err) {
            done(err);
            return;
          }

          if (process.platform === 'win32') {
            // Replace Unix path separators (i.e. '/') with Windows path separators (i.e. '\\') in pot fixture
            pot = pot.split('\n').map(function (line) {
              return /^#: /.test(line) ? line.replace(/\//g, '\\') : line;
            }).join('\n');
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
      var partial1 = createFixtureFile('partial1.html', '<div translate>Hello</div><div translate>Hello</div>');
      var partial2 = createFixtureFile('partial2.html', '<div translate>Hello</div><div translate>world</div>');

      var stream = extract('out.pot');
      stream.on('error', done);
      stream.on('data', function (file) {
        fs.readFile(path.join(fixturesDir, 'merge-duplicates.pot'), {encoding: 'utf8'}, function (err, pot) {
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
      var partial1 = createFixtureFile('partial1.html', '<div translate translate-n="count" translate-plural="Birds">Bird</div>');

      var stream = extract('out.pot');
      stream.on('error', done);
      stream.on('data', function (file) {
        fs.readFile(path.join(fixturesDir, 'plural.pot'), {encoding: 'utf8'}, function (err, pot) {
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
      var partial1 = createFixtureFile('partial1.html',
        '<div translate translate-n="count" translate-plural="Birds">Bird</div><div translate>Bird</div>');

      var stream = extract('out.pot');
      stream.on('error', done);
      stream.on('data', function (file) {
        fs.readFile(path.join(fixturesDir, 'plural.pot'), {encoding: 'utf8'}, function (err, pot) {
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
    it('should match es.po', function (done) {
      fs.readFile(path.join(fixturesDir, 'es.po'), function (err, esPo) {
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
          expect(path.extname(file.path)).to.equal('.json');
          expect(file.contents.toString()).to.equal(JSON.stringify({
            es: {
              'Hello world': '¡Hola, mundo',
              Goodbye: 'Adios'
            }
          }));

          done();
        });
        stream.write(createFixtureFile('es.po', esPo));
        stream.end();
      });
    });

    // I prefer JSON, but JS is angular-gettext-tool's default
    it('should default to javascript', function (done) {
      fs.readFile(path.join(fixturesDir, 'es.po'), function (err, esPo) {
        if (err) {
          done(err);
          return;
        }
        var stream = compile();
        stream.on('error', done);
        stream.on('data', function (file) {
          expect(path.extname(file.path)).to.equal('.js');

          done();
        });
        stream.write(createFixtureFile('es.po', esPo));
        stream.end();
      });
    });
  });
});
