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

    // This transform is a crude demonstration of what we might do with the LSR, where we need to store multiple
    // settings in a generated supportedSettings block.
    fluid.defaults("gpii.tests.schema.schemaHolder.transforms.mergeChild", {
        gradeNames: ["fluid.transformFunction"]
    });

    fluid.registerNamespace("gpii.tests.schema.schemaHolder.transforms");
    gpii.tests.schema.schemaHolder.transforms.mergeChild = function (transformSpec, transformer) {
        if (!transformSpec.toMerge) {
            fluid.fail("mergeChild transform requires a `toMerge` inputPath.", transformSpec);
        }
        var toMerge = transformer.expand(transformSpec.toMerge);
        // TODO: pass both components rather than just their schemas, so that we can use some aspect of the component
        //  rather than the "title" property of the schema.
        var outputPath = fluid.model.composePaths(transformer.outputPrefix, toMerge.title);
        transformer.applier.change(outputPath, toMerge);
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
        rules: {
            mergeSubcomponentSchema: {
                "": "baseSchema",
                properties: {
                    "": "baseSchema.properties",
                    transform: {
                        type: "gpii.tests.schema.schemaHolder.transforms.mergeChild",
                        toMerge: "toMerge"
                    }
                }
            }
        },
        components: {
            oneChild: {
                type: "gpii.tests.schema.schemaHolder",
                options: {
                    schema: {
                        title: "oldest child"
                    }
                }
            },
            anotherChild: {
                type: "gpii.tests.schema.schemaHolder",
                options: {
                    schema: {
                        title: "youngest child"
                    }
                }
            }
        }
    });

    // A schema holder with a single child and multiple grandchildren.
    fluid.defaults("gpii.tests.schema.schemaHolder.grandparent", {
        gradeNames: ["gpii.schema.schemaHolder"],
        schema: {
            type: "object",
            properties: {
                grandParentProperty: {type: "string"}
            }
        },
        rules: {
            mergeSubcomponentSchema: {
                "": "baseSchema",
                // We use a simpler approach here as we only expect one child component.
                properties: {
                    child: "toMerge"
                }
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
                    title: "oldest child",
                    type: "object",
                    properties: {
                        childProperty: {type: "string"}
                    }
                },
                "youngest child": {
                    "$schema": "gss-v7-full#",
                    title: "youngest child",
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
                            "title": "oldest child",
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
                            "title": "youngest child",
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
