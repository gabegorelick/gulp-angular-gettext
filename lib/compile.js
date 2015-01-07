'use strict';

var Compiler = require('angular-gettext-tools').Compiler;
var gutil = require('gulp-util');
var through = require('through2');
var path = require('path');

var pluginName = require('../package.json').name;

module.exports = function (options) {
  options = options || {};

  function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }

  function compile(poFilesContent, destFile) {
    var compiler = new Compiler(options);
    var contents = compiler.convertPo(poFilesContent);
    destFile.contents = new Buffer(contents);

    var dirname = path.dirname(destFile.path);
    var basename = path.basename(destFile.path, '.po');
    var extension = options.format === 'json' ? '.json' : '.js';
    var filename = basename;
    if (path.extname(basename) !== extension) {
      filename += extension;
    }
    destFile.path = path.join(dirname, filename);
  }

  var emitStreamingError = function () {
    this.emit('error', new gutil.PluginError(pluginName, 'Streaming not supported'));
  }.bind(this);

  if (!options.out) {
    return through.obj(function (file, enc, cb) {
      if (file.isNull()) {
        this.push(file);
        return cb();
      }

      if (file.isStream()) {
        emitStreamingError();
        return cb();
      }

      compile([file.contents.toString()], file);

      this.push(file);
      cb();
    });
  }

  var poFilesContent = [];
  var firstFile;

  var bufferPoFiles = function(file, enc, cb) {
    // ignore empty files
    if (file.isNull()) {
      cb();
      return;
    }

    if (file.isStream()) {
      emitStreamingError();
      cb();
      return;
    }

    // set first file if not already set
    if (!firstFile) {
      firstFile = file;
    }

    // add file to poFiles list
    poFilesContent.push(file.contents.toString());
    cb();
  };

  var compilePoFiles = function(cb) {
    // no files passed in, no file goes out
    if (!firstFile) {
      cb();
      return;
    }

    var joinedFile;

    // if file opt was a file path
    // clone everything from the first file
    if (typeof options.out === 'string') {
      joinedFile = firstFile.clone({contents: false});
      joinedFile.path = path.join(firstFile.base, options.out);
    } else {
      joinedFile = firstFile;
    }

    compile(poFilesContent, joinedFile);

    this.push(joinedFile);
    cb();
  };

  return through.obj(bufferPoFiles, compilePoFiles);

};
