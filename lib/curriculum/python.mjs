export default {
  "language": "python",
  "topics": [
    {
      "id": "values",
      "title": "Names, values, and types",
      "summary": "Assignment binds a name to an object. Names can be rebound, and two names can share the same mutable list.",
      "concepts": [
        "Assignment",
        "int, float, str, and bool",
        "Rebinding names",
        "Shared mutable objects"
      ],
      "example": "score = 4\nscore = \"four\"\nprint(type(score).__name__)\nitems = [1, 2]\nalias = items\nalias.append(3)\nprint(items)",
      "output": "str\n[1, 2, 3]",
      "steps": [
        "Rebind score from an integer to a string.",
        "Bind alias to the same list as items.",
        "Appending through alias changes that shared list."
      ],
      "source": "https://docs.python.org/3/tutorial/classes.html#python-scopes-and-namespaces"
    },
    {
      "id": "operators",
      "title": "Arithmetic and comparisons",
      "summary": "Use arithmetic to calculate results and comparisons to produce booleans. Floor division rounds downward, including for negative results.",
      "concepts": [
        "Arithmetic",
        "/ and //",
        "Remainders with %",
        "Explicit numeric conversion"
      ],
      "example": "print(7 / 2)\nprint(7 // 2)\nprint(-7 // 2)\nprint(7 % 2)",
      "output": "3.5\n3\n-4\n1",
      "steps": [
        "/ calculates ordinary numeric division.",
        "// rounds the quotient down toward negative infinity.",
        "% returns the remainder for the division."
      ],
      "source": "https://docs.python.org/3/tutorial/introduction.html#numbers"
    },
    {
      "id": "decisions",
      "title": "Conditions and indentation",
      "summary": "Use if, elif, and else to choose behavior. Indentation identifies the statements belonging to each branch.",
      "concepts": [
        "if, elif, and else",
        "Indentation",
        "Comparison conditions",
        "Truthiness"
      ],
      "example": "score = 72\nif score >= 60:\n    label = \"pass\"\nelse:\n    label = \"retry\"\nprint(label)",
      "output": "pass",
      "steps": [
        "Compare the score with 60.",
        "Only the matching branch assigns its label.",
        "The unindented print runs after the decision."
      ],
      "source": "https://docs.python.org/3/reference/lexical_analysis.html#indentation"
    },
    {
      "id": "loops",
      "title": "Loops and range",
      "summary": "A for loop visits iterable values. range describes integer steps and always excludes its stop boundary.",
      "concepts": [
        "for loops",
        "range()",
        "Running totals",
        "break and continue"
      ],
      "example": "total = 0\nfor number in range(1, 4):\n    total += number\nprint(total)\nprint(list(range(5, 0, -2)))",
      "output": "6\n[5, 3, 1]",
      "steps": [
        "range(1, 4) supplies 1, 2, and 3.",
        "Add those numbers to get 6.",
        "A negative step counts downward while still excluding the stop."
      ],
      "source": "https://docs.python.org/3/library/functions.html#func-range"
    },
    {
      "id": "functions",
      "title": "Functions and return values",
      "summary": "Define reusable work with def. Parameters receive arguments, and return sends a result back to the caller.",
      "concepts": [
        "def",
        "Parameters and arguments",
        "return",
        "Default arguments"
      ],
      "example": "def greet(name=\"learner\"):\n    return f\"Hello, {name}!\"\n\nprint(greet())\nprint(greet(\"Ada\"))",
      "output": "Hello, learner!\nHello, Ada!",
      "steps": [
        "Define the function and its default argument.",
        "The first call uses learner.",
        "The second call returns a greeting using Ada."
      ],
      "source": "https://docs.python.org/3/tutorial/controlflow.html#defining-functions"
    },
    {
      "id": "lists",
      "title": "Lists and mutation",
      "summary": "Lists hold ordered values and can change. Keep a method's return value separate from the list it mutates.",
      "concepts": [
        "Zero-based and negative indices",
        "append() and extend()",
        "sort() and sorted()",
        "Mutation"
      ],
      "example": "items = [1, 2]\nreturned = items.append(3)\nprint(items)\nprint(returned)\nprint(sorted([10, 2, 1]))",
      "output": "[1, 2, 3]\nNone\n[1, 2, 10]",
      "steps": [
        "append adds one item to the existing list.",
        "Its return value is None.",
        "sorted creates a new list in numeric order."
      ],
      "source": "https://docs.python.org/3/tutorial/datastructures.html#more-on-lists"
    },
    {
      "id": "strings",
      "title": "Strings, splitting, and joining",
      "summary": "Strings are immutable text. Strip edge padding, split text into pieces, and join strings with a separator.",
      "concepts": [
        "Immutable strings",
        "strip()",
        "split()",
        "join()"
      ],
      "example": "parts = \" red,blue \".strip().split(\",\")\nprint(parts)\nprint(\" / \".join(parts))",
      "output": "['red', 'blue']\nred / blue",
      "steps": [
        "strip removes the edge spaces.",
        "split makes two text pieces.",
        "join places the chosen separator between them."
      ],
      "source": "https://docs.python.org/3/library/stdtypes.html#string-methods"
    },
    {
      "id": "dictionaries",
      "title": "Dictionaries and safe lookup",
      "summary": "Dictionaries map keys to values. get reads an optional field without adding it or raising an error for a missing key.",
      "concepts": [
        "Key-value pairs",
        "get()",
        "Missing keys and None",
        "keys(), values(), and items()"
      ],
      "example": "profile = {\"name\": \"Ada\", \"level\": None}\nprint(profile.get(\"level\", \"beginner\"))\nprint(profile.get(\"theme\", \"light\"))\nprint(list(profile.keys()))",
      "output": "None\nlight\n['name', 'level']",
      "steps": [
        "The existing level key returns its stored None.",
        "The missing theme key uses its fallback.",
        "The keys snapshot still contains only the original fields."
      ],
      "source": "https://docs.python.org/3/library/stdtypes.html#mapping-types-dict"
    }
  ],
  "interviews": [
    {
      "id": "py-values-rebinding",
      "topicId": "values",
      "question": "Does a Python variable have a fixed type?",
      "answer": "A name refers to an object, and the object has a type. Reassigning the name can bind it to an object of a different type.",
      "keyPoints": [
        "Names and objects are distinct.",
        "Type changes here come from rebinding the name."
      ],
      "followUp": "What does type(score).__name__ report after score = \"four\"?"
    },
    {
      "id": "py-values-alias",
      "topicId": "values",
      "question": "Does b = a copy a list?",
      "answer": "No. Both names refer to the same list. A mutation through either name is visible through the other; a.copy() creates a shallow copy.",
      "keyPoints": [
        "Assignment shares the reference.",
        "Shallow copies still share nested objects."
      ],
      "followUp": "How would you copy a flat list before appending a new item?"
    },
    {
      "id": "py-operators-division",
      "topicId": "operators",
      "question": "How do / and // differ?",
      "answer": "For these real numbers, / performs true division. // performs floor division, rounding toward negative infinity, so -7 // 2 is -4.",
      "keyPoints": [
        "Flooring differs from truncating toward zero.",
        "7 / 2 is 3.5; 7 // 2 is 3."
      ],
      "followUp": "Predict -1 // 2."
    },
    {
      "id": "py-operators-conversion",
      "topicId": "operators",
      "question": "Why does \"4\" + 2 raise TypeError?",
      "answer": "The operands are a string and an integer, and Python does not implicitly convert them for this addition. int(\"4\") + 2 produces 6.",
      "keyPoints": [
        "Choose numeric addition or text concatenation explicitly.",
        "Quoted digits are strings."
      ],
      "followUp": "How would you deliberately produce the string \"42\" instead?"
    },
    {
      "id": "py-decisions-indentation",
      "topicId": "decisions",
      "question": "Why does indentation matter in Python?",
      "answer": "Indentation defines statement blocks. It determines which statements belong to an if branch, loop, or function.",
      "keyPoints": [
        "A colon introduces many blocks.",
        "Consistent indentation is part of the syntax."
      ],
      "followUp": "Where should print be indented if it must run only for passing scores?"
    },
    {
      "id": "py-decisions-truthiness",
      "topicId": "decisions",
      "question": "Are empty lists and empty dictionaries truthy?",
      "answer": "No. Empty containers are falsy, as are None, False, zero, and the empty string. Nonempty containers are normally truthy.",
      "keyPoints": [
        "Container emptiness affects truthiness.",
        "The string \"0\" is nonempty and therefore truthy."
      ],
      "followUp": "Predict bool([]), bool([0]), and bool(\"0\")."
    },
    {
      "id": "py-loops-stop",
      "topicId": "loops",
      "question": "Is the stop argument of range included?",
      "answer": "No. range(1, 4) supplies 1, 2, and 3. A negative step also excludes its stop boundary.",
      "keyPoints": [
        "Start is included when the range is nonempty.",
        "The step controls direction and spacing."
      ],
      "followUp": "What is list(range(5, 0, -2))?"
    },
    {
      "id": "py-loops-lazy",
      "topicId": "loops",
      "question": "Does range create a list of every number immediately?",
      "answer": "No. range is a compact immutable sequence object. list(range(...)) explicitly creates a list containing its numbers.",
      "keyPoints": [
        "A range object and a list are different types.",
        "Loops can use range directly."
      ],
      "followUp": "Why can a loop use range without wrapping it in list?"
    },
    {
      "id": "py-functions-return",
      "topicId": "functions",
      "question": "What does a function return without an explicit return value?",
      "answer": "It returns None, either by reaching the end or by executing return without a value. Printing a result is separate from returning it.",
      "keyPoints": [
        "None is a value.",
        "return ends the current function call."
      ],
      "followUp": "Why might result be None after calling a function that only prints?"
    },
    {
      "id": "py-functions-defaults",
      "topicId": "functions",
      "question": "Why is a mutable list risky as a default argument?",
      "answer": "Default arguments are evaluated once when the function is defined. A default list can therefore retain mutations across calls. Use None and create a fresh list inside.",
      "keyPoints": [
        "The same default object is reused.",
        "A fresh list avoids accidental shared state."
      ],
      "followUp": "How would you initialize items inside a function whose default is None?"
    },
    {
      "id": "py-lists-append-extend",
      "topicId": "lists",
      "question": "How do append and extend differ?",
      "answer": "append adds one object. extend adds the individual items from an iterable. Both change the list and return None.",
      "keyPoints": [
        "Appending a list creates one nested item.",
        "Extending with that list adds its items separately."
      ],
      "followUp": "Compare the results of appending [2, 3] and extending with [2, 3]."
    },
    {
      "id": "py-lists-sorting",
      "topicId": "lists",
      "question": "How does list.sort differ from sorted?",
      "answer": "list.sort changes the existing list and returns None. sorted accepts an iterable and returns a new sorted list.",
      "keyPoints": [
        "Mutation and return type differ.",
        "Both support reverse and key options."
      ],
      "followUp": "Which should you use when the original order must remain available?"
    },
    {
      "id": "py-strings-split",
      "topicId": "strings",
      "question": "How does split() differ from split(\",\")?",
      "answer": "split() groups whitespace and omits empty edge pieces. An explicit separator matches that text and preserves empty pieces between adjacent separators.",
      "keyPoints": [
        "Whitespace splitting and literal splitting have different rules.",
        "\"a,,b\".split(\",\") includes an empty middle string."
      ],
      "followUp": "Predict \"  a   b  \".split()."
    },
    {
      "id": "py-strings-strip",
      "topicId": "strings",
      "question": "Does strip(\"ab\") remove the complete prefix \"ab\" only?",
      "answer": "No. The argument names a set of edge characters. It strips a or b repeatedly from either end while leaving middle characters alone.",
      "keyPoints": [
        "A character set is not a whole prefix.",
        "Strings remain unchanged; use the returned string."
      ],
      "followUp": "Predict \"abbaXba\".strip(\"ab\")."
    },
    {
      "id": "py-dict-get",
      "topicId": "dictionaries",
      "question": "How does data.get(key) differ from data[key] for a missing key?",
      "answer": "get returns its fallback, or None when no fallback is supplied. Bracket lookup raises KeyError for an absent key.",
      "keyPoints": [
        "get handles a missing key without inserting it.",
        "A supplied default is used only when the key is absent."
      ],
      "followUp": "Why can get be useful for an optional profile field?"
    },
    {
      "id": "py-dict-none",
      "topicId": "dictionaries",
      "question": "Does get use the fallback when the stored value is None?",
      "answer": "No. An existing key returns its stored value, including None, False, or zero. The fallback applies only to a missing key.",
      "keyPoints": [
        "Presence differs from truthiness.",
        "A stored None can be meaningful data."
      ],
      "followUp": "Predict {\"level\": None}.get(\"level\", \"beginner\")."
    }
  ],
  "problems": [
    {
      "id": "py-adult-check",
      "topicId": "decisions",
      "title": "Check an age boundary",
      "difficulty": "Easy",
      "prompt": "Return True for an integer age of at least 18 and False for a lower age.",
      "starter": "def is_adult(age):\n    return ___",
      "answers": [
        "age >= 18",
        "18 <= age"
      ],
      "solution": "def is_adult(age):\n    return age >= 18",
      "hint": "Use an inclusive comparison.",
      "explanation": "A comparison returns a boolean directly. The boundary age 18 must pass.",
      "cases": [
        {
          "input": "is_adult(17)",
          "output": "False"
        },
        {
          "input": "is_adult(18)",
          "output": "True"
        },
        {
          "input": "is_adult(40)",
          "output": "True"
        }
      ]
    },
    {
      "id": "py-count-indices",
      "topicId": "loops",
      "title": "Build zero-based indices",
      "difficulty": "Easy",
      "prompt": "For a nonnegative integer stop, return a list from 0 up to but excluding stop.",
      "starter": "def indices(stop):\n    return list(___)",
      "answers": [
        "range(stop)",
        "range(0, stop)",
        "range(0, stop, 1)"
      ],
      "solution": "def indices(stop):\n    return list(range(stop))",
      "hint": "One argument to range supplies its excluded stop.",
      "explanation": "range starts at 0 by default. list converts the compact range into a displayed list.",
      "cases": [
        {
          "input": "indices(0)",
          "output": "[]"
        },
        {
          "input": "indices(1)",
          "output": "[0]"
        },
        {
          "input": "indices(4)",
          "output": "[0, 1, 2, 3]"
        }
      ]
    },
    {
      "id": "py-total-values",
      "topicId": "lists",
      "title": "Total the numbers",
      "difficulty": "Easy",
      "prompt": "Return the total of the integer values in a list. An empty list should return 0.",
      "starter": "def total_values(values):\n    return ___",
      "answers": [
        "sum(values)",
        "sum(values, 0)",
        "sum(values, start=0)"
      ],
      "solution": "def total_values(values):\n    return sum(values)",
      "hint": "A built-in adds iterable numbers with a default start of zero.",
      "explanation": "sum adds all items without changing the list. With no items, its starting value is the answer.",
      "cases": [
        {
          "input": "total_values([])",
          "output": "0"
        },
        {
          "input": "total_values([2, 3, 4])",
          "output": "9"
        },
        {
          "input": "total_values([-3, 3, 5])",
          "output": "5"
        }
      ]
    },
    {
      "id": "py-add-one-item",
      "topicId": "lists",
      "title": "Append one item",
      "difficulty": "Easy",
      "prompt": "Add value as one item at the end of items, then return the changed list. Complete the method call expression.",
      "starter": "def add_item(items, value):\n    result = ___\n    return items",
      "answers": [
        "items.append(value)"
      ],
      "solution": "def add_item(items, value):\n    result = items.append(value)\n    return items",
      "hint": "Use the method that adds exactly one item.",
      "explanation": "append changes items and stores None in result. The function deliberately returns items to show the mutation.",
      "cases": [
        {
          "input": "add_item([1, 2], 3)",
          "output": "[1, 2, 3]"
        },
        {
          "input": "add_item([], 0)",
          "output": "[0]"
        },
        {
          "input": "add_item([\"a\"], \"b\")",
          "output": "['a', 'b']"
        }
      ]
    },
    {
      "id": "py-clean-name",
      "topicId": "strings",
      "title": "Clean a name",
      "difficulty": "Easy",
      "prompt": "Return the text in lowercase with whitespace removed from its two ends.",
      "starter": "def clean_name(text):\n    return ___",
      "answers": [
        "text.strip().lower()",
        "text.lower().strip()"
      ],
      "solution": "def clean_name(text):\n    return text.strip().lower()",
      "hint": "Chain edge cleanup with casing normalization.",
      "explanation": "strip removes edge whitespace and lower returns lowercase text. The original string remains unchanged.",
      "cases": [
        {
          "input": "clean_name(\" Ada \")",
          "output": "'ada'"
        },
        {
          "input": "clean_name(\"\\tPYTHON\\n\")",
          "output": "'python'"
        },
        {
          "input": "clean_name(\"\")",
          "output": "''"
        }
      ]
    },
    {
      "id": "py-default-level",
      "topicId": "dictionaries",
      "title": "Read an optional level",
      "difficulty": "Easy",
      "prompt": "Read profile[\"level\"] safely. Return \"beginner\" only when that key is missing, preserving an existing None.",
      "starter": "def read_level(profile):\n    return ___",
      "answers": [
        "profile.get(\"level\", \"beginner\")",
        "profile.get('level', 'beginner')"
      ],
      "solution": "def read_level(profile):\n    return profile.get(\"level\", \"beginner\")",
      "hint": "Use the dictionary method with a missing-key fallback.",
      "explanation": "get tests whether the key exists. It does not replace an existing None with the fallback.",
      "cases": [
        {
          "input": "read_level({\"level\": \"advanced\"})",
          "output": "'advanced'"
        },
        {
          "input": "read_level({})",
          "output": "'beginner'"
        },
        {
          "input": "read_level({\"level\": None})",
          "output": "None"
        }
      ]
    }
  ]
};
