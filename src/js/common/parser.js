/*

  A parser that dereferences `$ref` links within a JSON Schema so that we have a representation of the schema with
  full definitions of each property.  This allows us to use the path data we get from the validator and find an
  appropriate description field to use instead of the raw output.  Say we have a schema like the following:

    {
        type: "object",
        definitions: {
            field1: {
                description: "Field one must contain at least one uppercase character.",
                type:        "string",
                pattern:     "[A-Z]+"
            }
        },
        properties: {
            field1: { $ref: "#/definitions/field1" }
        }
    }

  If the validator tells us that `.field1` is invalid, it will produce error data like the following:

    {
        fieldErrors: {
            field1: ["should match pattern \"[A-Z]\""]
        }
    }

  The parser allows us to replace this with the description from the JSON Schema, as in:

     {
         fieldErrors: {
             field1: ["Field one must contain at least one uppercase character."]
         }
     }

  This is clearer to read in even the simplest case, and is especially useful when using `allOf` and `anyOf` to combine
  rules.  Even a simple validation error for a field that uses `allOf` and `anyOf` would return at least two warnings
  from the validator, one of which simply says how many rules failed, or that one of them must match.

  If the desired schema property lacks a description, the raw message from the validator will be used as a fallback.

  To use this component, you will need to instantiate it and make it aware of your schemas.  These will be dereferenced
  and cached as they are added.  You can then use the `lookupField` method to retrieve any property of the field from
  the schema definition, as in:

    parser.lookupField("user", ".password.description")

  This component uses [json-schema-ref-parser](https://github.com/BigstickCarpet/json-schema-ref-parser).  We configure
  it using `options.parserOptions` (empty by default).  Read the library's documentation for details of what options
  are available.

 */

"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var $RefParser = $RefParser ? $RefParser : require("json-schema-ref-parser");

fluid.registerNamespace("gpii.schema.parser");

/*

   Dereference a single schema.  As the process is asynchronous, this function returns a promise.

 */

gpii.schema.parser.dereference = function (that, schemaContent, schemaKey) {
    var parser = new $RefParser(); // jshint ignore:line
    return parser.dereference(schemaContent, that.options.parserOptions, gpii.schema.parser.getParserCallback(that, schemaKey));
};

gpii.schema.parser.getParserCallback = function (that, schemaKey) {
    var promise = fluid.promise();
    return function (error, schema) {
        if (error) {
            promise.reject(error);
        }
        else {
            that.dereferencedSchemas[schemaKey] = schema;
            promise.resolve(schema);
        }
    };
};

/*

 Given the path to a field and a schema key, look up the definition in the JSON Schema.
 Accepts the following input parameters when launched through the invoker:

 1. `schemaKey`: The `key` of the schema (generally the filename minus `.json`).
 2. `schemaFieldPath`: a string like `.root.nested.value.description` or an array of path segments like
    `["root", "nested", "value", "description"]`.

 This function assumes it is working with an object that directly represents a JSON Schema, and that child properties
 will be represented within the `properties` element of each level.  The path `.root.nested.value.description` implies
 a structure like the following:

    {
      root: {
        properties: {
          nested: {
            properties: {
              value: {
                description: "Text description"
              }
            }
          }
        }
      }
    }

  At all but the last level, the segment (`nested`, for example`) is looked for first as a property, then as a root
  element.  On the last level, the segment (`description`, for example) is looked for first as a root element, and then
  as a property. This is done to avoid unexpected behavior in dealing with schema properties that match JSON Schema
  keywords, such as `required`, `title`, or `description`.

 */

gpii.schema.parser.lookupField = function (that, schemaKey, schemaFieldPath) {
    var pathSegments = Array.isArray(schemaFieldPath) ? schemaFieldPath : gpii.schema.validator.extractPathSegments(schemaFieldPath);

    var dereferencedSchema = that.dereferencedSchemas[schemaKey];
    if (dereferencedSchema) {
        var currentLevel = dereferencedSchema;
        for (var a = 0; a < pathSegments.length; a++) {
            var segment = pathSegments[a];
            var nextLevel = currentLevel.properties && currentLevel.properties[segment] ? currentLevel.properties[segment] : currentLevel[segment];
            if (a === pathSegments.length - 1) {
                nextLevel = currentLevel[segment] ? currentLevel[segment] : nextLevel;
            }
            if (nextLevel) {
                currentLevel = nextLevel;
            }
            else {
                return false;
            }
        }

        return currentLevel;
    }

    // If we can't evolve the output, return `false` so that we can use the existing error.
    return false;
};

/*

  A listener to cache schemas as they are added.

 */
gpii.schema.parser.updateSchemas = function (that, change) {
    // TODO:  Only update the schemas that have changed instead of those that do not already exist.
    var promises = [];
    fluid.each(that.model.schemas, function (schemaContent, schemaKey) {
        if (!that.dereferencedSchemas[schemaKey]) {
            promises.push(gpii.schema.parser.dereference(that, schemaContent, schemaKey));
        }
    });

    fluid.promise.sequence(promises).then(function () {
        that.events.onSchemasUpdated.fire(that);
    });
};

fluid.defaults("gpii.schema.parser", {
    gradeNames: ["fluid.modelComponent"],
    parserOptions: {},
    model: {
        schemas: {}
    },
    events: {
        onSchemasUpdated: null
    },
    members: {
        parser: null,
        dereferencedSchemas: {}
    },
    invokers: {
        lookupField: {
            funcName: "gpii.schema.parser.lookupField",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"] // schemaKey, schemaFieldPath
        }
    },
    modelListeners: {
        schemas: {
            funcName:      "gpii.schema.parser.updateSchemas",
            args:          ["{that}", "{arguments}.0"]
        }
    }
});