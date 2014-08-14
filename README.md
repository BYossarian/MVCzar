MVCzar
======

An MV* framework aiming for lightweight &amp; IE9+

There's already plenty of great MV* frameworks out there. This is just a personal exercise, but if you want to use it ... hey, go nuts.

Usage
-----  

### Event Emitter Class  


```javascript
// initialisation options - all optional
var events = {
    "someEventName" : function () {
        // the event handler
    }
}

// create a new event emitter
var emitter = new MVCzar.Emitter(events);

// attach an event handler
emitter.on("eventName", function(eventObject) {
    
    // eventObject.type === "eventName"
    // eventObject.target === emitter
    // eventObject.data === optionally event data
    
    // 'this' references the emitter
    
});

// detach an event handler
emitter.off("eventName", handler);

// detach all handlers for an event
emitter.off("eventName");

// add an observer that listens to events
emitter.addObserver(observerObject, "eventName", function(e) {
    
    // 'this' references the observer
    
});

// remove a particular handler for an observer of a particular event
emitter.removeObserver(observerObject, "eventName", handler);

// remove all of an observer's handlers for a particular event
emitter.removeObserver(observerObject, "eventName");

// emit an event to trigger any listening handlers
// optional eventData will be passed to the handler
// via eventObject.data
emitter.emit(event [, eventData]);

// all emitter methods return the emitter instance
// and so can be chained. For example:
emitter.on("event", handler)
        .addObserver(observer, "event", handler)
        .emit("event");
```

### Model Class  

A useful wrapper for your data.  
It inherits from the Emitter Class.

```javascript
// initialisation options - all optional
var options = {
    events: {
        "eventName": handler
    },
    initial: {
        "propertyName": value
    }
}

// create a new model
var model = new MVCzar.Model(options);

// set the value of some data
// if this causes an actual change in the value then
// model will emit 'change' and 'change:propertyName'
// events. If the silent flag is set to true, then
// no events will be emitted
model.set("propertyName", value[, silent]);

// get the value of some property
model.get("propertyName");

// get a copy of all the data
model.get();

// unset/delete a property from the model.
// again, assuming the property previously had a value
// 'change' and 'change:propertyName' will be emitted
// unless silent is true
model.unset("propertyName"[, silent]);

// model has a .toJSON() method which returns a
// copy of all the data
model.toJSON();

// meaning you can use JSON.parse() meaningfully:
JSON.parse(model);

// .set(), .unset() both return the model instance meaning
// you can chain them (together with the inherited Emitter
// methods):
model.set("property", value)
        .unset("property");
```

### View Class 

A useful wrapper for your HTML elements. Typical usage is that it observes some model for changes and updates the presented content when needed.

```javascript

// initialisation options - all optional
// - elem is the view's HTMLElement. If no valid argument is given
//     a new div element will be created for the view.
// - render is the function used to draw the contents of elem
// - DOMEvents attaches events to elem that will call the provided
//     handler whenever the event target matches the given CSS selector
var options = {
    elem: HTMLElement *or* "selector",
    render: function() {
        // 'this' will reference the view instance
    },
    model: someModelInstance,
    DOMEvents: [["event", "selector", handler], [...], ...]
}

// create a new view
var view = new MVCzar.View(options);

// access the view's associated HTML element
view.elem;

// access the view's associated model
view.model;

// render the content of view.elem
view.render();

// change the render function of the view
view.setRender(function() {
    // 'this' will reference the view instance
});

// observe an emitter instance
view.observe(emitter, "event", handler);

// stop observing an emitter for some "event" with
// some handler. If handler is omitted then all
// observation handlers for that event on that 
// emitter will be removed.
view.unobserve(emitter, "event"[, handler]);

// listen to DOM events from within view.elem
view.addDOMEvent("eventName", "selector", handler);

// detach handlers for DOM events
// either handler or both selector and handler can be
// omitted
view.removeDOMEvent("eventName"[, "selector"[, handler]]);

// all view methods can be chained. e.g.:
view.setRender(someFunction)
        .render()
        .addDOMEvent("eventName", "selector", handler);

```

### The Router Interface  

An interface for creating single page web apps. It allows you to change
the URL and emits "route" events when URL changes occur.  
It inherits from the Emitter class.

```javascript
// typical usage is to observe the router for "route" events
someView.observe(MVCzar.Router, "route", function(eventObject) {
    
    // eventObject.data.oldPath - the path before the routing
    // eventObject.data.path - the new path after the routing
    // eventObject.data.route - an array consisting of strings
    //                          formed by splitting the new path
    //                          along forward slash characters
    
});

// options for the Router
// - useHash indicates whether or not to use hash fragments for URLS
//     and listen to the hash change event rather than making use of
//     the newer History API. Default: false
// - root is the path root of your app. All paths used by MVCzar.Router
//     will be relative to this. Default: the URL path when the router
//     is started.
var options = {
    useHash: aBooleanFlag,
    root: ""
};

// start the Router listening for URL changes
// it will normalise the current URL according to options.root
// if options.useHash is true then a page reload may occur
// in order to normalise the URL
var router = MVCzar.Router.start(options);

// determine if the router has been started
router.hasStarted();

// once started the following methods will be available on router:

// navigate to some path within your app - "route" will be triggered
router.go("/some/path");

// replace the current path in the history stack by the new path given
// - "route" will be triggered
router.replace("/some/path");

// emit "route" for the current path without making changes to the
// history stack so that any views observing router can update
router.refresh("/some/path");

// get the current path (relative to the root path of your app)
router.getPath();
```