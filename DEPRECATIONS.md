
As Mojito matures, there are a number of changes/cleanups that we want to make
that break backwards-compatilibity.  However, we don't want to prevent you from
upgrading in a timely fashion, so that you can use the latest and greatest
version of mojito.

To enable both our needs and yours, we need a clear, predictable path into the
future.



Currently Deprecated
====================


### Deprecated but Available

* (2012-08-14) Controllers that declare themselves using `Y.mojito.controller = {...}`
should be changed to use `Y.namespace('mojito.controllers')[NAME] = {...}`. The previously
used pattern will clobber the controllers if you are using `shareYUIInstance: true`.

* (2012-08-13) Files ending in `.mu.html` will eventually not be rendered
out-of-the-box by Mojito. All downstream projects should use the Handlebars
view engine by renaming all view files from `.mu.html` to `.hb.html`. All examples
and archetypes have already been updated, so new projects will use Handlebars
by default. To rename all views in your project, run the following in your project's
root folder:
`find . -name "*.mu.html" -exec sh -c 'mv "$1" "$(echo "$1" | sed s/mu.html\$/hb.html/)"' _ {} \;`

* (2012-04-23) The `.guid` member of Mojito metadata (such as binder metadata)
is going away.  Often there's an associated member which more specifically
expresses the intent of the unique ID (for example `.viewId` or `.instanceId`).

* (2012-04-23) `ac.dispatch()` will be going away.  (This already emits a
warning.)  Currently the best alternative is `ac._dispatch()`.


### Deprecated with Warnings
nothing for mojito 0.3


### Removed
nothing for mojito 0.3



Deprecation Process
===================
A feature will move through the following phases, at a well-defined pace.


### "Deprecated but Available" Phase

* The documentation is updated to mark the feature as "deprecated".
* The feature will be in this phase until the end of the quarter year.
(It's possible that a feature won't spend much time in this phase, if it is
deprecated near the end of the quarter.)


### "Deprecated with Warning" Phase

* The feature is removed from the documentation.
* Mojito emits a warning (if possible) if the feature is used.
* The feature will spend a full quarter in this phase.


### "Removed" Phase

* The feature (and warning) is removed from Mojito.


### Example

* On 2012-04-19 (Q2), Mojito deprecates the "foo" feature by saying so in the
documentation.  This event is also mentioned in an email and/or blog post for
the next release.  It's also added to this DEPRECATIONS.md document.

* On the next release after 2012-06-30 (end of Q2), Mojito removes
documentation for feature "foo" and adds a warning if someone tries to use
feature "foo".  It is still documented in this DEPRECATIONS.md document.

* On the next releaes after 2012-09-30 (end of Q3), Mojito removes feature
"foo" (and the associated warnings).  It is mentioned as "removed" in this
DEPRECATIONS.md document.



