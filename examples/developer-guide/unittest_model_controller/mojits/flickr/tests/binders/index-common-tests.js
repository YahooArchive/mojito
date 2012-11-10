/*
 * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

YUI.add('flickrBinderIndex-tests', function(Y, NAME) {
  var suite = new YUITest.TestSuite(NAME),
  binder, A = YUITest.Assert;
  suite.add(new YUITest.TestCase({
    name: 'flickr binder index tests',
    setUp: function() {
      binder = Y.mojito.binders.flickrBinderIndex;
    },
    tearDown: function() {
      binder = null;
    },
    'test update id': function() {
      var node = Y.Node.create("<div id='guid123'></div>");
      binder.init({
        _guid: 'guid123'
      });
      binder.bind(node);
      binder._updateId('hello');
      var content = node.one('p').getContent();
      Y.log(content);
      A.areSame(content, 'guid123 hello', 'the node was not updated');
      //node.click();
    }
  }));
  YUITest.TestRunner.add(suite);
}, '0.0.1', {requires: ['mojito-test', 'node', 'flickrBinderIndex']});
