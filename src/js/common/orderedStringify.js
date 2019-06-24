/* globals require */
var fluid  = fluid  || {};
(function (fluid) {
    // TODO: pull this up into Infusion if we need to use this type of object hashing more broadly.
    "use strict";

    if (!fluid.identity) {
        fluid = require("infusion");
    }

    var gpii = fluid.registerNamespace("gpii");
    fluid.registerNamespace("gpii.schema");

    // Adapted from: https://github.com/fluid-project/infusion/pull/566/files#diff-ce65b74e18811491f3cd6be95ac827b6R475
    /**
     *
     * Converts an object or array to a string for use as a key.  Object members are sorted alphabetically to ensure
     * that the results are stable if only the key order varies between passes.
     *
     * @param {Object} objectToStringify - The object to "stringify".
     * @return {String} - A string representing the object.
     *
     */
    gpii.schema.stringifyObject = function (objectToStringify) {
        var str = "{";
        var keys = fluid.keys(objectToStringify).sort();

        fluid.each(keys, function (key, index) {
            var val = objectToStringify[key];
            if (index > 0) {
                str += ",";
            }
            str += "\"" + key + "\":" + gpii.schema.stringify(val);
        });

        str += "}";
        return str;
    };

    /**
     *
     * Generates a stringified version of any type of material.
     *
     * @param {Any} toStringify - The material to be "stringified".
     * @return {String} - A string representing the the material, suitable for parsing with JSON.parse.
     *
     */
    gpii.schema.stringify = function (toStringify) {
        if (Array.isArray(toStringify)) {
            var segments = fluid.transform(toStringify, gpii.schema.stringify);
            return "[" + segments.join(",") + "]";
        }
        else if (fluid.isPlainObject(toStringify)) {
            return gpii.schema.stringifyObject(toStringify);
        }

        return JSON.stringify(toStringify);
    };
})(fluid);
