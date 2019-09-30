'use strict';

var Extractor = require('angular-gettext-tools').Extractor;
var Vinyl = require('vinyl');
var PluginError = require('plugin-error');
var through = require('through2');
var path = require('path');

var pluginName = require('../package.json').name;

module.exports = function (out, config) {
  if (arguments.length === 1) {
    if (typeof out !== 'string') {
      // out is optional
      config = arguments[0];
      out = null;
    }
  }

  var emitStreamingError = function () {
    this.emit('error', new PluginError(pluginName, 'Streaming not supported'));
  }.bind(this);

  if (!out) {
    // return a standard gulp stream
    return through.obj(function (file, enc, cb) {
      if (file.isNull()) {
        this.push(file);
        return cb();
      }

      if (file.isStream()) {
        emitStreamingError();
        return cb();
      }

      var extractor = new Extractor(config);
      extractor.parse(file.relative, file.contents.toString());
      file.contents = Buffer.from(extractor.toString());

      var extension = path.extname(file.path);
      var extIndex = file.path.lastIndexOf(extension);
      file.path = file.path.substring(0, extIndex) + '.pot';

      this.push(file);
      cb();
    });
  }

  // concatenate output, inspired by gulp-concat
  var extractor = new Extractor(config);
  var firstFile = null;

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

    extractor.parse(file.relative, file.contents.toString());

    cb();
  };

  var flush = function (cb) {
    if (firstFile) {
      this.push(new Vinyl({
        // if you don't want to use the first file for the base directory, you can use gulp-rename to change it
        cwd: firstFile.cwd,
        base: firstFile.base,
        path: path.join(firstFile.base, out),
        contents: Buffer.from(extractor.toString())
      }));
    }

    cb();
  };

  return through.obj(bufferContents, flush);
};
