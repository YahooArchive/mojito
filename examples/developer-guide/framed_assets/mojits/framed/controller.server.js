/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('framed', function(Y, NAME) {
  Y.mojito.controllers[NAME] = {
    init: function(config) {
      this.config = config; 
    },
    index: function(ac) { 
      var data = {
        title: "Framed Assets", 
        colors: [
          {id: "green", rgb: "#616536"},
          {id: "brown", rgb: "#593E1A"},
          {id: "grey",  rgb: "#777B88"}, 
          {id: "blue",  rgb: "#3D72A4"},
          {id: "red",  rgb: "#990033"}  
        ]
      };
      ac.done(data); 
    }    
  };
}, '0.0.1', {requires: []});
