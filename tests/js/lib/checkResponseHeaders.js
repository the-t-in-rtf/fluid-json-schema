/*

    Static function to check responses for the standard headers.

 */
/* eslint-env node */
"use strict";
var fluid  =  require("infusion");
var gpii   = fluid.registerNamespace("gpii");
var jqUnit = require("node-jqunit");

fluid.registerNamespace("gpii.test.schema");
gpii.test.schema.checkResponseHeaders = function (response, schemaPattern) {
    fluid.each(["content-type", "link"], function (headerName) {
        var headerValue = response.headers[headerName];
        jqUnit.assertTrue("The '" + headerName + "' header should match the expected schema...", headerValue && headerValue.indexOf(schemaPattern) !== -1);
    });
};
