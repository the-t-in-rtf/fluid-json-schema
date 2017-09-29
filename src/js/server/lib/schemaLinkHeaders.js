/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.schema.schemaLinks");
/**
 *
 * Send the appropriate headers.
 *
 * @param that - The handler component itself.
 * @param response {Object} - The Express `response` object: http://expressjs.com/en/api.html#res
 *
 */
gpii.schema.schemaLinks.addHeaders = function (response, url) {
    response.type("application/schema+json; profile=\"" + url + "\"");
    response.set("Link", url + "; rel=\"describedBy\"");
};
