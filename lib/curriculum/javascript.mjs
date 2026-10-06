export default {
  "language": "javascript",
  "topics": [
    {
      "id": "values",
      "title": "Variables and values",
      "summary": "Use names to store values. Choose let when the name will be reassigned and const when the binding stays fixed.",
      "concepts": [
        "let and const",
        "Reassignment",
        "Primitive values",
        "Mutable arrays and objects"
      ],
      "example": "let score = 4;\nconst tags = [\"js\"];\nscore += 1;\ntags.push(\"python\");\nconsole.log(score);\nconsole.log(JSON.stringify(tags));",
      "output": "5\n[\"js\",\"python\"]",
      "steps": [
        "Create a number and an array.",
        "Reassign score to 5.",
        "Change the array contents without reassigning tags."
      ],
      "source": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types"
    },
    {
      "id": "operators",
      "title": "Operators and conversion",
      "summary": "Operators calculate and compare values. Convert text deliberately when you want numeric arithmetic.",
      "concepts": [
        "Arithmetic",
        "Explicit conversion",
        "String concatenation",
        "Strict equality"
      ],
      "example": "console.log(Number(\"4\") + 2);\nconsole.log(\"4\" + 2);\nconsole.log(2 === \"2\");",
      "output": "6\n42\nfalse",
      "steps": [
        "Number converts the first string to 4.",
        "Adding to a string joins text.",
        "Strict equality keeps number and string types distinct."
      ],
      "source": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_operators"
    },
    {
      "id": "decisions",
      "title": "Conditions and branches",
      "summary": "Use if and else to choose a branch. A conditional expression chooses between two values.",
      "concepts": [
        "if and else",
        "Comparison conditions",
        "Truthy and falsy values",
        "Conditional expressions"
      ],
      "example": "const score = 72;\nlet label;\nif (score >= 60) {\n  label = \"pass\";\n} else {\n  label = \"retry\";\n}\nconsole.log(label);",
      "output": "pass",
      "steps": [
        "Compare 72 with the threshold 60.",
        "The condition passes, so run the first branch.",
        "Store and print the chosen label."
      ],
      "source": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling"
    },
    {
      "id": "loops",
      "title": "Loops and iteration",
      "summary": "A loop repeats work. Use for...of to visit iterable values and keep a running result.",
      "concepts": [
        "for...of",
        "Accumulators",
        "break and continue",
        "Loop conditions"
      ],
      "example": "let total = 0;\nfor (const value of [2, 3, 4]) {\n  total += value;\n}\nconsole.log(total);",
      "output": "9",
      "steps": [
        "Start total at 0.",
        "Add 2, then 3, then 4.",
        "After the loop, total is 9."
      ],
      "source": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration"
    },
    {
      "id": "functions",
      "title": "Functions and return values",
      "summary": "Functions package reusable work. Parameters receive inputs, and return sends a value back to the caller.",
      "concepts": [
        "Parameters and arguments",
        "return",
        "Default parameters",
        "Reusable behavior"
      ],
      "example": "function greet(name = \"learner\") {\n  return \"Hello, \" + name + \"!\";\n}\nconsole.log(greet());\nconsole.log(greet(\"Ada\"));",
      "output": "Hello, learner!\nHello, Ada!",
      "steps": [
        "Define a function with a default name.",
        "The first call uses the default.",
        "The second call supplies Ada and receives a different string."
      ],
      "source": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions"
    },
    {
      "id": "arrays",
      "title": "Arrays and method pipelines",
      "summary": "Arrays store ordered items. Use map to transform values and filter to keep selected values in new arrays.",
      "concepts": [
        "Zero-based indices",
        "map()",
        "filter()",
        "Mutation and copies"
      ],
      "example": "const values = [1, 2, 3];\nconst result = values.map(n => n * 2).filter(n => n > 2);\nconsole.log(JSON.stringify(result));\nconsole.log(JSON.stringify(values));",
      "output": "[4,6]\n[1,2,3]",
      "steps": [
        "map creates [2, 4, 6].",
        "filter keeps values greater than 2.",
        "The callbacks leave the original array unchanged."
      ],
      "source": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map"
    },
    {
      "id": "strings",
      "title": "Strings and text cleanup",
      "summary": "Strings represent text. Chain methods to remove edge whitespace and normalize casing without changing the original string.",
      "concepts": [
        "Immutable strings",
        "trim()",
        "toLowerCase()",
        "Literal replacement"
      ],
      "example": "const original = \"  Ada  \";\nconst cleaned = original.trim().toLowerCase();\nconsole.log(cleaned);\nconsole.log(JSON.stringify(original));",
      "output": "ada\n\"  Ada  \"",
      "steps": [
        "trim removes whitespace at both ends.",
        "toLowerCase converts Ada to ada.",
        "original still contains its spaces and original casing."
      ],
      "source": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace"
    },
    {
      "id": "objects",
      "title": "Objects and named fields",
      "summary": "Objects group values under property names. Object.keys, Object.values, and Object.entries turn those fields into arrays.",
      "concepts": [
        "Property names and values",
        "Dot and bracket access",
        "Object.keys()",
        "Object.entries()"
      ],
      "example": "const profile = { name: \"Ada\", level: \"beginner\" };\nconsole.log(profile.name);\nconsole.log(JSON.stringify(Object.keys(profile)));\nconsole.log(JSON.stringify(Object.entries(profile)));",
      "output": "Ada\n[\"name\",\"level\"]\n[[\"name\",\"Ada\"],[\"level\",\"beginner\"]]",
      "steps": [
        "Read a single named field.",
        "Collect the property names.",
        "Collect each name together with its stored value."
      ],
      "source": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys"
    }
  ],
  "interviews": [
    {
      "id": "js-values-const",
      "topicId": "values",
      "question": "Can an array declared with const still change?",
      "answer": "Yes. const prevents reassignment of the variable, while methods such as push can change the array it references.",
      "keyPoints": [
        "Binding and value are different.",
        "Reassigning the variable is forbidden; mutating its array is allowed."
      ],
      "followUp": "What happens if you assign a new array to that const variable?"
    },
    {
      "id": "js-values-scope",
      "topicId": "values",
      "question": "How do let, const, and var differ in scope?",
      "answer": "let and const are block scoped. var is function scoped, or scoped to the surrounding script when outside a function.",
      "keyPoints": [
        "A block uses braces.",
        "let permits reassignment; const requires an initializer."
      ],
      "followUp": "Can code outside an if block access a let declared inside it?"
    },
    {
      "id": "js-operators-equality",
      "topicId": "operators",
      "question": "What is the difference between == and ===?",
      "answer": "== can convert operands before comparing. === compares without that type conversion, so 2 === \"2\" is false.",
      "keyPoints": [
        "Use strict equality when types should remain distinct.",
        "Equal-looking text and numbers are different values."
      ],
      "followUp": "Predict the results of 0 == false and 0 === false."
    },
    {
      "id": "js-operators-plus",
      "topicId": "operators",
      "question": "Why does \"4\" + 2 produce \"42\"?",
      "answer": "One operand is a string, so + performs string concatenation here. Number(\"4\") + 2 converts the text first and produces 6.",
      "keyPoints": [
        "+ can add numbers or join text.",
        "Explicit conversion makes the intended operation clear."
      ],
      "followUp": "What do \"4\" * 2 and Number(\"4\") + 2 produce?"
    },
    {
      "id": "js-decisions-ternary",
      "topicId": "decisions",
      "question": "When is a conditional expression useful?",
      "answer": "Use condition ? valueA : valueB when a simple branch needs to select one value, such as a pass or retry label.",
      "keyPoints": [
        "It is an expression with a result.",
        "Only the chosen expression is evaluated."
      ],
      "followUp": "Rewrite a two-branch label assignment using a conditional expression."
    },
    {
      "id": "js-decisions-truthiness",
      "topicId": "decisions",
      "question": "Are empty arrays and empty objects falsy?",
      "answer": "No. [] and {} are truthy. Common falsy values include false, 0, 0n, \"\", null, undefined, and NaN.",
      "keyPoints": [
        "An empty container can still be truthy.",
        "Check array.length when you need to know whether it has items."
      ],
      "followUp": "How would you check that an array contains at least one item?"
    },
    {
      "id": "js-loops-of-in",
      "topicId": "loops",
      "question": "How does for...of differ from for...in?",
      "answer": "for...of visits iterable values, such as array items. for...in visits enumerable string property keys, including inherited enumerable keys.",
      "keyPoints": [
        "Values and keys serve different purposes.",
        "Use for...of for an array's values."
      ],
      "followUp": "What would each loop variable contain for [\"a\", \"b\"]?"
    },
    {
      "id": "js-loops-control",
      "topicId": "loops",
      "question": "How do break and continue affect a loop?",
      "answer": "break leaves the loop. continue skips the rest of the current iteration and proceeds with the next iteration.",
      "keyPoints": [
        "break stops further iterations.",
        "continue keeps the loop running."
      ],
      "followUp": "Which would you use to skip one invalid score while processing the rest?"
    },
    {
      "id": "js-functions-return",
      "topicId": "functions",
      "question": "What does a function return if it reaches the end without return?",
      "answer": "It returns undefined. A console.log call prints a message but does not supply the caller with that message as a return value.",
      "keyPoints": [
        "Printing and returning have different purposes.",
        "A return statement also ends that function call."
      ],
      "followUp": "Why does an arrow callback with braces often need an explicit return?"
    },
    {
      "id": "js-functions-defaults",
      "topicId": "functions",
      "question": "When does a default parameter apply?",
      "answer": "It applies when the argument is omitted or explicitly undefined. Passing null uses null instead of the default.",
      "keyPoints": [
        "Omitted and undefined arguments use the default.",
        "null is an explicitly supplied value."
      ],
      "followUp": "Predict greet(), greet(undefined), and greet(null) for the example function."
    },
    {
      "id": "js-arrays-map-filter",
      "topicId": "arrays",
      "question": "How do map and filter differ?",
      "answer": "map stores a transformed value for each visited item. filter keeps original items whose predicate passes. Both return new arrays.",
      "keyPoints": [
        "map changes the output values.",
        "filter selects items and can shorten the result."
      ],
      "followUp": "Which method would keep only passing scores?"
    },
    {
      "id": "js-arrays-sort",
      "topicId": "arrays",
      "question": "Why can [10, 2, 1].sort() produce [1, 10, 2]?",
      "answer": "Without a comparator, sort compares string forms. For ascending numeric order, use sort((a, b) => a - b). sort mutates the array.",
      "keyPoints": [
        "Default sorting is not numeric.",
        "The comparator and mutation behavior both matter."
      ],
      "followUp": "How would you keep the original array before sorting numerically?"
    },
    {
      "id": "js-strings-immutable",
      "topicId": "strings",
      "question": "Do trim and toLowerCase change the original string?",
      "answer": "No. Strings are immutable, and these methods return new strings. Assign or use the returned value to keep the change.",
      "keyPoints": [
        "The original string remains available.",
        "Method chaining uses each returned string."
      ],
      "followUp": "What happens if you call text.trim() and then print text?"
    },
    {
      "id": "js-strings-replace",
      "topicId": "strings",
      "question": "Does replace with a string pattern replace every occurrence?",
      "answer": "No. A string pattern replaces the first occurrence only. Use replaceAll for all literal occurrences, or an appropriate global regular expression.",
      "keyPoints": [
        "The pattern form controls how many matches change.",
        "replace returns a new string."
      ],
      "followUp": "Predict \"a-a-a\".replace(\"a\", \"b\")."
    },
    {
      "id": "js-objects-views",
      "topicId": "objects",
      "question": "What do Object.keys, Object.values, and Object.entries return?",
      "answer": "They return arrays of own enumerable string property names, their values, or [key, value] pairs respectively.",
      "keyPoints": [
        "keys gives names; values gives data; entries gives both.",
        "These functions do not mutate the object."
      ],
      "followUp": "Which would help you render both a field label and its value?"
    },
    {
      "id": "js-objects-key-order",
      "topicId": "objects",
      "question": "Why can Object.keys({2: \"b\", 1: \"a\", tag: \"x\"}) list \"1\" before \"2\"?",
      "answer": "Array-index property keys appear in ascending numeric order. Other enumerable string keys follow their creation order.",
      "keyPoints": [
        "Numeric-looking array-index keys have special ordering.",
        "All returned keys are strings."
      ],
      "followUp": "Predict the complete keys array for that object."
    }
  ],
  "problems": [
    {
      "id": "js-double-number",
      "topicId": "operators",
      "title": "Double a number",
      "difficulty": "Easy",
      "prompt": "Complete the expression so the function returns twice the finite number n.",
      "starter": "function doubleNumber(n) {\n  return ___;\n}",
      "answers": [
        "n * 2",
        "2 * n",
        "n + n"
      ],
      "solution": "function doubleNumber(n) {\n  return n * 2;\n}",
      "hint": "Multiply the input by two.",
      "explanation": "The expression uses the parameter and returns one numeric value.",
      "cases": [
        {
          "input": "doubleNumber(0)",
          "output": "0"
        },
        {
          "input": "doubleNumber(3)",
          "output": "6"
        },
        {
          "input": "doubleNumber(-4)",
          "output": "-8"
        }
      ]
    },
    {
      "id": "js-pass-label",
      "topicId": "decisions",
      "title": "Choose a pass label",
      "difficulty": "Easy",
      "prompt": "Return \"pass\" for a finite score of at least 60, and \"retry\" for a lower score.",
      "starter": "function passLabel(score) {\n  return ___;\n}",
      "answers": [
        "score >= 60 ? \"pass\" : \"retry\"",
        "score < 60 ? \"retry\" : \"pass\"",
        "score >= 60 ? 'pass' : 'retry'",
        "score < 60 ? 'retry' : 'pass'"
      ],
      "solution": "function passLabel(score) {\n  return score >= 60 ? \"pass\" : \"retry\";\n}",
      "hint": "A conditional expression chooses between two strings.",
      "explanation": "The boundary belongs to the pass branch because the condition uses >=.",
      "cases": [
        {
          "input": "passLabel(45)",
          "output": "\"retry\""
        },
        {
          "input": "passLabel(60)",
          "output": "\"pass\""
        },
        {
          "input": "passLabel(80)",
          "output": "\"pass\""
        }
      ]
    },
    {
      "id": "js-square-items",
      "topicId": "arrays",
      "title": "Square each item",
      "difficulty": "Easy",
      "prompt": "Complete the map callback to return a new array containing each number squared.",
      "starter": "function squareItems(values) {\n  return values.map(n => ___);\n}",
      "answers": [
        "n * n",
        "n ** 2",
        "Math.pow(n, 2)"
      ],
      "solution": "function squareItems(values) {\n  return values.map(n => n * n);\n}",
      "hint": "The callback receives one number as n.",
      "explanation": "map collects one squared result per item, preserving order and leaving the input array unchanged.",
      "cases": [
        {
          "input": "squareItems([])",
          "output": "[]"
        },
        {
          "input": "squareItems([1, 2, 3])",
          "output": "[1, 4, 9]"
        },
        {
          "input": "squareItems([-2, 0])",
          "output": "[4, 0]"
        }
      ]
    },
    {
      "id": "js-even-items",
      "topicId": "arrays",
      "title": "Keep even numbers",
      "difficulty": "Easy",
      "prompt": "Complete the filter predicate so the function keeps only even integers, including negative even numbers and zero.",
      "starter": "function evenItems(values) {\n  return values.filter(n => ___);\n}",
      "answers": [
        "n % 2 === 0",
        "0 === n % 2"
      ],
      "solution": "function evenItems(values) {\n  return values.filter(n => n % 2 === 0);\n}",
      "hint": "Even integers have remainder zero when divided by two.",
      "explanation": "filter keeps the original values that pass the predicate; it does not replace them with booleans.",
      "cases": [
        {
          "input": "evenItems([])",
          "output": "[]"
        },
        {
          "input": "evenItems([1, 2, 3, 4])",
          "output": "[2, 4]"
        },
        {
          "input": "evenItems([-3, -2, 0])",
          "output": "[-2, 0]"
        }
      ]
    },
    {
      "id": "js-clean-name",
      "topicId": "strings",
      "title": "Clean a name",
      "difficulty": "Easy",
      "prompt": "Return the input text in lowercase with whitespace removed from its two ends.",
      "starter": "function cleanName(text) {\n  return ___;\n}",
      "answers": [
        "text.trim().toLowerCase()",
        "text.toLowerCase().trim()"
      ],
      "solution": "function cleanName(text) {\n  return text.trim().toLowerCase();\n}",
      "hint": "Chain the two string methods.",
      "explanation": "trim removes edge whitespace; toLowerCase normalizes casing. The original string stays unchanged.",
      "cases": [
        {
          "input": "cleanName(\" Ada \")",
          "output": "\"ada\""
        },
        {
          "input": "cleanName(\"\\tPYTHON\\n\")",
          "output": "\"python\""
        },
        {
          "input": "cleanName(\"\")",
          "output": "\"\""
        }
      ]
    },
    {
      "id": "js-profile-keys",
      "topicId": "objects",
      "title": "List profile keys",
      "difficulty": "Easy",
      "prompt": "Return an array of the profile object's own enumerable string property names.",
      "starter": "function profileKeys(profile) {\n  return ___;\n}",
      "answers": [
        "Object.keys(profile)"
      ],
      "solution": "function profileKeys(profile) {\n  return Object.keys(profile);\n}",
      "hint": "Call the static function on Object.",
      "explanation": "Object.keys returns the names of fields, not their values. Array-index keys appear in numeric order.",
      "cases": [
        {
          "input": "profileKeys({name: \"Ada\", age: 28})",
          "output": "[\"name\", \"age\"]"
        },
        {
          "input": "profileKeys({})",
          "output": "[]"
        },
        {
          "input": "profileKeys({\"2\": \"two\", \"1\": \"one\", tag: \"x\"})",
          "output": "[\"1\", \"2\", \"tag\"]"
        }
      ]
    }
  ]
};
