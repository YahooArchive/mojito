/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('RouteParamGrabber', function(Y) {
    
    Y.mojito.controller = {
        
        index: function(ac) {
            var params = ac.params.route(),
                paramsArray = [];
            Y.Object.each(params, function(param, key) {
                paramsArray.push({key: key, value: param});
            });
            ac.done({
                desc: 'All route params',
                rte: paramsArray
            });
        }
        
    };
    
}, '0.0.1', {requires: []});
