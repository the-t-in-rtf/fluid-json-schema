// A payload to test the performance of our "ordered stringify" function.  Intended to be both "deep" (many layers of
// properties) and "broad" (lots of properties at one or more levels).
(function (fluid) {
    "use strict";
    fluid.registerNamespace("fluid.test.schema.payloads");
    fluid.test.schema.payloads.deepAndBroad = {
        "type": "object",
        "properties": {
            // "deep" branch
            "deep": {
                "type": "object",
                "properties": {
                    "foo": {
                        "type": "object",
                        "properties": {
                            "bar": {
                                "type": "object",
                                "properties": {
                                    "baz": {
                                        "type": "object",
                                        "properties": {
                                            "qux": {
                                                "type": "object",
                                                "properties": {
                                                    "quux": {
                                                        "type": "boolean"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "broad": {
                "type": "object",
                "properties": {
                    "zero": { "type": "string" },
                    "one": { "type": "string" },
                    "two": { "type": "string" },
                    "three": { "type": "string" },
                    "four": { "type": "string" },
                    "five": { "type": "string" },
                    "six": { "type": "string" },
                    "seven": { "type": "string" },
                    "eight": { "type": "string" },
                    "nine": { "type": "string" },
                    "ten": { "type": "string" },
                    "eleven": { "type": "string" },
                    "twelve": { "type": "string" },
                    "thirteen": { "type": "string" },
                    "fourteen": { "type": "string" },
                    "fifteen": { "type": "string" },
                    "sixteen": { "type": "string" },
                    "seventeen": { "type": "string" },
                    "eighteen": { "type": "string" },
                    "nineteen": { "type": "string" },
                    "twenty": { "type": "string" },
                    "twenty-one": { "type": "string" },
                    "twenty-two": { "type": "string" },
                    "twenty-three": { "type": "string" },
                    "twenty-four": { "type": "string" },
                    "twenty-five": { "type": "string" },
                    "twenty-six": { "type": "string" },
                    "twenty-seven": { "type": "string" },
                    "twenty-eight": { "type": "string" },
                    "twenty-nine": { "type": "string" },
                    "thirty": { "type": "string" },
                    "thirty-one": { "type": "string" },
                    "thirty-two": { "type": "string" },
                    "thirty-three": { "type": "string" },
                    "thirty-four": { "type": "string" },
                    "thirty-five": { "type": "string" },
                    "thirty-six": { "type": "string" },
                    "thirty-seven": { "type": "string" },
                    "thirty-eight": { "type": "string" },
                    "thirty-nine": { "type": "string" },
                    "fourty": { "type": "string" },
                    "fourty-one": { "type": "string" },
                    "fourty-two": { "type": "string" },
                    "fourty-three": { "type": "string" },
                    "fourty-four": { "type": "string" },
                    "fourty-five": { "type": "string" },
                    "fourty-six": { "type": "string" },
                    "fourty-seven": { "type": "string" },
                    "fourty-eight": { "type": "string" },
                    "fourty-nine": { "type": "string" },
                    "fifty": { "type": "string" },
                    "fifty-one": { "type": "string" },
                    "fifty-two": { "type": "string" },
                    "fifty-three": { "type": "string" },
                    "fifty-four": { "type": "string" },
                    "fifty-five": { "type": "string" },
                    "fifty-six": { "type": "string" },
                    "fifty-seven": { "type": "string" },
                    "fifty-eight": { "type": "string" },
                    "fifty-nine": { "type": "string" },
                    "sixty": { "type": "string" },
                    "sixty-one": { "type": "string" },
                    "sixty-two": { "type": "string" },
                    "sixty-three": { "type": "string" },
                    "sixty-four": { "type": "string" },
                    "sixty-five": { "type": "string" },
                    "sixty-six": { "type": "string" },
                    "sixty-seven": { "type": "string" },
                    "sixty-eight": { "type": "string" },
                    "sixty-nine": { "type": "string" },
                    "seventy": { "type": "string" },
                    "seventy-one": { "type": "string" },
                    "seventy-two": { "type": "string" },
                    "seventy-three": { "type": "string" },
                    "seventy-four": { "type": "string" },
                    "seventy-five": { "type": "string" },
                    "seventy-six": { "type": "string" },
                    "seventy-seven": { "type": "string" },
                    "seventy-eight": { "type": "string" },
                    "seventy-nine": { "type": "string" },
                    "eighty": { "type": "string" },
                    "eighty-one": { "type": "string" },
                    "eighty-two": { "type": "string" },
                    "eighty-three": { "type": "string" },
                    "eighty-four": { "type": "string" },
                    "eighty-five": { "type": "string" },
                    "eighty-six": { "type": "string" },
                    "eighty-seven": { "type": "string" },
                    "eighty-eight": { "type": "string" },
                    "eighty-nine": { "type": "string" },
                    "ninety": { "type": "string" },
                    "ninety-one": { "type": "string" },
                    "ninety-two": { "type": "string" },
                    "ninety-three": { "type": "string" },
                    "ninety-four": { "type": "string" },
                    "ninety-five": { "type": "string" },
                    "ninety-six": { "type": "string" },
                    "ninety-seven": { "type": "string" },
                    "ninety-eight": { "type": "string" },
                    "ninety-nine": { "type": "string" },
                    "hundred": { "type": "string" }
                }
            }
        }
    };
})(fluid);
