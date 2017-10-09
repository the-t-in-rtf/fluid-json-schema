# JSON Schemas and HTTP headers

When writing REST interfaces, we also commonly return JSON data in response to a request.  JSON Schemas can also be
used to provide hints about the output format we are using.

The working group that writes the JSON Schema standard [has outlined two approaches for labeling outgoing responses](http://json-schema.org/latest/json-schema-core.html#anchor33).
Both of these involve setting HTTP headers in the outgoing response, as in:

    Content-Type: application/my-media-type+json; profile="http://example.com/my-hyper-schema#"
    Link: <http://example.com/my-hyper-schema#>; rel="describedBy"

This package provides two approaches to adding these headers:

1. The "Schema Link Handler" grade describe on this page adds headers for both "success" and "error" messages it fields, and has the option to use a different schema URL for each.
2. The "Schema Link Middleware" grades described on this page add headers for a single schema to all requests they are allowed to process.

# Schema Link Handler

This approach is better suited a wider range of scenarios, for example, when there is a chance that "success" and
"failure" for a given endpoint might be represented by different schemas.  A common example would be an endpoint that
returns a set of records when search terms are entered, but which returns an error message when the search terms are 
invalid or a server error occurs.

## `gpii.schema.handlerWithSchemaHeaders`

An extension of [`gpii.express.handler`](https://github.com/GPII/gpii-express/blob/master/docs/handler.md) that adds
the HTTP headers when the `sendResponse` or `sendError` invoker is called.  This grade only adds headers, it does not
decide what success or failure looks like.  It is designed to be overlayed with any existing `gpii.express.handler`
grade that relies on the standard `sendResponse` and `sendError` functions.

If you are already customising these in your handler, you should be careful if you are:

1. Setting the `Content-Type` or `Link` headers yourself.
2. Sending a response yourself using the `response` object's `send` method, in which case this grade's invoker will not have a chance to send the headers.

### Component Options

In addition to the standard available for an instance of
[`gpii.express.handler`](https://github.com/GPII/gpii-express/blob/master/docs/handler.md), this grade supports
the following unique 

| Option               | Type       | Description |
| -------------------- | ---------- | ----------- |
| `schemaUrls`         | `{String}` | The URLs to be included in both the `Link` and `Content-Type` headers (see below). |
| `schemaUrls.error`   | `{String}` | The JSON Schema to which an error response conforms. |
| `schemaUrls.success` | `{String}` | The JSON Schema to which a successful response conforms. |

### Component Invokers

#### `{that}.sendError(statusCode, body)`
* `statusCode`: The [HTTP status code](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes) associated with the error.
* `body`: The body (JSON, text, or otherwise) to be passed along as an error message.
* Returns: Nothing.

Sets the HTTP headers using the URL contained in `schemaUrls.error`, then handles the error as outlined in the
`gpii.express.handler` docs.

#### `{that}.sendResponse(statusCode, body)`
* `statusCode`: The [HTTP status code](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes) to be sent to the user.
* `body`: The body (JSON, text, or otherwise) to be sent via `that.response.send`.
* Returns: Nothing.

Sets the HTTP headers using the URL contained in `schemaUrls.success`, then sends the response as outlined in the
`gpii.express.handler` docs.


# Schema Link Middleware

The schema link middleware provided in this package adds the required HTTP headers to all requests it is allowed to
work with.  There are two grades, one for normal (non-error) requests, and one for error requests.  To use either of
these, they must be allowed to work with the request before whatever router or middleware sends the final response to
the user.  The ordering of middleware components is controlled using
[priorities and namespaces](http://docs.fluidproject.org/infusion/development/Priorities.html).

These grades do not send a response to the user.  You are expected to wire a `gpii.express.router` instance into the
middleware chain that will respond to the user.  Otherwise, the error will be passed along to the default Express
error handler.  Another key limitation of this approach is that the headers are always set for every request.  It is
only really appropriate when only a single type of payload will ever be sent, for example:

1. When delivering a static payload such as a JSON document saved to a file.
2. When delivering a single JSON error message format as the last "link" in the error-handling middleware chain.

## `gpii.schema.schemaLink.middleware`

The middleware grade for non-error requests, which extends [`gpii.express.middleware.headerSetter`](https://github.com/GPII/gpii-express/blob/master/docs/headerMiddleware.md#gpiiexpressmiddlewareheadersetter).
Adds the two headers outlined above to all "non-error" messages and then allows processing to continue along the chain
of (non-error-handling) middleware.

### Component Options

In addition to the supported by the underlyng `gpii.express.headerSetter` grade, this grade supports the
following unique 

| Option                           | Type       | Description |
| -------------------------------- | ---------- | ----------- |
| `schemaBaseUrl`                  | `{String}` | The base URL, relative to which all schemas can be found. |
| `schemaPaths.success` (required) | `{String}` | The path to the "success" schema, relative to `schemaBaseUrl`. |

You may also choose to manage the schema URL directly and to set separate base URLs for the "error" and "success" schema.
See the documentation below for `gpii.schema.schemaLink.schemaUrlHolder` for details.


## `gpii.schema.schemaLink.middleware.error`

The middleware grade for error requests, which extends [`gpii.express.headerSetter.error`](github.com/GPII/gpii-express/blob/master/docs/headerMiddleware.md).
Adds the two headers outlined above to all "error" messages and then allows processing to continue along the chain of (error-handling) middleware.

### Component Options

In addition to the supported by the underlying `gpii.express.headerSetter.error` grade, this component supports:

| Option                         | Type       | Description |
| ------------------------------ | ---------- | ----------- |
| `schemaBaseUrl`                | `{String}` | The base URL, relative to which all schemas can be found. |
| `schemaPaths.error` (required) | `{String}` | The path to the "error" schema, relative to `schemaBaseUrl`. |

You may also choose to manage the schema URL directly and to set separate base URLs for the "error" and "success" schema.
See the documentation below for `gpii.schema.schemaLink.schemaUrlHolder` for details.

# The Schema Link "Holder"

Rather than require implementers to manage individual schema URLs, a convenience grade is provided that will assemble
schema URLs from base URLs and schema paths.  These are configured such that most people will only need to set 
`schemaBaseUrl` and one or both of `schemaPaths.error` and `schemaPaths.success`.

## `gpii.schema.schemaLink.schemaUrlHolder`

### Component Options

| Option                   | Type       | Description |
| ------------------------ | ---------- | ----------- |
| `schemaBaseUrl`          | `{String}` | The base URL, relative to which all schemas can be found. |
| `schemaBaseUrls.error`   | `{String}` | The base URL, relative to which the "error" schema can be found.  Set to `schemaBaseUrl` by default. |
| `schemaBaseUrls.success` | `{String}` | The base URL, relative to which the "success" schema can be found.  Set to `schemaBaseUrl` by default. |
| `schemaPaths.error`      | `{String}` | The path to the "error" schema, relative to `schemaBaseUrls.error`. |
| `schemaPaths.success`    | `{String}` | The path to the "success" schema, relative to `schemaBaseUrls.error`. |

By default, the final URLs will be constructed from `schemaBaseUrl` and one of the schema paths.  If your "error" 
and "success" schemas can be found at different hostnames (ports, etc.), you can set `schemaBaseUrls.error` and
`schemaBaseUrls.success` individually.

The "Schema Link Handler" and "Schema Link Middleware" described above both extend this grade, so you can use it as a
convenient target for setting a common base URL, as in the following example:

```javascript
fluid.defaults("my.express.grade", {
    gradeNames: ["gpii.express"],
    distributeOptions: {
        source: "{that}.options.schemaBaseUrl",
        target: "{that gpii.schema.schemaLink.schemaUrlHolder}.options.schemaBaseUrl"
    }
    // Your components and other unique options.
});
```