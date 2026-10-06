export default {
  "language": "c",
  "standard": "ISO C11-compatible examples",
  "practiceMode": "Guided expression completion and worked examples",
  "notes": [
    "C uses functions; it does not have built-in object methods.",
    "Displayed outputs assume successful writes to standard output.",
    "Examples use the initial C locale and small integers whose results are representable.",
    "Problem checks recognize a documented set of expressions; they do not compile arbitrary C."
  ],
  "topics": [
    {
      "id": "types",
      "title": "Types & arithmetic",
      "summary": "Choose a type before calculating.",
      "concepts": [
        "int stores integers; double supports fractions.",
        "Integer division truncates toward zero.",
        "Convert an operand before division."
      ],
      "example": "#include <stdio.h>\n\nint main(void) {\n    int a = 7, b = 2;\n    printf(\"%d %.1f\\n\", a / b, (double)a / b);\n    return 0;\n}\n",
      "output": "3 3.5",
      "steps": [
        "Store 7 and 2 as integers.",
        "Integer division produces 3.",
        "Casting a to double produces 3.5."
      ],
      "source": "https://www.gnu.org/software/c-intro-and-ref/manual/html_node/Division-and-Remainder.html"
    },
    {
      "id": "conditions",
      "title": "Conditions & logic",
      "summary": "Choose which branch runs.",
      "concepts": [
        "Zero is false; nonzero is true.",
        "== compares values; = assigns.",
        "&& stops when its left operand is false."
      ],
      "example": "#include <stdio.h>\n\nint main(void) {\n    int score = 82;\n    if (score >= 60) {\n        puts(\"Pass\");\n    } else {\n        puts(\"Keep practicing\");\n    }\n    return 0;\n}\n",
      "output": "Pass",
      "steps": [
        "Compare 82 with 60.",
        "The condition is true.",
        "Print Pass."
      ],
      "source": "https://www.gnu.org/software/c-intro-and-ref/manual/html_node/if-Statement.html"
    },
    {
      "id": "loops",
      "title": "Loops & repetition",
      "summary": "Repeat a small operation with a clear stopping rule.",
      "concepts": [
        "for initializes once.",
        "Its condition runs before each iteration.",
        "Update the loop variable to reach the stopping condition."
      ],
      "example": "#include <stdio.h>\n\nint main(void) {\n    int total = 0;\n    for (int i = 1; i <= 4; ++i) {\n        total += i;\n    }\n    printf(\"%d\\n\", total);\n    return 0;\n}\n",
      "output": "10",
      "steps": [
        "Start total at 0.",
        "Add 1, 2, 3 and 4.",
        "Stop when i becomes 5."
      ],
      "source": "https://www.gnu.org/software/c-intro-and-ref/manual/html_node/for-Statement.html"
    },
    {
      "id": "functions",
      "title": "Functions & parameters",
      "summary": "Name a reusable calculation.",
      "concepts": [
        "Declare parameter and return types.",
        "Arguments are passed by value.",
        "return supplies the result to the caller."
      ],
      "example": "#include <stdio.h>\n\nint square(int n) {\n    return n * n;\n}\n\nint main(void) {\n    printf(\"%d\\n\", square(5));\n    return 0;\n}\n",
      "output": "25",
      "steps": [
        "Call square with 5.",
        "The local parameter receives 5.",
        "Return 5 multiplied by 5."
      ],
      "source": "https://www.gnu.org/software/c-intro-and-ref/manual/html_node/Function-Call-Semantics.html"
    },
    {
      "id": "arrays",
      "title": "Arrays & indexing",
      "summary": "Process a known number of elements.",
      "concepts": [
        "Indices begin at 0.",
        "A three-element array has indices 0 through 2.",
        "Pass element counts separately to functions."
      ],
      "example": "#include <stdio.h>\n\nint main(void) {\n    int values[] = {2, 4, 6};\n    size_t count = sizeof values / sizeof values[0];\n    int total = 0;\n    for (size_t i = 0; i < count; ++i) {\n        total += values[i];\n    }\n    printf(\"%d\\n\", total);\n    return 0;\n}\n",
      "output": "12",
      "steps": [
        "Count the actual local array's elements.",
        "Visit indices 0, 1 and 2.",
        "Add 2 + 4 + 6."
      ],
      "source": "https://www.gnu.org/software/c-intro-and-ref/manual/html_node/Accessing-Array-Elements.html"
    },
    {
      "id": "strings",
      "title": "Strings & null terminators",
      "summary": "Work with a byte array that ends in '\\0'.",
      "concepts": [
        "strlen counts bytes before the terminator.",
        "A string buffer also needs space for '\\0'.",
        "sizeof an actual array measures its allocated bytes."
      ],
      "example": "#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    char word[] = \"cat\";\n    printf(\"%zu %zu\\n\", strlen(word), sizeof word);\n    return 0;\n}\n",
      "output": "3 4",
      "steps": [
        "The array holds c, a, t and '\\0'.",
        "strlen returns 3.",
        "sizeof the array returns 4 bytes."
      ],
      "source": "https://sourceware.org/glibc/manual/latest/html_node/String-Length.html"
    },
    {
      "id": "pointers",
      "title": "Pointers & mutation",
      "summary": "Use an address to reach an existing object.",
      "concepts": [
        "& obtains an object's address.",
        "* reads or writes the pointed-to object.",
        "Dereference only valid pointers to live objects."
      ],
      "example": "#include <stdio.h>\n\nint main(void) {\n    int value = 4;\n    int *p = &value;\n    *p = 9;\n    printf(\"%d\\n\", value);\n    return 0;\n}\n",
      "output": "9",
      "steps": [
        "p points to value.",
        "Assigning through *p changes value.",
        "Print the updated value."
      ],
      "source": "https://www.gnu.org/software/c-intro-and-ref/manual/html_node/Pointers.html"
    },
    {
      "id": "structs",
      "title": "Structures & fields",
      "summary": "Keep related values together.",
      "concepts": [
        "A struct can contain fields of different types.",
        "Use object.field for a struct value.",
        "Use pointer->field for a valid struct pointer."
      ],
      "example": "#include <stdio.h>\n\nstruct Rectangle {\n    int width;\n    int height;\n};\n\nint main(void) {\n    struct Rectangle r = {3, 4};\n    printf(\"%d\\n\", r.width * r.height);\n    return 0;\n}\n",
      "output": "12",
      "steps": [
        "Create a rectangle with width 3 and height 4.",
        "Read its fields with dots.",
        "Multiply the dimensions."
      ],
      "source": "https://www.gnu.org/software/c-intro-and-ref/manual/html_node/Referencing-Fields.html"
    }
  ],
  "interviews": [
    {
      "id": "integer-division",
      "topicId": "types",
      "question": "What do 7 / 2 and 7.0 / 2 produce?",
      "answer": "7 / 2 is integer division and gives 3. With 7.0, division uses double and gives 3.5.",
      "keyPoints": [
        "Operand types affect arithmetic.",
        "A cast must happen before division."
      ],
      "followUp": "Why does (double)(7 / 2) still give 3.0?"
    },
    {
      "id": "initialization",
      "topicId": "types",
      "question": "Why should a local variable be initialized before use?",
      "answer": "An uninitialized automatic int has an indeterminate value. Reading it can cause undefined behavior; it does not reliably start at zero.",
      "keyPoints": [
        "Initialize before reading.",
        "Local and static storage have different initialization rules."
      ],
      "followUp": "How is a static local int initialized when no initializer is given?"
    },
    {
      "id": "comparison-assignment",
      "topicId": "conditions",
      "question": "How do = and == differ in a condition?",
      "answer": "= assigns a value; == compares two values. In if (x = 3), x becomes 3 and the condition is true.",
      "keyPoints": [
        "Assignment can itself be an expression.",
        "Use == when comparing."
      ],
      "followUp": "What does if (x = 0) do?"
    },
    {
      "id": "short-circuit",
      "topicId": "conditions",
      "question": "Why can p != NULL && *p > 0 be useful?",
      "answer": "&& evaluates its right operand only when the left operand is true. This avoids dereferencing p when it is null, but p must still point to a valid live int otherwise.",
      "keyPoints": [
        "&& short-circuits.",
        "Non-null alone does not guarantee validity."
      ],
      "followUp": "Does the same rule apply to bitwise &?"
    },
    {
      "id": "loop-zero",
      "topicId": "loops",
      "question": "Can a for loop execute zero times?",
      "answer": "Yes. Its condition is checked before the first iteration. If false, the body never runs.",
      "keyPoints": [
        "Initialize once.",
        "Test before the body."
      ],
      "followUp": "How does a do-while loop differ?"
    },
    {
      "id": "loop-bound",
      "topicId": "loops",
      "question": "Why is i < count a usual array loop condition?",
      "answer": "Valid indices run from 0 through count - 1. Starting at 0 and using i < count visits exactly those elements.",
      "keyPoints": [
        "Avoid accessing array[count].",
        "An empty array range causes zero iterations."
      ],
      "followUp": "What changes if you write i <= count?"
    },
    {
      "id": "pass-value",
      "topicId": "functions",
      "question": "Does changing an int parameter change the caller's variable?",
      "answer": "No. C passes argument values by value. Assigning to an int parameter changes the function's local copy.",
      "keyPoints": [
        "Parameters receive copies.",
        "Pointers are also passed by value."
      ],
      "followUp": "How can a function change the caller's int using a pointer?"
    },
    {
      "id": "prototype",
      "topicId": "functions",
      "question": "Why declare a function before calling it?",
      "answer": "A prototype supplies the function's return type and parameter types so the compiler can check the call. C11 does not permit implicit function declarations.",
      "keyPoints": [
        "Declare before use.",
        "Match the definition's types."
      ],
      "followUp": "What does int read_value(void) say about its parameters?"
    },
    {
      "id": "array-count",
      "topicId": "arrays",
      "question": "Can sizeof(a) / sizeof(a[0]) find every array's length?",
      "answer": "It works when a is the actual array with a known size. A parameter declared int a[] is adjusted to a pointer, so sizeof a measures the pointer instead.",
      "keyPoints": [
        "Array and pointer are distinct types.",
        "Pass a count alongside an array parameter."
      ],
      "followUp": "What would you pass to sum_array(const int *a, size_t count)?"
    },
    {
      "id": "array-bounds",
      "topicId": "arrays",
      "question": "What happens when code accesses beyond an array's bounds?",
      "answer": "An out-of-bounds read or write causes undefined behavior. C does not guarantee a bounds exception or a useful result.",
      "keyPoints": [
        "Keep every index within bounds.",
        "A one-past pointer must not be dereferenced."
      ],
      "followUp": "What is the last valid index in int values[5]?"
    },
    {
      "id": "string-length",
      "topicId": "strings",
      "question": "How do strlen(word) and sizeof word differ for char word[] = \"cat\"?",
      "answer": "strlen(word) is 3 because it excludes '\\0'. sizeof word is 4 because it measures the whole array, including the terminator.",
      "keyPoints": [
        "Length differs from capacity.",
        "strlen counts bytes, which may differ from character count."
      ],
      "followUp": "What changes if word is declared as a pointer?"
    },
    {
      "id": "string-comparison",
      "topicId": "strings",
      "question": "How do you compare two C strings by their contents?",
      "answer": "Use strcmp(a, b) == 0 for equality when both inputs are valid terminated strings. a == b compares pointer values, not string contents.",
      "keyPoints": [
        "Zero means equal.",
        "Only the sign of unequal strcmp results is specified."
      ],
      "followUp": "Why should you avoid testing strcmp(a, b) == -1?"
    },
    {
      "id": "address-dereference",
      "topicId": "pointers",
      "question": "What do &value and *p mean?",
      "answer": "&value produces value's address. If p validly points to value, *p refers to that object, allowing a read or a write.",
      "keyPoints": [
        "& takes an address.",
        "* dereferences."
      ],
      "followUp": "How does *p = 10 affect the pointed-to int?"
    },
    {
      "id": "pointer-validity",
      "topicId": "pointers",
      "question": "Is a pointer safe to dereference just because it is non-null?",
      "answer": "No. It could be dangling, outside an object's bounds or unsuitable for the required type. It must refer to a valid live object.",
      "keyPoints": [
        "Check lifetime and bounds.",
        "Null checks cover only one invalid case."
      ],
      "followUp": "Why must a function not return a pointer to its ordinary local variable?"
    },
    {
      "id": "field-access",
      "topicId": "structs",
      "question": "When do you use . and ->?",
      "answer": "Use r.width when r is a struct object. Use p->width when p is a valid pointer to that struct; this is equivalent to (*p).width.",
      "keyPoints": [
        ". accesses an object's field.",
        "-> accesses a pointed-to object's field."
      ],
      "followUp": "Write height access through a struct Rectangle pointer."
    },
    {
      "id": "struct-size",
      "topicId": "structs",
      "question": "Is sizeof a struct always the sum of its fields' sizes?",
      "answer": "No. Implementations may insert padding between fields and after the final field to satisfy alignment requirements.",
      "keyPoints": [
        "Layout can include padding.",
        "Do not assume a fixed struct size across systems."
      ],
      "followUp": "Why can raw memcmp be unsuitable for comparing struct values?"
    }
  ],
  "problems": [
    {
      "id": "fractional-average",
      "topicId": "types",
      "title": "Keep the fraction",
      "difficulty": "Beginner",
      "prompt": "Complete the expression to return the average of a and b. Inputs are integers from -100 through 100.",
      "starter": "double average(int a, int b) {\n    return ___;\n}",
      "answers": [
        "(a + b) / 2.0",
        "(double)(a + b) / 2",
        "(a + b) * 0.5"
      ],
      "solution": "double average(int a, int b) {\n    return (a + b) / 2.0;\n}",
      "hint": "Make the divisor a floating-point value.",
      "explanation": "The small input bounds keep a + b representable; division by 2.0 preserves half values.",
      "cases": [
        {
          "input": "average(3, 4)",
          "output": "3.5"
        },
        {
          "input": "average(-3, 2)",
          "output": "-0.5"
        },
        {
          "input": "average(0, 0)",
          "output": "0"
        }
      ],
      "steps": [
        "Add the bounded integer values.",
        "Divide their sum by 2.0.",
        "Return the double result."
      ]
    },
    {
      "id": "even-number",
      "topicId": "conditions",
      "title": "Check an even number",
      "difficulty": "Beginner",
      "prompt": "Return 1 for an even int, otherwise 0. Complete the expression.",
      "starter": "int is_even(int n) {\n    return ___;\n}",
      "answers": [
        "n % 2 == 0",
        "(n % 2) == 0",
        "0 == n % 2",
        "!(n % 2)"
      ],
      "solution": "int is_even(int n) {\n    return n % 2 == 0;\n}",
      "hint": "An even number has remainder zero when divided by 2.",
      "explanation": "The comparison produces 1 or 0 and also works for negative even numbers.",
      "cases": [
        {
          "input": "is_even(8)",
          "output": "1"
        },
        {
          "input": "is_even(-4)",
          "output": "1"
        },
        {
          "input": "is_even(7)",
          "output": "0"
        },
        {
          "input": "is_even(0)",
          "output": "1"
        }
      ],
      "steps": [
        "Find the remainder after division by 2.",
        "Compare the remainder with zero.",
        "Return the comparison result."
      ]
    },
    {
      "id": "sum-up-to",
      "topicId": "loops",
      "title": "Add 1 through n",
      "difficulty": "Beginner",
      "prompt": "Complete the loop condition. n is from 0 through 100.",
      "starter": "int sum_to(int n) {\n    int total = 0;\n    for (int i = 1; ___; ++i) {\n        total += i;\n    }\n    return total;\n}",
      "answers": [
        "i <= n",
        "n >= i",
        "i < n + 1"
      ],
      "solution": "int sum_to(int n) {\n    int total = 0;\n    for (int i = 1; i <= n; ++i) {\n        total += i;\n    }\n    return total;\n}",
      "hint": "The final value n must be included.",
      "explanation": "The inclusive bound adds every value from 1 to n. For n = 0, the loop runs zero times.",
      "cases": [
        {
          "input": "sum_to(4)",
          "output": "10"
        },
        {
          "input": "sum_to(1)",
          "output": "1"
        },
        {
          "input": "sum_to(0)",
          "output": "0"
        },
        {
          "input": "sum_to(100)",
          "output": "5050"
        }
      ],
      "steps": [
        "Start i at 1 and total at 0.",
        "Include values while i <= n.",
        "Add each value, then return total."
      ]
    },
    {
      "id": "square-value",
      "topicId": "functions",
      "title": "Return a square",
      "difficulty": "Beginner",
      "prompt": "Complete the return expression. n is from -100 through 100.",
      "starter": "int square(int n) {\n    return ___;\n}",
      "answers": [
        "n * n",
        "n*n"
      ],
      "solution": "int square(int n) {\n    return n * n;\n}",
      "hint": "Multiply the value by itself.",
      "explanation": "The bounded inputs ensure the product is representable even on a 16-bit int implementation.",
      "cases": [
        {
          "input": "square(5)",
          "output": "25"
        },
        {
          "input": "square(-3)",
          "output": "9"
        },
        {
          "input": "square(0)",
          "output": "0"
        },
        {
          "input": "square(100)",
          "output": "10000"
        }
      ],
      "steps": [
        "Receive a local copy of n.",
        "Multiply n by itself.",
        "Return the representable product."
      ]
    },
    {
      "id": "sum-array",
      "topicId": "arrays",
      "title": "Total an array",
      "difficulty": "Beginner",
      "prompt": "Complete the indexed expression. count is at most 100; each element is from -100 through 100. values points to at least count valid int objects, or may be NULL when count is 0.",
      "starter": "#include <stddef.h>\n\nint sum_array(const int *values, size_t count) {\n    int total = 0;\n    for (size_t i = 0; i < count; ++i) {\n        total += ___;\n    }\n    return total;\n}",
      "answers": [
        "values[i]",
        "*(values + i)"
      ],
      "solution": "#include <stddef.h>\n\nint sum_array(const int *values, size_t count) {\n    int total = 0;\n    for (size_t i = 0; i < count; ++i) {\n        total += values[i];\n    }\n    return total;\n}",
      "hint": "Read the element at index i.",
      "explanation": "The count supplies the bound; the pointer alone does not carry an array length.",
      "cases": [
        {
          "input": "int a[] = {2, 4, 6}; sum_array(a, 3)",
          "output": "12"
        },
        {
          "input": "int a[] = {-2, 2}; sum_array(a, 2)",
          "output": "0"
        },
        {
          "input": "sum_array(NULL, 0)",
          "output": "0"
        }
      ],
      "steps": [
        "Start total at 0.",
        "Add values[i] for every i < count.",
        "Return the total; count 0 reads no elements."
      ]
    },
    {
      "id": "count-string",
      "topicId": "strings",
      "title": "Count before the terminator",
      "difficulty": "Beginner",
      "prompt": "Complete the loop condition. text points to a valid NUL-terminated string.",
      "starter": "#include <stddef.h>\n\nsize_t string_length(const char *text) {\n    size_t i = 0;\n    while (___) {\n        ++i;\n    }\n    return i;\n}",
      "answers": [
        "text[i] != '\\0'",
        "text[i] != 0",
        "text[i]",
        "*(text + i) != '\\0'"
      ],
      "solution": "#include <stddef.h>\n\nsize_t string_length(const char *text) {\n    size_t i = 0;\n    while (text[i] != '\\0') {\n        ++i;\n    }\n    return i;\n}",
      "hint": "Stop on the byte '\\0'.",
      "explanation": "The terminating byte marks the end and is excluded from the count. The result counts bytes.",
      "cases": [
        {
          "input": "string_length(\"cat\")",
          "output": "3"
        },
        {
          "input": "string_length(\"\")",
          "output": "0"
        },
        {
          "input": "string_length(\"a b\")",
          "output": "3"
        }
      ],
      "steps": [
        "Start at index 0.",
        "Advance while text[i] is not '\\0'.",
        "Return the index of the terminator."
      ]
    },
    {
      "id": "swap-ints",
      "topicId": "pointers",
      "title": "Swap through pointers",
      "difficulty": "Beginner",
      "prompt": "Complete the missing expression. a and b are valid pointers to writable int objects.",
      "starter": "void swap(int *a, int *b) {\n    int saved = *a;\n    *a = ___;\n    *b = saved;\n}",
      "answers": [
        "*b",
        "b[0]"
      ],
      "solution": "void swap(int *a, int *b) {\n    int saved = *a;\n    *a = *b;\n    *b = saved;\n}",
      "hint": "Read the int that b points to.",
      "explanation": "Save the first value before overwriting it, then restore the saved value into the second object.",
      "cases": [
        {
          "input": "a = 2, b = 9; swap(&a, &b)",
          "output": "a = 9, b = 2"
        },
        {
          "input": "a = -1, b = 3; swap(&a, &b)",
          "output": "a = 3, b = -1"
        },
        {
          "input": "a = 4; swap(&a, &a)",
          "output": "a = 4"
        }
      ],
      "steps": [
        "Save the first pointed-to value.",
        "Copy the second value into the first.",
        "Write the saved value into the second."
      ]
    },
    {
      "id": "rectangle-perimeter",
      "topicId": "structs",
      "title": "Read a rectangle's fields",
      "difficulty": "Beginner",
      "prompt": "Return the perimeter. width and height are integers from 0 through 100.",
      "starter": "struct Rectangle {\n    int width;\n    int height;\n};\n\nint perimeter(struct Rectangle r) {\n    return ___;\n}",
      "answers": [
        "2 * (r.width + r.height)",
        "(r.width + r.height) * 2",
        "2 * r.width + 2 * r.height"
      ],
      "solution": "struct Rectangle {\n    int width;\n    int height;\n};\n\nint perimeter(struct Rectangle r) {\n    return 2 * (r.width + r.height);\n}",
      "hint": "Use dots because r is a struct value.",
      "explanation": "A rectangle has two sides of each dimension, so double their sum.",
      "cases": [
        {
          "input": "perimeter((struct Rectangle){3, 4})",
          "output": "14"
        },
        {
          "input": "perimeter((struct Rectangle){0, 0})",
          "output": "0"
        },
        {
          "input": "perimeter((struct Rectangle){5, 5})",
          "output": "20"
        }
      ],
      "steps": [
        "Read width and height with dots.",
        "Add the dimensions.",
        "Double the sum."
      ]
    }
  ],
  "references": [
    {
      "id": "strlen",
      "name": "strlen()",
      "group": "Strings",
      "summary": "Count bytes before '\\0'.",
      "syntax": "size_t strlen(const char *s);",
      "header": "string.h",
      "example": "#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    printf(\"%zu\\n\", strlen(\"coding\"));\n    return 0;\n}\n",
      "output": "6",
      "steps": [
        "Read coding.",
        "Count six bytes before '\\0'.",
        "Print 6."
      ],
      "returns": "Byte count, excluding '\\0'.",
      "mutation": "Reads only.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/String-Length.html"
    },
    {
      "id": "strcmp",
      "name": "strcmp()",
      "group": "Strings",
      "summary": "Compare terminated strings.",
      "syntax": "int strcmp(const char *a, const char *b);",
      "header": "string.h",
      "example": "#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    printf(\"%d\\n\", strcmp(\"cat\", \"cat\") == 0);\n    return 0;\n}\n",
      "output": "1",
      "steps": [
        "Compare both strings.",
        "The result is zero.",
        "Print equality as 1."
      ],
      "returns": "Negative, zero or positive; unequal magnitudes are unspecified.",
      "mutation": "Reads only.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/String_002fArray-Comparison.html"
    },
    {
      "id": "strncmp",
      "name": "strncmp()",
      "group": "Strings",
      "summary": "Compare at most n bytes.",
      "syntax": "int strncmp(const char *a, const char *b, size_t n);",
      "header": "string.h",
      "example": "#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    printf(\"%d\\n\", strncmp(\"coding\", \"code\", 3) == 0);\n    return 0;\n}\n",
      "output": "1",
      "steps": [
        "Compare the first three bytes.",
        "Both prefixes are cod.",
        "Print equality as 1."
      ],
      "returns": "Negative, zero or positive.",
      "mutation": "Reads only.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/String_002fArray-Comparison.html"
    },
    {
      "id": "strchr",
      "name": "strchr()",
      "group": "Strings",
      "summary": "Find the first matching byte.",
      "syntax": "char *strchr(const char *s, int c);",
      "header": "string.h",
      "example": "#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    const char *p = strchr(\"banana\", 'n');\n    puts(p != NULL ? p : \"Not found\");\n    return 0;\n}\n",
      "output": "nana",
      "steps": [
        "Find the first n.",
        "Check for NULL.",
        "Print the suffix."
      ],
      "returns": "Match pointer, or NULL.",
      "mutation": "Reads only.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/Search-Functions.html"
    },
    {
      "id": "strrchr",
      "name": "strrchr()",
      "group": "Strings",
      "summary": "Find the last matching byte.",
      "syntax": "char *strrchr(const char *s, int c);",
      "header": "string.h",
      "example": "#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    const char *p = strrchr(\"banana\", 'a');\n    puts(p != NULL ? p : \"Not found\");\n    return 0;\n}\n",
      "output": "a",
      "steps": [
        "Find the last a.",
        "Check for NULL.",
        "Print the suffix."
      ],
      "returns": "Match pointer, or NULL.",
      "mutation": "Reads only.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/Search-Functions.html"
    },
    {
      "id": "strstr",
      "name": "strstr()",
      "group": "Strings",
      "summary": "Find the first substring.",
      "syntax": "char *strstr(const char *s, const char *needle);",
      "header": "string.h",
      "example": "#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    const char *p = strstr(\"learn C today\", \"C\");\n    puts(p != NULL ? p : \"Not found\");\n    return 0;\n}\n",
      "output": "C today",
      "steps": [
        "Find C.",
        "Check for NULL.",
        "Print the suffix."
      ],
      "returns": "Match pointer, or NULL; an empty needle returns s.",
      "mutation": "Reads only.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/Search-Functions.html"
    },
    {
      "id": "strspn",
      "name": "strspn()",
      "group": "Strings",
      "summary": "Count the initial accepted bytes.",
      "syntax": "size_t strspn(const char *s, const char *accept);",
      "header": "string.h",
      "example": "#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    printf(\"%zu\\n\", strspn(\"123abc\", \"0123456789\"));\n    return 0;\n}\n",
      "output": "3",
      "steps": [
        "Accept decimal digits.",
        "Stop at a.",
        "Print 3."
      ],
      "returns": "Prefix byte count.",
      "mutation": "Reads only.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/Search-Functions.html"
    },
    {
      "id": "strcspn",
      "name": "strcspn()",
      "group": "Strings",
      "summary": "Count bytes before any rejected byte.",
      "syntax": "size_t strcspn(const char *s, const char *reject);",
      "header": "string.h",
      "example": "#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    printf(\"%zu\\n\", strcspn(\"red,green\", \",\"));\n    return 0;\n}\n",
      "output": "3",
      "steps": [
        "Search for comma.",
        "Three bytes precede it.",
        "Print 3."
      ],
      "returns": "Prefix byte count.",
      "mutation": "Reads only.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/Search-Functions.html"
    },
    {
      "id": "memcpy",
      "name": "memcpy()",
      "group": "Memory",
      "summary": "Copy n bytes without overlap.",
      "syntax": "void *memcpy(void *dest, const void *src, size_t n);",
      "header": "string.h",
      "example": "#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    char src[] = \"blue\";\n    char dest[sizeof src];\n    memcpy(dest, src, sizeof src);\n    puts(dest);\n    return 0;\n}\n",
      "output": "blue",
      "steps": [
        "Allocate five destination bytes.",
        "Copy all bytes, including '\\0'.",
        "Print the copied string."
      ],
      "returns": "Destination pointer.",
      "mutation": "Writes dest; both buffers must hold n bytes and must not overlap.",
      "source": "https://sourceware.org/glibc/manual/2.34/html_node/Copying-Strings-and-Arrays.html"
    },
    {
      "id": "memmove",
      "name": "memmove()",
      "group": "Memory",
      "summary": "Copy bytes even when regions overlap.",
      "syntax": "void *memmove(void *dest, const void *src, size_t n);",
      "header": "string.h",
      "example": "#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    char text[] = \"abcd\";\n    memmove(text + 1, text, 3);\n    puts(text);\n    return 0;\n}\n",
      "output": "aabc",
      "steps": [
        "Copy abc one byte right.",
        "Preserve the original source bytes.",
        "The terminator remains at index 4."
      ],
      "returns": "Destination pointer.",
      "mutation": "Writes dest; both regions must hold n bytes.",
      "source": "https://sourceware.org/glibc/manual/2.34/html_node/Copying-Strings-and-Arrays.html"
    },
    {
      "id": "memset",
      "name": "memset()",
      "group": "Memory",
      "summary": "Fill n bytes with one byte value.",
      "syntax": "void *memset(void *dest, int value, size_t n);",
      "header": "string.h",
      "example": "#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    char text[] = \"code\";\n    memset(text, '*', 3);\n    puts(text);\n    return 0;\n}\n",
      "output": "***e",
      "steps": [
        "Replace the first three bytes.",
        "Keep e and '\\0'.",
        "Print the result."
      ],
      "returns": "Destination pointer.",
      "mutation": "Writes n bytes; this is a byte fill, not integer-element assignment.",
      "source": "https://sourceware.org/glibc/manual/2.34/html_node/Copying-Strings-and-Arrays.html"
    },
    {
      "id": "memcmp",
      "name": "memcmp()",
      "group": "Memory",
      "summary": "Compare n bytes.",
      "syntax": "int memcmp(const void *a, const void *b, size_t n);",
      "header": "string.h",
      "example": "#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    unsigned char a[] = {1, 2, 3};\n    unsigned char b[] = {1, 2, 3};\n    printf(\"%d\\n\", memcmp(a, b, sizeof a) == 0);\n    return 0;\n}\n",
      "output": "1",
      "steps": [
        "Compare three bytes.",
        "All bytes match.",
        "Print equality as 1."
      ],
      "returns": "Negative, zero or positive.",
      "mutation": "Reads only; both regions must hold n bytes.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/String_002fArray-Comparison.html"
    },
    {
      "id": "snprintf",
      "name": "snprintf()",
      "group": "Input / output",
      "summary": "Format text into a bounded buffer.",
      "syntax": "int snprintf(char *dest, size_t capacity, const char *format, ...);",
      "header": "stdio.h",
      "example": "#include <stdio.h>\n\nint main(void) {\n    char text[8];\n    int n = snprintf(text, sizeof text, \"id=%d\", 27);\n    if (n < 0 || (size_t)n >= sizeof text) {\n        return 1;\n    }\n    puts(text);\n    return 0;\n}\n",
      "output": "id=27",
      "steps": [
        "Format id=27 into eight bytes.",
        "Check error and truncation.",
        "Print the complete buffer."
      ],
      "returns": "Required byte count excluding '\\0', or negative on error.",
      "mutation": "Writes dest; capacity includes '\\0'. Avoid source/destination overlap.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/Formatted-Output-Functions.html"
    },
    {
      "id": "printf",
      "name": "printf()",
      "group": "Input / output",
      "summary": "Print formatted values.",
      "syntax": "int printf(const char *format, ...);",
      "header": "stdio.h",
      "example": "#include <stdio.h>\n\nint main(void) {\n    printf(\"score=%d\\n\", 42);\n    return 0;\n}\n",
      "output": "score=42",
      "steps": [
        "Match %d with an int.",
        "Format 42.",
        "Print the line."
      ],
      "returns": "Printed character count, or negative on error.",
      "mutation": "Writes stdout.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/Formatted-Output-Functions.html"
    },
    {
      "id": "puts",
      "name": "puts()",
      "group": "Input / output",
      "summary": "Print a string and a newline.",
      "syntax": "int puts(const char *s);",
      "header": "stdio.h",
      "example": "#include <stdio.h>\n\nint main(void) {\n    puts(\"Keep practicing\");\n    return 0;\n}\n",
      "output": "Keep practicing",
      "steps": [
        "Read the string.",
        "Write its text.",
        "Append a newline."
      ],
      "returns": "Nonnegative on success; EOF on error.",
      "mutation": "Writes stdout.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/Simple-Output.html"
    },
    {
      "id": "putchar",
      "name": "putchar()",
      "group": "Input / output",
      "summary": "Print one character.",
      "syntax": "int putchar(int c);",
      "header": "stdio.h",
      "example": "#include <stdio.h>\n\nint main(void) {\n    putchar('C');\n    putchar('\\n');\n    return 0;\n}\n",
      "output": "C",
      "steps": [
        "Write C.",
        "Write a newline.",
        "Finish the line."
      ],
      "returns": "Written character as unsigned char converted to int, or EOF.",
      "mutation": "Writes stdout.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/Simple-Output.html"
    },
    {
      "id": "isdigit",
      "name": "isdigit()",
      "group": "Characters",
      "summary": "Test for a decimal digit.",
      "syntax": "int isdigit(int c);",
      "header": "ctype.h",
      "example": "#include <stdio.h>\n#include <ctype.h>\n\nint main(void) {\n    char c = '7';\n    printf(\"%d\\n\", isdigit((unsigned char)c) != 0);\n    return 0;\n}\n",
      "output": "1",
      "steps": [
        "Convert c to unsigned char.",
        "Test digit membership.",
        "Normalize the result to 1."
      ],
      "returns": "Nonzero for a digit; zero otherwise.",
      "mutation": "Reads only; argument must be EOF or representable as unsigned char.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/Classification-of-Characters.html"
    },
    {
      "id": "isalpha",
      "name": "isalpha()",
      "group": "Characters",
      "summary": "Test for an alphabetic character.",
      "syntax": "int isalpha(int c);",
      "header": "ctype.h",
      "example": "#include <stdio.h>\n#include <ctype.h>\n\nint main(void) {\n    char c = 'K';\n    printf(\"%d\\n\", isalpha((unsigned char)c) != 0);\n    return 0;\n}\n",
      "output": "1",
      "steps": [
        "Convert c to unsigned char.",
        "Test letter membership.",
        "Normalize the result to 1."
      ],
      "returns": "Nonzero for a letter; zero otherwise.",
      "mutation": "Reads only; uses the current locale and valid unsigned-char/EOF inputs.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/Classification-of-Characters.html"
    },
    {
      "id": "toupper",
      "name": "toupper()",
      "group": "Characters",
      "summary": "Return an uppercase mapping.",
      "syntax": "int toupper(int c);",
      "header": "ctype.h",
      "example": "#include <stdio.h>\n#include <ctype.h>\n\nint main(void) {\n    char c = 'm';\n    printf(\"%c\\n\", toupper((unsigned char)c));\n    return 0;\n}\n",
      "output": "M",
      "steps": [
        "Supply m safely.",
        "Map it to uppercase.",
        "Print M."
      ],
      "returns": "Mapped character, or unchanged input.",
      "mutation": "Does not modify c; use valid unsigned-char/EOF inputs.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/Case-Conversion.html"
    },
    {
      "id": "tolower",
      "name": "tolower()",
      "group": "Characters",
      "summary": "Return a lowercase mapping.",
      "syntax": "int tolower(int c);",
      "header": "ctype.h",
      "example": "#include <stdio.h>\n#include <ctype.h>\n\nint main(void) {\n    char c = 'Q';\n    printf(\"%c\\n\", tolower((unsigned char)c));\n    return 0;\n}\n",
      "output": "q",
      "steps": [
        "Supply Q safely.",
        "Map it to lowercase.",
        "Print q."
      ],
      "returns": "Mapped character, or unchanged input.",
      "mutation": "Does not modify c; use valid unsigned-char/EOF inputs.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/Case-Conversion.html"
    },
    {
      "id": "abs",
      "name": "abs()",
      "group": "Numbers",
      "summary": "Find an int's absolute value.",
      "syntax": "int abs(int n);",
      "header": "stdlib.h",
      "example": "#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    printf(\"%d\\n\", abs(-12));\n    return 0;\n}\n",
      "output": "12",
      "steps": [
        "Use the representable input -12.",
        "Take its magnitude.",
        "Print 12."
      ],
      "returns": "Absolute value as int.",
      "mutation": "Reads only; undefined if the result is unrepresentable, such as INT_MIN on two's-complement systems.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/Absolute-Value.html"
    },
    {
      "id": "labs",
      "name": "labs()",
      "group": "Numbers",
      "summary": "Find a long int's absolute value.",
      "syntax": "long int labs(long int n);",
      "header": "stdlib.h",
      "example": "#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    printf(\"%ld\\n\", labs(-300L));\n    return 0;\n}\n",
      "output": "300",
      "steps": [
        "Pass a long int.",
        "Take its magnitude.",
        "Print with %ld."
      ],
      "returns": "Absolute value as long int.",
      "mutation": "Reads only; the result must be representable.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/Absolute-Value.html"
    },
    {
      "id": "strtol",
      "name": "strtol()",
      "group": "Numbers",
      "summary": "Parse an integer with error checks.",
      "syntax": "long int strtol(const char *s, char **end, int base);",
      "header": "stdlib.h, errno.h",
      "example": "#include <stdio.h>\n#include <stdlib.h>\n#include <errno.h>\n\nint main(void) {\n    const char *text = \"2048\";\n    char *end;\n    errno = 0;\n    long value = strtol(text, &end, 10);\n    if (errno == ERANGE || end == text || *end != '\\0') {\n        return 1;\n    }\n    printf(\"%ld\\n\", value);\n    return 0;\n}\n",
      "output": "2048",
      "steps": [
        "Parse in base 10.",
        "Check range, consumed digits and end.",
        "Print the long result."
      ],
      "returns": "Parsed long; use end and errno to distinguish errors.",
      "mutation": "Updates *end and may set errno; input remains unchanged.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/Parsing-of-Integers.html"
    },
    {
      "id": "qsort",
      "name": "qsort()",
      "group": "Algorithms",
      "summary": "Sort an array using a comparator.",
      "syntax": "void qsort(void *base, size_t count, size_t size, int (*compare)(const void *, const void *));",
      "header": "stdlib.h",
      "example": "#include <stdio.h>\n#include <stdlib.h>\n\nint compare_ints(const void *left, const void *right) {\n    int a = *(const int *)left;\n    int b = *(const int *)right;\n    return (a > b) - (a < b);\n}\n\nint main(void) {\n    int values[] = {3, 1, 2};\n    size_t count = sizeof values / sizeof values[0];\n    qsort(values, count, sizeof values[0], compare_ints);\n    printf(\"%d %d %d\\n\", values[0], values[1], values[2]);\n    return 0;\n}\n",
      "output": "1 2 3",
      "steps": [
        "Count three int elements.",
        "Compare using signs without subtraction overflow.",
        "Print the sorted array."
      ],
      "returns": "void.",
      "mutation": "Reorders the array; equal-element ordering is unspecified.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/Array-Sort-Function.html"
    },
    {
      "id": "bsearch",
      "name": "bsearch()",
      "group": "Algorithms",
      "summary": "Search an array sorted by its comparator.",
      "syntax": "void *bsearch(const void *key, const void *base, size_t count, size_t size, int (*compare)(const void *, const void *));",
      "header": "stdlib.h",
      "example": "#include <stdio.h>\n#include <stdlib.h>\n\nint compare_ints(const void *left, const void *right) {\n    int a = *(const int *)left;\n    int b = *(const int *)right;\n    return (a > b) - (a < b);\n}\n\nint main(void) {\n    int values[] = {1, 2, 3};\n    int key = 2;\n    size_t count = sizeof values / sizeof values[0];\n    int *found = bsearch(&key, values, count, sizeof values[0], compare_ints);\n    if (found != NULL) {\n        printf(\"%d\\n\", *found);\n    } else {\n        puts(\"Not found\");\n    }\n    return 0;\n}\n",
      "output": "2",
      "steps": [
        "Start with sorted values.",
        "Search for key 2.",
        "Check NULL before reading the match."
      ],
      "returns": "Pointer to a match, or NULL.",
      "mutation": "Reads only; comparator must agree with sorting.",
      "source": "https://sourceware.org/glibc/manual/latest/html_node/Array-Search-Function.html"
    }
  ],
  "sources": [
    {
      "title": "WG14 C11 committee draft N1570 (language and standard library)",
      "url": "https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf"
    },
    {
      "title": "GNU C language manual",
      "url": "https://www.gnu.org/software/c-intro-and-ref/manual/c-intro-and-ref.html"
    },
    {
      "title": "GNU C Library manual",
      "url": "https://sourceware.org/glibc/manual/"
    }
  ]
};
