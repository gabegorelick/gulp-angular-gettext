'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');

gulp.task('jshint', function() {
  gulp.src(['*.js', './lib/*.js', './test/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('mocha', function () {
  gulp.src('test/*.js')
    .pipe(mocha());
});

gulp.task('default', ['jshint', 'mocha']);
