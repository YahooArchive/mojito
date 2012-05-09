/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('FooterMojit', function(Y, NAME) {
  Y.mojito.controllers[NAME] = {
    init: function(config) {
      this.config = config; 
    },
    index: function(actionContext) {
      actionContext.done({title: "Footer"}); 
    }
  };
}, '0.0.1', {requires: ['mojito']})
