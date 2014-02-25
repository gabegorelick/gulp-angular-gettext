# [gulp](http://gulpjs.com)-angular-gettext

> Extract/compile translatable strings using [angular-gettext](http://angular-gettext.rocketeer.be)

## Install

Install with [npm](https://npmjs.org/package/gulp-angular-gettext)

```
npm install --save-dev gulp-angular-gettext
```

## Examples

```
var gulp = require('gulp');
var gettext = require('gulp-angular-gettext');

gulp.task('pot', function () {
    return gulp.src(['src/partials/**/*.html', 'src/scripts/**/*.js'])
        .pipe(gettext.extract())
        .pipe(gulp.dest('po/'));
});

gulp.task('translations', function () {
	return gulp.src('po/**/*.po')
		.pipe(gettext.compile({
		    format: 'json'
        }))
		.pipe(gulp.dest('dist/translations/'));
});
```
