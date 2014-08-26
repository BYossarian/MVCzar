// MVCzar v0.8.0 by Ben Jackson
//
// https://github.com/BYossarian/MVCzar

var MVCzar = (function() {

    "use strict";

    var exports = {};

    // ***************************************
    // Emitter Class
    // ***************************************

    function Emitter(events) {

        this._handlers = {};
        this._observers = {};

        if (events) {
            // add initial events
            for (var event in events) {
                if (events.hasOwnProperty(event)) {
                    this.on(event, events[event]);
                }
            }
        }

    }

    Emitter.prototype.on = function(event, handler) {

        if (this._handlers[event]) {
            this._handlers[event].push(handler);
        } else {
            this._handlers[event] = [handler];
        }

        return this;

    };

    Emitter.prototype.off = function(event, handler) {
        
        if (this._handlers[event]) {
            if (handler) {
                // remove all instances of handler

                var i = this._handlers[event].length;

                while (i--) {
                    
                    if (this._handlers[event][i] === handler) {
                        this._handlers[event].splice(i,1);
                    }

                }

            } else {
                // clear out all event handlers for stated event

                while (this._handlers[event].length) {
                    this._handlers[event].pop();
                }

            } 
        }

        return this;

    };

    Emitter.prototype.addObserver = function(observer, event, handler) {

        if (this._observers[event]) {
            
            this._observers[event].push({
                observer: observer,
                handler: handler
            });

        } else {
            
            this._observers[event] = [{
                observer: observer,
                handler: handler
            }];

        }

        return this;

    };

    Emitter.prototype.removeObserver = function(observer, event, handler) {

        if (this._observers[event]) {

            var i = this._observers[event].length;
            
            while (i--) {
                
                // check observer
                if (this._observers[event][i].observer === observer) {

                    // if no specific handler is listed, or if the handlers match, remove it
                    if (typeof handler === "undefined" || this._observers[event][i].handler === handler) {
                        this._observers[event].splice(i,1);
                    }

                }

            }

        }

        return this;

    };

    Emitter.prototype.emit = function(event, eventData) {

        // build the event object
        eventData = eventData || {};
        eventData.target = this;
        eventData.type = event;

        // call all handlers for stated event
        if (this._handlers[event]) {

            for (var i = 0, l = this._handlers[event].length; i<l; i++) {
                this._handlers[event][i].call(this, eventData);
            }


        }

        // inform all observers of the stated event
        if (this._observers[event]) {

            for (var j = 0, k = this._observers[event].length; j<k; j++) {
                this._observers[event][j].handler.call(this._observers[event][j].observer, eventData);
            }

        }

        return this;

    };

    exports.Emitter = Emitter;

    // ***************************************
    // Model Class
    // ***************************************

    function Model(options) {

        options = options || {};

        // set any events 
        Emitter.call(this, options.events);

        this._props = {};  // the actual raw data to be held by the model

        // set initial values (silently - i.e. without triggering event handlers)
        if (options.initial) {
            this.set(options.initial, true);
        }

        if (options.setup) {
            options.setup.call(this);
        }

    }

    // Model inherits from Emitter
    Model.prototype = Object.create(Emitter.prototype);

    Model.prototype.set = function(property, value, silent) {

        var changed = false,
            eventData = null,
            data = null;

        function setOne(property, value, silent) {
            
            // only fire change event if value actually changes
            if (this.get(property) !== value) {
                
                // build event data
                eventData = {};
                eventData.oldValue = this._props[property];
                eventData.newValue = value;

                // change value
                this._props[property] = value;
                
                if (!silent) {
                    this.emit('change:' + property, eventData);
                }

                changed = true;
            }

        }

        // accepts an object and a boolean (silent) or
        // a property name, a value and a boolean (silent)
        // so rename variables accordingly
        if (property instanceof Object) {
            // set multiple properties
            
            data = property;
            silent = !!value;

            for (property in data) {
                if (data.hasOwnProperty(property)) {

                    value = data[property];

                    setOne.call(this, property, value, silent);

                }
            }

        } else {
            // set a single property

            setOne.call(this, property, value, silent);
        }

        if (changed && !silent) {
            this.emit('change');
        }

        return this;

    };

    Model.prototype.get = function(property) {
        
        if (typeof property === "string") {

            // make sure the property actually exists on the _props instance
            // and isn't inherited from Object
            if (this._props.hasOwnProperty(property)) {
                return this._props[property];
            } else {
                return;
            }

        } else {

            // return a copy of the _props object
            return JSON.parse(JSON.stringify(this._props));

        }

    };

    Model.prototype.unset = function(property, silent) {

        if (this._props.hasOwnProperty(property)) {

            var oldValue = this._props[property];
            
            delete this._props[property];
            
            if (!silent) {
                this.emit("change:" + property, {
                    oldValue: oldValue
                });
                this.emit('change');
            }

        }

        return this;

    };

    Model.prototype.toJSON = function() {

        // return a copy of the _props object to be used in JSON.stringify
        return this.get();

    };

    exports.Model = Model;

    // ***************************************
    // ModelList Class
    // ***************************************

    function ModelList(options) {

        var that = this;

        options = options || {};

        // set any events 
        Emitter.call(this, options.events);

        // set default data values for models
        this._defaults = options.defaults;

        // set setup function for models
        this._setup = options.modelSetup || function() {};

        if (options.setup) {
            options.setup.call(this);
        }

        this._models = [];

        // silently add the models to the collection
        if (options.models) {
            options.models.forEach(function(model) {
                that.add(model, true);
            });
        }

    }

    // ModelList inherits from Emitter
    ModelList.prototype = Object.create(Emitter.prototype);

    // define length property of ModelList
    Object.defineProperty(ModelList.prototype, "length", {
        get: function() {
            return this._models.length;
        }
    });

    // add a model to the ModelList
    ModelList.prototype.add = function(initialData, silent) {

        var newModel = null,
            addingOldModel = (initialData instanceof Model);

        if (addingOldModel) {

            newModel = initialData;

        } else {

            // build initial data for the new model
            var data = {};

            for (var prop in this._defaults) {
                if (this._defaults.hasOwnProperty(prop)) {
                    data[prop] = this._defaults[prop];
                }
            }

            // allow no initialData (meaning just add a default model)
            // in which case the only possible argument would be the
            // boolean silent
            if (typeof initialData !== "boolean") {

                for (prop in initialData) {
                    if (initialData.hasOwnProperty(prop)) {
                        data[prop] = initialData[prop];
                    }
                }

            } else {
                silent = initialData;
            }

            newModel = new Model({
                initial: data,
                setup: this._setup
            });

        }

        this._models.push(newModel);

        if (!silent) {

            this.emit("add", {
                model: newModel
            });

            // only emit add on model when adding a pre-exisiting model
            if (addingOldModel) {

                newModel.emit("add", {
                    modelList: this
                });

            }

        }

        return newModel;

    };

    // remove all instances of a model from a ModelList
    ModelList.prototype.remove = function(model, silent) {

        var i = this._models.length;

        while(i--) {
            if (this._models[i] === model) {
                this._models.splice(i, 1);
            }
        }

        if (!silent) {

            this.emit("remove", {
                model: model
            });

            model.emit("remove", {
                modelList: this
            });

        }

        return model;

    };

    ModelList.prototype.getModelAt = function(index) {

        return this._models[index];

    };

    ModelList.prototype.set = function(property, value, silent) {

        this._models.forEach(function(model) {
            model.set(property, value, silent);
        });

        return this;

    };

    ModelList.prototype.unset = function(property, silent) {

        this._models.forEach(function(model) {
            model.unset(property, silent);
        });

        return this;

    };

    ModelList.prototype.toJSON = function() {

        var listCopy = [];

        this._models.forEach(function(model) {
            listCopy.push(model.toJSON());
        });

        return listCopy;

    };

    ModelList.prototype.forEach = function(func) {

        var that = this;

        this._models.forEach(function(model, i) {

            func.call(that, model, i, that);
            
        });

        return this;

    };

    // return an Array (not a ModelList) of the models that
    // pass the filter
    ModelList.prototype.filter = function(func) {

        var that = this;

        return this._models.filter(function(model, i) {

            return func.call(that, model, i, that);

        });

    };

    exports.ModelList = ModelList;

    // ***************************************
    // View Class
    // ***************************************

    // find the right name for the element.matches() function for checking if an
    // element matches a given selector
    var matchesSelectorName = (function(testElem) {

        var funcNames = ["matches", "webkitMatchesSelector", "mozMatchesSelector", "msMatchesSelector", "oMatchesSelector"],
            i = funcNames.length;

        while (i--) {
            if (testElem[funcNames[i]]) {
                return funcNames[i];
            }
        }

    })(HTMLElement.prototype);

    function View(options) {

        options = options || {};

        // set any events on the view itself
        Emitter.call(this, options.events);

        // set the view's element
        if (options.elem instanceof HTMLElement) {
            this.elem = options.elem;
        } else if (typeof options.elem === "string") {
            this.elem = document.querySelector(options.elem) || document.createElement('div');
        } else {
            this.elem = document.createElement('div');
        }

        // set the view's render function
        this._render = options.render || function() {};

        // set the view's model
        if (options.model) {
            this.model = options.model;
        }

        // set up the initial event handlers for the DOM
        this._DOMEvents = {};

        // _DOMEventHandler needs to exist on the instance (rather than prototype)
        // since it needs binding to the particular View instance (and therefore
        // varies from instance to instance)
        this._DOMEventHandler = (function(e) {

            var handlerArray = this._DOMEvents[e.type];

            if (handlerArray) {
                for (var i = 0, l = handlerArray.length; i<l; i++) {
                    if (e.target[matchesSelectorName](handlerArray[i].selector)) {
                        handlerArray[i].handler.call(this, e);
                    }
                }
            }

        }).bind(this);

        // expect options.DOMEvents to be an array of arrays: [event, selector, handler]
        if (options.DOMEvents) {
            for (var j = 0, len = options.DOMEvents.length; j<len; j++) {
                this.addDOMEvent(options.DOMEvents[j][0], options.DOMEvents[j][1], options.DOMEvents[j][2]);
            }
        }

        if (options.setup) {
            options.setup.call(this);
        }

    }

    // View inherits from Emitter
    View.prototype = Object.create(Emitter.prototype);

    View.prototype.observe = function(observee, event, handler) {

        if (observee.addObserver) {

            observee.addObserver(this, event, handler);

        }

        return this;

    };

    View.prototype.unobserve = function(observee, event, handler) {

        if (observee.removeObserver) {

            observee.removeObserver(this, event, handler);

        }

        return this;

    };

    View.prototype.setRender = function(render) {

        this._render = render;

        return this;

    };

    View.prototype.render = function() {

        this._render.apply(this, arguments);

        return this;

    };

    View.prototype.addDOMEvent = function(event, selector, handler) {

        if (this._DOMEvents[event] && this._DOMEvents[event].length) {
            this._DOMEvents[event].push({
                selector: selector,
                handler: handler
            });
        } else {
            // either first handler for this event or first one to be added back
            // after previously emptying array
            this._DOMEvents[event] = (this._DOMEvents[event] || []);
            this._DOMEvents[event].push({
                selector: selector,
                handler: handler
            });

            // need to (re)attach DOM event handler
            this.elem.addEventListener(event, this._DOMEventHandler, false);
        }

        return this;

    };

    View.prototype.removeDOMEvent = function(event, selector, handler) {

        if (this._DOMEvents[event]) {

            if (!selector && !handler) {
                // remove all handlers for that event

                while (this._DOMEvents[event].length) {
                    this._DOMEvents[event].pop();
                }

            } else {

                var i = this._DOMEvents[event].length;
                            
                while (i--) {
                                
                    // check selector
                    if (this._DOMEvents[event][i].selector === selector) {

                        // if no specific handler is listed, or if the handlers match, remove it
                        if (typeof handler === "undefined" || this._DOMEvents[event][i].handler === handler) {
                            this._DOMEvents[event].splice(i,1);
                        }

                    }

                }

            }

            // deattach DOM event handler if no more handlers are registered for this event
            if (!this._DOMEvents[event].length) {
                this.elem.removeEventListener(event, this._DOMEventHandler, false);
            }

        }

        return this;

    };

    exports.View = View;

    // ***************************************
    // Router Interface
    // ***************************************

    // there'll only be one Router instance so no need to set up a constructor
    var Router = (function() {

        var useHistory = false,
            started = false,
            Router = Object.create(Emitter.prototype);

        Emitter.call(Router);

        var initialPath = 0,  // webkit bug: use initial path to bypass popstate firing on page load
            currentPath = "",    // used to pass the old path to the route event
            root = "";

        // methods to be defined once .start() has been called
        var getNormalisedPath, go, replace;

        function getHash() {
            // return hash with starting "#/" and trailing slash removed

            return window.location.hash.replace(/^#/, '').replace(/^\//, '').replace(/\/$/, '');
        }

        function getPath() {
            // return path with root and trailing slash removed

            var pathname = window.location.pathname.replace(/\/$/, ''); // removing trailing slash

            if (pathname.indexOf(root) === 0) {
                return pathname.slice(root.length).replace(/^\//, '');  // remove root from pathname & starting /
            }

            return pathname.replace(/^\//, '');
        }

        function refresh(e) {

            var path = getNormalisedPath(),
                route = path.split('/');

            // webkit bug: use initial path to bypass popstate firing on page load
            // basically, it's used so that the 2nd call to refresh after page load
            // will be ignored if the current path is still the same as the first
            // call to refresh. Also, checks for the existance of a passed argument
            // so second refresh is only ignored if it comes from a state change event
            // as opposed to calling router.refresh()
            if (path === initialPath && e) {
                initialPath = 0;
                return;
            }
            initialPath = 0;

            Router.emit("route", {
                oldPath: currentPath,
                path: "/" + path,
                route: route
            });

            if (currentPath !== "/" + path) {
                Router.emit("pathchange", {
                    oldPath: currentPath,
                    path: "/" + path,
                    route: route
                });
            }

            currentPath = "/" + path;

        }

        function hasStarted() {

            return started;

        }

        function start(options) {
            
            options = options || {};

            // root defaults to /
            root = options.root || "/";
            // normalise root so that it starts with a slash but doesn't end with one
            // also a root of "/" will be converted to ""
            root = root.replace(/^\/?/, '/').replace(/\/?$/, '');

            var hash = getHash(),
                path = getPath();

            useHistory = !options.useHash;

            // define methods based on useHistory flag

            // gets path (relative to root) without starting or trailing /
            getNormalisedPath = useHistory ? getPath : getHash;

            // navigate to a particular URL
            go = useHistory ? 
                    function(newPath) {
                        window.history.pushState(null, document.title, root + newPath);

                        // pushState doesn't trigger a popstate event so have to trigger manually:
                        refresh();
                    } :
                    function(newPath) {
                        window.location.hash = "#" + newPath;
                    };

            // replace the current URL
            replace = useHistory ? 
                    function(newPath) {
                        window.history.replaceState(null, document.title, root + newPath);

                        // replaceState doesn't trigger a popstate event so have to trigger manually:
                        refresh();
                    } :
                    function(newPath) {
                        window.location.replace("#" + newPath);
                    };

            // normalise current (i.e. initial) url
            if (hash && path) {
                // both a hash and a path
                // in this case, use path and ignore hash
                if (useHistory) {

                    window.history.replaceState(null, document.title, root + "/" + path);

                } else {
                    
                    window.location.replace((root || "/") + "#/" + path); // may trigger page reload

                }

            } else if (hash && useHistory) {
                // has a hash, not a path in a browser with history support

                window.history.replaceState(null, document.title, root + "/" + hash);

            } else if (path && !useHistory) {
                // has a path, not a hash in a browser without history support

                window.location.replace((root || "/") + "#/" + path); // may trigger page reload

            }

            // load current (i.e. initial) page content
            refresh(true);   // need to send true value here to sidestep webkit bug

            // webkit bug: use initial path to bypass popstate firing on page load
            initialPath = getNormalisedPath();

            // event handlers for url change
            if (useHistory) {
                window.addEventListener('popstate', refresh, false);
            } else {
                window.addEventListener('hashchange', refresh, false);
            }

            // make methods publicly available
            Router.go = go;
            Router.replace = replace;
            Router.refresh = refresh;
            Router.getPath = function() {
                return "/" + getNormalisedPath();
            };

            started = true;

            return Router;

        }

        Router.start = start;
        Router.hasStarted = hasStarted;
        // until the Router has been started, these methods do nothing:
        Router.go = Router.replace = Router.refresh = Router.getPath = function() {};

        return Router;

    })();

    exports.Router = Router;

    return exports;

})();