'use strict';

var Compiler = require('angular-gettext-tools').Compiler;
var gutil = require('gulp-util');
var through = require('through2');
var path = require('path');
var isString = require('lodash.isstring');

var pluginName = require('../package.json').name;

module.exports = function (out, options) {
  if (arguments.length === 1) {
    if (!isString(out)) {
      // out is optional
      options = arguments[0];
      out = null;
    }
  }

  var emitStreamingError = function () {
    this.emit('error', new gutil.PluginError(pluginName, 'Streaming not supported'));
  }.bind(this);

  if (!out) {
    return through.obj(function (file, enc, cb) {
      if (file.isNull()) {
        this.push(file);
        return cb();
      }

      if (file.isStream()) {
        emitStreamingError();
        return cb();
      }

      var compiler = new Compiler(options);
      var contents = compiler.convertPo([file.contents.toString()]);
      file.contents = new Buffer(contents);

      var dirname = path.dirname(file.path);
      var basename = path.basename(file.path, '.po');
      var extension = options.format === 'json' ? '.json' : '.js';
      file.path = path.join(dirname, basename + extension);

      this.push(file);
      cb();
    });
  }

  // concatenate output, inspired by gulp-concat

  var firstFile = null,
      sources = [];

  var bufferContents = function (file, encoding, cb) {
    if (file.isNull()) {
      cb(); // ignore
      return;
    }

    if (file.isStream()) {
      emitStreamingError();
      cb();
      return;
    }

    if (!firstFile) {
      firstFile = file;
    }

    sources.push(file.contents.toString());

    cb();
  };

  var flush = function (cb) {
    var compiler = new Compiler(options);
    var contents = compiler.convertPo(sources);

    this.push(new gutil.File({
      // if you don't want to use the first file for the base directory, you can use gulp-rename to change it
      cwd: firstFile.cwd,
      base: firstFile.base,
      path: path.join(firstFile.base, out),
      contents: new Buffer(contents)
    }));

    cb();
  };

  return through.obj(bufferContents, flush);
};
