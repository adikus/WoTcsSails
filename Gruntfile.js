module.exports = function (grunt) {

    var jsFilesToInject = [

        'socket.io',
        'sails.io',
        'app',
        '**/'
    ];
    var jsFilesToHash = jsFilesToInject.map(function (path) {
        return '.tmp/public/comp-temp/js/'+path+'*.js';;
    });
    jsFilesToInject = jsFilesToInject.map(function (path) {
        return '.tmp/public/comp/js/'+path+'*.js';
    });

    var cssFilesToInject = [

        'bootstrap',
        '**/'
    ];
    var cssFilesToHash = cssFilesToInject.map(function (path) {
        return '.tmp/public/comp-temp/styles/'+path+'*.css';
    });
    cssFilesToInject = cssFilesToInject.map(function (path) {
        return '.tmp/public/comp/styles/'+path+'*.css';
    });

    var depsPath = grunt.option('gdsrc') || 'node_modules/sails/node_modules';
    grunt.loadTasks(depsPath + '/grunt-contrib-clean/tasks');
    grunt.loadTasks(depsPath + '/grunt-contrib-copy/tasks');
    grunt.loadTasks(depsPath + '/grunt-sails-linker/tasks');
    grunt.loadTasks(depsPath + '/grunt-contrib-less/tasks');
    grunt.loadTasks(depsPath + '/grunt-contrib-watch/tasks');
    grunt.loadTasks(depsPath + '/grunt-contrib-concat/tasks');
    grunt.loadTasks(depsPath + '/grunt-contrib-uglify/tasks');
    grunt.loadTasks(depsPath + '/grunt-contrib-cssmin/tasks');
    grunt.loadNpmTasks('grunt-md5');
    grunt.loadNpmTasks('grunt-file-creator');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            dev: ['.tmp/public/**'],
            less: ['.tmp/public/comp/styles/bootstrap/**', '.tmp/public/comp/styles/*.less'],
            temp: ['.tmp/public/comp-temp/**']
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
                    dest: '.tmp/public/comp-temp'
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
                    '.tmp/assets.ejs': jsFilesToInject
                }
            },
            prodJs: {
                options: {
                    startTag: '<!--SCRIPTS-->',
                    endTag: '<!--SCRIPTS END-->',
                    fileTmpl: '<script src="%s"></script>',
                    appRoot: '.tmp/public'
                },
                files: {
                    '.tmp/assets.ejs': ['.tmp/public/comp/js/production.min*.js']
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
                    '.tmp/assets.ejs': cssFilesToInject
                }
            },
            prodCss: {
                options: {
                    startTag: '<!--STYLES-->',
                    endTag: '<!--STYLES END-->',
                    fileTmpl: '<link rel="stylesheet" href="%s">',
                    appRoot: '.tmp/public'
                },
                files: {
                    '.tmp/assets.ejs': ['.tmp/public/comp/styles/production.min*.css']
                }
            }
        },

        less: {
            dev: {
                files: [
                    {
                        expand: true,
                        cwd: '.tmp/public/comp-temp/styles/bootstrap',
                        src: ['bootstrap.less'],
                        dest: '.tmp/public/comp-temp/styles',
                        ext: '.css'
                    },
                    {
                        expand: true,
                        cwd: '.tmp/public/comp-temp/styles',
                        src: ['*.less'],
                        dest: '.tmp/public/comp-temp/styles',
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
        },

        concat: {
            js: {
                src: jsFilesToHash,
                dest: '.tmp/public/comp-temp/js/production.js'
            },
            css: {
                src: cssFilesToHash,
                dest: '.tmp/public/comp-temp/styles/production.css'
            }
        },

        uglify: {
            dist: {
                src: ['.tmp/public/comp-temp/js/production.js'],
                dest: '.tmp/public/comp-temp/js/production.min.js'
            }
        },

        cssmin: {
            dist: {
                src: ['.tmp/public/comp-temp/styles/production.css'],
                dest: '.tmp/public/comp-temp/styles/production.min.css'
            }
        },

        md5: {
            dev: {
                files: {
                    '.tmp/public/comp/styles/': cssFilesToHash,
                    '.tmp/public/comp/js/': jsFilesToHash
                }
            },
            prod: {
                files: {
                    '.tmp/public/comp/styles/': ['.tmp/public/comp-temp/styles/production.min.css'],
                    '.tmp/public/comp/js/': ['.tmp/public/comp-temp/js/production.min.js']
                }
            }
        },

        'file-creator': {
            files: {
                ".tmp/assets.ejs": function(fs, fd, done) {
                    fs.writeSync(fd, '<!--STYLES--><!--STYLES END--><!--SCRIPTS--><!--SCRIPTS END-->');
                    done();
                }
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
        'file-creator',
        'copy:dev',
        'less',
        'clean:less',
        'md5:dev',
        'clean:temp'
    ]);

    grunt.registerTask('linkAssets', [
        'file-creator',
        'sails-linker:devJs',
        'sails-linker:devCss'
    ]);

    grunt.registerTask('prod',  function () {
        grunt.option('force', true);
        grunt.task.run([
            'compileAssetsProd',
            'linkAssetsProd'
        ]);
    });

    grunt.registerTask('compileAssetsProd', [
        'clean:dev',
        'file-creator',
        'copy:dev',
        'less',
        'clean:less',
        'concat',
        'uglify',
        'cssmin',
        'md5:prod',
        'clean:temp'
    ]);

    grunt.registerTask('linkAssetsProd', [
        'sails-linker:prodJs',
        'sails-linker:prodCss'
    ]);

};
