MVCzar = (function() {

    "use strict";

    var exports = {};

    // ***************************************
    // Event Emitter Interface
    // ***************************************

    function Emitter(events) {

        this._handlers = {};

        if (events) {
            // add initial events
            for (var event in events) {
                if (events.hasOwnProperty(event)) {
                    this.on(event, events[event]);
                }
            }
        }

    };

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

    Emitter.prototype.emit = function(event) {

        // call all handlers for stated event
        if (this._handlers[event]) {
            for (var i=0, l=this._handlers[event].length; i<l; i++) {
                this._handlers[event][i].call(this);
            }
        }

        return this;

    };

    exports.Emitter = Emitter;

    // ***************************************
    // Model Interface
    // ***************************************

    function Model(setup) {

        setup = setup || {};

        // set any events 
        Emitter.call(this, setup.events);

        this._props = {};

        // set initial values (silently - i.e. without triggering event handlers)
        if (setup.initial) {
            this.set(setup.initial, true);
        }

    }

    // Model inherits from Emitter
    Model.prototype = Object.create(Emitter.prototype);
    Model.prototype.constructor = Model;

    Model.prototype.set = function(a, b, c) {

        // accepts an object and a boolean (silent) or
        // a property name, a value and a boolean (silent)

        if (a instanceof Object) {
            // set multiple properties

            var changed = false;

            for (var prop in a) {
                if (a.hasOwnProperty(prop)) {

                    // only fire change event if value actually changes
                    if (this._props[prop] !== a[prop]) {
                        this._props[prop] = a[prop];
                        if (!b) {
                            // silent flag is false
                            this.emit('change:' + prop);
                        }
                        changed = true;
                    }

                }
            }

            if (changed && !b) {
                this.emit('change');
            }

        } else {
            // set a single property

            // only fire change event if value actually changes
            if (this._props[a] !== b) {
                this._props[a] = b;
                if (!c) {
                    this.emit('change:' + a);
                    this.emit('change');
                }
            }
        }

        return this;

    };

    Model.prototype.get = function(property) {
        
        if (typeof property === "string") {
            return this._props[property];
        } else {
            // return a copy of the _props object
            return JSON.parse(JSON.stringify(this._props));
        }

    };

    Model.prototype.unset = function(property, silent) {

        if (typeof this._props[property] !== "undefined") {
            
            delete this._props[property];
            
            if (!silent) {
                this.emit("change:" + property);
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

    return exports;

})();