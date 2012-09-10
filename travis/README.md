Mojito testing with TravisCI
====================================

This directory contains the scripts used to automate Mojito testing with TravisCI for our bleeding
branches, specifically those using the latest YUI version.

Scripts
-------

   * `before.sh` - Runs in the `before_install` build step to clone and create the latest YUI npm package
   * `install.sh` - Runs in the `install` build step to do an `npm install` for mojito dependencies
      and `npm install` on YUI's `build-npm` (created from the above step)
   * `travis.sh` - Runs the travis tests locally for testing, not used in the Travis build.

Running the test locally
-------------------------

Clone the repo, then:

    cd mojito;
    ./travis/travis.sh