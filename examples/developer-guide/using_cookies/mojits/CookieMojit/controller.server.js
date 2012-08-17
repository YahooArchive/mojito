/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('CookieMojit', function(Y, NAME) {

  Y.namespace('mojito.controllers')[NAME] = {
    init: function(config) {
      this.config = config;
    },
    index: function(actionContext) {
      var requestCookieValue = actionContext.cookie.get('request_cookie');
   
      // Or use this API to set a session cookie 
      // with default properties set by Mojito
      actionContext.cookie.set("response_cookie", "Hello from the server!");
      actionContext.done(
        {
          title: "Cookie Demo",
          request_cookie_value: requestCookieValue
        }
      );
    }    
  }; 
}, '0.0.1', {requires: []});
