/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('device', function(Y, NAME) {
  
  Y.namespace('mojito.controllers')[NAME] = {
    init: function(config) {
      this.config = config;
    },
    /* Method corresponding to the 'index' action. 
    * 
    * @param ac {Object} The action context that 
    * provides access to the Mojito API.
    */
    index: function(ac) { 
      ac.done({title: 'Device Views'}); 
    }    
  };
}, '0.0.1', {requires: []});
