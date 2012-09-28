/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('GenURLMojit', function(Y, NAME) {
  Y.namespace('mojito.controllers')[NAME] = {
    init: function(config) {
      this.config = config;
    },
    index: function(ac) {
      var url = ac.url.make('mymojit', 'contactus', '');
      ac.done({contactus_url: url});
    },
    contactus: function(ac) {
      var currentTime = ac.intl.formatDate(new Date());
      ac.done({currentTime: currentTime});
    }
  };
}, '0.0.1', {requires: [
    'mojito',
    'mojito-url-addon',
    'mojito-intl-addon']});
