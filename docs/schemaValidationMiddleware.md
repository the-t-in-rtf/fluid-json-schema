# The Schema "Gatekeeper" Validation Middleware

Although you usually will build some fault tolerance into your components, on some level they expect to deal with
data that has a particular structure, and which contains the expected type of information (strings, booleans, dates,
etc).  Although it cannot confirm whether data supplied by an end user is accurate or meaningful, [the JSON Schema validation component](validator.md)
provided by this package can at least verify whether the supplied data is "valid", i.e. that it matches the rules
outlined in a particular JSON Schema.

The `gpii.schema.validationMiddleware` component provided with this package validates all incoming requests, and rejects
invalid payloads.  This allows your server-side components to at least assume they will only receive JSON data that is
valid according to the supplied schema.  The "gatekeeper" doesn't know anything about how you intend to use the data.
It only examines the payload and steps in if the payload is not valid according to the configured JSON Schema.

The base middleware is intended to be used with a `gpii.express` or `gpii.express.router` instance.  The
`gpii.schema.validationMiddleware.requestAware.router` wrapper is provided as a convenient starting point.  With that router,
you can created "gated" REST endpoints that only pass through valid payloads to the underlying handlers, as show here:

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

## Displaying validation messages onscreen

The [`errorBinder`](errorBinder.md) component included with this package is designed to associate the validation error
messages produced by `gpii.schema.validationMiddleware` with on-screen elements.  See that component's documentation for details.

## Components

### `gpii.schema.validationMiddleware`

Validates information available in the request object. The incoming request is first transformed using
`fluid.model.transformWithRules` and`options.rules.requestContentToValidate`. The results are validated against
`options.schemaKey`.

The default options validate the request body, as expected with a `POST` or `PUT` request.  See the mix-in grades
below for examples of how different rules can handle different types of request data.

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

#### Invokers

##### `{middleware}.middleware(request, response, next)`

* `request`: An object representing the individual user's request.  See [the `gpii-express` documentation](https://github.com/GPII/gpii-express/blob/master/docs/express.md#the-express-request-object) for details.
* `response`: The response object, which can be used to send information to the requesting user.  See [the `gpii-express` documentation](https://github.com/GPII/gpii-express/blob/master/docs/express.md#the-express-response-object) for details.
* `next`: The next Express middleware or router function in the chain.  See [the `gpii-express` documentation for details](https://github.com/GPII/gpii-express/blob/master/docs/middleware.md#what-is-middleware).
* Returns: Nothing.

This invoker fulfills the standard contract for a `gpii.express.middleware` component.  It examines the `request`
content and interrupts the conversation if the JSON data supplied as part of `request` is not valid according to the
JSON Schema `options.schemaKey` found at `options.schemaPath`.  If the content is valid, execute the supplied `next`
function and let some other downstream piece of middleware continue the conversation.

This function is expected to be called by Express (or by an instance of `gpii.express`).

### `gpii.schema.validationMiddleware.handlesQueryData`

A mix-in grade that configures an instance of `gpii.schema.validationMiddleware` to validate query data.
Sets `rules.requestContentToValidate` to the following:

```snippet
requestContentToValidate: {
  "": "query"
}
```
