/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('framed', function(Y) {

  Y.mojito.controller = {
    init: function(config) {
      this.config = config;
    },
    index: function(ac) {
      ac.done({app_name:'Framed Mojit'});
    }
  };
}, '0.0.1', {requires: ['']});
