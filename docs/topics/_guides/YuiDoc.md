#YUI Doc
YUI Doc is a Python application used at build time to generate API documentation for JavaScript code.YUI Doc is comment-driven and supports a wide range of JavaScript coding styles. The output of YUI Doc is API documentation formatted as a set of HTML pages including information about methods, properties, custom events and inheritance for JavaScript objects.

We are integrating YUI Doc in the Mojito framework so that we can use it to create the Documentation for individual mojits, applications or mojito itself.


### Open-Source Approach

YUI Doc relies on Python and four external libraries. If you have Python and [setuptools](http://pypi.python.org/pypi/setuptools) installed, you can use easy_install to install the latest versions of these libraries.

We do not need to install the yuidoc package because we have already added the package to mojito/lib/server/libs. 

### External libraries

Following are the four libraries with links to their project pages:

  [setuptools](http://peak.telecommunity.com/DevCenter/setuptools): distribution/packaging tools
  
  [Pygments](http://pygments.org/): Python syntax highlighter
  
  [SimpleJSON](http://svn.red-bean.com/bob/simplejson/tags/simplejson-1.3/docs/index.html): JSON toolkit for Python
  
  [Cheetah](http://www.cheetahtemplate.org/): Python templating engine
 
#Steps to Install these libraries:

1. Check to see if setuptools is installed.
    Execute this command:
        
        which easy_install
    
    If it returns something, it's installed skip to step #3.


2. Install Setup Tools:
    Extract the archive in ext and install the package
        
        sudo python setup.py install (no sudo needed for cygwin or windows)

    setuptools
       
        tar xfvz setuptools-0.6c9.tar.gz
        cd setuptools-0.6c9
        sudo python setup.py install

3. Install the dependencies

Before doing this we need to Check is easy_install is in its latest version:
        
        sudo easy_install -U setuptools 
        
Now we can install the rest of the libraries        
        
        easy_install pygments
        easy_install Cheetah
        easy_install simplejson

You are now ready to run YUI Doc on mojits, apps and mojito


###Using YUI Doc with mojito

###Note: Currently we have not used the commenting rules specified by YUI Doc, so you will get an error while running YUI Doc on the entire mojito, but  it works fine for individual mojits and app. In order to get the api documentation of your apps or mojits you need to write comments in your code according to the rules specified in the [yuidoc page](http://developer.yahoo.com/yui/yuidoc/) 

In order to document the mojito framework, you can go to the mojito-trunk and run,

        mojito docs
        
This creates an artifacts directory in mojito-trunk, where you can find the documentation

        artifacts/framework/docs  
        
In order to document a mojito application you can go to the application directory and run

        mojito docs app [app-name]
        
This creates an artifacts directory in the application directory, where you can find the documentation

        artifacts/docs/app
        
In order to document a mojit you can go to the application directory and run

        mojito docs mojit mojits/[mojit-name]

This creates an artifacts directory in the application directory, where you can find the documentation

        artifacts/docs/mojit
        
###Example of Using YUIDoc

In order to see YUIDoc working on a mojito application, we can go to the basic-yql app in getting-started-guide-part2 and run,

        mojito docs app basic-yql
        
We can see the modules, classes and files in the index.html file in artifacts/docs/app/basic-yql/
        
