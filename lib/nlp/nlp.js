"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var classifier_1 = require("./classifier");
var helpers_1 = require("./helpers");
var Promise = require("bluebird");
var _ = require("lodash");
var util = require("util");
var NLPBase = (function () {
    function NLPBase(classifierFile) {
        if (classifierFile === void 0) { classifierFile = __dirname + "/../../nlp/classifiers.json"; }
        var allClassifiers = classifier_1.LoadSavedClassifiers(classifierFile);
        this.classifiers = allClassifiers;
        this.components = [
            baseBotTextNLP.bind(this),
            locationNLP.bind(this),
            helpers_1.grabTopics.bind(this)
        ];
        return this;
    }
    NLPBase.prototype.getIntents = function (message) {
        if (message.type === 'text') {
            var promises = this.components.map(function (func) { return func(message.text); });
            return Promise.all(promises)
                .then(function (intents) {
                var flat = _.flatten(intents);
                return flat;
            });
        }
        else {
            return Promise.resolve([]);
        }
    };
    // public retrainClassifiers(classifierFiles: Array<string|TopicCollection> = defaultClassifierDirectories) {
    //   const allClassifiers = GenerateClassifier(classifierFiles);
    //   this.classifiers = allClassifiers;
    // }
    NLPBase.prototype.getTopics = function () {
        var topics = _.mapValues(this.classifiers, function (value, key) { return _.keys(value).map(function (key) { return key.replace(/-/g, ' '); }); });
        return topics;
    };
    return NLPBase;
}());
exports.default = NLPBase;
function baseBotTextNLP(text) {
    var compacted = classifier_1.runThroughClassifiers(text, this.classifiers);
    if (compacted.length === 0) {
        return null;
    }
    var sorted = _.orderBy(compacted, ['value'], 'desc');
    if (this && this.debugOn) {
        console.log(text + "\n" + util.inspect(sorted, { depth: null }));
    }
    ;
    var intents = sorted.map(function (intent) {
        var baseIntent = {
            action: intent.label,
            details: {
                confidence: intent.value,
            },
            domain: intent.topic,
        };
        return baseIntent;
    });
    return Promise.resolve(intents);
}
exports.baseBotTextNLP = baseBotTextNLP;
function locationNLP(text) {
    var locations = helpers_1.locatonExtractor(text);
    if (_.keys(locations).length === 0) {
        return Promise.resolve([]);
    }
    var action = _.keys(locations)[0];
    var city = locations[action][0];
    var intent = {
        action: action,
        details: {
            confidence: helpers_1.getLocationConfidence(text, city),
        },
        domain: 'locations',
    };
    return Promise.resolve([intent]);
}
exports.locationNLP = locationNLP;
//# sourceMappingURL=nlp.js.map