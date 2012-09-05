/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('simple', function(Y, NAME) {
  Y.namespace('mojito.controllers')[NAME] = {
    init: function(config) {
      this.config = config;
    },
    index: function(ac) { 
      var today = new Date(), 
      data = { 
        type : 'simple',
        time : { hours: today.getHours()%12, minutes: today.getMinutes()<10 ? "0" + today.getMinutes() : today.getMinutes(), period: today.getHours()>=12 ? "p.m." : "a.m."}, 
        show : true, 
        hide : false, 
        list : [{id: 2}, {id: 1}, {id: 3} ],
        hole : null, 
        html : "<h3 style='color:red;'>simple html</h3>"
      };
      ac.done(data);
    }
  };
}, '0.0.1', {requires: []});

