/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint anon:true, sloppy:true, nomen:true*/

YUI.add('MainMojitModel', function (Y) {

    Y.mojito.models.MainMojit = {

        getData: function (callback) {
            callback({some: 'data'});
        }

    };
}, '0.0.1', {requires: ['mojito']});
