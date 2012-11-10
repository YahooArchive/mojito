

========
Overview
========

What is Mojito?
###############

Mojito is a `model-view-controller (MVC) <http://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller>`_ application framework built on YUI 3 that enables agile development of 
Web applications. Mojito allows developers to use a combination of configuration and an MVC architecture to create applications. Because client and server components are both written in JavaScript, 
Mojito can run on the client (browser) or the server (Node.js).

Mojito offers the following features, some of which are discussed in the next section:

- Local development environment and tools (Yahoo! independent stack)
- Library for simplifying internationalization & localization
- Integrated unit testing
- Device specific presentation (Hero, Mobile, TV, Web, etc.)

Why Mojito?
###########

The best way to illustrate why you should use Mojito for creating Web applications is to give an example. Suppose you wanted to create a slideboard application that 
lets users quickly view news articles from various sources. Your application needs to be available on a variety of devices and use the appropriate UI elements of the device. 
For example, the application on the Web should provide rich interaction using the mouse, whereas, the application on a tablet or phone should provide the same rich interaction 
using the touchscreen.

You also want people from all over to be able to use your slideboard application, so you will need to support internationalization and localization. Users should be able to see the 
application in their local language or choose their preferred language.

In the following, we will discuss how Mojito makes it easier to create the slideboard application.

One Language
============

Your slideboard application will need to fetch articles either through some API or an RSS feed. Most conventional Web applications that need data have both server-side and client-side components. 
The server-side script, written in a language such as Python, Perl, Ruby, PHP, or Java, fetches data and then passes the data to client-side script written in JavaScript. The one Web application 
would have at least two languages and would need to make at least two network calls: one to the data source, and one between the server-side and client-side code to transmit data.

Because Mojito is written entirely in JavaScript, your application code can run on the server or be deployed to the client. From the client, you can use the `YUI YQL Utility <http://yuilibrary.com/yui/docs/yql/>`_, 
to get all types of Web data, removing the need for the client to fetch data from your server.

Two Runtimes
============

Your application code can be configured to run on the server or be deployed to the client. If your application is configured to deploy code 
to the client, Mojito will determine whether the client can execute JavaScript before deployment. If the client cannot execute JavaScript, 
your application code will instead execute on the server. You write one code base, configure where code should optimally run, and then let 
Mojito determine at runtime to either deploy the code or run it on the server. Whether running on the client or server, your code can 
use the `YUI YQL Utility <http://yuilibrary.com/yui/docs/yql/>`_ to get all types of Web data.

Views for Different Devices
===========================

Your slideboard application is a Web application, but we want users to view it on tablets and smart phones as well. Do you create separate versions of your application? Do you write code logic 
that serves the correct version?

Mojito can identify the calling device by examining the HTTP header ``User-Agent``. You create custom views for different devices, and Mojito will render and serve the correct 
device-specific views.

Progressive Enhancement
=======================

You want your users to be able to take advantage of the rich features of the device they are using. Users skimming through articles on an iPad should be able to use the touch screen, and Web 
users should have features such as mouseovers and right-clicks. Handling these UI events requires JavaScript, so how do you handle them when the client has disabled JavaScript?

Mojito allows you to serve code to the client, so that your users can use the rich interactive features of their devices, but Mojito also allows you to handle cases when the client has 
not enabled JavaScript. You can write HTML and CSS so your page functions without JavaScript sure that your application works with just HTML and CSS. Because Mojito runs on `Node.js <http://nodejs.org/>`_ 
the code intended to be deployed to the client can instead run on the server.

Localization and Internationalization
=====================================

Mojito is built on `YUI 3 <http://yuilibrary.com/>`_, which has an internationalization utility that allows you to handle monolingual and multilingual applications. Using the `YUI Internationalization 
utility <http://yuilibrary.com/yui/docs/intl/>`_ and `Yahoo! Resource Bundles (YRB) <http://yuilibrary.com/yui/docs/intl/#yrb>`_, your slideboard application could use one language for the UI and serve 
the content in a different language.


