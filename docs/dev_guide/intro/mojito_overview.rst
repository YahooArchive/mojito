========
Overview
========

.. _mojito_overview-what:

What is Mojito?
===============

Mojito is a `model-view-controller (MVC) <http://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller>`_ 
application framework built on YUI 3 that enables agile development of Web applications. 
Mojito allows developers to use a combination of configuration and an MVC architecture to 
create applications. Because client and server components are both written in JavaScript, 
Mojito can run on the client (browser) or the server (Node.js).

Mojito offers the following features, some of which are discussed in the next section:

- Local development environment and tools (Yahoo independent stack)
- Library for simplifying internationalization & localization
- Integrated unit testing
- Device specific presentation (Hero, Mobile, TV, Web, etc.)

.. _mojito_overview-why:

Why Mojito?
===========

The best way to illustrate why you should use Mojito for creating Web applications is to 
give an example. Suppose you wanted to create a slideboard application that 
lets users quickly view news articles from various sources. Your application needs to be 
available on a variety of devices and use the appropriate UI elements of the device. 
For example, the application on the Web should provide rich interaction using the mouse, 
whereas, the application on a tablet or phone should provide the same rich interaction 
using the touchscreen.

You also want people from all over to be able to use your slideboard application, so you 
will need to support internationalization and localization. Users should be able to see 
the application in their local language or choose their preferred language.

In the following, we will discuss how Mojito makes it easier to create the slideboard 
application.

.. _mojito_overview_why-one_lang:

One Language
------------

Your slideboard application will need to fetch articles either through some API or an RSS 
feed. Most conventional Web applications that need data have both server-side and 
client-side components. The server-side script, written in a language such as Python, 
Perl, Ruby, PHP, or Java, fetches data and then passes the data to client-side script 
written in JavaScript. The one Web application would have at least two languages and 
would need to make at least two network calls: one to the data source, and one between 
the server-side and client-side code to transmit data.

Because Mojito is written entirely in JavaScript, your application code can run on the
server or be deployed to the client. From the client, you can use the 
`YUI YQL Utility <http://yuilibrary.com/yui/docs/yql/>`_, to get all types of Web data, 
removing the need for the client to fetch data from your server.

.. _mojito_overview_why-two_runtimes:

Two Runtimes
------------

Your application code can be configured to run on the server or be deployed to the client. 
If your application is configured to deploy code to the client, Mojito will determine 
whether the client can execute JavaScript before deployment. If the client cannot execute 
JavaScript, your application code will instead execute on the server. You write one code 
base, configure where code should optimally run, and then let Mojito determine at runtime 
to either deploy the code or run it on the server. Whether running on the client or server, 
your code can use the `YUI YQL Utility <http://yuilibrary.com/yui/docs/yql/>`_ to get all 
types of Web data.

.. _mojito_overview_why-device_views:

Views for Different Devices
---------------------------

Your slideboard application is a Web application, but we want users to view it on tablets 
and smart phones as well. Do you create separate versions of your application? Do you 
write code logic that serves the correct version?

Mojito can identify the calling device by examining the HTTP header ``User-Agent``. You 
create custom views for different devices, and Mojito will render and serve the correct 
device-specific views.

.. _mojito_overview_why-prog_enhancement:

Progressive Enhancement
-----------------------

You want your users to be able to take advantage of the rich features of the device they 
are using. Users skimming through articles on an iPad should be able to use the touch 
screen, and Web users should have features such as mouseovers and right-clicks. Handling 
these UI events requires JavaScript, so how do you handle them when the client has 
disabled JavaScript?

Mojito allows you to serve code to the client, so that your users can use the rich 
interactive features of their devices, but Mojito also allows you to handle cases when the 
client has not enabled JavaScript. You can write HTML and CSS so your page functions 
without JavaScript sure that your application works with just HTML and CSS. Because Mojito 
runs on `Node.js <http://nodejs.org/>`_ the code intended to be deployed to the client can 
instead run on the server.

.. _mojito_overview_why-loc_intl:

Localization and Internationalization
-------------------------------------

Mojito is built on `YUI 3 <http://yuilibrary.com/>`_, which has an internationalization 
utility that allows you to handle monolingual and multilingual applications. Using the 
`YUI Internationalization utility <http://yuilibrary.com/yui/docs/intl/>`_ and 
`Yahoo Resource Bundles (YRB) <http://yuilibrary.com/yui/docs/intl/#yrb>`_, your 
slideboard application could use one language for the UI and serve the content in a 
different language.

One Framework, Two UI Layers
----------------------------

Client and Server Separation
############################

In the past, applications were often divided into two discrete parts (client/server) 
that were written by two groups of specialized engineers: frontend and backend engineers. The frontend 
engineers wrote the code that was to be executed in the browser, and backend engineers focused on the 
business logic and backend UI layer. By backend UI layer, we are referring to the
payload (templates/data) that is generated by the server. Frontend developers used AJAX  

- separation of client and server code
- two groups of specialized engineers
- AJAX 

Then: Application Frameworks 
############################

Later frameworks such as Django and Ruby on Rails were structured in a way to more tightly 
integrate the client and server, so engineers could write both client-side and server-side code. 
Still, this required writing code in Ruby/PHP as well as being proficient in JavaScript/CSS/HTML.  
Also, engineers still need to know how to work with databases through an ORM, although these 
frameworks simplified the interaction between the backend UI layer and the database.

Mojito and Node.js
##################

Because Mojito is built on Node.js, frontend engineers can write both the frontend UI and backend UI layer
in JavaScript. This gives them greater control of what gets delivered to the client, and they don't have to
be as reliant on backend developers. Unlike Django and Ruby on Rails, however, Mojito does not
provide an ORM to a database. As a Mojito application developer, you 

them to control the middle server layer that contains the payload. 

Model connects directly to a database through an ORM, with no intermediate service layer.
applicathe distinction between the client-side and server-side was so clear that we had 

specialized engineers to work on client-side code and
In the past, the client-side and server-side of application were discrete parts tart
were developed by  

I think that's where Juan and I completely misunderstood the role of Mojito, and why we kept trying to make Y.Storage abstract out both browser databases and server databases.
 
I also think that this is where a lot of developers like us, that have backgrounds from frameworks like Django and Rails, got really confused about Mojito, and didn't adopt it for our own projects.  In Django and Rails, a Model connects directly to a database through an ORM, with no intermediate service layer.
 
I think we need to write a blog post that expands on Zakas' post, how Mojito relates to it, and how Django/Rails/PHP developers should use Mojito today.  I also think this blog post needs to be at the front of the Mojito Getting Started guide, and that developers should know that Mojito should be built on top of an existing service architecture.
 
For Modown: I realize now that I was trying to solve the wrong problem for the past two months, but I think I know how to better approach it now.
 
-----------
Node.js and the new web front-end
Posted at October 7, 2013 07:00 am by Nicholas C. Zakas
Tags: Architecture, JavaScript, Node.js, Web Server
Front-end engineers have a rather long and complicated history in software engineering. For the longest time, that stuff 
you sent to the browser was “easy enough” that anyone could do it and there was no real need for specialization. 
Many claimed that so-called web developers were nothing more than graphic designers using a different medium. 
The thought that one day you would be able to specialize in web technologies like HTML, CSS, and JavaScript was 
laughable at best – the UI was, after all, something anyone could just hack together and have work.

JavaScript was the technology that really started to change the perception of web developers, changing them into 
front-end engineers. This quirky little toy language that many software engineers turned their noses up at became the 
driving force of the Internet. CSS and HTML then came along for the ride as more browsers were introduced, creating 
cross-browser incompatibilities that very clearly defined the need for front-end engineers. Today, front-end specialists 
are one of the most sought after candidates in the world.

The two UI layers

Even after the Ajax boom, the front-end engineer was seen as primarily working with technologies inside of a browser window. 
HTML, CSS, and JavaScript were the main priorities and we would only touch the back-end (web server) in order to ensure it 
was properly outputting the front-end. In a sense, there were two UI layers: the one in the browser itself and the one on the 
server that generated the payload for the browser. We had very little control over the back-end UI layer and were often 
beholden to back-end engineers’ opinions on how frameworks should be put together – a world view that rarely took into 
consideration the needs of the front-end.

I think I personally had a huge gap understanding how Mojito (and Modown) worked until I read this post by Zakas:

http://www.nczonline.net/blog/2013/10/07/node-js-and-the-new-web-front-end/

It didn't occur to me until today that Mojito was supposed to be built on top of an existing HTTP service, 
and not directly connected to a database.  

Every time I built a Mojito application, I had a lot of models that were split up into something like:
post.server.js
post.client.js

Where the server model connected to a database, and the client model made an AJAX call to access 
the server model through a RESTful route.  

I think that's where Juan and I completely misunderstood the role of Mojito, and why we kept trying to make 
Y.Storage abstract out both 
browser databases and server databases.

I also think that this is where a lot of developers like us, that have backgrounds from frameworks like Django and Rails, got really confused about 
Mojito, and didn't adopt it for our own projects.  

I think we need to write a blog post that expands on Zakas' post, how Mojito relates to it, and how Django/Rails/PHP developers should use Mojito today.  
I also think this blog post needs to be at the front of the Mojito Getting Started guide, and that developers should know that Mojito should be built on 
top of an existing service architecture.

For Modown: I realize 
now that I was trying to solve the wrong problem for the past two months, but I think I know how to better approach it now.
