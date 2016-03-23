# The Schema "Gatekeeper" Middleware

Although you usually will build some fault tolerance into your components, on some level they expect to deal with
data that has the right structure, and which contains the expected type of information (strings, booleans, dates, etc).

The `gpii.schema.middleware` components provided with this package reject invalid payloads, which allows your server-side
components to safely assume they will only receive JSON data in the correct format.  The component doesn't know anything
about how you intend to use the data.  It only examines the payload and steps in if the payload is not valid according
to the configured JSON Schema.

The base middleware is intended to be used with a `gpii.express` or `gpii.express.router` instance.  The
`gpii.schema.middleware.requestAware.router` wrapper is provided as a convenient starting point.  With that router,
you can created "gated" REST endpoints that only pass through valid payloads to the underlying handlers, as show here:

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
    );

    gpii.express({
      gradeNames:        ["gpii.schema.middleware.requestAware.router"],
      handlerGrades:     ["gpii.schema.tests.handler"],
      schemaKey:         "valid.json",
      schemaDirs:        ["%my-package/src/schemas"],
      responseSchemaKey: "message.json",
      responseSchemaUrl: "http://my.site/schemas/"
      path:              "/gatekeeper"
    });

If you were to launch this example, you would have a REST endpoint `/gatekeeper` that compares all POST request payloads
to the schema `valid.json`, which can be found in `%my-package/src/schemas`. If a payload is valid according to the
schema, the handler defined above would output a canned "success" message.  If the payload is invalid, the underlying
`gpii.express.middleware` instance steps in and responds with a failure message.

# Displaying validation messages onscreen

The [`errorBinder`](errorBinder.md) component included with this package is designed to associate the validation error
messages produced by `gpii.schema.middleware` with on-screen elements.  See that component's documentation for details.

# Components

## `gpii.schema.middleware`

Validates information available in the request object. The incoming request is first transformed using
`fluid.model.transformWithRules` and`options.rules.requestContentToValidate`. The results are validated against
`options.schemaKey`.

The default options validate the request body, as expected with a `POST` or `PUT` request.  See the mix-in grades
below for examples of how different rules can handle different types of request data.


The transformed request data is validated against the schema. Any validation errors are then transformed using
`options.rules.validationErrorsToResponse` before they are sent to the user.  The default format looks roughly like:

     {
       ok: false,
       message: "The JSON you have provided is not valid.",
       errors: {
         field1: ["This field is required."]
       }
     }

The rejection output of this middleware is delivered using a [`schemaHandler`](./handler.md). It should match the JSON
Schema specified in `options.responseSchemaKey` and `options.responseSchemaUrl`.

### Component Options

The following component configuration options are supported:

| Option              | Type     | Description |
| ------------------- | -------- | ----------- |
| `handlerGrades` | `Array` | An array of grade names that will be used in constructing our request handler. |
| `method` | `String` | The method(s) the inner router will respond to.  These should be lowercase strings corresponding to the methods exposed by Express routers.  The default is to use the `POST` method, there are convenience grades for each method. |
| `responseSchemaKey` | `String` | The schema key that [our handler](./handler.md) will use in constructing response headers. |
| `responseSchemaUrl` | `String` | The base URL where `responseSchemaKey` can be found. |
| `rules.requestContentToValidate` | `Object` | The [rules to use in transforming](http://docs.fluidproject.org/infusion/development/ModelTransformationAPI.html#fluid-model-transformwithrules-source-rules-options-)
the incoming data before validation (see below for more details). |
| `rules.validationErrorsToResponse` | `Object` | The [rules to use in transforming](http://docs.fluidproject.org/infusion/development/ModelTransformationAPI.html#fluid-model-transformwithrules-source-rules-options-)
validation errors before they are sent to the user (see above). |
| `schemaKey`         | `String` |  The key (also the filename) of the schema to be used for validation. |
| `schemaDirs`        | `String` | The path to the schema directories that contain a file matching `options.schemaKey`.  This is expected to be an array of package-relative paths such as `%gpii-handlebars/tests/schemas`. |

The default `rules.requestContentToValidate` in this grade are intended for use with `PUT` or `POST` body data.  This
can be represented as follows:

      requestContentToValidate: {
          "": "body"
      }

See `gpii.schema.middleware.handlesGetMethod` below for an example of working with query data.

### Invokers

#### `{middleware}.middleware(req, res, next)`

* `req`: The [request object](http://expressjs.com/en/api.html#req) provided by Express, which wraps node's [`http.incomingMessage`](https://nodejs.org/api/http.html#http_class_http_incomingmessage).
* `res`: The [response object](http://expressjs.com/en/api.html#res) provided by Express, which wraps node's [`http.ServerResponse`](https://nodejs.org/api/http.html#http_class_http_serverresponse).
* `next`: The next Express middleware or router function in the chain.
* Returns: Nothing.

This invoker fulfills the standard contract for a `gpii.express.middleware` component.  It examines the `req` content
and interrupts the conversation if the JSON data supplied as part of `req` is not valid according to the JSON
Schema `options.schemaKey` found at `options.schemaPath`.  If the content is valid, execute the supplied `next` function
and let some other downstream piece of middleware continue the conversation.

This function is expected to be called by Express (or by an instance of `gpii.express`).


## `gpii.schema.middleware.requestAware.router`

A component that overlays a `gpii.schema.middleware` instance in front  of a `gpii.express.requestAware.router`
instance. Invalid responses will be immediately rejected as outlined above.  Valid responses will be passed along to
the underlying router and handler.    For information about the underlying grade, see
[the documentation for `gpii-express`](http://github.com/GPII/gpii-express).

### Component Options

| Option              | Type     | Description |
| ------------------- | -------- | ----------- |
| `path`              | `String` | The URL path (including any path variables) that will be handled by this router. |
| `handlerGrades`     | `Array`  | An array of grade names that will be used in constructing the request handler that will field a successful response. |
| `method`            | `String` | The method(s) the inner router will respond to.  These should be lowercase strings corresponding to the methods exposed by Express routers.  The default is to use the `POST` method, there are convenience grades for each method. |
| `responseSchemaKey` | `String` | The schema key that [our handler](./handler.md) will use in constructing response headers. |
| `responseSchemaUrl` | `String` | The base URL where `responseSchemaKey` can be found. |
| `rules.requestContentToValidate` | `Object` | The [rules to use in transforming](http://docs.fluidproject.org/infusion/development/ModelTransformationAPI.html#fluid-model-transformwithrules-source-rules-options-)
the incoming data before validation (see above). |
| `rules.validationErrorsToResponse` | `Object` | The [rules to use in transforming](http://docs.fluidproject.org/infusion/development/ModelTransformationAPI.html#fluid-model-transformwithrules-source-rules-options-)
validation errors before they are sent to the user (see above). |
| `schemaKey`         | `String` |  The key (also the filename) of the schema to be used for validation. |
| `schemaDirs`        | `String` | The path to the schema directories that contain a file matching `options.schemaKey`.  This is expected to be an array of package-relative paths such as `%gpii-handlebars/tests/schemas`. |

Note that `handlerGrades` as used here only governs the response sent when valid data is received.  If you wish to
override the `handlerGrades` used by this component's `gpii.schema.middleware` instance, you would need to use options
like the following:

    fluid.defaults("my.custom.router", {
        gradeNames: ["gpii.schema.middleware.requestAware.router"]
        components: {
            gatekeeper: {
                options: {
                    handlerGrades: ["my.custom.handler"]
                }
            }
        }
    });

## `gpii.schema.middleware.contentAware.router`

A component that overlays a `gpii.schema.middleware` instance in front of a `gpii.express.contentAware.router` instance.
Invalid responses will be immediately rejected using the first matching handler in `options.errorHandlers`.  Valid
responses will be passed along to the first matching handler in `options.successHandlers`.  For information about the
underlying `contentAware` grade, see [the documentation for `gpii-express`](http://github.com/GPII/gpii-express).

### Component Options

| Option              | Type     | Description |
| ------------------- | -------- | ----------- |
| `errorHandlers`     | `Object` | A map of handlers and content types that will be use in handling a rejected response. |
| `method`            | `String` | The method(s) the inner router will respond to.  These should be lowercase strings corresponding to the methods exposed by Express routers.  The default is to use the `POST` method, there are convenience grades for each method. |
| `path`              | `String` | The URL path (including any path variables) that will be handled by this router. |
| `rules.requestContentToValidate` | `Object` | The [rules to use in transforming](http://docs.fluidproject.org/infusion/development/ModelTransformationAPI.html#fluid-model-transformwithrules-source-rules-options-)
the incoming data before validation (see above). |
| `rules.validationErrorsToResponse` | `Object` | The [rules to use in transforming](http://docs.fluidproject.org/infusion/development/ModelTransformationAPI.html#fluid-model-transformwithrules-source-rules-options-)
validation errors before they are sent to the user (see above). |
| `schemaKey`         | `String` |  The key (also the filename) of the schema to be used for validation. |
| `schemaDirs`        | `String` | The path to the schema directories that contain a file matching `options.schemaKey`.  This is expected to be an array of package-relative paths such as `%gpii-handlebars/tests/schemas`. |
| `successHandlers`   | `Object` | A map of handlers and content types that will be use in handling a successful response. |

The order in which success and error handlers are matched is controlled using [namespaces and priorities](http://docs.fluidproject.org/infusion/development/Priorities.html).

## `gpii.schema.middleware.handlesGetMethod`

A mix-in grade that configures either of the above routers to validate GET query data.
Changes the `method` option to `get` and sets `rules.requestContentToValidate` to the following:

      requestContentToValidate: {
          "": "query"
      }

## `gpii.schema.middleware.handlesPutMethod`

A mix-in grade that configures either of the above routers to validate PUT body data.
Changes the `method` options to `put`.  The rules to control what information is validated are inherited from
`gpii.schema.middleware`.