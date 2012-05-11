/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('QueryMojit', function(Y, NAME) {
  Y.mojito.controllers[NAME] = {
    init: function(config) {
      this.config = config; 
  },
  index: function(actionContext) {
    actionContext.done('Mojito is working.');
  },
  // Read from query string 
  // e.g. GET /example1?foo=bar 
  example1: function(actionContext) { 
    var params = actionContext.params.url(),
    paramsArray = [];
    Y.Object.each(params, function(param, key) {                
      paramsArray.push({key: key, value: param});
    });
    actionContext.done(
      {
        title: "Show all query string parameters",
        params: paramsArray
      },
      {name: 'index'}
    );
  },
  // Read parameters from POST body
  // e.g. POST /example2 with POST body
  example2: function(actionContext) {
    var params = actionContext.params.body(),
      paramsArray = [];
    Y.Object.each(params, function(param, key) {
      paramsArray.push({key: key, value: param});
    });
    actionContext.done(
      {
        title: "Show all POST parameters",
        params: paramsArray
      },
      {name: 'index'}
    );
  }, 
  // Read parameters from routing system
  example3: function(actionContext) {
    var params = actionContext.params.route(),
      paramsArray = [];
    Y.Object.each(params, function(param, key) {
      paramsArray.push({key: key, value: param});
    }); 
    actionContext.done(
      {
        title: "Show all ROUTING parameters (see routes.json)",
        params: paramsArray
      },
      { name: 'index'}
    );
  },
  // Read the merged map created by Mojito 
  // of all input parameters from URL query string (GET),    // the POST body, and any routing parameters 
  // that may have been attached during routing lookup      // Priority of merging is : Route -&gt; GET -&gt; POST\
  example4: function(actionContext) {
    var params = actionContext.params.merged(),
      paramsArray = [];
    Y.Object.each(params, function(param, key) {
      paramsArray.push({key: key, value: param});
    });
    actionContext.done(
      {
        title: "Show all ROUTING parameters (see routes.json)",
        params: paramsArray
      },
      {name: 'index'}
    );
  }
};
}, '0.0.1', {requires: ['dump']});
