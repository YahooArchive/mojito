/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('i18n', function(Y, NAME) {
  Y.mojito.controllers[NAME] = { 
    init: function(config) {
      this.config = config;
    },
    index: function(ac) {
      // Default.
      ac.done(
        {
          title: ac.intl.lang("TITLE"), 
          today: ac.intl.formatDate(new Date())
        }
      );
    }
  };
}, '0.0.1', { requires: ['mojito-intl-addon']});
