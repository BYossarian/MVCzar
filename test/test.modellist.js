describe("The ModelList Class", function() {
    
    it("inherits from Emitter", function() {

        var modelList = new MVCzar.ModelList();

        expect(modelList instanceof MVCzar.Emitter).to.be.true;

    });

    it("allows events to be set on initialisation", function() {

        var result = false,
            that = null;

        var modelList = new MVCzar.ModelList({
            events: {
                someEvent: function() {
                    result = true;
                    that = this;
                }
            }
        });

        modelList.emit('someEvent');

        expect(result).to.be.true;
        expect(that).to.equal(modelList);

    });

    it("has a setup function that is run on initialisation", function() {

        var result = false,
            that = null;

        var modelList = new MVCzar.ModelList({
            setup: function() {

                result = true;
                that = this;

            }
        });

        expect(result).to.be.true;
        expect(that).to.equal(modelList);

    });

    it("allows models to be added using .add() and retrieved by index", function() {

        var modelList = new MVCzar.ModelList();

        var model1 = modelList.add(),
            model2 = modelList.add();

        expect(modelList.getModelAt(0)).to.equal(model1);
        expect(modelList.getModelAt(1)).to.equal(model2);

    });

    it("allows models to be added on initialisation", function() {

        var model1 = new MVCzar.Model(),
            model2 = new MVCzar.Model();

        var modelList = new MVCzar.ModelList({
            models: [model1, model2]
        });

        expect(modelList.getModelAt(0)).to.equal(model1);
        expect(modelList.getModelAt(1)).to.equal(model2);

    });

    it("allows models to be created used .add() with default data and a common setup function", function() {

        var that = null;

        var modelList = new MVCzar.ModelList({
            modelSetup: function() {

                that = this;

            },
            defaults: {
                prop1: 100,
                prop2: "value"
            }
        });

        // add a default model
        var model1 = modelList.add();

        expect(modelList.getModelAt(0)).to.equal(model1);
        expect(that).to.equal(model1);
        expect(model1.get('prop1')).to.equal(100);
        expect(model1.get('prop2')).to.equal("value");

        // add a model with some fresh data
        var model2 = modelList.add({
            prop2: "different",
            prop3: false
        });

        expect(modelList.getModelAt(1)).to.equal(model2);
        expect(that).to.equal(model2);
        expect(model2.get('prop1')).to.equal(100);
        expect(model2.get('prop2')).to.equal("different");
        expect(model2.get('prop3')).to.not.be.true;

    });

    it("triggers the 'add' event on itself and the model when a model is added, but it can be silenced", function() {

        var addedTo = null,
            adding = null,
            count = 0;

        var model1 = new MVCzar.Model({
                events: {
                    add: function(e) {
                        addedTo = e.modelList;
                    }
                }
            }),
            model2 = new MVCzar.Model();

        var modelList = new MVCzar.ModelList({
            events: {
                add: function(e) {
                    
                    count++;
                    adding = e.model;

                }
            }
        });

        var addedModel = modelList.add(model1);
        expect(addedModel).to.equal(model1);
        expect(addedTo).to.equal(modelList);
        expect(adding).to.equal(model1);
        expect(count).to.equal(1);

        // can add silently
        modelList.add(model2, true);
        expect(adding).to.equal(model1);
        expect(count).to.equal(1);

        var model3 = modelList.add();
        expect(adding).to.equal(model3);
        expect(count).to.equal(2);

        // can add default models silently
        var model4 = modelList.add(true);
        expect(adding).to.equal(model3);
        expect(count).to.equal(2);

    });

    it("has a read-only length property", function() {

        var model1 = new MVCzar.Model(),
            model2 = new MVCzar.Model();

        var modelList = new MVCzar.ModelList(),
            modelList2 = new MVCzar.ModelList({
                models: [model1, model2]
            });

        expect(modelList.length).to.equal(0);
        expect(modelList2.length).to.equal(2);

        modelList.add();

        expect(modelList.length).to.equal(1);

        modelList.add();

        expect(modelList.length).to.equal(2);

        // read only
        modelList.length = 0;
        expect(modelList.length).to.equal(2);

    });

    it("allows models to be removed via .remove(), triggering a 'remove' event on the modelList and model", function() {

        var removing = null,
            removedFrom = null,
            count = 0;

        var model1 = new MVCzar.Model({
                events: {
                    remove: function(e) {
                        removedFrom = e.modelList;
                    }
                }
            }),
            model2 = new MVCzar.Model();

        var modelList = new MVCzar.ModelList({
                models: [model1, model2],
                events: {
                    remove: function(e) {
                        removing = e.model;
                        count++;
                    }
                }
            });

        // check everything is in place
        expect(modelList.getModelAt(0)).to.equal(model1);
        expect(modelList.getModelAt(1)).to.equal(model2);
        expect(modelList.length).to.equal(2);

        // remove first model
        var removedModel = modelList.remove(model1);
        expect(removedModel).to.equal(model1);
        expect(modelList.getModelAt(0)).to.equal(model2);
        expect(modelList.getModelAt(1)).to.be.undefined;
        expect(modelList.length).to.equal(1);
        expect(count).to.equal(1);
        expect(removing).to.equal(model1);
        expect(removedFrom).to.equal(modelList);

        // remove second model silently
        var removedModel = modelList.remove(model2, true);
        expect(removedModel).to.equal(model2);
        expect(modelList.getModelAt(0)).to.be.undefined;
        expect(modelList.getModelAt(1)).to.be.undefined;
        expect(modelList.length).to.equal(0);
        expect(count).to.equal(1);
        expect(removing).to.equal(model1);
        expect(removedFrom).to.equal(modelList);

    });

    it("has .set() and .unset() methods that apply to all models and can be chained", function() {

        var model1 = new MVCzar.Model({
            prop1: 200
        });

        var modelList = new MVCzar.ModelList({
            defaults: {
                prop1: 100,
                prop2: "value"
            },
            models: [model1]
        });

        var model2 = modelList.add();

        modelList.set("prop2", "moreValue").unset("prop1").set("prop3", 1000);

        expect(model1.get("prop1")).to.be.undefined;
        expect(model1.get("prop2")).to.equal("moreValue");
        expect(model1.get("prop3")).to.equal(1000);
        expect(model2.get("prop1")).to.be.undefined;
        expect(model2.get("prop2")).to.equal("moreValue");
        expect(model2.get("prop3")).to.equal(1000);

    });

    it("has a .forEach() method that works like it's Array namesake", function() {

        var count = 0,
            modelReferences = [],
            modelListRef = null,
            that = null;

        var modelList = new MVCzar.ModelList();

        var model1 = modelList.add(),
            model2 = modelList.add();

        modelList.forEach(function(model, i, modelList) {

            count++;
            modelReferences.push(model);
            modelListRef = modelList;
            that = this;

        });

        expect(count).to.equal(2);
        expect(modelReferences[0]).to.equal(model1);
        expect(modelReferences[1]).to.equal(model2);
        expect(modelListRef).to.equal(modelList);
        expect(that).to.equal(modelList);

    });

    it("has a .filter() method that works like it's Array namesake, and returns an Array", function() {

        var count = 0,
            modelListRef = null,
            that = null;

        var model1 = new MVCzar.Model({
                initial: {
                    chooseMe: true
                }
            }),
            model2 = new MVCzar.Model({
                initial: {
                    chooseMe: false
                }
            });

        var modelList = new MVCzar.ModelList({
            models: [model1, model2]
        });

        var model3 = modelList.add(),
            model4 = modelList.add({
                chooseMe: true
            });

        var filteredModels = modelList.filter(function(model, i, modelList) {

            count++;
            modelListRef = modelList;
            that = this;

            return model.get('chooseMe');

        });

        expect(count).to.equal(4);
        expect(modelListRef).to.equal(modelList);
        expect(that).to.equal(modelList);
        expect(filteredModels.length).to.equal(2);
        expect(filteredModels[0]).to.equal(model1);
        expect(filteredModels[1]).to.equal(model4);

    });

    it("has a .toJSON() method so that JSON.stringify() works", function() {

        var expected = [{
            prop1: 200
        }, {
            prop1: 100,
                prop2: "value"
        }];

        var modelList = new MVCzar.ModelList();

        modelList.add(expected[0]);
        modelList.add(expected[1]);

        expect(modelList.toJSON()).to.deep.equal(expected);
        expect(JSON.parse(JSON.stringify(modelList))).to.deep.equal(expected);

    });

});