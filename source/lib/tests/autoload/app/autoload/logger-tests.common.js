/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
YUI.add('mojito-logger-tests', function(Y, NAME) {

    var suite = new YUITest.TestSuite(NAME),
        A = YUITest.Assert,
        AA = YUITest.ArrayAssert;

    suite.add(new YUITest.TestCase({

        name: 'simple logger tests',

        'default construction logs message to console immediately with default log level "info"': function() {
            var logMsg,
                logger = new Y.mojito.Logger({
                    writer: function(msg) {
                        logMsg = msg;
                    },
                    timestamp: false
                });

            logger.log('test');

            A.areSame('[INFO] test', logMsg, 'bad log message');
        },

        'log message and level': function() {
            var logMsg,
                logger = new Y.mojito.Logger({
                    writer: function(msg) {
                        logMsg = msg;
                    },
                    timestamp: false
                });

            logger.log('test', 'info');

            A.areSame('[INFO] test', logMsg, 'bad log message');
        },

        'log message, level, and source': function() {
            var logMsg,
                logger = new Y.mojito.Logger({
                    writer: function(msg) {
                        logMsg = msg;
                    },
                    timestamp: false
                });

            logger.log('test', 'info', 'source-module');

            A.areSame('[INFO] source-module: test', logMsg, 'bad log message');
        },

        'timestamp configuration adds a timestamp': function() {
            var logMsg,
                logger = new Y.mojito.Logger({
                    writer: function(msg) {
                        logMsg = msg;
                    },
                    timestamp: true
                });
            var _date_gettime = Date.prototype.getTime;
            Date.prototype.getTime = function() {
                return 'timestamp';
            };

            logger.log('test', 'info', 'source-module');

            A.areSame('[INFO] (timestamp) source-module: test', logMsg, 'bad log message');

            Date.prototype.getTime = _date_gettime;
        }

    }));

    suite.add(new YUITest.TestCase({

        name: 'advanced logger tests',

        'INFO log level by default': function() {
            var logMsgs = [],
                logger = new Y.mojito.Logger({
                    writer: function(msg) {
                        logMsgs.push(msg);
                    },
                    timestamp: false
                });

            logger.log('1', 'debug');
            logger.log('2', 'mojito');
            logger.log('3', 'info');
            logger.log('4', 'warn');
            logger.log('5', 'error');

            A.areSame(3, logMsgs.length, 'bad number of logs');
            A.areSame('[INFO] 3', logMsgs[0], 'bad  log message');
            A.areSame('[WARN] 4', logMsgs[1], 'bad  log message');
            A.areSame('[ERROR] 5', logMsgs[2], 'bad  log message');
        },

        'INFO log level': function() {
            var logMsgs = [],
                logger = new Y.mojito.Logger({
                    writer: function(msg) {
                        logMsgs.push(msg);
                    },
                    level: 'info',
                    timestamp: false
                });

            logger.log('0', 'yui');
            logger.log('1', 'debug');
            logger.log('2', 'info');
            logger.log('3', 'warn');
            logger.log('4', 'error');

            A.areSame(3, logMsgs.length, 'bad number of logs');
            A.areSame('[INFO] 2', logMsgs[0], 'bad  log message');
            A.areSame('[WARN] 3', logMsgs[1], 'bad  log message');
            A.areSame('[ERROR] 4', logMsgs[2], 'bad  log message');
        },

        'WARN log level': function() {
            var logMsgs = [],
                logger = new Y.mojito.Logger({
                    writer: function(msg) {
                        logMsgs.push(msg);
                    },
                    level: 'warn',
                    timestamp: false
                });

            logger.log('0', 'yui');
            logger.log('1', 'debug');
            logger.log('2', 'info');
            logger.log('3', 'warn');
            logger.log('4', 'error');

            A.areSame(2, logMsgs.length, 'bad number of logs');
            A.areSame('[WARN] 3', logMsgs[0], 'bad  log message');
            A.areSame('[ERROR] 4', logMsgs[1], 'bad  log message');
        },

        'ERROR log level': function() {
            var logMsgs = [],
                logger = new Y.mojito.Logger({
                    writer: function(msg) {
                        logMsgs.push(msg);
                    },
                    level: 'error',
                    timestamp: false
                });

            logger.log('0', 'yui');
            logger.log('1', 'debug');
            logger.log('2', 'info');
            logger.log('3', 'warn');
            logger.log('4', 'error');

            A.areSame(1, logMsgs.length, 'bad number of logs');
            A.areSame('[ERROR] 4', logMsgs[0], 'bad  log message');
        }

    }));

    suite.add(new YUITest.TestCase({

        name: 'output writing',

        'can override both writer and formatter with publisher': function () {
            var logged = false,
                logger = new Y.mojito.Logger({
                publisher: function(msg, lvl, src) {
                    A.areSame('msg', msg);
                    A.areSame('info', lvl);
                    A.areSame('source', src);
                    logged = true;
                }
            });

            logger.log('msg', 'info', 'source');

            A.isTrue(logged);
        },

        'default formatter converts Errors into strings': function() {
            var log,
                logger = new Y.mojito.Logger({
                    writer: function(str) {
                        log = str;
                    },
                    timestamp: false
                });

            var err = new Error('message');
            err.code = 500;
            err.stack = 'stack trace';
            logger.log(err);

            A.areSame('[INFO] Error 500: message\nstack trace', log, 'bad Error to string conversion');
        }

    }));

    suite.add(new YUITest.TestCase({

        name: 'buffered logger tests',

        'buffered logs are not written to console': function() {
            var logged = false;
                logger = new Y.mojito.Logger({
                    writer: function(msg) {
                        logged = true;
                    },
                    buffer: true
                });

            logger.log('test');

            A.isFalse(logged, 'buffered logs should not write to console');
        },

        'flush buffered logs': function() {
            var logMsgs = [],
                logger = new Y.mojito.Logger({
                    writer: function(msgs) {
                        logMsgs = msgs;
                    },
                    buffer: true,
                    timestamp: false
                });

            logger.log('1');
            logger.log('2');
            logger.log('3');
            logger.log('4');

            A.areSame(0, logMsgs.length, 'logs should not be logged until flushed');

            logger.flush();

            A.areSame(4, logMsgs.length, 'bad number of flushed logs');
            A.areSame('[INFO] 1', logMsgs[0], 'bad flushed log message');
            A.areSame('[INFO] 2', logMsgs[1], 'bad flushed log message');
            A.areSame('[INFO] 3', logMsgs[2], 'bad flushed log message');
            A.areSame('[INFO] 4', logMsgs[3], 'bad flushed log message');
        }



    }));

    YUITest.TestRunner.add(suite);

}, '0.0.1', {requires: ['mojito-logger']});
