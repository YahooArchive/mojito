

=============
Client Object
=============

When Mojito starts up, the global object ``Y.mojito.client`` that represents the client runtime is 
created. The ``client`` object can be used to pause and resume mojits running within the page.  
See `Class Y.mojito.Client <../../api/classes/Y.mojito.Client.html>`_ in the 
`Mojito API Reference <../../api/>`_ for more details.

Pausing Mojits
##############

From the ``client`` object, you call the ``pause`` method as seen below to prevent any code from 
executing outside of the individual binders (within the Mojito framework) and to call ``onPause()`` 
on all binders.

``Y.mojito.client.pause()``

Resuming Mojits
###############

From the ``client`` object, you call the ``resume`` method as seen below to immediately execute all 
cached operations and notify all of the binders through the ``onResume`` function.

``Y.mojito.client.resume()``


