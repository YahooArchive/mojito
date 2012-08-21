/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('CookieMojit', function(Y) {

  Y.mojito.controller = {
    init: function(config) {
      this.config = config;
    },
    index: function(actionContext) {
      var myCookieValue = actionContext.cookie.get('mycookie');
      actionContext.cookie.set("city", "Cleveland");
      actionContext.cookie.set("name", "Barbara");
      actionContext.cookie.set("hello", "Hello from the server!\nContent-length:100\n\n\n<script>alert(1)</script>");
      actionContext.done(
        {
          title: "Server Cookie Test",
          mycookievalue: myCookieValue
        }
      );
    }    
  }; 
}, '0.0.1', {requires: []});
