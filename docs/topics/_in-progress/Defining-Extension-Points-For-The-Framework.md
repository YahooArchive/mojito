# Defining Extension Points for the framework

Following are the extension points for the framework:

1) AC Plugins (also called addOns)
 
2) Middleware 

3) Libraries (Node + YUI)
 
4) View Engines
 
5) Mojits
 
6) Client-Server Comms 
 
7) Actions

###Application Directory Structure

Based on these extension points we have come up with an **Application Directory** structure as follows:

         MyApp/
         
              Libs/
         
                  middleware/
                  
                  autoload/
                  
where,

1) **middleware** directory will contain middleware (Node.js modules) that the developer wants to inject in the Mojito framework.

2) **autoload** directory will contain libraries (YUI and node) that the framework will load automatically. So by default we will load                                                                                                                                                               
everything that is present in the autoload directory.

###NOTE:
Anything that is not present in the autoload directory, the developer has to take care that it is loaded. (e.g specify it in the requires part)

**Advantage**: We can allow the developer to not load acAddons if he does not want to.

###Mojit Directory Structure

        MyMojit/

              Libs/

                   autoload/ 

where,

1) **autoload** directory will contain libraries (YUI and node) that the framework will load automatically.


#Miscellaneous 

###Namespace Proposal

All the files in the framework will follow a naming convention that will allow the developer to find out where the file will run.
     E.g consider controller.js
     
     It can be:
     
     controller.client.js
     
     controller.server.js
     
     controller.common.js 

If nothing is specified then the default is ‘.server’ for security reasons. This will allow us to easily separate the logic for client and server.

**Concerns**: What if the controller has shared state?

###Important Points

1) Mojit can require middleware from the “Warehouse” but cannot have its own middleware.

2) Anything put in acAddons is directly attached to the actionContext

###libs v lib

We need to have lib folder in the application directory because npm expects it to be there.
So for now we have decided on having both the lib and the Libs folder in the application directory.
All the third party libraries will go in the Libs folder as discussed previously.

#Propositions

###ToDo

1) Middleware Config: Externalize the middleware and allow developers to add middleware through a middleware config. 

2) Framework Config

