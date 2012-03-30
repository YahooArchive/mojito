# Libraries

How to include some other JavaScript into your Mojito app.

## Node.js Libraries

### In Mojits

Each mojit directory may have a `lib` directory, and you can place node modules here. They can be referenced directly from within your mojit code.

### In Mojito Applications

Each app may have a `server` directory, and you can place node modules here. They can also be referenced directly from within your mojit code.

### YUI Modules

All JavaScript files (except those in the `lib` folder) will be loaded by Mojito. So you can put any YUI module anywhere inside a mojit folder, and it will be available to your mojits. 
