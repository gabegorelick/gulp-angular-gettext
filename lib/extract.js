'use strict';

var Extractor = require('angular-gettext-tools').Extractor;
var gutil = require('gulp-util');
var through = require('through2');
var path = require('path');
var assign = require('lodash.assign');

var pluginName = require('../package.json').name;

module.exports = function (out, config) {
  if (!config) {
    // out is optional
    config = arguments[0];
    out = null;
  }

  var emitStreamingError = function () {
    this.emit('error', new gutil.PluginError(pluginName, 'Streaming not supported'));
  }.bind(this);

  var getPoFromFile = function (file) {
    var extractor = new Extractor(config);
    extractor.parse(file.path, file.contents.toString());
    return extractor.toString();
  };

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

      console.log('writing contents');
      file.contents = new Buffer(getPoFromFile(file));

      this.push(file);
      cb();
    });
  }

  // concatenate output, inspired by gulp-concat

  var buffer = []; // array of po strings
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
      buffer.push(getPoFromFile(file));
    } else {
      // remove duplicate preamble

      var removeHeaders = function (po) {
        po.headers = {};
      };
      var options = assign({
        postProcess: removeHeaders
      }, config);

      if (config.postProcess) {
        // chain transform functions
        options.postProcess = function (po) {
          removeHeaders(po); // call our function first so client can override
          config.postProcess(po);
        };
      }

      var extractor = new Extractor(options);
      extractor.parse(file.path, file.contents.toString());
      var contents = extractor.toString().replace(/^msgid\s+""\s+msgstr\s+""\s+/, '');

      buffer.push(contents);
    }

    cb();
  };

  var flush = function (cb) {
    if (buffer.length === 0) {
      cb();
      return;
    }

    this.push(new gutil.File({
      // if you don't want to use the first file for the base directory, you can use gulp-rename to change it
      cwd: firstFile.cwd,
      base: firstFile.base,
      path: path.join(firstFile.base, out),
      contents: new Buffer(buffer.join('\n'))
    }));

    cb();
  };

  return through.obj(bufferContents, flush);
};
