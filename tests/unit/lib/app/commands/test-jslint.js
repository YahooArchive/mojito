/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true, stupid:true, plusplus:true */
/*globals YUI*/

// NOTE the dependency on 'test' here, but not 'jslint', since jslint.js is NOT
// a YUI module.
YUI().use('test', function(Y) {

    var mockery = require('mockery'),
        suite = new Y.Test.Suite('jslint tests'),
        A = Y.Assert,
        OA = Y.ObjectAssert,
        AA = Y.ArrayAssert,
        libfs = require('fs'),          // Require here so we can wrap real
                                        // functionality. Mock in setUp().
        libpath = require('path'),
        cmdpath = libpath.join(__dirname,
            '../../../../../lib/app/commands/jslint.js'),
        fixtureDir = libpath.join(__dirname,
                '../../../../fixtures/cli/'),
        jslint,
        mockFs = {

            mkdirSyncCalled: false,
            unlinkSyncCalled: false,
            writeFileSyncCalled: false,
            writeStreamEnded: false,
            writeStreamWritten: false,

            RESET_MOCK: function() {
                this.mkdirSyncCalled = false;
                this.unlinkSyncCalled = false;
                this.writeFileSyncCalled = false;
                this.writeStreamEnded = false;
                this.writeStreamWritten = false;
            },

            createWriteStream: function(file) {
                var my = this;
                return {
                    end: function() {
                        my.writeStreamEnded = true;
                    },

                    write: function(str) {
                        my.writeStreamWritten = true;
                    }
                };
            },

            lstatSync: function(file) {
                return libfs.lstatSync(file);
            },

            mkdirSync: function(path, mode) {
                this.mkdirSyncCalled = true;
            },

            readdirSync: function(file) {
                return libfs.readdirSync(file);
            },

            readFileSync: function(file, encoding) {
                return libfs.readFileSync(file, encoding);
            },

            statSync: function(file) {
                return libfs.statSync(file);
            },

            unlinkSync: function(file) {
                this.unlinkSyncCalled = true;
            },

            writeFileSync: function(file, str) {
                this.writeFileSyncCalled = true;
            }
        };
        

    suite.add(new Y.Test.Case({

        name: 'jslint',

        setUp: function() {

            mockery.registerAllowable(cmdpath);
            mockery.registerMock('fs', mockFs);
            mockery.enable({
                'useCleanCache': true,
                'warnOnUnregistered': false,
                'warnOnReplace': false

            });
            jslint = require(cmdpath);
        },

        tearDown: function() {
            mockery.deregisterAll();
            mockery.disable();

            mockFs.RESET_MOCK();
        },

        'test require': function() {
            A.isNotNull(jslint);
            A.isFunction(jslint.run, 'No run function exported');
            A.isString(jslint.usage, 'No usage string exported');
            A.isArray(jslint.options, 'No options array exported');
        },

        'test mkdirsSync': function() {
            var path = libpath.join(fixtureDir, 'testDir');

            jslint._mkdirsSync(path);
            A.isTrue(mockFs.mkdirSyncCalled);
        },

        'test rmSync': function() {
            var path = libpath.join(fixtureDir, 'deleteDir');

            jslint._rmSync(path);
            A.isTrue(mockFs.unlinkSyncCalled,
                'failed to delete directory.');

            mockFs.RESET_MOCK();

            path = libpath.join(fixtureDir, 'deleteFile');
            jslint._rmSync(path);
            A.isTrue(mockFs.unlinkSyncCalled,
                'failed to delete file.');
        },

        'test processDir': function() {
            var count = 0,
                processor = function() {
                    count++;
                },
                path = libpath.join(fixtureDir, 'src');

            jslint._processDir(path, processor);

            A.areEqual(count, 2);
        },

        'test lintOneFile': function() {
            var output = '',
                outfile = {
                    write: function(str) {
                        output += str;
                    }
                },
                path = libpath.join(fixtureDir, 'src/dir1/nolint.js');

            jslint._lintOneFile(path, outfile);
            A.areEqual(output, '', 'Failed to find no lint in clean file.');

            output = '';
            path = libpath.join(fixtureDir, 'src/dir2/gotlint.js');
            jslint._lintOneFile(path, outfile);
            A.areNotEqual(output, '', 'Failed to find lint in dirty file.');
        },

        'test writePage': function() {
            var outDir = '.',
                rowdata = [],
                totalErrors = 0;

            jslint._writePage(outDir, rowdata, totalErrors);
            A.isTrue(mockFs.writeFileSyncCalled, 'failed to write page.');
        },

        'test processFiles': function() {
            var calledWrite = false,
                count = 0,
                rootDir = libpath.join(fixtureDir, 'src'),
                outDir = libpath.join(fixtureDir, 'artifacts');

            // Mock the OutputFile helper.
            jslint._OutputFile = function() {
                this.done = function() {
                };

                this.write = function(str) {
                    calledWrite = true;
                    count++;
                };
            };

            jslint._OutputStdout = function() {
                this.done = function() {
                };

                this.write = function(str) {
                    calledWrite = true;
                    count++;
                };
            };

            jslint._processFiles(rootDir); //, outDir);
            A.isTrue(calledWrite, 'Should have called write()');
            A.areEqual(count, 2, 'Should have run on two files.');


        },

        'test run': function() {
            try {
                jslint.run();
            } catch (e) {
                A.fail('Run exception: ' + e.message);
            }
        }

    }));

    Y.Test.Runner.add(suite);
});
