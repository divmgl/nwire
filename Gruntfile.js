module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({
    mochaTest: {
      test: {
        src: ['test/**/*.js']
      }
    },
    watch: {
      test: {
        files: ['test/**/*.js'],
        tasks: ['mochaTest']
      }
    }
  });

  grunt.registerTask('testing', ['mochaTest', 'watch:test']);
  grunt.registerTask('test', ['mochaTest']);
}