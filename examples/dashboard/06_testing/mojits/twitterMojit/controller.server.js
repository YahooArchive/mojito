/*
 * Copyright (c) 2012 Yahoo! Inc. All rights reserved.
 */
/*jslint anon:true, sloppy:true, nomen:true*/
YUI.add('twitterMojit', function(Y, NAME) {

/**
 * The twitterMojit module.
 *
 * @module twitterMojit
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
            ac.models.get('TwitterSearchModel').getData({},function(err, data) {
                if (err) {
                    ac.error(err);
                    return;
                }

                // add mojit specific css
                ac.assets.addCss('./index.css');

                //Y.log(data);
                ac.done({
                    title: 'YUI Twitter mentions',
                    results: data
                });
            });
        }

    };

}, '0.0.1', {requires: ['mojito', 'mojito-assets-addon', 'mojito-models-addon']});
