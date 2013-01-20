/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('Flickr', function (Y, NAME) {

    "use strict";
/**
 * The Flickr module.
 *
 * @module Flickr
 */

    Y.namespace('mojito.controllers')[NAME] = {

        /**
         * Method corresponding to the 'index' action.
         * @method index
         * @param ac {Object} The action context that provides access
         *        to the Mojito API.
         * @return {}       
         */
        index: function(ac) {
            ac.models.get('FlickrModel').getFlickrImages('mojito', function(images) {

                ac.flush({images: images});

                ac.done({images: images}, {view: {name: 'bar'}});
            });
        }

    };

}, '0.0.1', {requires: [
    'mojito',
    'mojito-models-addon',
    'FlickrModel'
]});
