/*
 * Copyright (c) 2012 Yahoo! Inc. All rights reserved.
 */
/*jslint anon:true, sloppy:true, nomen:true*/
/*globals YUI*/

YUI.add('top_frame', function(Y, NAME) {

/**
 * The top_frame module.
 *
 * @module top_frame
 */

    /**
     * Constructor for the Controller class.
     *
     * @class Controller
     * @constructor
     */
    Y.namespace('mojito.controllers')[NAME] = {

        /**
         * Method corresponding to the 'index' action.
         *
         * @param ac {Object} The ActionContext that provides access
         *        to the Mojito API.
         */
        index: function(ac) {
            ac.models.get('top_frameModelFoo').getData(function(err, data) {
                if (err) {
                    ac.error(err);
                    return;
                }

                ac.done({
                    status: 'Mojito is working.',
                    data: data
                });
            });
        }

    };

}, '0.0.1', {requires: [
    'mojito',
    'mojito-assets-addon',
    'mojito-models-addon',
    'top_frameModelFoo'
]});
