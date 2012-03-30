# Mojito on the Browser

If specified, the Mojito framework _serves itself_ into the browser.

This means that the majority of the Mojito framework code all the mojits you write runs within the browser.

To deploy Mojito to the browser, you must specify a configuration option to the `HTMLFrameMojit`:

    "deployToClient": "true"

See the doc on `HTMLFrameMojit` below for an example.

This document will describe a Mojito application as it is deployed to a browser.

## Mojits on the Browser

### How To Deploy Mojito to the Browser

There is a special mojit type built into Mojito: the `HTMLFrameMojit`.

#### HTMLFrameMojit

The `HTMLFrameMojit` is a top-level mojit container you can use to deploy your Mojito application to the browser. Let's take a look at a typical `application.json` file without an `HTMLFrameMojit` and the output that gets sent within an HTTP response to a client. 

    [
        {
            "settings": [ "master" ],
            "specs": {
                "noframe": {
                    "type": "Slinger"
                }
            }
        }
    ]

When you hit a URL in a browser that executes this mojit, you'll get a response body that looks like this:

    <h1>What is up?</h1>
    <h2>I'm not in an HTMLFrameMojit.</h2>

It is only the output of the mojit itself. There is no document, no `<html>`, no `<body>`, etc. All you get is the mojit's direct markup. 
    
You want to create your main pages (the documents you're serving to browsers) in a way that creates proper document markup, as well as deploying the Mojito framework to the client. To do this, you need to wrap your top-level mojits within an `HTMLFrameMojit`:

    [
        {
            "settings": [ "master" ],
            "specs": {
                "frame": {
                    "type": "HTMLFrameMojit",
                    "config": {
                        "deployToClient": "true"
                        "child": {
                            "type": "Slinger"
                        }
                    }
                }
            }
        }
    ]

<div style="margin:1em; padding:0.4em; border:1px solid #F86; color:#844; background-color:#EEF;">
    <h4>NOTE:</h4>
    Mojito will <strong>not</strong> be deployed to the browser unless <em>"deployToClient": "true"</em> is specified. This is a security measure to ensure you don't accidentally sent sensitive code to your clients.
</div>

### What gets deployed?

By default, only mojit _binders_ are deployed to the client. If you would like your entire mojit deployed to the client, you can specify this in your `definition.json` file:

    "deployToClient": "true"
    
For example, here is a `definition.json` file:

    [
        {
            "settings": ["master"],
            "name": "ChickenMojit",
            "version": "0.0.2",
            "deployToClient": "true"
        }
    ]

All mojit code will be delivered to the client and will be runnable within the browser Mojito runtime.

### What Parts are Client-only?

Each mojit may have a `binder` directory, which contains one or many JavaScript files. All these files will be deployed to the client, but will never run within the server environment. This is because they are only there to bind event handlers to the DOM for each mojit you create. More information on `binders` can be found [here](/guides.binders/).

Mojit binders are the only parts of a mojit that are only run within the client.

### Serving Static Files

#### Mojito App Assets

You can create an `assets` directory within your Mojito application, and all files and folders you place here will be made available from the path `http://yourserver.com/app/`.

#### Mojit Assets

As mentioned above, *all files* within your mojits directory are currently serve-able from your Mojito application. One reason for this is because the JavaScript files making up your mojit must be deployed to the browser. (Future versions of Mojito will have a much more secure static file serving strategy.)

So, if you have a Mojito app in `/Users/yourface/myapps/mojito-app`, all the mojit folders in the `mojits/` directory in your application will be served by name. For example, if you had an image you wanted to server inside a mojit called `FooMojit`, and it was located at `/Users/yourface/myapps/mojito-app/mojits/FooMojit/assets/crazy-kitty.jpg`, you can expect it to be available from your running Mojito application here:

    http://localhost:8666/mojits/FooMojit/assets/crazy-kitty.jpg

