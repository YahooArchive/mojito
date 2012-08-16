

=================================
Basic Configuring of Applications
=================================

**Time Estimate:** 10 minutes

**Difficulty Level:** Beginning

Summary
#######

This example shows how to configure a mojit and the routing for your application.

Implementation Notes
####################

The ``application.json`` file is used to specify the mojits that your application can use. The example ``application.json`` below specifies that the application use the mojit ``SimpleMojit``.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "specs": {
         "simple": {
           "type": "SimpleMojit"
         }
       }
     }
   ]

The routing configuration for Mojito applications is contained in ``routes.json``. In this example ``routes.json``, the Mojito server is told to call the ``index`` method in the controller when an HTTP GET is called on the root path.

.. code-block:: javascript

   [
     {
       "settings": [ "master" ],
       "simple": {
         "verbs": ["get"],
         "path": "/",
         "call": "simple.index"
       }
     }
   ]

The ``index`` method is a canned method in the controller when you create a mojit. To learn how to create view templates that get data from the controller, 
see `Creating a Simple View with Handlebars <simple_view_template.html>`_.

Setting Up this Example
#######################

To set up and run ``simple_config``:

#. Create your application.

   ``$ mojito create app simple_config``

#. Change to the application directory.

#. Create your mojit.

   ``$ mojito create mojit SimpleMojit``

#. To specify that your application use ``SimpleMojit``, replace the code in ``application.json`` with the following:

   .. code-block:: javascript

      [
        {
          "settings": [ "master" ],
          "specs": {
            "simple": {
              "type": "SimpleMojit"
            }
          }
        }
      ]

#. To configure routing, create the file ``routes.json`` with the following:

   .. code-block:: javascript

      [
        {
          "settings": [ "master" ],
          "simple": {
            "verbs": ["get"],
            "path": "/",
            "call": "simple.index"
          }
        }
      ]

#. From the application directory, run the server.

   ``$ mojito start``

#. To view your application, go to the URL:

   http://localhost:8666

Source Code
###########

- `Simple Config Application <http://github.com/yahoo/mojito/tree/master/examples/developer-guide/simple_config/>`_


