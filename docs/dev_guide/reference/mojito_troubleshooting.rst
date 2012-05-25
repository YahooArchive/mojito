

===============
Troubleshooting
===============

The following provide answers to common Mojito problems. See also the `Mojito: FAQ <../faq/>`_.

Issues
######

* :ref:`I am trying get config values using "ac.config.get(key)", but Mojito is giving me an error or the value is not found. <moj_config_error>`  
* :ref:`I am getting the message that my mojit controller is not an object? What does this mean and how do I fix the problem? <moj_controller_not_obj>`
* :ref:`I am including CSS files in the assets object of "application.json", so why are my CSS files not being inserted into the HTML page? <moj_asset_insertion>`
* :ref:`My binder is getting deployed to the client, so why isn't the "init" function being called? <moj_binder_init>`
* :ref:`I am getting Mustache rendering errors. Is this a client-side or server-side issue with Mustache, and can it be fixed? <mustache_rendering_error>`
* :ref:`Why can't my controller access the YUI modules in the "autoload" directory? <controller_access_autoload>`
* :ref:`Why am I getting the error message "EADDRINUSE, Address already in use" when I try to start Mojito? <eaddriuse_err>`
* :ref:`When I execute child mojits with "composite.execute", the views are being rendered, but the binders are not executed. Why? <binder_not_executing>`


Solutions
#########

.. _moj_config_error:

**Q:** *I am trying get config values using 'ac.config.get(key)', but Mojito is giving me an error or the value is not found.*


**A:** 
Try inspecting the ``spec`` object that is found in the ``ActionContext`` object for the key. If ``ac`` is the ``ActionContext`` object,
you can access the ``specs` object with the following: ``ac.app.config.specs``. 

If you need to examine the entire ``ActionContext`` object, you can use the ``console.log(ac)`` or the following code:

.. code-block:: javascript

   Object.keys(ac).forEach(function(n) {
      console.log(n + ' value:');
      console.log(ac[n]);
   });

------------

.. _moj_controller_not_obj:

**Q:** *I am getting the message that my mojit controller is not an object? What does this mean and how do I fix the problem?*

**A:**
Usually, this error occurs when one of your controllers has a syntax error. Use the ``mojito`` command with the option ``jslint`` as seen below to check the app and your mojits for errors:

::

   $ mojito jslint app {app_name}
   $ mojito jslint mojit {app_name}/mojits/{mojit_name}

The output from the above commands will tell you if you have errors, but not where the errors are. Use your own developer tools or manually check your controllers for errors and then run your application again.

------------

.. _moj_asset_insertion:

**Q:** *I am including CSS files in the assets object of 'application.json', so why are my CSS files not being inserted into the HTML page?*

**A:** 
To configure Mojito to automatically insert the asset files specified in the ``assets`` object of ``application.json``, you must use the ``HTMLFrameMojit``. The ``HTMLFrameMojit`` will insert the assets into the ``head`` element if you include the assets in the ``top`` array or at the bottom within the ``body`` element if you include the assets in the ``bottom`` array. 

In the example ``application.json`` below, the ``simple.css`` file will be included in the ``head`` element of the HTML page. Note that the ``assets`` object is inside the ``frame`` mojit instance. which is of type ``HTMLFrameMojit``.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "specs": {
         "frame": {
           "type": "HTMLFrameMojit", 
           "config": {
             "child" : { 
               "type" : "framed" 
             },
             "assets": { 
               "top": {
                 "css": [
                   "/static/framed/assets/index.css" 
                 ]
               }
             }
           }
         }
       }
     }
   ]

------------

.. _moj_binder_init:

**Q:** *My binder is getting deployed to the client, so why isn't the "init" function being called?*

**A:**
Most likely Mojito was not able to create a ``Y.one`` instance to wrap the DOM nodes that wrap mojit instances because the root element of the mojit's view template
didn't have the ``id`` value ``{{mojit_view_id}}``. If your view template wraps its content in a ``<div>`` element, assign the value  ``{{mojit_view_id}}`` to
the ``id`` attribute of that ``<div>`` element: ``<div id={{mojit_view_id}}>``

------------


.. _mustache_rendering_error:

**Q:** *I am getting Mustache rendering errors. Is this a client-side or server-side issue with Mustache, and can it be fixed?*

**A:**
The issue is not with Mustache on the client, but with the Mustache rendering engine on the
server. The Mustache rendering engine inspects the prototypes during the template processing stage. If you
remove the prototype inspecting, e.g., creating object literals, the Mustache engine cannot process the data for the templates.

Although not a permanent solution, you can use ``Y.mix`` to ensure that your data has a prototype so that
your templates can be rendered. Try doing the following: ``ac.done(Y.mix({},data));``

------------

.. _controller_access_autoload:

**Q:** *Why can't my controller access the YUI modules in the "autoload" directory?*

**A:**
A common problem is that the YUI module is missing the `affinity <../reference/glossary.html#affinity>`_
or that the affinity is incorrect. If your controller has been deployed to the client, your YUI module should 
have the ``client`` or ``common`` affinity. If your controller is running on the server, the YUI module should have
the affinity ``server`` or ``common``. Also, confirm that the registered name of the YUI module, i.e., 
the string passed to ``YUI.add``, is the same as the string passed to the ``requires`` array.

------------

.. _eaddriuse_err:

**Q:** *Why am I getting the error message "EADDRINUSE, Address already in use" when I try to start Mojito?*

**A:**
You probably have an instance of mojito already started/running (check the output from ``ps aux | grep mojito``). 
Either stop the instance that is running or start a new instance on another port such as in ``mojito start 8667``.

------------

.. _binder_not_executing:

**Q:** *When I execute child mojits with "composite.execute", the views are being rendered, but the binders are not executed. Why?*

**A:**
The problem may be that you need to pass the "meta" information to your children as well. This is where the binder metadata *bubbles up* 
from the children.  Try doing the following:

.. code-block:: javascript 
  
   ...
   ac.composite.execute(cfg, function(data, meta){
     ac.done(data, meta);
   });
   ...
   
   
