/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.schema.kettle.validator");

/**
 *
 * Validate a request payload according to a GSS Schema.  Fulfills the contract for a `kettle.middleware` `handle`
 * invoker.
 *
 * @param {Object} kettleValidator - A `gpii.schema.kettle.validator` instance that has a schema and rules about which part of the payload should be validated.
 * @param {Object} globalValidator - The global `gpii.schema.validator` instance.
 * @param {Object} requestHandler - The `kettle.request.http` grade that is fielding the actual request.
 * @return {Promise} - A `fluid.promise` that is rejected with a validation error if the payload is invalid or resolved if the payload is valid.
 *
 */
gpii.schema.kettle.validator.validateRequest = function (kettleValidator, globalValidator, requestHandler) {
    var validationPromise = fluid.promise();

    var gssSchema = kettleValidator.options.requestSchema;
    var transformationRules = kettleValidator.options.requestContentToValidate;
    var toValidate = fluid.model.transformWithRules(requestHandler.req, transformationRules);
    var validationResults = globalValidator.validate(gssSchema, toValidate, kettleValidator.options.schemaHash);

    if (validationResults.isValid) {
        validationPromise.resolve();
    }
    else {
        var localisedErrors = gpii.schema.validator.localiseErrors(validationResults.errors, toValidate, kettleValidator.model.messages, kettleValidator.options.localisationTransform);
        var localisedPayload = fluid.copy(validationResults);
        localisedPayload.errors = localisedErrors;

        var failurePayload = fluid.extend({}, kettleValidator.options.errorTemplate, localisedPayload);
        validationPromise.reject(failurePayload);
    }

    return validationPromise;
};

// A kettle.middleware grade that can be used in the requestMiddleware stack, as in:
// https://github.com/fluid-project/kettle/blob/670396acbf4be31be009b2b2dee48373134ea94d/tests/shared/SessionTestDefs.js#L64

fluid.defaults("gpii.schema.kettle.validator", {
    gradeNames: ["kettle.middleware", "fluid.modelComponent"],
    schemaHash: "@expand:gpii.schema.hashSchema({that}.options.requestSchema)",
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
    requestSchema: {
        "$schema": "gss-v7-full#"
    },
    requestContentToValidate: {
        "body":   "body",
        "params": "params",
        "query":  "query"
    },
    mergePolicy: {
        "requestSchema": "nomerge",
        "requestContentToValidate": "nomerge"
    },
    invokers: {
        handle: {
            funcName: "gpii.schema.kettle.validator.validateRequest",
            args:    ["{that}", "{gpii.schema.validator}", "{arguments}.0"] // kettleValidator, globalValidator, request
        }
    },
    listeners: {
        "onCreate.cacheSchema": {
            func: "{gpii.schema.validator}.cacheSchema",
            args: ["{that}.options.requestSchema", "{that}.options.schemaHash"] // gssSchema, schemaHash
        }
    }
});

fluid.defaults("gpii.schema.kettle.validator.body", {
    gradeNames: ["gpii.schema.kettle.validator"],
    requestContentToValidate: {
        "": "body"
    }
});

fluid.defaults("gpii.schema.kettle.validator.params", {
    gradeNames: ["gpii.schema.kettle.validator"],
    requestContentToValidate: {
        "": "params"
    }
});

fluid.defaults("gpii.schema.kettle.validator.query", {
    gradeNames: ["gpii.schema.kettle.validator"],
    requestContentToValidate: {
        "":  "query"
    }
});
