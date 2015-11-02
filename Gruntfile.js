module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            dist : {
                files: {
                    "dist/main.min.js": [
                        "src/js/bootstrap.js",
                    ],
                }
            },
            babel: {
                options: {
                    transform: [
                        ["babelify", {
                            loose: "all"
                        }]
                    ]
                },
                files: {
                    "dist/main.min.js": [
                        "src/js/bootstrap.js",
                    ],
                }
            }
        },
        uglify: {
            dist: {
                files: {
                    'dist/main.min.js': ['dist/main.min.js']
                }
            },
            phaser: {
                files: {
                    'dist/phaser.min.js': ['node_modules/phaser/dist/phaser-no-physics.min.js']
                } 
            },
            socketio: {
                files: {
                    'dist/socket.io.min.js': ['src/js/socket.io.min.js']
                } 
            }
        },
        concat : {
            options: {
                separator: ';'
            },
            dist: {
                src: ['dist/phaser.min.js', 'dist/socket.io.min.js', 'dist/main.min.js'],
                dest: 'dist/main.min.js'
            }
        },
        watch: {
            scripts: {
                files: ["./src/js/*.js"],
                tasks: ["browserify:dist", "concat"]
            }
        }
    });

    grunt.loadNpmTasks("grunt-browserify");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    // grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask("default", ["watch"]);
    grunt.registerTask("libs", ["uglify:phaser", "uglify:socketio"]);
    grunt.registerTask("build", ["browserify:dist", "uglify:dist", "concat"]);
};
