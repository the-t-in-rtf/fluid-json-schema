/*

    This file defines the core concept of a "schema holder", a grades that holds a schema that can be used to validate
    arbitrary user payloads.  It also provides the core "user" schema extended by the specific schemas used by
    the REST API endpoints in this package.

*/
/* globals require */
(function (fluid) {
    "use strict";
    if (!fluid) {
        fluid = require("infusion");
        fluid.require("%gpii-json-schema");
    }

    var gpii = fluid.registerNamespace("gpii");

    fluid.registerNamespace("gpii.schema.schemaHolder");

    gpii.schema.schemaHolder.generateIfNeeded = function (that) {
        return that.generatedSchema ? fluid.toPromise(that.generatedSchema) : that.generateSchema();
    };

    // We cannot simply use fluid.set here because it does not return the set value, and would strip the value from the
    // promise chain.
    gpii.schema.schemaHolder.cacheSchema = function (that, schema) {
        that.generatedSchema = schema;
        return schema;
    };

    gpii.schema.schemaHolder.incorporateSubcomponentSchemas = function (that, baseSchema) {
        var subComponents = fluid.queryIoCSelector(that, "gpii.schema.schemaHolder", true);
        fluid.each(subComponents, function (subComponent) {
            // getSchema is asynchronous, so we have to use a "promise chain" to handle this.
            that.events.incorporateSubcomponentSchemas.addListener(function (baseSchema) {
                var singleComponentSchemaPromise = fluid.promise();
                subComponent.getSchema().then(
                    function (subComponentSchema) {
                        try {
                            var mergedSchema = fluid.model.transformWithRules({ baseSchema: baseSchema, toMerge: subComponentSchema }, that.options.rules.mergeSubcomponentSchema);
                            singleComponentSchemaPromise.resolve(mergedSchema);
                        }
                        catch (error) {
                            singleComponentSchemaPromise.reject(error);
                        }
                    },
                    singleComponentSchemaPromise.reject
                );
                return singleComponentSchemaPromise;
            });
        });
        return fluid.promise.fireTransformEvent(that.events.incorporateSubcomponentSchemas, baseSchema);
    };

    fluid.defaults("gpii.schema.schemaHolder", {
        gradeNames: ["fluid.component"],
        mergePolicy: {
            "rules.mergeSubcomponentSchema": "nomerge"
        },
        rules: {
            // By default, simply ignore any child schemas.
            mergeSubcomponentSchema: {
                "": "baseSchema"
            }
        },
        events: {
            getSchema: null,
            generateSchema: null,
            incorporateSubcomponentSchemas: null
        },
        members: {
            generatedSchema: false,
            subComponentSchemaPromises: []
        },
        schema: {
            $schema: "gss-v7-full#",
            additionalProperties: true
        },
        invokers: {
            getSchema: {
                funcName: "gpii.schema.schemaHolder.generateIfNeeded",
                args: ["{that}"]
            },
            generateSchema: {
                funcName: "fluid.promise.fireTransformEvent",
                args: ["{that}.events.generateSchema"]
            }
        },
        listeners: {
            "generateSchema.getOptions": {
                priority: "first",
                funcName: "fluid.identity",
                args: ["{that}.options.schema"]
            },
            "generateSchema.incorporateComponentSchemas": {
                priority: "after:getOptions",
                funcName: "gpii.schema.schemaHolder.incorporateSubcomponentSchemas",
                args: ["{that}", "{arguments}.0"]
            },
            "generateSchema.cacheSchema": {
                priority: "last",
                funcName: "gpii.schema.schemaHolder.cacheSchema",
                args: ["{that}", "{arguments}.0"]
            }
        }
    });
})(fluid);
