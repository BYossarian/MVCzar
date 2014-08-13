describe("The Model Class", function() {
    
    it("inherits from Emitter", function() {

        var model = new MVCzar.Model();

        expect(model instanceof MVCzar.Emitter).toBe(true);

    });

    it("allows events to be set on initialisation", function() {

        var result = false,
            that = null;

        var model = new MVCzar.Model({
            events: {
                someEvent: function() {
                    result = true;
                    that = this;
                }
            }
        });

        model.emit('someEvent');

        expect(result).toBe(true);
        expect(that).toBe(model);

    });

    it("has a getter and setter", function() {

        var model = new MVCzar.Model();

        var obj = {
            qwe: 123
        };

        // setting a single property
        model.set("someProp", "someValue");

        expect(model.get("someProp")).toBe("someValue");
        expect(model.get("anotherProp")).toBeUndefined();

        // setting many properties
        model.set({
            anotherProp: "hey",
            moreProp: true
        });

        expect(model.get("someProp")).toBe("someValue");
        expect(model.get("anotherProp")).toBe("hey");
        expect(model.get("moreProp")).toBe(true);

        // setting an object
        model.set("object", obj);

        expect(model.get("object")).toBe(obj);

    });

    it("allows properties to be set on initialisation", function() {

        var model = new MVCzar.Model({
            initial: {
                someProp: "hey",
                someNum: 42
            }
        });

        expect(model.get("someProp")).toBe("hey");
        expect(model.get("someNum")).toBe(42);
        expect(model.get("anotherProp")).toBeUndefined();

    });

    it("will return a copy of the object's properties when .get() is used without arguments", function() {

        var obj = {
                someProp: "hey",
                someNum: 42,
                subObj: {
                    blah: "blah"
                }
            };

        var model = new MVCzar.Model({
            initial: obj
        });

        // should return copy
        expect(model.get()).toEqual(obj);
        expect(model.get()).not.toBe(obj);

        // a deep copy
        expect(model.get().subObj).toEqual(obj.subObj);
        expect(model.get().subObj).not.toBe(obj.subObj);

    });

    it("allows properties to be unset", function() {

        var model = new MVCzar.Model({
            initial: {
                someProp: "hey",
                someNum: 42
            }
        });

        // at first you see me ....
        expect(model.get("someProp")).toBe("hey");
        expect(model.get("someNum")).toBe(42);

        // and now you don't ....
        model.unset("someProp");
        expect(model.get("someProp")).toBeUndefined();
        expect(model.get("someNum")).toBe(42);

    });

    it("allows chaining of set and unset", function() {

        var model = new MVCzar.Model({
            initial: {
                someProp: "hey",
                someNum: 42
            }
        });

        // chaining of set and unset
        model.unset("someNum").set("qwe", 123).set("asd", {prop: "erty"}).unset("qwe");

        expect(model.get()).toEqual({
            someProp: "hey",
            asd: {
                prop: "erty"
            }
        });

    });

    it("emits change events when changing properties", function() {

        var changeAny = 0,
            changeParticular = 0;

        var model = new MVCzar.Model({
            events: {
                change: function() {
                    changeAny++;
                },
                "change:someProp": function() {
                    changeParticular++;
                }
            }
        });

        model.set("aProp", "value");
        expect(changeAny).toBe(1);

        // setting the same value shouldn't trigger a change event
        model.set("aProp", "value");
        expect(changeAny).toBe(1);

        model.set("someProp", "someValue");
        expect(changeAny).toBe(2);
        expect(changeParticular).toBe(1);

        model.set("aProp", "different");
        expect(changeAny).toBe(3);
        expect(changeParticular).toBe(1);

        // setting multiple properties at once
        // should only trigger change event once
        // also maintaining same value for someProp
        // so shouldn't trigger that particular handler
        model.set({
            someProp: "someValue",
            tooManyProps: 10
        });
        expect(changeAny).toBe(4);
        expect(changeParticular).toBe(1);

        // unsetting a property that doesn't exist shouldn't trigger hander
        model.unset("notAProp");
        expect(changeAny).toBe(4);
        expect(changeParticular).toBe(1);

        // unsetting a property
        model.unset("aProp");
        expect(changeAny).toBe(5);
        expect(changeParticular).toBe(1);

        // unsetting a particular property
        model.unset("someProp");
        expect(changeAny).toBe(6);
        expect(changeParticular).toBe(2);


    });

    it("won't emit change events for initialisation values", function() {

        var changeAny = 0,
            changeParticular = 0;

        var model = new MVCzar.Model({
            events: {
                change: function() {
                    changeAny++;
                },
                "change:someProp": function() {
                    changeParticular++;
                }
            },
            initial: {
                someProp: "abc",
                another: true
            }
        });

        // no events should have fired
        expect(changeAny).toBe(0);
        expect(changeParticular).toBe(0);

        // although the event handlers are there ...
        model.set("someProp", "someValue");
        expect(changeAny).toBe(1);
        expect(changeParticular).toBe(1);

        model.set("aProp", "different");
        expect(changeAny).toBe(2);
        expect(changeParticular).toBe(1);

    });

    it("allows you to set/unset properties silently", function() {

        var changeAny = 0,
            changeParticular = 0;

        var model = new MVCzar.Model({
            events: {
                change: function() {
                    changeAny++;
                },
                "change:someProp": function() {
                    changeParticular++;
                }
            }
        });

        // check handlers are attached
        model.set("aProp", "value");
        expect(changeAny).toBe(1);

        model.set("someProp", "someValue");
        expect(changeAny).toBe(2);
        expect(changeParticular).toBe(1);

        // silently change a single value
        model.set("aProp", "value2", true);
        model.set("someProp", "someValue2", true);
        expect(changeAny).toBe(2);
        expect(changeParticular).toBe(1);

        // silently change multiple values
        model.set({
            someProp: "someValue",
            tooManyProps: 10
        }, true);
        expect(changeAny).toBe(2);
        expect(changeParticular).toBe(1);

        // silently unset a value
        model.unset("someProp", true);
        expect(changeAny).toBe(2);
        expect(changeParticular).toBe(1);

    });
    
    it("has a .toJSON() method that allows JSON.stringify to be used directly", function() {

        var obj = {
                someProp: "hey",
                someNum: 42,
                subObj: {
                    blah: "blah"
                }
            };

        var model = new MVCzar.Model({
            initial: obj
        });

        // calling .toJSON() directly will actually return a copy
        expect(model.toJSON()).toEqual(obj);
        expect(model.toJSON()).not.toBe(obj);

        // which will give the correct output when JSON.stringify is used
        expect(JSON.stringify(model)).toBe(JSON.stringify(obj));

    });

});