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

## Express Components

### `gpii.schema.validationMiddleware`

The base grade for validation middleware used with gpii-express.  Supports all the options above, plus the options for
[`gpii.express.middleware`](https://github.com/GPII/gpii-express/blob/master/docs/middleware.md#gpiiexpressmiddleware).
The incoming request is first transformed using `fluid.model.transformWithRules`
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
| `errorTemplate`                  | `Object` | If there are validation errors, this object will be merged with the raw error to set the kettle-specific options like `message` and `statusCode`. |
| `inputSchema`                    | `Object` | The [GSS](gss.md) schema to use in validating incoming request data. |
| `rules.requestContentToValidate` | `Object` | The [rules to use in transforming](http://docs.fluidproject.org/infusion/development/ModelTransformationAPI.html#fluid-model-transformwithrules-source-rules-options-) the incoming data before validation (see below for more details). |

The default `rules.requestContentToValidate` in the express middleware grade can be represented as follows:

```snippet
requestContentToValidate: {
  "": "body"
}
```

This transformation exposes only the body of the request as a top-level object to be validated.  For another example,
see `gpii.schema.validationMiddleware.handlesQueryData` below.

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

### `gpii.schema.validationMiddleware.handlesQueryData`

A mix-in grade that configures a grade that derives from `gpii.schema.validationMiddleware.base` (so, either the
gpii-express or kettle variants above) to validate query data. Sets `rules.requestContentToValidate` to the following:

```snippet
requestContentToValidate: {
  "": "query"
}
```

### gpii-express example

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
    gradeNames:    ["gpii.schema.validationMiddleware.requestAware.router"],
    handlerGrades: ["gpii.schema.tests.handler"],
    inputSchema: {
        properties: {
            key: {
                type: "string",
                required: true
            }
        }
    },
    path: "/gatekeeper",
    port: 3000
});
```

If you were to launch this example, you would have a REST endpoint `/gatekeeper` that compares all POST request payloads
to the requestSchema. If a payload is valid according to the schema, the handler defined above would output a canned
"success" message.  If the payload is invalid, the underlying `gpii.express.middleware` instance steps in and responds
with a failure message.

## Kettle Components

### `gpii.schema.kettle.validator`

An extension of the `kettle.middleware` grade that is intended to be hosted as a child of your
[`kettle.app`]((https://github.com/fluid-project/kettle/blob/master/docs/RequestHandlersAndApps.md)) grade, and to be
referenced as `requestMiddleware` from one or more of your `kettle.request.http` instances.  Each validator validates
a single type of payload.   See below for a usage example.

#### Component Options

The following component configuration options are supported:

| Option                           | Type     | Description |
| -------------------------------- | -------- | ----------- |
| `errorTemplate`                  | `Object` | If there are validation errors, this object will be merged with the raw error to set the kettle-specific options like `message` and `statusCode`. |
| `inputSchema`                    | `Object` | The [GSS](gss.md) schema to use in validating incoming request data. |
| `rules.requestContentToValidate` | `Object` | The [rules to use in transforming](http://docs.fluidproject.org/infusion/development/ModelTransformationAPI.html#fluid-model-transformwithrules-source-rules-options-) the incoming data before validation (see below for more details). |

The default `rules.requestContentToValidate` in the express middleware grade can be represented as follows:

```snippet
requestContentToValidate: {
  "body": "body",
  "params": "params",
  "query": "query"
}
```

This transformation strips complex internal material from the underlying request and exposes only the parameters (
`params`), query string data (`query`) and request body (`body`).  There are convenience grades provided for payloads
where only the query, parameters, or body are validated.  See below.

#### Invokers

##### `{gpii.schema.kettle.validator}.handle(requestComponent)`

* `requestComponent`: The `kettle.request.http` instance fielding the actual request.
* Returns: A [`fluid.promise`](https://docs.fluidproject.org/infusion/development/PromisesAPI.html) that will be
  resolved if the payload is valid, or rejected with validation errors if the payload is invalid.

This invoker satisfies the basic contract for a `kettle.middleware` grade.  It validates a payload and returns a promise
that is resolved if processing should continue or rejected if an invalid payload is detected.

### `gpii.schema.kettle.validator.body`

A convenience validator grade that exposes the request body as a top-level object, so that you can write simpler
schemas to validate your payloads.

### `gpii.schema.kettle.validator.params`

A convenience validator grade that exposes only the URL parameters as a top-level object, so that you can write simpler
schemas to validate your payloads.

### `gpii.schema.kettle.validator.query`

A convenience validator grade that exposes only the query string parameters as a top-level object, so that you can write
simpler schemas to validate your payloads.

### Kettle example

```javascript
var fluid = require("infusion");

fluid.require("kettle");
fluid.require("gpii-json-schema");

var my = fluid.registerNamespace("my");

fluid.registerNamespace("my.kettle.handler");

my.kettle.handler.reportSuccess = function (request) {
    request.events.onSuccess.fire({ message: "Payload accepted." });
};

fluid.defaults("my.kettle.validator", {
    gradeNames: ["gpii.schema.kettle.validator.body"],
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
    }
});

// Looking for body content and validate that against our schema.
fluid.defaults("my.kettle.handler", {
    gradeNames: ["kettle.request.http"],
    requestMiddleware: {
        validate: {
            middleware: "{my.kettle.validator}"
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
    components: {
        myValidator: {
            type: "my.kettle.validator"
        }
    },
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

Note that we use the `gpii.schema.kettle.validator.body` grade to keep our schema simple.  If we were to use the base
`gpii.schema.kettle.validator` grade, our schema might look like:

```json5
{
    type: "object",
    properties: {
        body: {
            properties: {
                hasBodyContent: {
                    type: "string",
                    required: true,
                    enum: ["good"],
                    enumLabels: ["Good Choice"]
                }
            }
        }
    }
}
```

Each of the convenience grades above allow you to avoid one layer of object-and-property nesting when you are only
dealing with one type of data.
