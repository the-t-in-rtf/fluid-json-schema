/* eslint-env node */
"use strict";
var fluid = require("infusion");

require("./lib/schemaUrlAssembler");

// A convenience grade to make it easier to replace bits of various schema URLs in differing environments (prod, dev, et cetera).
fluid.defaults("gpii.schema.schemaLink.schemaUrlHolder", {
    gradeNames: ["fluid.component"],
    schemaBaseUrls: {
        error:   "{that}.options.schemaBaseUrl",
        success: "{that}.options.schemaBaseUrl"
    },
    schemaUrls: {
        error: {
            expander: {
                funcName: "gpii.schema.urlAssembler",
                args:     ["{that}.options.schemaBaseUrls.error", "{that}.options.schemaPaths.error"]
            }
        },
        success: {
            expander: {
                funcName: "gpii.schema.urlAssembler",
                args:     ["{that}.options.schemaBaseUrls.success", "{that}.options.schemaPaths.success"]
            }
        }
    }
});
