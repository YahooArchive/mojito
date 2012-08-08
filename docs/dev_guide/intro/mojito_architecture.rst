===================
Mojito Architecture
===================

.. role:: raw-html(raw)
   :format: html

This chapter attempts to give you a general understanding of the Mojito architecture as a whole 
and the Mojito Framework. We'll first look at graphics to understand the relationships 
of the discrete components within the architecture and then briefly discuss some of the core
components. We hope that having a better understanding of how the pieces work 
together and what role they play will help you design, build, and debug your applications.

.. _mj_arch-overview:

Overview
--------

Before looking at inside of Mojito, let's take a look at where Mojito lives and exists in the Web 
application world. The diagram below illustrates how Mojito runs on different clients,
uses the HTTP for client-server communication, and accesses data. The sections following the 
diagram discuss the clients, Mojito applications, and getting data in greater detail.


.. image:: images/mojito_architecture.png
   :scale: 85 %
   :alt: Diagram showing Mojito running on different clients.
   :height: 574px
   :width: 459px
   :align: center 
  

:raw-html:`<br clear="all"/>`

.. _overview-clients:

Clients and Runtimes
####################

Mojito was designed with the goal to run in multiple runtime environments and to
support online and offline experiences. The following are the supported client/runtime 
environments:
                
- **Mobile browser:** - supports an HTML-based online experience and may also 
  support an HTML5-based offline experience.
- **Desktop browser:** - assumed to be always connected and support an 
  HTML-based online experience.
- **Native client:** - deployed as packaged applications, wrapping native 
  chrome around an HTML5-based experience.
  
.. _overview-apps:  

Mojito Applications
###################

In short, a Mojito application is a set of module/widget configurations together with a configuration 
for the application and the framework/application code. The application is packaged to be 
distributed and deployed as a unit, and as such, it is deployment-independent. The modules/widgets 
used by an application may be included directly within the package or may be included by reference 
from a cloud-based repository.

See also `Mojito Applications <./mojito_apps.html>`_ for a more in-depth discussion.

.. _overview-data:

Data
####

Data is typically obtained with YQL. In most cases, the data will be requested by the application 
and processed in some way before it is transferred to the client. Native applications, however, 
may make data requests directly to YQL. JSON is expected to be by far the most prevalent format 
for data retrieved from YQL.

.. _mj_arch-framework:

Mojito Framework
----------------

The Mojito Framework consists of both a module and an application framework, which taken together
provide the infrastructure upon which applications are built. The framework includes the base 
component, the event system, and management of navigation, views, and configuration. 

This diagram shows the relationships among the Mojito application, the 
Mojito Core, mojits, and the runtime environments. The subsequent sections describe the 
elements in the diagram in more detail.


.. image:: images/mojito_framework.png
   :scale: 85 %
   :alt: Diagram showing the relationships between the Mojito application, Mojito core, mojits,
         and runtime environments.
   :height: 513px
   :width: 718px
   :align: center


:raw-html:`<br clear="all"/>`

.. _framework-server_runtime:

Mojito Server Runtime
#####################

The base server-only capabilities that support the Mojito Core include, but are not 
limited to, the following:

- HTTP Server 
- Routing Rules
- Config Loader
- Disk-Based Loader

.. _framework-client_runtime:

Mojito Client Runtime
#####################

The base client-only capabilities that support the Mojito Core include, but are not limited 
to, the following:

- URL-Based / JSON-Based Loader
- Local Storage / Cache Access

.. _framework-core:

Mojito Core
###########

The Mojito Core is the common functionality of Mojito that runs on both server and client. The core 
is initialized (or bootstrapped, if you will) by either the Mojito Server Runtime or the Mojito 
Client Runtime, as appropriate. Elements of the Mojito Core include, but are not limited to, 
the following:

- Front Controller
- Dispatcher
- Mojit Registry

.. _framework-mojit_container:

Mojit Container
###############

The Mojit Container is where mojit instances live. This is analogous, in a traditional Java Web 
framework, to the servlet container, but runs in both server and client contexts. It includes, but 
is not limited to, the following:

- Mojit Lifecycle

.. _framework-mojit_container:

ActionContext Object
#####################

The ``ActionContext`` object is available to a mojit instance to enable it to do its work. 
Each mojit instance receives a unique instance of this object. In a traditional Web framework, this 
is analogous to the request context (except, of course, that there is no request object when the 
mojit is running within the client).

.. _framework-mojito_services:

Mojito Services
###############

TBD - Need a short description and list of components if any.


.. _framework-model_factory:

Model Factory
#############

The Model Factory creates the model instance for a mojit instance based on that mojit's 
configuration (and perhaps on its corresponding mojit definition). The use of a factory mechanism 
allows the framework to easily interject proxies and other intermediaries, in a manner that is 
transparent to the mojit developer. In addition, a mojit developer may choose to provide a custom 
factory, although the need for this is not expected except in rare circumstances.

.. _framework-view_factory:

View Factory
############

Similarly to the Model Factory, the View Factory creates the view instance for a mojit instance
based on a mojit's configuration and on its corresponding mojit definition. 

The following standard view types are provided, along with the capability for a mojit developer 
to define a custom view type:

- Template View
- DOM View
- Hybrid View

.. _framework-view_cache:

View Cache
##########

The View Cache provides applications with the ability to cache. For example, because of the View
Cache, an application can cache partially rendered views to improve performance in situations 
where the same partial rendering is frequently requested.

.. _mj_arch-framework_components:


Mojito Framework Components
---------------------------

Box A in the flowchart below represents the Application Container at its most basic level. Here 
we focus on the servicing of page requests and user interactions, and ignore for the 
moment issues such as packaging and deployment. Again, we examine more closely 
the framework components in the following sections.

.. image:: images/mojito_components.png
   :alt: Flowchart showing how page requests are handled and responses returned.
   :height: 540px
   :width: 457px
   :align: center
   :target: ./images/mojito_components.png
  

:raw-html:`<br clear="all"/>`

.. _framework_components-dispatcher:

Dispatcher/Mapper
#################

This component processes incoming URLs and determines how to map these 
to the appropriate application functionality. This is similar in many ways to the front controller 
used in most action frameworks. The target functionality is almost always provided by a mojit, 
and thus, the Dispatcher primarily maps URLs to mojit identifiers.

.. _framework_components-nav_manager:

Navigation Manager
##################

In some applications, it is important that certain *destinations* within 
the application be URL addressable (e.g., to allow the user to create bookmarks to specific points 
or states within the application). This is most easily managed through a central Navigation 
Manager that both assists the Dispatcher in resolving URLs and provides URL management facilities 
to application functionality. Note that many sites and simpler applications have no need of 
URL management, so this component may not be used in such cases.

.. _framework_components-mojit_host:

Mojit Host
##########

The mojits themselves are not part of the Application Container per se. The container
provides the facilities to host, support, and manage mojits while the mojits collectively provide 
the functionality of the application. See also `Mojits <mojito_apps.html#mojits>`_ for more 
information about mojits.

.. _framework_components-app_config:

Application Configuration
#########################

A particular instance of the Application Container is initialized 
through an externally managed configuration. This configuration includes, among other things, 
the mappings that drive the Dispatcher, the identification of necessary mojit registries, and 
other environmental parameters. The Application Configuration specifically excludes 
deployment parameters, however, because it is part of the packaged, deployable application, and 
thus, must not be tied to a particular deployment environment.



