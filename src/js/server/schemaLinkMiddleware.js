/*

    Error and non-error middleware that add schema-related HTTP headers to an outgoing response. See the component's
    documentation for more details:

    https://github.com/the-t-in-rtf/gpii-json-schema/blob/master/docs/schemaLinks.md

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");

require("gpii-express");
require("../common/hasRequiredOptions");
require("./schemaUrlHolder");

fluid.defaults("gpii.schema.schemaLink.middleware", {
    gradeNames: ["gpii.hasRequiredOptions", "gpii.schema.schemaLink.schemaUrlHolder", "gpii.express.middleware.headerSetter"],
    requiredFields: {
        "schemaUrls.success": true
    },
    namespace:  "schemaLink.middleware",
    headers: {
        contentType: {
            fieldName: "Content-Type",
            template:  "application/schema+json; profile=\"%schemaUrl\"",
            dataRules: {
                schemaUrl: "that.options.schemaUrls.success"
            }
        },
        link: {
            fieldName: "Link",
            template:  "%schemaUrl; rel=\"describedBy\"",
            dataRules: {
                schemaUrl: "that.options.schemaUrls.success"
            }
        }
    }
});

fluid.defaults("gpii.schema.schemaLink.middleware.error", {
    gradeNames: ["gpii.hasRequiredOptions", "gpii.schema.schemaLink.schemaUrlHolder", "gpii.express.middleware.headerSetter.error"],
    requiredFields: {
        "schemaUrls.error": true
    },
    namespace:  "schemaLink.middleware",
    headers: {
        contentType: {
            fieldName: "Content-Type",
            template:  "application/schema+json; profile=\"%schemaUrl\"",
            dataRules: {
                schemaUrl: "that.options.schemaUrls.error"
            }
        },
        link: {
            fieldName: "Link",
            template:  "%schemaUrl; rel=\"describedBy\"",
            dataRules: {
                schemaUrl: "that.options.schemaUrls.error"
            }
        }
    }
});
