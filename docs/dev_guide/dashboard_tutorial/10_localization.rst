=======================
10. Localizing Your App
=======================

Introduction
============

Because Mojito is built with YUI, localizing Mojito applications is fairly 
straightforward and easy. In this module, we’re just going to localize the title 
of our dashboard to show you how you would localize your own applications. In a 
nutshell, you provide localized strings, Mojito determines the language environment 
of the client, and you apply the correct localized string with an addon from your 
controller. 


What We’ll Cover
----------------

You can probably guess some of what we’re going to cover just by reading the 
introduction, but more specifically, we’re going to cover how to create the 
localized strings and how to use the addon. We’ll also discuss the ways that 
Mojito detects the language environment of the client. 

- creating YUI resource bundles for your mojits
- using the Intl addon to get a localized string
- specifying the BCP 47 language tags. BCP 47 is currently the combination of 
  RFC 5646 and RFC 4647
- understanding how Mojito determines the language environment

Final Product
-------------

In the screenshot, you can see that our dashboard has three localized pages: English, 
simplified Chinese, and Spanish. Our application only localizes the title of the page,
but more importantly, you'll learn how to localize your own applications in the future.

.. image:: images/10_hb_localization.png
   :height: 254 px
   :width: 877 px
   :alt: Screenshot of 09 Handlebars template application.

Before Starting
---------------

Review of the Last Module
#########################


Setting Up
----------

``$ cp -r 09_hb 10_localization``



Lesson: Localizing Applications
===============================

Mojito lets you localize applications by detecting the language environment of 
the client environment and then using the the YUI Internationalization utility 
to dynamically retrieve localized strings.  Although Mojito does the work of 
detecting the language environment of the client, your application still needs 
resource bundles that contain localized strings and the ``Intl`` addon, which uses 
the YUI Internalization utility to fetch the correct localized string. The YUI 
Internationalization utility uses the ``Intl.lookupBestLang`` method to determine 
the best language based on an application’s request and a module’s language 
support.

We’re going to first look at the resource bundle files and then show how to 
use the ``Intl`` addon to access the localized strings in those files.

Resources Bundles for Languages
-------------------------------

The resource bundle is simply a JavaScript file containing a YUI module that 
registers a new module and maps a BCP language tag to key-value pairs. BCP 47 
language tags are the identifiers for languages used on the internet. BCP stands 
for IETF Best Current Practice, and BCP 47 is currently the combination of RFC 
5646 and RFC 4647. 

Location
########

These resource bundles are placed in the lang directory of the mojit. For example, 
we’ll be using resource bundles for the LayoutMojit, so the resource bundles should 
be in the following directory: ``mojits/LayoutMojit/lang``

Naming Syntax
#############

File Names
**********

For Mojito to find the the correct resource bundle file for a language, the 
files should use the following naming convention:

``{mojit_name}_{BCP 47 tag}.js``

YUI Module Name
***************

The language resource files, as we’ve said, are YUI modules. You register the 
module name with YUI.add. Thus, for the LayoutMojit, the resource bundle file 
``FrameMojit_zh-Hans.js``.

Registering Modules and Resource Bundles
########################################

The YUI module name of your language bundle is registered like other modules with 
``YUI.add``. For example, the resource bundle for simplified Chinese in our 
``FrameMojit``, would use the following to register the module:

.. code-block:: javascript

   YUI.add('lang/FrameMojit_zh-Hans.js'), function(Y) {
     ...
   }, "3.1.0", {requires: ['intl']});


The resource bundle is registered with the mojit name and the BCP 47 name tag. 
Using the same resource bundle file, we register the resource bundle using the 
following:

.. code-block:: javascript

   Y.Intl.add(
     "FrameMojit",  // associated module
     "zh-Hans",    // BCP 47 language tag
     // key-value pairs for this module and language
     {
       YUITitle: "Trib - YUI 开发人员仪表板",
       MojitoTitle: "Trib - Mojito 开发人员仪表板"
     }
   );

For those who don’t read simplified Chinese, the localized strings that we 
registered are simply the translations  of "Trib - YUI Dashboard" and 
"Trib - Mojito Dashboard".

Requiring the Intl Addon
########################

We saw that the resource bundle was registered with ``Y.Intl.add``. To use the ``intl`` 
module, you need to require it as shown below:

.. code-block:: javascript

   }, "3.1.0", {requires: ['intl']});

Example Resource Bundle
#######################

Let’s look at the completed version of the resource bundle ``FrameMojit_zh-Hans.js``:

.. code-block:: javascript

   YUI.add("lang/FrameMojit_zh-Hans", function (Y) {
     Y.Intl.add(
       "FrameMojit",  // associated module
       "zh-Hans",    // BCP 47 language tag
       // key-value pairs for this module and language
       {
         YUITitle: "Trib - YUI 开发人员仪表板",
         MojitoTitle: "Trib - Mojito 开发人员仪表板"
       }
     );
   }, "3.1.0", {requires: ['intl']});


Using the intl Addon to Access Resource Bundle
##############################################

The controller accesses the YUI intl module through the Intl addon, which is 
required like other addons. The Intl addon has methods to get localized 
strings from the resource bundles and to format dates. In the 
``controller.server.js`` file below, the intl.lang gets the localized 
string from resource bundles.

.. code-block:: javascript

   ...
     index: function (ac) {
       var view_type = ac.params.getFromRoute('view_type') || "yui";    
       if (view_type === "yui") {
         ac.composite.done({
           title: ac.intl.lang("YUITitle"),
           button_text: "See Mojito Dashboard",
           other: "/mojito"
         });
       } else if (view_type === "mojito") {
         ac.composite.done({
           title: ac.intl.lang("MojitoTitle"),
           button_text: "See YUI Dashboard",
           other: "/"
         });
       }
     }
   ...


How Mojito Determines the Language Environment
##############################################

When running on the client side, YUI can detect the browser settings to select 
the default translation and date format. On the server, the preferred language 
and date format is determined by HTTP header the order of languages listed in 
the mojit controller.

Fortunately, Mojito lets you configure applications to run on either the server 
or client side. Because this code example illustrates how to localize your 
application, we want to configure Mojito to run the application on the client 
to improve the chances of serving content in the user’s preferred language and 
date format.



Creating the Application
========================

#. After you have copied the application that you made in the last module 
   (see Setting Up), change into the application ``10_localization``.
#. First let's add the ``lang`` directory to the ``PageLayout`` mojit.
#. In the ``lang`` directory, create the language resource bundle files 
   ``PageLayout_en-US.js``, ``PageLayout_es-419.js``, and ``PageLayout_zh-Hans.js``
   with the content below. Notice that the YUI registered name is the same as the
   directory and file, the inclusion of the ``intl`` addon, and the registration
   of the language bundle with ``Y.Intl.add``.

   ``PageLayout_en-US.js``

   .. code-block:: javascript

      YUI.add("lang/PageLayout_en-US", function (Y) {
        Y.Intl.add(
          "PageLayout",  // associated module
          "en-US",    // BCP 47 language tag
          // key-value pairs for this module and language
          {
            YUITitle: "Trib - YUI Developer Dashboard",
            MojitoTitle: "Trib - Mojito Developer Dashboard"
          }
        );
      }, "3.1.0", {requires: ['intl']});

   ``PageLayout_es-419.js``

   .. code-block:: javascript

      YUI.add("lang/PageLayout_es-419", function (Y) {
        Y.Intl.add(
          "PageLayout",  // associated module
          "es-419",    // BCP 47 language tag
          // key-value pairs for this module and language
          {
            YUITitle: "Trib - YUI Panel para desarrolladores",
            MojitoTitle: "Trib - Mojito Panel para desarrolladores"
          }
        );
      }, "3.1.0", {requires: ['intl']});

   ``PageLayout_zh-Hans.js``

   .. code-block:: javascript

      YUI.add("lang/PageLayout_zh-Hans", function (Y) {
        Y.Intl.add(
         "PageLayout",  // associated module
         "zh-Hans",    // BCP 47 language tag
         // key-value pairs for this module and language
         {
           YUITitle: "Trib - YUI 开发人员仪表板",
           MojitoTitle: "Trib - Mojito 开发人员仪表板"
         }
       );
     }, "3.1.0", {requires: ['intl']});

#. The controller of the ``PageLayout`` mojit will use the ``Intl`` addon to access
   the values of the registered language bundlers. Update the ``index`` method
   of the controller with the following:

   .. code-block:: javascript

      index: function(ac) {
        // Register helper for use in template
        ac.helpers.expose('linker', createLink);

        var view_type = ac.params.getFromRoute('view_type') || "yui";
        if (view_type === "yui") {
          ac.composite.done({
            title: ac.intl.lang("YUITitle"),
            button_text: "See Mojito Dashboard",
            other: "/mojito"
          });
        } else if (view_type === "mojito") {
          ac.composite.done({
            title: ac.intl.lang("MojitoTitle"),
            button_text: "See YUI Dashboard",
            other: "/"
          });
        }
      }

#. Also, require the ``Intl`` addon by adding the string ``mojito-intl-addon`` to the
   ``requires`` array.
#. Since this is our final application, let's put a little polish on the presentation
   with background images, favicons, and CSS. Copy the following images to the specified
   location:

   - `/assets/favicon.ico <images/assets/favicon.ico>`_ to ``10_localization/assets/``
   - `/assets/images/dust.png <images/assets/images/dust.png>`_ to ``10_localization/assets/images/``
   - `/mojits/Blog/assets/favicon.ico <images/mojits/Blog/assets/favicon.ico>`_ to ``10_localization/mojits/Blog/assets/``
   - `/mojits/Blog/assets/favicon-blog.png <images/mojits/Blog/assets/favicon-blog.png>`_ to ``10_localization/mojits/Blog/assets/``
   - `/mojits/Calendar/assets/favicon-calendar.ico <images/mojits/Calendar/assets/favicon-calendar.ico>`_ to ``10_localization//mojits/Calendar/assets``
   - `/mojits/Calendar/assets/favicon-calendar.png <images/mojits/Calendar/assets/favicon-calendar.png>`_ to ``10_localization//mojits/Calendar/assets``
   - `/mojits/Twitter/assets/favicon.ico <images/mojits/Twitter/assets/favicon.ico>`_ to ``10_localization/mojits/Twitter/assets/``
   - `/mojits/Twitter/assets/favicon-twitter.png <images/mojits/Twitter/assets/favicon-twitter.png>`_ to ``10_localization/mojits/Twitter/assets/``
   - `/mojits/Gallery/assets/favicon-blog.png <images/mojits/Gallery/assets/favicon-blog.png>`_ to ``10_localization/mojits/Gallery/assets/``
   - `/mojits/Github/assets/favicon-github.png <images/mojits/Github/assets/favicon-github.png>`_ to ``10_localization/mojits/Github/assets/``

#. We're going to update the CSS for some mojits as well so that the images are used
   and styles. Replace the code in the following CSS files with the content below:

   ``/mojits/Blog/assets/index.css``

   .. code-block:: html

      #blog h3 strong {
        background-image: url(/static/Blog/assets/favicon-blog.png);
      }
   
   ``/mojits/Calendar/assets/index.css``

   .. code-block:: html

      #calendar h3 strong {
        background-image: url(/static/Calendar/assets/favicon-calendar.png);
      }
      #calendar .inner li {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
      #calendar .inner li span {
        padding-right: 4px;
        font-size: .8em;
        display: inline-block;
        width: 106px;
        max-width: 7.6 em;
        overflow: hidden;
      }

  ``/mojits/Gallery/assets/index.css`` 

   .. code-block:: html 

      #gallery h3 strong {
        background-image: url(/static/Gallery/assets/favicon-blog.png);
      }

   ``/mojits/Github/assets/index.css`` 
 
   .. code-block:: html

      #github h3 strong {
        background-image: url(/static/Github/assets/favicon-github.png);
      }

   ``/mojits/Twitter/assets/index.css``

   .. code-block: html

      #twitter h3 strong {
        background-image: url(/static/Twitter/assets/favicon-twitter.png);
      }

#. Launch your application to see the application in its more finished form.
#. To view the localized title in Chinese for the dashboard, add the query string parameter
   ``?lang=zh-Hans`` to the URL and refresh the page. You can see the title in Spanish 
   as well with the query string parameter ``?lang=es-419``.
#. Congratulations, you have completed all of the modules in this tutorial. There is still
   more to learn about Mojito, but you should have a strong grasp of the basics that you
   can build on. If you haven't already, be sure to read the `documentation <../>`_ and the 
   `code examples <../code_examples/>`_ as well.


Troubleshooting
===============

Problem One
-----------

Nulla pharetra aliquam neque sed tincidunt. Donec nisi eros, sagittis vitae 
lobortis nec, interdum sed ipsum. Quisque congue tempor odio, a volutpat eros 
hendrerit nec. 

Problem Two
-----------

Nulla pharetra aliquam neque sed tincidunt. Donec nisi eros, sagittis vitae 
lobortis nec, interdum sed ipsum. Quisque congue tempor odio, a volutpat eros 
hendrerit nec. 

Summary
=======

Q&A
===

Test Yourself
=============


Terms
=====

Source Code
===========

[app_part{x}](http://github.com/yahoo/mojito/examples/quickstart_guide/app_part{x})

Further Reading
===============

- [Mojito Doc](http://developer.yahoo.com/cocktails/mojito/docs/)

