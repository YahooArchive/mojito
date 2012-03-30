# Serving Static Files

## From Mojito Applications

**TODO**

## From Mojit Directories

All files within a mojit directory are available for static serving. This is a development state, at the moment, and we plan on making this more secure in the future.

If you want to server a mojit file, you can simple write a path like this:

    /mojits/YourMojit/path
    
So, if you created a file called `./myapp/MyMojit/assets/css/main.css`, you can server that file from:

    /mojits/MyMojit/assets/css/main.css

