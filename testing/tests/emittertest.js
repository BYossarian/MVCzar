describe("The Emitter Class", function() {
    
    it("allows you to attach event handlers and emit events", function() {
        var emitter = new MVCzar.Emitter(),
            result = false,
            that = null;

        emitter.on('someEvent', function() {
            result = true;
            that = this;
        });

        emitter.emit('someEvent');

        expect(result).toBe(true);
        expect(that).toBe(emitter);
    });

    it("allows you to attach events on initilisation", function() {
        var result = false,
            that = null;

        var emitter = new MVCzar.Emitter({
            someEvent: function() {
                result = true;
            }
        });

        emitter.emit('someEvent');

        expect(result).toBe(true);
    });

    it("allows you to attach multiple different events", function() {
        var resultA = false,
            resultB = false,
            resultC = false,
            resultD = false;

        var emitter = new MVCzar.Emitter({
            eventA: function() {
                resultA = true;
            },
            eventB: function() {
                resultB = true;
            }
        });

        emitter.on('eventC', function() {
            resultC = true;
        });

        emitter.on('eventD', function() {
            resultD = true;
        });

        emitter.emit('eventA');
        emitter.emit('eventB');
        emitter.emit('eventC');

        expect(resultA).toBe(true);
        expect(resultB).toBe(true);
        expect(resultC).toBe(true);
        expect(resultD).toBe(false);
    });

    it("allows multiple handlers on the same event to be fired in order", function() {
        var result = "";

        var emitter = new MVCzar.Emitter({
            someEvent: function() {
                result += "A";
            }
        });

        emitter.on('someEvent', function() {
            result += "B";
        });

        emitter.on('someEvent', function() {
            result += "C";
        });

        emitter.emit('someEvent');

        expect(result).toBe("ABC");
    });
    
    it("allows you to deattch event handlers", function() {
        var resultA = false,
            resultB = false,
            resultC = false,
            resultD = false;

        var emitter = new MVCzar.Emitter({
            eventA: function() {
                resultA = !resultA;
            },
            eventB: function() {
                resultB = !resultB;
            }
        });

        var handler = function() {
            resultD = !resultD;
        };

        emitter.on('eventC', function() {
            resultC = !resultC;
        });

        emitter.on('eventD', handler);

        // check all events are attached
        emitter.emit('eventA');
        emitter.emit('eventB');
        emitter.emit('eventC');
        emitter.emit('eventD');

        expect(resultA).toBe(true);
        expect(resultB).toBe(true);
        expect(resultC).toBe(true);
        expect(resultD).toBe(true);

        // turn off some events
        emitter.off('eventA');
        emitter.off('eventC');

        emitter.emit('eventA');
        emitter.emit('eventB');
        emitter.emit('eventC');
        emitter.emit('eventD');

        expect(resultA).toBe(true);
        expect(resultB).toBe(false);
        expect(resultC).toBe(true);
        expect(resultD).toBe(false);

        // turn of events using reference to function
        emitter.off('eventD', handler);

        emitter.emit('eventA');
        emitter.emit('eventB');
        emitter.emit('eventC');
        emitter.emit('eventD');

        expect(resultA).toBe(true);
        expect(resultB).toBe(true);
        expect(resultC).toBe(true);
        expect(resultD).toBe(false);
    });

    it("allows you to detach particular handlers or all handlers from an event", function() {
        var resultA = false,
            resultB = false,
            resultC = false;

        var emitter = new MVCzar.Emitter({
            someEvent: function() {
                resultA = !resultA;
            }
        });

        var handler = function() {
            resultB = !resultB;
        };

        emitter.on('someEvent', handler);

        emitter.on('someEvent', function() {
            resultC = !resultC;
        });

        // check all events are attached
        emitter.emit('someEvent');

        expect(resultA).toBe(true);
        expect(resultB).toBe(true);
        expect(resultC).toBe(true);

        // deattach handler using reference
        emitter.off('someEvent', handler);

        emitter.emit('someEvent');

        expect(resultA).toBe(false);
        expect(resultB).toBe(true);
        expect(resultC).toBe(false);

        // deattach all handlers
        emitter.off('someEvent');

        emitter.emit('someEvent');

        expect(resultA).toBe(false);
        expect(resultB).toBe(true);
        expect(resultC).toBe(false);
    });

    it("will maintain the event order when deattching handlers", function() {
        var result = "";

        var emitter = new MVCzar.Emitter({
            someEvent: function() {
                result += "A";
            }
        });

        var handler = function() {
            result += "B";
        };

        emitter.on('someEvent', handler);

        emitter.on('someEvent', function() {
            result += "C";
        });

        emitter.off('someEvent', handler);

        emitter.emit('someEvent');

        expect(result).toBe("AC");
    });

    it("will deattch multiple equivalent handlers", function() {
        var result = "";

        var emitter = new MVCzar.Emitter();

        var handler = function() {
            result += "A";
        },
        handler2  = function() {
            result += "B";
        };

        emitter.on('someEvent', handler);
        emitter.on('someEvent', handler);
        emitter.on('someEvent', handler2);

        emitter.emit('someEvent');

        expect(result).toBe("AAB");

        // remove all handler references from the emitter
        emitter.off('someEvent', handler);

        emitter.emit('someEvent');

        expect(result).toBe("AABB");
    });

    it("allows you to use chaining", function() {
        var resultA = false,
            resultB = false,
            resultC = false;

        var emitter = new MVCzar.Emitter({
            eventA: function() {
                resultA = !resultA;
            }
        });

        emitter.on('eventB', function() {
            resultB = !resultB;
        }).on('eventC', function() {
            resultC = !resultC;
        }).emit('eventA');

        expect(resultA).toBe(true);
        expect(resultB).toBe(false);
        expect(resultC).toBe(false);

        emitter.off('eventA').emit('eventA').emit('eventB').emit('eventC');

        expect(resultA).toBe(true);
        expect(resultB).toBe(true);
        expect(resultC).toBe(true);
    });

    it("passes an event object to the handler", function() {

        var eventObj = null;

        var emitter = new MVCzar.Emitter({
            someEvent: function(e) {
                eventObj = e;
            }
        });

        emitter.emit("someEvent");
        expect(eventObj).toEqual({
            target: emitter,
            type: "someEvent"
        });
        // not sure on internal workings of .toEqual() but
        // we want e.target to be an actual reference to the emitter so:
        expect(eventObj.target).toBe(emitter);

        // pass custom data to the event object
        emitter.emit("someEvent", {hello: "there"});
        expect(eventObj).toEqual({
            hello: "there",
            target: emitter,
            type: "someEvent"
        });

    });

    it("allows objects to observe it's events using .addObserver()", function() {

        var emitter = new MVCzar.Emitter(),
            observer = {},
            that = null,
            eventObj = null;

        emitter.addObserver(observer, "anEvent", function(e) {
            that = this;
            eventObj = e;
        });

        emitter.emit("anEvent");

        // observer hears the event and the handler is called with 'this' referencing the observer
        expect(that).toBe(observer);

        // the event object get's passed to the handler
        expect(eventObj).toEqual({
            type: "anEvent",
            target: emitter
        });
        // not sure on internal workings of .toEqual() but
        // we want e.target to be an actual reference to the emitter so:
        expect(eventObj.target).toBe(emitter);

    });

    it("will notify the observers in the order that they were registered", function() {

        var emitter = new MVCzar.Emitter(),
            observer = {},
            result = "",
            handler = function() {
                result += "B";
            };

        emitter.addObserver({}, "anEvent", function() {
            result += "A";
        });

        emitter.addObserver(observer, "anEvent", handler);

        emitter.addObserver(observer, "anEvent", function() {
            result += "C";
        });

        emitter.emit("anEvent");

        expect(result).toBe("ABC");

    });

    it("allows observers to stop watching an event using .removeObserver()", function() {

        var emitter = new MVCzar.Emitter(),
            observer = {},
            result = "",
            handler = function() {
                result += "B";
            };

        emitter.addObserver(observer, "anEvent", function() {
            result += "A";
        });

        emitter.addObserver(observer, "anEvent", handler);

        emitter.addObserver(observer, "anEvent", function() {
            result += "C";
        });

        emitter.addObserver({}, "anEvent", function() {
            result += "D";
        });

        emitter.emit("anEvent");

        // everything working ok ....
        expect(result).toBe("ABCD");

        // remove one observer with a particular handler
        emitter.removeObserver(observer, "anEvent", handler);
        emitter.emit("anEvent");
        expect(result).toBe("ABCDACD");

        // remove all handlers for a particular observer
        emitter.removeObserver(observer, "anEvent");
        emitter.emit("anEvent");
        expect(result).toBe("ABCDACDD");


    });

});