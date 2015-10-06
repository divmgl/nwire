var gulp = require('gulp');
var mocha = require('gulp-mocha');
var plumber = require('gulp-plumber');
var gutil = require('gulp-util');

gulp.task('test', function() {
  gulp.src(['tests/**/*.js', '!tests/fixtures/**/*'])
    .pipe(plumber())
    .pipe(mocha({ reporter: 'spec'})
      .on('error', gutil.log));
});

gulp.task('watch:test', function(){
  gulp.watch(['index.js', "tests/**/*"], ["test"]);
});
