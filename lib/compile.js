'use strict';

var Compiler = require('angular-gettext-tools').Compiler;
var gutil = require('gulp-util');
var through = require('through2');
var path = require('path');

var pluginName = require('../package.json').name;

module.exports = function (options) {
  return through.obj(function (file, enc, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.isStream()) {
      this.emit('error', new gutil.PluginError(pluginName, 'Streaming not supported'));
      return cb();
    }

    var compiler = new Compiler(options);
    var contents = compiler.convertPo([file.contents.toString()]);
    file.contents = new Buffer(contents);

    var dirname = path.dirname(file.path);
    var basename = path.basename(file.path, '.po');
    file.path = path.join(dirname, basename + '.json');

    this.push(file);
    cb();
  });
};
