# The JSON Schema Link Middleware

When writing REST interfaces, we also commonly return JSON data in response to a request.  JSON Schemas can also be
used to provide hints about the output format we are using.

The working group that writes the JSON Schema standard [has outlined two approaches for labeling outgoing responses](http://json-schema.org/latest/json-schema-core.html#anchor33).
Both of these involve setting HTTP headers in the outgoing response, as in:

    Content-Type: application/my-media-type+json; profile="http://example.com/my-hyper-schema#"
    Link: <http://example.com/my-hyper-schema#>; rel="describedBy"

The schema link middleware provided in this package adds these headers to all requests it is allowed to work with.
There are two grades, one for normal (non-error) requests, and one for error requests.  To use either of these, they
must be allowed to work with the request before whatever router or middleware sends the final response to the user.  The
ordering of middleware components is controlled using
[priorities and namespaces](http://docs.fluidproject.org/infusion/development/Priorities.html).

These grades do not send a response to the user.  You are expected to wire a `gpii.express.router` instance into the
middleware chain that will respond to the user.  Otherwise, the error will be passed along to the default Express
error handler.

# `gpii.schema.schemaLinkMiddleware`

The middleware grade for non-error requests.

## Component Options

In addition to the standard options available for an instance of
[`gpii.express.middleware`](https://github.com/GPII/gpii-express/blob/master/docs/middleware.md), this grade supports
the following unique options:

| Option      | Type       | Description |
| ----------- | ---------- | ----------- |
| `schemaKey` | `{String}` | A short key for the schema that will represent it in the `Content-Type` header. |
| `schemaUrl` | `{String}` | A URL for the schema, which will be included in both the `Link` and `Content-Type` headers. |


## Component Invokers

### `{that}.middleware(request, response, body)`

* `request`: The [request object](http://expressjs.com/en/api.html#req) provided by Express, which wraps node's [`http.incomingMessage`](https://nodejs.org/api/http.html#http_class_http_incomingmessage).
* `response`: The [response object](http://expressjs.com/en/api.html#res) provided by Express, which wraps node's [`http.ServerResponse`](https://nodejs.org/api/http.html#http_class_http_serverresponse).
* `next`: The next Express middleware or router function in the chain.
* Returns: Nothing.

This invoker fulfills the standard contract for a `gpii.express.middleware` component.  It adds the two headers outlined
above and then allows processing to continue along the chain of middleware.


# `gpii.schema.schemaLinkMiddleware.error`

The middleware grade for error requests.

## Component Options

In addition to the options outlined above, and the options supported for an instance of
[`gpii.express.middleware.error`](https://github.com/GPII/gpii-express/blob/master/docs/errorMiddleware.md), this grade
supports the following options:

| Option       | Type       | Description |
| ------------ | ---------- | ----------- |
| `statusCode` | `{Number}` |  The [HTTP status code](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes) to send via the `response` object. |


## Component Invokers

### `{that}.middleware(error, request, response, body)`

* `error`: The error payload returned by upstream middleware.
* `request`: The [request object](http://expressjs.com/en/api.html#req) provided by Express, which wraps node's [`http.incomingMessage`](https://nodejs.org/api/http.html#http_class_http_incomingmessage).
* `response`: The [response object](http://expressjs.com/en/api.html#res) provided by Express, which wraps node's [`http.ServerResponse`](https://nodejs.org/api/http.html#http_class_http_serverresponse).
* `next`: The next Express middleware or router function in the chain.
* Returns: Nothing.

This invoker fulfills the standard contract for a `gpii.express.middleware.error` component.  It adds the two headers
outlined above and then allows processing to continue along the chain of error middleware.
