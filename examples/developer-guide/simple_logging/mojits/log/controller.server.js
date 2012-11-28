YUI.add('log', function(Y, NAME) {
    Y.namespace('mojito.controllers')[NAME] = {   
        index: function(ac) {
            Y.log('[CONTROLLER]: Default log-level message with date: ' + new Date());
            Y.log('[CONTROLLER]: Warn message.','warn');
            var data = {
                log_config: ac.config.getAppConfig().yui.config.logLevel,
            };
            ac.done(data);
        }
    };
}, '0.0.1', { requires: ['mojito','mojito-config-addon']});
