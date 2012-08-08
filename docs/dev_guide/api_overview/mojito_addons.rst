

======
Addons
======

The Action Context uses a mechanism called addons to provide functionality that lives both on the server and client. Each addon provides additional functions through a namespacing object,  
which is appended to the ``ActionContext`` object that is available in every controller function. See the `ActionContext Class <../../api/classes/ActionContext.html>`_ for the addon classes.

Addons allow you to do the following:

- access assets, such as CSS and JavaScript files
- get configuration information
- get and set cookies
- localize content
- access query and response parameters
- get and set HTTP headers
- create URLs

Syntax
######

Using the ActionContext object ``ac``, you would call a ``{method}`` from an ``{addon}`` with the following syntax:

``ac.{addon}.{method}``

For example, to get all of the query string parameters, you would use the ``Params`` addon with the ``url`` method as seen here:

``ac.params.url()``

Addon Examples
##############

The following code examples use the addons in parentheses:

- `Dynamically Adding CSS to Different Devices <../code_exs/dynamic_assets.html>`_  (``Assets``)
- `Using Cookies <../code_exs/cookies.html>`_ (``Cookie``)
- `Using Query Parameters <../code_exs/query_params.html>`_ (``Params``)
- `Generating URLs <../code_exs/generating_urls.html>`_ (``Url``)
- `Internationalizing Your Application <../code_exs/i18n_apps.html>`_ (``Intl``)
- `Using Multiple Mojits <../code_exs/multiple_mojits.html>`_ (``Composite``)

Creating Addons
###############

Because customized addons are not part of the standard API, but an extension of the API, the instructions for creating addons can be found in  `Creating New Addons <../topics/mojito_extensions.html#creating-new-addons>`_.


