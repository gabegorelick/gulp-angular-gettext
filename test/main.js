'use strict';
/*jshint expr: true */

var compile = require('../').compile;
var extract = require('../').extract;
var gutil = require('gulp-util');
var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');



describe('gulp-angular-gettext', function () {
  describe('extract()', function () {
    var createFile = function (contents) {
      var base = path.normalize(__dirname + '/fixtures');
      return new gutil.File({
        path: path.join(base, 'partial.html'),
        base: base,
        cwd: __dirname,
        contents: contents
      });
    };

    it('should match angular-gettext output', function (done) {
      fs.readFile(__dirname + '/fixtures/partial.html', function (err, partial) {
        if (err) {
          done(err);
          return;
        }

        extract({
          postProcess: function (po) {
            po.items.forEach(function (item) {
              item.references = item.references.map(function (ref) {
                return path.relative(path.join(__dirname, 'fixtures'), ref)
                  .replace(/\\/g, '/'); // replace any Windows-style paths
              });
            });
          }
        })
          .on('error', done)
          .on('data', function (file) {
            expect(file.isNull()).to.be.false;

            fs.readFile(__dirname + '/fixtures/test.pot', {encoding: 'utf8'}, function (err, pot) {
              if (err) {
                done(err);
                return;
              }

              expect(file.contents.toString()).to.equal(pot);

              done();
            });
          })
          .write(createFile(partial));
      });
    });
  });

  describe('compile()', function () {
    var createFile = function (contents) {
      var base = path.normalize(__dirname + '/fixtures');
      return new gutil.File({
        path: path.join(base, 'es.po'),
        base: base,
        cwd: __dirname,
        contents: contents
      });
    };

    it('should match es.po', function (done) {
      fs.readFile(__dirname + '/fixtures/es.po', function (err, esPo) {
        if (err) {
          done(err);
          return;
        }
        compile({
          format: 'json'
        })
          .on('error', done)
          .on('data', function (file) {
            expect(file.isNull()).to.be.false;
            expect(file.contents.toString()).to.equal(JSON.stringify({
              es: {
                'Hello world': '¡Hola, mundo',
                'Goodbye': 'Adios'
              }
            }));

            done();
          })
          .write(createFile(esPo));
      });
    });
  });
});
