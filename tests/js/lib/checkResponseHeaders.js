/*

    Static function to check responses for the standard headers.

 */
"use strict";
var fluid  =  require("infusion");
var gpii   = fluid.registerNamespace("gpii");
var jqUnit = require("node-jqunit");

fluid.registerNamespace("gpii.schema.tests");
gpii.schema.tests.checkResponseHeaders = function (response, body, typePattern, linkPattern) {
    if (typePattern) {
        var contentType = response.headers["content-type"];
        jqUnit.assertTrue("The content type header should contain our key...", contentType && contentType.match(typePattern));
    }

    if (linkPattern) {
        var link = response.headers.link;
        jqUnit.assertTrue("The link header should contain our key...", link && link.match(linkPattern) !== -1);
    }

    jqUnit.assertNotUndefined("There should be body content", body);
};