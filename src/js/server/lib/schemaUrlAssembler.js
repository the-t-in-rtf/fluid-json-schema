/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var url = require("url");

fluid.registerNamespace("gpii.schema");

/**
 * A function that constructs a schema URL from constituent parts.  If one or both parts are falsy, null is returned.
 *
 * @param baseUrl {String} - The base URL for our schemas.
 * @param schemaPath {String} - The path to the individual schema, relative to the base URL.
 */
gpii.schema.urlAssembler = function (baseUrl, schemaPath) {
    return baseUrl && schemaPath && url.resolve(baseUrl, schemaPath);
};
