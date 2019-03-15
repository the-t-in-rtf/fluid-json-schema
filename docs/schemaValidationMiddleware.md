# The Schema "Gatekeeper" Validation Middleware

Although you usually will build some fault tolerance into your components, on some level they expect to deal with data
that has a particular structure, and which contains the expected type of information (strings, booleans, dates, etc).
Although it cannot confirm whether data supplied by an end user is accurate or meaningful, [the JSON Schema validation
component](validator.md) provided by this package can at least verify whether the supplied data is "valid", i.e. that it
matches the rules outlined in a particular JSON Schema.

This package provides validation middleware that can be used with either gpii-express or kettle.  These validation
middleware components can be used to validate incoming requests, and to automatically reject invalid payloads with a
detailed error.  This allows your server-side components to at least assume they will only receive JSON data that is
valid according to a schema.  The validation middleware is a "gatekeeper" that doesn't need to know anything about how
you intend to use the data.  You only need to describe the "contract", i.e. what is valid, and let the "gatekeeper"
filter out incoming requests that are not valid according to your JSON Schema.

See below for usage examples for both kettle and gpii-express.

## Displaying validation messages onscreen

The [`errorBinder`](errorBinder.md) component included with this package is designed to associate the validation error
messages produced by the validator with on-screen elements.  See that component's documentation for details.

## Components

### `gpii.schema.validationMiddleware.base`

The base grade for both kettle and gpii-express validation middleware. Validates information available in the request
object. The incoming request is first transformed using `fluid.model.transformWithRules`
and`options.rules.requestContentToValidate`. The results are validated against `options.schemaKey`.

The default options validate the request body, as expected with a `POST` or `PUT` request.  See the mix-in grades below
for examples of how different rules can handle different types of request data.

The transformed request data is validated against the schema. If there are validation errors, the validation output of
this middleware is passed on to the next piece of middleware in the error-handling chain.  If there are no validation
errors, the next piece of middleware in non-error-handling chain is called.  In both cases, this middleware does not
send any kind of response itself.  You are expected to ensure that middleware further along in the chain sends the
response and/or [sets HTTP headers](schemaLinks.md).

#### Component Options

The following component configuration options are supported:

| Option                           | Type     | Description |
| -------------------------------- | -------- | ----------- |
| `inputSchema`                    | `Object` | The [GSS](gss.md) schema to use in validating incoming request data. |
| `rules.requestContentToValidate` | `Object` | The [rules to use in transforming](http://docs.fluidproject.org/infusion/development/ModelTransformationAPI.html#fluid-model-transformwithrules-source-rules-options-) the incoming data before validation (see below for more details). |

The default `rules.requestContentToValidate` in this grade are intended for use with `PUT` or `POST` body data.  This
can be represented as follows:

```snippet
requestContentToValidate: {
  "": "body"
}
```

These rules extract POST and PUT payloads from the request body created by the [Express body parser
middleware](https://github.com/expressjs/body-parser).  See `gpii.schema.validationMiddleware.handlesGetMethod` below
for an example of working with query data.

### `gpii.schema.validationMiddleware`

The base grade for validation middleware used with gpii-express.  Supports all the options above, plus the options for
[`gpii.express.middleware`](https://github.com/GPII/gpii-express/blob/master/docs/middleware.md#gpiiexpressmiddleware).

#### Invokers

##### `{middleware}.middleware(request, response, next)`

* `request`: An object representing the individual user's request.  See [the `gpii-express`
  documentation](https://github.com/GPII/gpii-express/blob/master/docs/express.md#the-express-request-object) for
  details.
* `response`: The response object, which can be used to send information to the requesting user.  See [the
  `gpii-express`
  documentation](https://github.com/GPII/gpii-express/blob/master/docs/express.md#the-express-response-object) for
  details.
* `next`: The next Express middleware or router function in the chain.  See [the `gpii-express` documentation for
  details](https://github.com/GPII/gpii-express/blob/master/docs/middleware.md#what-is-middleware).
* Returns: Nothing.

This invoker fulfills the standard contract for a `gpii.express.middleware` component.  It examines the `request`
content and interrupts the conversation if the JSON data supplied as part of `request` is not valid according to the
JSON Schema `options.schemaKey` found at `options.schemaPath`.  If the content is valid, execute the supplied `next`
function and let some other downstream piece of middleware continue the conversation.

This function is expected to be called by Express (or by an instance of `gpii.express`).

## `gpii.schema.kettle.middleware`

The schema validation [kettle middleware](https://github.com/fluid-project/kettle/blob/master/docs/Middleware.md). Must
be used in combination with a grade that derives from `gpii.schema.kettle.request.http`.  See "kettle example" below
for an example of using this grade.

## `gpii.schema.kettle.request.http`

The [request handler](https://github.com/fluid-project/kettle/blob/master/docs/RequestHandlersAndApps.md) portion of
the kettle schema validation middleware.  Must be used in combination with a grade that derives from
`gpii.schema.kettle.middleware`.  See "kettle example" below for an example of using this grade.

### `gpii.schema.validationMiddleware.handlesQueryData`

A mix-in grade that configures a grade that derives from `gpii.schema.validationMiddleware.base` (so, either the
gpii-express or kettle variants above) to validate query data. Sets `rules.requestContentToValidate` to the following:

```snippet
requestContentToValidate: {
  "": "query"
}
```

## gpii-express example

The `gpii.schema.validationMiddleware` grade is intended to be used with a `gpii.express` or `gpii.express.router`
instance.  The `gpii.schema.validationMiddleware.requestAware.router` wrapper is provided as a convenient starting
point.  With that router, you can created "gated" REST endpoints that only pass through valid payloads to the underlying
handlers, as shown here:

```javascript
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("gpii-express");
require("gpii-json-schema");

fluid.defaults("gpii.schema.tests.handler", {
    gradeNames: ["gpii.express.handler"],
    invokers: {
        handleRequest: {
            funcName: "{that}.sendResponse",
            args:     [200, "Someone sent me a valid JSON payload."]
        }
    }
});

gpii.express({
    gradeNames:        ["gpii.schema.validationMiddleware.requestAware.router"],
    handlerGrades:     ["gpii.schema.tests.handler"],
    schemaKey:         "valid.json",
    schemaDirs:        ["%my-package/src/schemas"],
    responseSchemaKey: "message.json",
    responseSchemaUrl: "http://my.site/schemas/",
    path:              "/gatekeeper",
    port:              3000
});
```

If you were to launch this example, you would have a REST endpoint `/gatekeeper` that compares all POST request payloads
to the schema `valid.json`, which can be found in `%my-package/src/schemas`. If a payload is valid according to the
schema, the handler defined above would output a canned "success" message.  If the payload is invalid, the underlying
`gpii.express.middleware` instance steps in and responds with a failure message.

## kettle example

```javascript
var fluid = require("infusion");

fluid.require("kettle");
fluid.require("gpii-json-schema");

var my = fluid.registerNamespace("my");

fluid.registerNamespace("my.kettle.handler");

my.kettle.handler.reportSuccess = function (request) {
    request.events.onSuccess.fire({ message: "Payload accepted." });
};

// Looking for body content and validate that against our schema.
fluid.defaults("my.kettle.handler", {
    gradeNames: ["gpii.schema.kettle.request.http"],
    inputSchema: {
        type: "object",
        properties: {
            hasBodyContent: {
                type: "string",
                required: true,
                enum: ["good"],
                enumLabels: ["Good Choice"]
            }
        }
    },
    invokers: {
        handleRequest: {
            funcName: "my.kettle.handler.reportSuccess"
        }
    }
});

fluid.defaults("my.kettle.app", {
    gradeNames: ["kettle.app"],
    requestHandlers: {
        gatedBody: {
            type: "my.kettle.handler",
            route: "/gated",
            method: "post"
        }
    }
});

my.kettle.app();
```

If you were to run the above example, you would have a kettle app with a `/gated` POST endpoint, that would reject any
payload that does not contain a `hasBodyContent` element that is specifically set to the string `good`.  Any payload
that contains that element with the correct value would be passed to the underlying handler stub, and result in a
"payload accepted" message.
