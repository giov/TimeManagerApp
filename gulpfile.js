// Include gulp
var gulp = require('gulp'); 

// Include our plugins
// CSS tasks
var less = require('gulp-less');
var minifyCss = require('gulp-minify-css');
var prefixCss = require('gulp-autoprefixer');
// JS tasks
var uglifyJs = require('gulp-uglify');
// Various tasks
var rename = require('gulp-rename');
var liveReload = require('gulp-livereload');


// Compile LESS
gulp.task('less', function() {
    return gulp.src('src/less/*.less')
        .pipe(less())
        .pipe(prefixCss())
        .pipe(minifyCss())
        .pipe(rename('style.css'))
        .pipe(gulp.dest('src/css'));
});

// Concatenate JS
gulp.task('scripts', function() {
    return gulp.src('src/js/*.js')
        .pipe(uglifyJs())
        .pipe(rename('main.min.js'))
        .pipe(gulp.dest('src/js'));
});

// Watch Files For Changes
gulp.task('watch', function() {

    console.log("watching ...");

    // Livereload
    var liveServer = liveReload();

    gulp.watch('src/js/*.js', ['scripts'])
    .on('change', function(event){
        liveServer.changed(event.path);
        console.log('Reloading for JS');
    });

    gulp.watch('src/less/*.less', ['less'])
    .on('change', function(event){
        liveServer.changed(event.path);
        console.log('Reloading for CSS');
    });

    gulp.watch('*.html')
    .on('change', function(event){
        liveServer.changed(event.path);
        console.log('Reloading for HTML');
    });
    // gulp.watch('project/*.html', ['re']);
});

// Default Task
gulp.task('default', ['less', 'scripts', 'watch']);