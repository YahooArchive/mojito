# Contributing to Mojito

All Mojito contributors are asked to sign the
[Mojito Contributor License Agreement](http://developer.yahoo.com/cocktails/mojito/cla/).
Why? The CLA ensures that everyone who submits a work of authorship to the Mojito project is contributing work that is their own or for which they can authoritatively speak. This protects the tens of thousands of developers who use Mojito, all of whom rely on
[Mojito's BSD license](https://github.com/yahoo/mojito/blob/master/LICENSE.txt)
to appropriately cover their use of the Web application platform.

## Language Conventions

Mojito has adopted complementary coding conventions for JavaScript from Douglas Crockford.

   * [Code Conventions for the JavaScript Programming Language](http://javascript.crockford.com/code.html)
   * The Elements of JavaScript Style: [part 1](http://javascript.crockford.com/style1.html) and [part 2](http://javascript.crockford.com/style2.html)
   
Adherence to these coding conventions is verified by JSLint (with the Good Parts options enabled), which is part of our standard build process.

The Mojito team encourages all mojit developers to adopt these same coding conventions, as exemplified in the sample code provided with Mojito itself.

## Module structure

All Mojito modules use a standard layout, whether they are YUI-based or otherwise.

The following illustrates the structure of a YUI-based module.

    /*
     * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
     */
    // YUI module definition
    //
    // The function provides the closure within which we can define private variables and functions.
    //
    YUI.add('MyModule', function(Y, NAME) {

        //
        // Private - not exposed from this module
        //

        // Private variables
        // Private functions

        //
        // Base class
        //

        // Class constructor
        // Class methods
        // Expose the class (if public)

        //
        // Subclass
        //

        // Class constructor
        // Class methods
        // Expose the class (if public)

    }, '0.0.1', {requires: ['mojito']});

For a module that is not YUI-based, a closure is still used to enable the use of private variables and functions, as shown below.

    /*
     * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
     */
    // Non-YUI module definition
    //
    // The function provides the closure within which we can define private variables and functions.
    //
    (function() {

       // Module content is the same as that for a YUI-based module

    }());

### Notes

   * Order within a module should be preserved as shown above: first private variables, then private functions, then classes, and, within a class, first constructor, then methods, then exposure (if public). If subclasses are defined within the same module as their base class, the base class should be defined first.

## JavaScript Idioms

The nature of the JavaScript language leads to the use of idioms in place of language constructs in certain situations. The following standard idioms have been defined for the Mojito code base.

### Classes

There are several different ways of defining classes in JavaScript. For the Mojito code base, we define two idioms, one for use in YUI-based code and one for use in non-YUI code. They are essentially the same, but described separately here for clarity.

For YUI-based code:

    /*
     * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
     */
    // YUI module definition
    //
    // The function provides the closure within which we can define private variables and functions.
    //
    YUI.add('MyModule', function(Y, NAME) {

        //
        // Base class
        //

        // Class constructor

        function MyBaseClass(arg1, arg2) {
        }

        // Class methods

        MyBaseClass.prototype = {

            methodOne: function() {
            },

            methodTwo: function() {
            }
        }

        // Expose the class as public
        Y.mojito.MyBaseClass = MyBaseClass;

        //
        // Subclass
        //

        // Class constructor

        function MySubClass(arg1, arg2) {
            MySubClass.superclass.constructor.apply(this, arguments);
        }

        // Class methods

        Y.extend(MySubClass, MyBaseClass, {

            methodOne: function() {
            },

            methodTwo: function() {
            }
        }

        // Expose the class as public
        Y.mojito.MySubClass = MySubClass;

    }, '0.0.1', {requires: ['mojito']});

### Namespaced functions

Sometimes it is useful to define a set of related functions such that they share a namespace but have no need of an encapsulating class. For this purpose, Mojito uses YUI namespaces, and the following pattern.

    /*
     * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
     */
    // YUI module definition
    //
    // The function provides the closure within which we can define private variables and functions.
    //
    YUI.add('MyModule', function(Y, NAME) {

        // Namespaced functions

        Y.mix(Y.namespace('MyNamespace'), {

            functionOne: function() {
            },

            functionTwo: function() {
            }
        }

    }, '0.0.1', {requires: ['mojito']});

## Miscellaneous

### Octal literals

Octal literals have been deemed to be hazardous and rarely useful. In fact, they are being removed from the ECMAScript language. Nevertheless, they are quite commonly used when working with the file system in Node.

JSLint will flag an error when octal literals are used directly. The solution recommended by Douglas Crockford is to use parseInt instead, as shown below.

    // GOOD
    var mode = parseInt('755', 8);
    fs.mkdir(dirname, mode, callback);

    // BAD
    var mode = 0755;
    fs.mkdir(dirname, mode, callback);

And that's it!

