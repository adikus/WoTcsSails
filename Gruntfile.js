module.exports = function (grunt) {

    var timestamp = (new Date()).getTime();

    var jsFilesToInject = [

        'socket.io.js',
        'sails.io.js',
        'app.js',
        '**/*.js'
    ];
    jsFilesToInject = jsFilesToInject.map(function (path) {
        return '.tmp/public/'+timestamp+'/js/'+path;
    });

    var cssFilesToInject = [

        'bootstrap.css',
        '**/*.css'
    ];
    cssFilesToInject = cssFilesToInject.map(function (path) {
        return '.tmp/public/'+timestamp+'/styles/'+path;
    });

    var depsPath = grunt.option('gdsrc') || 'node_modules/sails/node_modules';
    grunt.loadTasks(depsPath + '/grunt-contrib-clean/tasks');
    grunt.loadTasks(depsPath + '/grunt-contrib-copy/tasks');
    grunt.loadTasks(depsPath + '/grunt-sails-linker/tasks');
    grunt.loadTasks(depsPath + '/grunt-contrib-less/tasks');
    grunt.loadTasks(depsPath + '/grunt-contrib-watch/tasks');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            dev: ['.tmp/public/**'],
            less: ['.tmp/public/'+timestamp+'/styles/bootstrap/**', '.tmp/public/'+timestamp+'/styles/*.less']
        },

        copy: {
            dev: {
                files: [{
                    expand: true,
                    cwd: './assets',
                    src: ['**/*','!linker','!linker/**/*'],
                    dest: '.tmp/public'
                },{
                    expand: true,
                    cwd: './assets/linker',
                    src: ['**/*'],
                    dest: '.tmp/public/'+timestamp
                }]
            }
        },

        'sails-linker': {

            devJs: {
                options: {
                    startTag: '<!--SCRIPTS-->',
                    endTag: '<!--SCRIPTS END-->',
                    fileTmpl: '<script src="%s"></script>',
                    appRoot: '.tmp/public'
                },
                files: {
                    '.tmp/public/**/*.html': jsFilesToInject,
                    'views/**/*.html': jsFilesToInject,
                    'views/**/*.ejs': jsFilesToInject
                }
            },
            devCss: {
                options: {
                    startTag: '<!--STYLES-->',
                    endTag: '<!--STYLES END-->',
                    fileTmpl: '<link rel="stylesheet" href="%s">',
                    appRoot: '.tmp/public'
                },
                files: {
                    '.tmp/public/**/*.html': cssFilesToInject,
                    'views/**/*.html': cssFilesToInject,
                    'views/**/*.ejs': cssFilesToInject
                }
            }
        },

        less: {
            dev: {
                files: [
                    {
                        expand: true,
                        cwd: '.tmp/public/'+timestamp+'/styles/bootstrap',
                        src: ['bootstrap.less'],
                        dest: '.tmp/public/'+timestamp+'/styles',
                        ext: '.css'
                    },
                    {
                        expand: true,
                        cwd: '.tmp/public/'+timestamp+'/styles',
                        src: ['*.less'],
                        dest: '.tmp/public/'+timestamp+'/styles',
                        ext: '.css'
                    }
                ]
            }
        },

        watch: {
            assets: {

                // Assets to watch:
                files: ['assets/**/*'],

                // When assets are changed:
                tasks: ['compileAssets', 'linkAssets']
            }
        }
    });

    grunt.registerTask('default',  function () {
        grunt.option('force', true);
        grunt.task.run([
            'compileAssets',
            'linkAssets',
            'watch'
        ]);
    });

    grunt.registerTask('compileAssets', [
        'clean:dev',
        'copy:dev',
        'less',
        'clean:less',
    ]);

    grunt.registerTask('linkAssets', [
        'sails-linker:devJs',
        'sails-linker:devCss'
    ]);

};
