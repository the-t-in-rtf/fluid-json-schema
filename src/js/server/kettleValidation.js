/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.schema.kettle.validator");

gpii.schema.kettle.validator.validateRequest = function (kettleValidator, globalValidator, requestHandler) {
    var schemaKey = requestHandler.options.schemaKey || "default";
    var rulesKey  = requestHandler.options.rulesKey  || "default";
    var schemaHash = kettleValidator.schemaHashes[schemaKey];
    var gssSchema = fluid.get(kettleValidator, ["options", "requestSchemas", schemaKey]);
    var transformationRules = fluid.get(kettleValidator, ["options", "requestContentToValidate", rulesKey]);
    var toValidate = fluid.model.transformWithRules(requestHandler.req, transformationRules);
    var validationResults = globalValidator.validate(gssSchema, toValidate, schemaHash);

    if (validationResults.isValid) {
        requestHandler.handleValidRequest(requestHandler);
    }
    else {
        var localisedErrors = gpii.schema.validator.localiseErrors(validationResults.errors, toValidate, kettleValidator.model.messages, kettleValidator.options.localisationTransform);
        var localisedPayload = fluid.copy(validationResults);
        localisedPayload.errors = localisedErrors;

        var failurePayload = fluid.extend({}, kettleValidator.options.errorTemplate, localisedPayload);
        requestHandler.events.onError.fire(failurePayload);
    }
};

gpii.schema.kettle.validator.cacheSchemas = function (kettleValidator, globalValidator) {
    fluid.each(kettleValidator.options.requestSchemas, function (requestSchema, schemaKey) {
        var schemaHash = gpii.schema.hashSchema(requestSchema);
        kettleValidator.schemaHashes[schemaKey] = schemaHash;
        globalValidator.cacheSchema(requestSchema, schemaHash);
    });
};

fluid.defaults("gpii.schema.kettle.validator", {
    gradeNames: ["fluid.modelComponent"],
    members: {
        schemaHashes: {}
    },
    model: {
        messages: gpii.schema.messages.validationErrors
    },
    localisationTransform: {
        "": ""
    },
    errorTemplate: {
        // "Bad Request": https://developer.mozilla.org/nl/docs/Web/HTTP/Status/400
        statusCode: 400,
        message: "Your request was invalid.  See the errors for details."
    },
    requestSchemas: {
        default: {
            "$schema": "gss-v7-full#"
        }
    },
    requestContentToValidate: {
        default: "{that}.options.requestContentToValidate.body",
        body: {
            "": "body"
        },
        params: {
            "": "params"
        },
        query: {
            "": "query"
        }
    },
    invokers: {
        validateRequest: {
            funcName: "gpii.schema.kettle.validator.validateRequest",
            args: ["{that}", "{gpii.schema.validator}", "{arguments}.0"] // kettleValidator, globalValidator, request
        }
    },
    listeners: {
        "onCreate.cacheSchemas": {
            funcName: "gpii.schema.kettle.validator.cacheSchemas",
            args:     ["{that}", "{gpii.schema.validator}"] // globalValidator
        }
    }
});

fluid.defaults("gpii.schema.kettle.app", {
    gradeNames: ["kettle.app"],
    components: {
        validator: {
            type: "gpii.schema.kettle.validator"
        }
    }
});

fluid.defaults("gpii.schema.kettle.request.http", {
    gradeNames: ["kettle.request.http"],
    rulesKey: "default",
    schemaKey: "default",
    invokers: {
        handleRequest: {
            func: "{gpii.schema.kettle.validator}.validateRequest",
            args: ["{arguments}.0", "{gpii.schema.kettle.request.http}.options.schemaKey", "{gpii.schema.kettle.request.http}.options.rulesKey", "{gpii.schema.kettle.request.http}.handleValidRequest", "{that}"] // request, schemaKey, rulesKey, callback
        },
        handleValidRequest: {
            func: "fluid.notImplemented"
        }
    }
});
