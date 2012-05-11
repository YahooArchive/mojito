/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('log', function(Y, NAME) {

    /**
     * Constructor for the Controller class.
     *
     * @class Controller
     * @constructor
     */
    Y.mojito.controllers[NAME] = {

        init: function(config) {
            this.config = config;
        },
        
        /**
         * Method corresponding to the 'index' action.
         *
         * @param ac {Object} The ActionContext that provides access
         *        to the Mojito API.
         */

        index: function(ac) {
            Y.log('[CONTROLLER]: entering into controller index (...)',"info"); 
            var today = new Date(), 
            data = { 
                type : 'simple',
                time : {
                    hours: today.getHours()%12, 
                    minutes: today.getMinutes()<10 ? "0" + today.getMinutes() : today.getMinutes(), 
                    period: today.getHours()>=12 ? "p.m." : "a.m."
                }, 
                show : true, 
                hide : false, 
                list : [{
                    id: 2
                }, {
                    id: 1
                }, {
                    id: 3
                } ],
                hole : null, 
                html : "<h3 style='color:red;'>simple html</h3>"
            };
            Y.log('[CONTROLLER]: Today ' +today); 
            ac.done(data);
        }

    };

}, '0.0.1', {
    requires: ['mojito']
});
