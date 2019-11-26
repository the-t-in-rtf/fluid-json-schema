/* eslint-env browser */
/* globals require */
var fluid  = fluid || {};
var jqUnit = jqUnit || {};

(function (fluid, jqUnit) {
    "use strict";
    if (!fluid.identity) {
        fluid  = require("infusion");
        jqUnit = require("node-jqunit");
        require("../../../src/js/common/schemaHolder");
    }
    var gpii = fluid.registerNamespace("gpii");

    // A schema holder with no children.
    fluid.defaults("gpii.tests.schema.schemaHolder", {
        gradeNames: ["gpii.schema.schemaHolder"],
        schema: {
            type: "object",
            properties: {
                childProperty: {type: "string"}
            }
        }
    });

    fluid.registerNamespace("gpii.tests.schema.schemaHolder.parent");
    gpii.tests.schema.schemaHolder.parent.incorporateSubcomponentSchemas = function (parentSchemaHolder, schemaToDate) {
        var outerPromise = fluid.promise();

        var modifiedSchema = fluid.copy(schemaToDate);
        var schemaModificationPromises = [];
        var childSchemaHolders = parentSchemaHolder.getChildSchemaHolders();
        fluid.each(childSchemaHolders, function (childSchemaHolder) {
            schemaModificationPromises.push(function () {
                var schemaMungingPromise = fluid.promise();
                childSchemaHolder.getSchema().then(
                    function (childSchema) {
                        fluid.set(modifiedSchema, ["properties", childSchemaHolder.options.name], childSchema);
                        schemaMungingPromise.resolve();
                    },
                    schemaMungingPromise.reject
                );
                return schemaMungingPromise;
            });
        });
        var schemaMungingSequence = fluid.promise.sequence(schemaModificationPromises);
        schemaMungingSequence.then(
            function () {
                outerPromise.resolve(modifiedSchema);
            },
            outerPromise.reject
        );

        return outerPromise;
    };

    // A schema holder with multiple children.
    fluid.defaults("gpii.tests.schema.schemaHolder.parent", {
        gradeNames: ["gpii.schema.schemaHolder"],
        schema: {
            type: "object",
            properties: {
                parentProperty: {type: "string"}
            }
        },
        invokers: {
            incorporateSubcomponentSchemas: {
                "funcName": "gpii.tests.schema.schemaHolder.parent.incorporateSubcomponentSchemas"
            }
        },
        components: {
            oneChild: {
                type: "gpii.tests.schema.schemaHolder",
                options: {
                    name: "oldest child"
                }
            },
            anotherChild: {
                type: "gpii.tests.schema.schemaHolder",
                options: {
                    name: "youngest child"
                }
            }
        }
    });

    fluid.registerNamespace("gpii.tests.schema.schemaHolder.grandparent");
    gpii.tests.schema.schemaHolder.grandparent.incorporateSubcomponentSchemas = function (grandparentSchemaHolder, schemaToDate) {
        var outerPromise = fluid.promise();
        var modifiedSchema = fluid.copy(schemaToDate);
        var schemaMungingPromises = [];
        var childSchemaHolders = grandparentSchemaHolder.getChildSchemaHolders();
        fluid.each(childSchemaHolders, function (childSchemaHolder) {
            schemaMungingPromises.push(function () {
                var schemaMungingPromise = fluid.promise();
                childSchemaHolder.getSchema().then(
                    function (childSchema) {
                        fluid.set(modifiedSchema, ["properties", "child"], childSchema);
                        schemaMungingPromise.resolve();
                    },
                    schemaMungingPromise.reject
                );
                return schemaMungingPromise;
            });
        });
        var schemaMungingSequence = fluid.promise.sequence(schemaMungingPromises);
        schemaMungingSequence.then(
            function () {
                outerPromise.resolve(modifiedSchema);
            },
            outerPromise.reject
        );
        return outerPromise;
    };

    // A schema holder with a single child and multiple grandchildren.
    fluid.defaults("gpii.tests.schema.schemaHolder.grandparent", {
        gradeNames: ["gpii.schema.schemaHolder"],
        schema: {
            type: "object",
            properties: {
                grandParentProperty: {type: "string"}
            }
        },
        subComponentGrade: "gpii.schema.schemaHolder",
        invokers: {
            incorporateSubcomponentSchemas: {
                funcName: "gpii.tests.schema.schemaHolder.grandparent.incorporateSubcomponentSchemas"
            }
        },
        components: {
            child: {
                type: "gpii.tests.schema.schemaHolder.parent"
            }
        }
    });

    gpii.tests.schema.schemaHolder.failOnError = function (error) {
        jqUnit.start();
        jqUnit.fail(error);
    };

    gpii.tests.schema.schemaHolder.generateCheckOnResolveFn = function (message, expected) {
        return function (schema) {
            jqUnit.start();
            jqUnit.assertDeepEq(message, expected, schema);
        };
    };


    jqUnit.module("Schema holder tests.");

    jqUnit.asyncTest("Testing a schema holder with no children.", function () {
        var expected  = {
            "$schema": "gss-v7-full#",
            additionalProperties: true,
            type: "object",
            properties: {
                childProperty: {type: "string"}
            }
        };
        var component = gpii.tests.schema.schemaHolder();
        component.getSchema().then(
            gpii.tests.schema.schemaHolder.generateCheckOnResolveFn("The schema should be as expected", expected),
            gpii.tests.schema.schemaHolder.failOnError
        );
    });

    jqUnit.asyncTest("Testing schema caching.", function () {
        var expected  = {
            "$schema": "gss-v7-full#",
            additionalProperties: true,
            type: "object",
            properties: {
                childProperty: {type: "string"}
            }
        };
        var component = gpii.tests.schema.schemaHolder();
        component.getSchema().then(
            function () {
                component.getSchema().then(
                    gpii.tests.schema.schemaHolder.generateCheckOnResolveFn("The cached schema should be as expected", expected),
                    gpii.tests.schema.schemaHolder.failOnError
                );
            },
            gpii.tests.schema.schemaHolder.failOnError
        );
    });

    jqUnit.asyncTest("Testing a component with multiple child schema holders.", function () {
        var expected  = {
            "$schema": "gss-v7-full#",
            additionalProperties: true,
            type: "object",
            properties: {
                parentProperty: {type: "string"},
                "oldest child": {
                    "$schema": "gss-v7-full#",
                    additionalProperties: true,
                    type: "object",
                    properties: {
                        childProperty: {type: "string"}
                    }
                },
                "youngest child": {
                    "$schema": "gss-v7-full#",
                    additionalProperties: true,
                    type: "object",
                    properties: {
                        childProperty: {type: "string"}
                    }
                }
            }
        };
        var component = gpii.tests.schema.schemaHolder.parent();
        component.getSchema().then(
            gpii.tests.schema.schemaHolder.generateCheckOnResolveFn("The schema should have been merged with our children's schemas.", expected),
            gpii.tests.schema.schemaHolder.failOnError
        );
    });

    jqUnit.asyncTest("Testing a component with multiple levels of child schema holders.", function () {
        fluid.logObjectRenderChars = 10240;
        var expected = {
            "type": "object",
            "properties": {
                "grandParentProperty": {
                    "type": "string"
                },
                "child": {
                    "type": "object",
                    "properties": {
                        "parentProperty": {
                            "type": "string"
                        },
                        "oldest child": {
                            "type": "object",
                            "properties": {
                                "childProperty": {
                                    "type": "string"
                                }
                            },
                            "$schema": "gss-v7-full#",
                            "additionalProperties": true
                        },
                        "youngest child": {
                            "type": "object",
                            "properties": {
                                "childProperty": {
                                    "type": "string"
                                }
                            },
                            "$schema": "gss-v7-full#",
                            "additionalProperties": true
                        }
                    },
                    "$schema": "gss-v7-full#",
                    "additionalProperties": true
                }
            },
            "$schema": "gss-v7-full#",
            "additionalProperties": true
        };

        var component = gpii.tests.schema.schemaHolder.grandparent();
        component.getSchema().then(
            gpii.tests.schema.schemaHolder.generateCheckOnResolveFn("The schema should have been merged with our children's schemas.", expected),
            gpii.tests.schema.schemaHolder.failOnError
        );
    });
})(fluid, jqUnit);
