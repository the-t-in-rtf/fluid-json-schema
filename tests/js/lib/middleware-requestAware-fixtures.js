// "gated" test middleware (and an underlying test handler that lies beyond the gate).  Used in testing the
// `requestAware` wrapper with our `schemaMiddleware`.
//
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-express");
require("../../../");

// A handler which delivers a "success" or "failure" message depending on a single user-supplied flag.
fluid.registerNamespace("gpii.test.schema.middleware.underlyingHandler");

gpii.test.schema.middleware.underlyingHandler.handleRequest = function (that) {
    // Reuse the validation rules to get a consistent payload across all methods.
    var data = fluid.model.transformWithRules(that.options.request, that.options.rules.requestContentToValidate);
    // TODO:  Simplify this once the binder properly supports checkboxes: https://issues.gpii.net/browse/GPII-1577
    if (data.succeed || data["succeed[]"]) {
        that.sendResponse(200, { ok: true, message: that.options.messages.success});
    }
    else {
        that.sendResponse(400, { ok: false, message: that.options.messages.failure});
    }
};

fluid.defaults("gpii.test.schema.middleware.underlyingHandler", {
    gradeNames: ["gpii.express.handler"],
    rules: "{gpii.schema.validationMiddleware}.options.rules",
    invokers: {
        handleRequest: {
            funcName: "gpii.test.schema.middleware.underlyingHandler.handleRequest",
            args:     ["{that}"]
        }
    }
});

// A base grade for all the "method" variations on our router.
fluid.defaults("gpii.test.schema.middleware.router.base", {
    gradeNames: ["gpii.express.router"],
    events: {
        onSchemasDereferenced: null
    },
    components: {
        validationMiddleware: {
            type: "gpii.schema.validationMiddleware",
            options: {
                namespace: "validationMiddleware",
                schemaDirs: "%gpii-json-schema/tests/schemas",
                schemaKey:  "gated.json",
                listeners: {
                    "onSchemasDereferenced.notifyParent": {
                        func: "{gpii.test.schema.middleware.router.base}.events.onSchemasDereferenced.fire"
                    }
                }
            }
        },
        requestAwareMiddleware: {
            type: "gpii.express.middleware.requestAware",
            options: {
                priority: "after:validationMiddleware",
                method:    "use",
                handlerGrades: ["gpii.test.schema.middleware.underlyingHandler"],
                messages: {
                    success: {
                        expander: {
                            funcName: "fluid.stringTemplate",
                            args: ["You were able to '%method' content.", { method: "{gpii.test.schema.middleware.router.base}.options.method"}]
                        }
                    },
                    failure: {
                        expander: {
                            funcName: "fluid.stringTemplate",
                            args: ["You failed to '%method' content.", { method: "{gpii.test.schema.middleware.router.base}.options.method"}]
                        }
                    }
                },
                distributeOptions: [
                    {
                        source: "{that}.options.messages",
                        target: "{that gpii.express.handler}.options.messages"
                    },
                    {
                        source: "{that}.options.rules",
                        target: "{that gpii.express.handler}.options.rules"
                    }
                ]
            }
        }
    }
});

// POST
fluid.defaults("gpii.test.schema.middleware.router.post", {
    gradeNames: ["gpii.test.schema.middleware.router.base"],
    method:     "post",
    path:       "/POST"
});

// PUT
fluid.defaults("gpii.test.schema.middleware.router.put", {
    gradeNames: ["gpii.test.schema.middleware.router.base"],
    method:     "put",
    path:       "/PUT"
});

// GET
fluid.defaults("gpii.test.schema.middleware.router.get", {
    gradeNames: ["gpii.test.schema.middleware.router.base"],
    method:     "get",
    path:       "/GET",
    components: {
        validationMiddleware: {
            options: {
                gradeNames: ["gpii.schema.validationMiddleware.handlesQueryData"]
            }
        }
    }
});

// A common container for all of the different "method" variations
fluid.defaults("gpii.test.schema.middleware.router", {
    gradeNames: ["gpii.express.router"],
    path: "/gated",
    method: "use",
    events: {
        onGetSchemasDereferenced:  null,
        onPostSchemasDereferenced: null,
        onPutSchemasDereferenced:  null,
        onSchemasDereferenced: {
            events: {
                onGetSchemasDereferenced:  "onGetSchemasDereferenced",
                onPostSchemasDereferenced: "onPostSchemasDereferenced",
                onPutSchemasDereferenced:  "onPutSchemasDereferenced"
            }
        }
    },
    components: {
        linkHeaderMiddleware: {
            type: "gpii.schema.schemaLink.middleware",
            options: {
                schemaPaths: {
                    success: "success-message.json"
                }
            }
        },
        get: {
            type: "gpii.test.schema.middleware.router.get",
            options: {
                priority: "after:schemaLinkMiddleware",
                listeners: {
                    "onSchemasDereferenced.notifyParent": {
                        func: "{gpii.test.schema.middleware.router}.events.onGetSchemasDereferenced.fire"
                    }
                }
            }
        },
        post: {
            type: "gpii.test.schema.middleware.router.post",
            options: {
                priority: "after:schemaLinkMiddleware",
                listeners: {
                    "onSchemasDereferenced.notifyParent": {
                        func: "{gpii.test.schema.middleware.router}.events.onPostSchemasDereferenced.fire"
                    }
                }
            }
        },
        put: {
            type: "gpii.test.schema.middleware.router.put",
            options: {
                priority: "after:schemaLinkMiddleware",
                listeners: {
                    "onSchemasDereferenced.notifyParent": {
                        func: "{gpii.test.schema.middleware.router}.events.onPutSchemasDereferenced.fire"
                    }
                }
            }
        }
    }
});
