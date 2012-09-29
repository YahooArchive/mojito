/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('scrollModel', function(Y) {

  Y.mojito.models.scrollMojit = {
     init: function(config) {
       this.config = config;
      },
      getData: function(callback) {
        callback({some:'data'});
      }
  };
}, '0.0.1', {requires: ['mojito']});
