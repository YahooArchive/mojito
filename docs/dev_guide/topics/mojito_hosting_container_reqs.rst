=======================================================
Startup Requirements for Mojito in Hosting Environments
=======================================================


Mojito v0.4.5 and Earlier Versions
==================================

Version 0.4.5 and earlier versions rely exclusively on 'mojito start' to run a
new Mojito server instance which means the index.js and server.js files are both
required. Applications using Mojito version 0.4.5 and prior versions should use
index.js and server.js files matching those below.

index.js
--------

.. code-block:: javascript

   /*
   * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
   * Copyrights licensed under the New BSD License.
   * See the accompanying LICENSE file for terms.
   */


   /*jslint anon:true, sloppy:true, nomen:true, node:true*/

   process.chdir(__dirname);

   /**
   * @param {object} config The configuration object containing processing params.
   * @param {object} token Token used to identify the application.
   */
   module.exports = function(config, token) {
     var app = require('./server.js');

     // Signal the application is ready, providing the token and app references.
     process.emit('application-ready', token, app);
   };

server.js
---------


.. code-block:: javascript

   /*
   * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
   * Copyrights licensed under the New BSD License.
   * See the accompanying LICENSE file for terms.
   */

   /*jslint anon:true, sloppy:true*/

   /**
   * Returns a new Mojito server instance.
   */
   module.exports = require('mojito').createServer();

Mojito v0.4.6
=============

NOT RECOMMENDED
---------------

Version 0.4.6 is the first version of Mojito to support ``npm start`` in addition
to ``mojito start`` as a means for starting up a new Mojito server instance.

Mojito version 0.4.6 alters Mojito's startup logic to support 'npm start' as a
common startup mechanism and expands the number of hosting containers Mojito was
compatible with.

index.js
########

The ``index.js`` file does not change for 0.4.6.

server.js
#########

For version 0.4.6 the ``server.js`` file changes due to changes in how a Mojito
server instance is created and the API of that instance. In this version of
Mojito there is a ``start`` method on the Mojito server which is used to launch a
new server. Unfortunately, while this approach works it retains some limitations
and created an issue with at least one hosting container. For that reason
version 0.4.6 is not recommended, instead we recommend using version 0.4.7 or
greater.

.. code-block:: javascript

   /*
   * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
   * Copyrights licensed under the New BSD License.
   * See the accompanying LICENSE file for terms.
   */

   /*jslint anon:true, sloppy:true*/

   /**
   * Create and start a new Mojito server/application.
   */

   var Mojito = require('mojito');
   var app = Mojito.createServer();

   module.exports = app.start();


Mojito v0.4.7
=============


Version 0.4.7 repaired an issue with a specific hosting container and replaced
the ``start`` method with a ``listen`` wrapper method and a ``getHttpServer`` method
to provide access to the Node.js ``http.Server`` instance being used. This
approach makes it possible for Mojito to support an even broader range of
hosting containers and startup requirements.

Applications running version 0.4.7 or greater no longer require an index.js
file, although one is still provided. Such applications must use a server.js
file as specified below.

index.js
--------

OBSOLETE, but still present, in this version. Remove from any applications using
0.4.7 or greater.

server.js
---------

.. code-block:: javascript

   /*
   * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
   * Copyrights licensed under the New BSD License.
   * See the accompanying LICENSE file for terms.
   */

   /*jslint anon:true, sloppy:true, nomen:true*/

   process.chdir(__dirname);

   /*
   * Create the MojitoServer instance we'll interact with. Options can be passed
   * using an object with the desired key/value pairs.
   */
   var Mojito = require('mojito');
   var app = Mojito.createServer();

   // ---------------------------------------------------------------------------
   // Different hosting environments require different approaches to starting the
   // server. Adjust below to match the requirements of your hosting environment.
   // ---------------------------------------------------------------------------

   /*
   * Manhattan
   *
   module.exports = function(config, token) {
     process.emit('application-ready', token, app.getHttpServer());
   };
   */

   /*
   * Localhost and others where the default port/host combinations work.
   * You can provide port, host, callback parameters as needed.
   */
   module.exports = app.listen();


Mojito v0.4.8 and Later
=======================

Version 0.4.8 solidifies the changes made in version 0.4.7, removing the
index.js file from any application archetypes (the files used to create new
applications) and removing unneccessary commented-out code in the ``server.js``
file. As with 0.4.7 applications, you should remove the ``index.js`` file from any
applications using 0.4.8 or later versions of Mojito and update your server.js
file to match the one provided here.

index.js
--------

OBSOLETE and no longer present in this version. Remove from any applications
using 0.4.7 or greater.

server.js
---------

.. code-block:: javascript

   /*
   * Copyright (c) 2011-2012, Yahoo! Inc.  All rights reserved.
   * Copyrights licensed under the New BSD License.
   * See the accompanying LICENSE file for terms.
   */

   /*jslint anon:true, sloppy:true, nomen:true*/

   process.chdir(__dirname);

   /*
   * Create the MojitoServer instance we'll interact with. Options can be passed
   * using an object with the desired key/value pairs.
   */
   var Mojito = require('mojito');
   var app = Mojito.createServer();

   // ---------------------------------------------------------------------------
   // Different hosting environments require different approaches to starting the
   // server. Adjust below to match the requirements of your hosting environment.
   // ---------------------------------------------------------------------------

   module.exports = app.listen();


