export default {
  "language": "java",
  "topics": [
    {
      "id": "java-types",
      "title": "Variables, types & operators",
      "summary": "Choose a type for each value; arithmetic follows the operand types.",
      "concepts": [
        "int and double",
        "boolean comparisons",
        "Assignment and arithmetic"
      ],
      "example": "class Main {\n  public static void main(String[] args) {\n    int a = 5;\n    int b = 2;\n    System.out.println(a / b);\n    System.out.println(a / 2.0);\n  }\n}",
      "output": "2\n2.5",
      "steps": [
        "Store the two integers.",
        "Integer division discards the fractional part.",
        "A double operand produces decimal division."
      ],
      "source": "https://dev.java/learn/language/constructs/basics/primitive-types/"
    },
    {
      "id": "java-flow",
      "title": "Conditions & loops",
      "summary": "Choose actions with if, then repeat work with for or while.",
      "concepts": [
        "if and else",
        "for and while",
        "break and continue"
      ],
      "example": "class Main {\n  public static void main(String[] args) {\n    int total = 0;\n    for (int i = 1; i <= 3; i++) {\n      total += i;\n    }\n    System.out.println(total);\n  }\n}",
      "output": "6",
      "steps": [
        "Start total at zero.",
        "Add 1, then 2, then 3.",
        "Stop when i becomes 4."
      ],
      "source": "https://dev.java/learn/language/constructs/basics/controlling-flow/"
    },
    {
      "id": "java-strings",
      "title": "Strings & text",
      "summary": "String objects hold immutable text. Methods inspect text or return a result.",
      "concepts": [
        "String immutability",
        "Zero-based indexing",
        "Content comparison"
      ],
      "example": "class Main {\n  public static void main(String[] args) {\n    String text = \"Java\";\n    String changed = text.replace('a', 'o');\n    System.out.println(text);\n    System.out.println(changed);\n  }\n}",
      "output": "Java\nJovo",
      "steps": [
        "Store the original text.",
        "Create the replacement result.",
        "Print both to see that the original remains unchanged."
      ],
      "source": "https://dev.java/learn/language/constructs/numbers-strings/strings/"
    },
    {
      "id": "java-arrays",
      "title": "Arrays & indexing",
      "summary": "An array has a fixed length and stores elements of one type.",
      "concepts": [
        "Array creation",
        "length field",
        "Bounds and traversal"
      ],
      "example": "class Main {\n  public static void main(String[] args) {\n    int[] scores = {7, 9, 12};\n    System.out.println(scores.length);\n    System.out.println(scores[scores.length - 1]);\n  }\n}",
      "output": "3\n12",
      "steps": [
        "Create three elements.",
        "Read the array length.",
        "Use length minus one for the final index."
      ],
      "source": "https://dev.java/learn/language/constructs/basics/arrays/"
    },
    {
      "id": "java-methods",
      "title": "Methods & parameters",
      "summary": "Methods combine a name, typed parameters, a return type, and a body.",
      "concepts": [
        "Parameters and arguments",
        "Return values",
        "Method overloading"
      ],
      "example": "class Main {\n  static int square(int n) {\n    return n * n;\n  }\n  public static void main(String[] args) {\n    System.out.println(square(4));\n  }\n}",
      "output": "16",
      "steps": [
        "Pass 4 into n.",
        "Multiply n by itself.",
        "Return and print 16."
      ],
      "source": "https://dev.java/learn/language/oop/classes-objects/defining-methods/"
    },
    {
      "id": "java-objects",
      "title": "Classes & objects",
      "summary": "A class defines fields and methods; each object has its own state.",
      "concepts": [
        "Fields and methods",
        "Constructors",
        "this"
      ],
      "example": "class Main {\n  static class Counter {\n    int value;\n    Counter(int value) { this.value = value; }\n    int next() { value += 1; return value; }\n  }\n  public static void main(String[] args) {\n    Counter first = new Counter(2);\n    Counter second = new Counter(10);\n    System.out.println(first.next());\n    System.out.println(second.value);\n  }\n}",
      "output": "3\n10",
      "steps": [
        "Construct two separate counters.",
        "Update the first counter.",
        "The second counter keeps its own value."
      ],
      "source": "https://dev.java/learn/language/oop/classes-objects/creating-classes/"
    },
    {
      "id": "java-collections",
      "title": "Lists & collections",
      "summary": "Lists keep ordered elements and can grow. Generic types describe their element type.",
      "concepts": [
        "ArrayList growth",
        "List<Integer> and boxing",
        "List operations"
      ],
      "example": "import java.util.ArrayList;\n\nclass Main {\n  public static void main(String[] args) {\n    ArrayList<String> names = new ArrayList<>();\n    names.add(\"Ada\");\n    names.add(\"Lin\");\n    System.out.println(names.get(1));\n    System.out.println(names.size());\n  }\n}",
      "output": "Lin\n2",
      "steps": [
        "Create an empty String list.",
        "Append two names.",
        "Read index 1 and the element count."
      ],
      "source": "https://dev.java/learn/api/collections-and-streams/collections-framework/lists/"
    },
    {
      "id": "java-errors",
      "title": "Exceptions & safe input",
      "summary": "Handle an expected failure with a specific catch block.",
      "concepts": [
        "try and catch",
        "Checked and unchecked exceptions",
        "finally and cleanup"
      ],
      "example": "class Main {\n  public static void main(String[] args) {\n    try {\n      System.out.println(Integer.parseInt(\"oops\"));\n    } catch (NumberFormatException ex) {\n      System.out.println(\"Invalid integer\");\n    }\n  }\n}",
      "output": "Invalid integer",
      "steps": [
        "Try to parse the text.",
        "Parsing throws NumberFormatException.",
        "The matching catch prints a useful response."
      ],
      "source": "https://dev.java/learn/language/annotations-exceptions/exceptions/catching-handling/"
    }
  ],
  "interviews": [
    {
      "id": "java-i01",
      "topicId": "java-types",
      "question": "What is the difference between int and double?",
      "answer": "int stores 32-bit whole numbers. double stores floating-point values and can represent fractions; many decimal fractions are approximate.",
      "keyPoints": [
        "Whole numbers",
        "Floating point",
        "Approximation"
      ],
      "followUp": "What does 5 / 2 produce, and how can you produce 2.5?",
      "source": "https://dev.java/learn/language/constructs/basics/primitive-types/"
    },
    {
      "id": "java-i02",
      "topicId": "java-types",
      "question": "Are local variables given default values?",
      "answer": "No. A local variable must be assigned before it is read. Fields and array elements receive type-dependent defaults such as 0, false, or null.",
      "keyPoints": [
        "Definite assignment",
        "Fields have defaults",
        "Array elements have defaults"
      ],
      "followUp": "Why does int score; System.out.println(score); fail inside a method?",
      "source": "https://dev.java/learn/language/constructs/basics/primitive-types/"
    },
    {
      "id": "java-i03",
      "topicId": "java-flow",
      "question": "How do while and do-while differ?",
      "answer": "while tests before the body, so it may run zero times. do-while tests after the body, so it runs at least once.",
      "keyPoints": [
        "Test before",
        "Test after",
        "Minimum executions"
      ],
      "followUp": "Which loop is useful when a menu must be shown at least once?",
      "source": "https://dev.java/learn/language/constructs/basics/controlling-flow/"
    },
    {
      "id": "java-i04",
      "topicId": "java-flow",
      "question": "What do break and continue do inside a loop?",
      "answer": "An unlabeled break exits the nearest loop. An unlabeled continue skips the rest of the current iteration and proceeds with that loop's next iteration.",
      "keyPoints": [
        "Exit loop",
        "Skip iteration"
      ],
      "followUp": "How would you skip negative values while summing an array?",
      "source": "https://dev.java/learn/language/constructs/basics/controlling-flow/"
    },
    {
      "id": "java-i05",
      "topicId": "java-strings",
      "question": "Why compare String contents with equals rather than ==?",
      "answer": "For object references, == tests whether both refer to the same object. String.equals checks the text contents. Two different String objects can have equal text.",
      "keyPoints": [
        "Reference identity",
        "Text equality"
      ],
      "followUp": "What does new String(\"Java\").equals(\"Java\") produce?",
      "source": "https://dev.java/learn/language/constructs/numbers-strings/strings/"
    },
    {
      "id": "java-i06",
      "topicId": "java-strings",
      "question": "What does immutable mean for String?",
      "answer": "A String object's text cannot change after creation. Operations such as replace return a result; assigning that result updates the variable's reference, not the old object.",
      "keyPoints": [
        "Unchanged object",
        "Returned result",
        "Reference assignment"
      ],
      "followUp": "Why does text.replace('a', 'o'); alone leave text unchanged?",
      "source": "https://dev.java/learn/language/constructs/numbers-strings/strings/"
    },
    {
      "id": "java-i07",
      "topicId": "java-arrays",
      "question": "How do you find an array's last valid index?",
      "answer": "For a nonempty array, use array.length - 1. Indices start at zero. An empty array has no valid element index.",
      "keyPoints": [
        "Zero-based",
        "length minus one",
        "Empty array"
      ],
      "followUp": "What are the valid indices for an array of length 4?",
      "source": "https://dev.java/learn/language/constructs/basics/arrays/"
    },
    {
      "id": "java-i08",
      "topicId": "java-arrays",
      "question": "Can you resize an existing Java array?",
      "answer": "No. Its length is fixed when created. You can allocate another array and copy elements, or choose a resizable collection such as ArrayList.",
      "keyPoints": [
        "Fixed length",
        "New allocation",
        "Resizable alternative"
      ],
      "followUp": "What happens when you read array[array.length]?",
      "source": "https://dev.java/learn/language/constructs/basics/arrays/"
    },
    {
      "id": "java-i09",
      "topicId": "java-methods",
      "question": "What is method overloading?",
      "answer": "Methods in the same class can share a name with different parameter lists. Changing only the return type is insufficient to create a valid overload.",
      "keyPoints": [
        "Same name",
        "Different parameter lists",
        "Return type alone insufficient"
      ],
      "followUp": "Can int convert(int n) and double convert(int n) coexist?",
      "source": "https://dev.java/learn/language/oop/classes-objects/defining-methods/"
    },
    {
      "id": "java-i10",
      "topicId": "java-methods",
      "question": "Does Java pass objects by reference?",
      "answer": "Java always passes values. For an object argument, the copied value is its reference. The method can mutate that shared object's state, but reassigning its parameter does not reassign the caller's variable.",
      "keyPoints": [
        "Pass by value",
        "Copied reference",
        "Mutation versus reassignment"
      ],
      "followUp": "What happens if a method adds to a passed ArrayList, then assigns its parameter to a new list?",
      "source": "https://dev.java/learn/language/oop/classes-objects/calling-methods-constructors/"
    },
    {
      "id": "java-i11",
      "topicId": "java-objects",
      "question": "How are a class and an object different?",
      "answer": "A class defines a type with fields, constructors, and methods. An object is a particular instance of that type with its own instance state.",
      "keyPoints": [
        "Type definition",
        "Instance",
        "Per-object state"
      ],
      "followUp": "Why can two Counter objects hold different values?",
      "source": "https://dev.java/learn/language/oop/classes-objects/creating-classes/"
    },
    {
      "id": "java-i12",
      "topicId": "java-objects",
      "question": "What distinguishes a constructor from a method?",
      "answer": "A constructor initializes a new instance, uses the class name, and declares no return type. A method has its own name and a declared return type, which can be void.",
      "keyPoints": [
        "Initialize instance",
        "Class name",
        "No constructor return type"
      ],
      "followUp": "Does void Counter() declare a constructor?",
      "source": "https://dev.java/learn/language/oop/classes-objects/creating-classes/"
    },
    {
      "id": "java-i13",
      "topicId": "java-collections",
      "question": "Why use an ArrayList instead of an array?",
      "answer": "An ArrayList can grow or shrink and provides list operations. An array has fixed length. ArrayList uses reference element types, so integers are stored as Integer values with boxing.",
      "keyPoints": [
        "Resizable list",
        "Fixed array",
        "Generic reference types"
      ],
      "followUp": "Why is ArrayList<int> invalid?",
      "source": "https://dev.java/learn/api/collections-and-streams/collections-framework/lists/"
    },
    {
      "id": "java-i14",
      "topicId": "java-collections",
      "question": "How do remove(index) and remove(value) differ for ArrayList<Integer>?",
      "answer": "remove(int) removes by index and returns the removed element. remove(Object) removes the first equal value and returns success. To remove integer value 2, use remove(Integer.valueOf(2)).",
      "keyPoints": [
        "Overload selection",
        "Index removal",
        "Value removal"
      ],
      "followUp": "For [4, 2, 9], what does remove(2) remove?",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/ArrayList.html"
    },
    {
      "id": "java-i15",
      "topicId": "java-errors",
      "question": "How do checked and unchecked exceptions differ?",
      "answer": "Checked exceptions must be caught or declared with throws. RuntimeException and Error families are unchecked; the compiler does not require you to catch or declare them.",
      "keyPoints": [
        "Catch or declare",
        "Unchecked families"
      ],
      "followUp": "Is NumberFormatException checked or unchecked?",
      "source": "https://dev.java/learn/language/annotations-exceptions/exceptions/unchecked-exception-controversy/"
    },
    {
      "id": "java-i16",
      "topicId": "java-errors",
      "question": "When does finally run?",
      "answer": "Normally when the try statement exits, including after return or an exception. It may not run if the JVM terminates. Prefer try-with-resources for closing resources that support it.",
      "keyPoints": [
        "Cleanup",
        "Return and exception paths",
        "JVM termination"
      ],
      "followUp": "Why should a finally block avoid returning a value?",
      "source": "https://dev.java/learn/language/annotations-exceptions/exceptions/catching-handling/"
    }
  ],
  "problems": [
    {
      "id": "java-p01",
      "topicId": "java-types",
      "title": "Average two integers",
      "difficulty": "Beginner",
      "prompt": "Complete the expression to return the decimal average. Inputs are between -10,000 and 10,000.",
      "starter": "static double average(int a, int b) {\n  return ___;\n}",
      "answers": [
        "(a + b) / 2.0",
        "(a + b) * 0.5",
        "((double) a + b) / 2"
      ],
      "solution": "static double average(int a, int b) {\n  return (a + b) / 2.0;\n}",
      "hint": "Make the divisor a double.",
      "explanation": "Add both values, then divide by 2.0 so integer division does not discard .5.",
      "cases": [
        {
          "input": "average(3, 4)",
          "output": "3.5"
        },
        {
          "input": "average(0, 0)",
          "output": "0.0"
        },
        {
          "input": "average(-3, 2)",
          "output": "-0.5"
        }
      ]
    },
    {
      "id": "java-p02",
      "topicId": "java-flow",
      "title": "Sum from one to n",
      "difficulty": "Beginner",
      "prompt": "Fill the loop condition so both 1 and n are included. n is between 0 and 100.",
      "starter": "static int sumTo(int n) {\n  int total = 0;\n  for (int i = 1; ___; i++) {\n    total += i;\n  }\n  return total;\n}",
      "answers": [
        "i <= n",
        "n >= i"
      ],
      "solution": "static int sumTo(int n) {\n  int total = 0;\n  for (int i = 1; i <= n; i++) {\n    total += i;\n  }\n  return total;\n}",
      "hint": "The final iteration must run when i equals n.",
      "explanation": "Start at 1, add each value through n, then stop. For n = 0 the condition is false immediately.",
      "cases": [
        {
          "input": "sumTo(3)",
          "output": "6"
        },
        {
          "input": "sumTo(1)",
          "output": "1"
        },
        {
          "input": "sumTo(0)",
          "output": "0"
        }
      ]
    },
    {
      "id": "java-p03",
      "topicId": "java-strings",
      "title": "Take a text prefix",
      "difficulty": "Beginner",
      "prompt": "Return the first n UTF-16 code units. text is non-null and 0 <= n <= text.length(); examples use ASCII.",
      "starter": "static String prefix(String text, int n) {\n  return ___;\n}",
      "answers": [
        "text.substring(0, n)"
      ],
      "solution": "static String prefix(String text, int n) {\n  return text.substring(0, n);\n}",
      "hint": "substring includes its first index and excludes its second.",
      "explanation": "Begin at index zero and stop before index n. n = 0 returns an empty string.",
      "cases": [
        {
          "input": "prefix(\"Java\", 2)",
          "output": "\"Ja\""
        },
        {
          "input": "prefix(\"Java\", 0)",
          "output": "\"\""
        },
        {
          "input": "prefix(\"code\", 4)",
          "output": "\"code\""
        }
      ]
    },
    {
      "id": "java-p04",
      "topicId": "java-arrays",
      "title": "Read the last element safely",
      "difficulty": "Beginner",
      "prompt": "Return 0 for an empty array; otherwise return its last element. values is non-null.",
      "starter": "static int lastOrZero(int[] values) {\n  if (values.length == 0) {\n    return 0;\n  }\n  return ___;\n}",
      "answers": [
        "values[values.length - 1]"
      ],
      "solution": "static int lastOrZero(int[] values) {\n  if (values.length == 0) {\n    return 0;\n  }\n  return values[values.length - 1];\n}",
      "hint": "Valid indices end one before length.",
      "explanation": "Check the empty case before indexing, then read length minus one.",
      "cases": [
        {
          "input": "lastOrZero(new int[]{3, 8, 4})",
          "output": "4"
        },
        {
          "input": "lastOrZero(new int[]{9})",
          "output": "9"
        },
        {
          "input": "lastOrZero(new int[]{})",
          "output": "0"
        }
      ]
    },
    {
      "id": "java-p05",
      "topicId": "java-methods",
      "title": "Reuse a square method",
      "difficulty": "Beginner",
      "prompt": "Use square to return the sum of a squared and b squared. Inputs are between -100 and 100.",
      "starter": "static int square(int n) {\n  return n * n;\n}\nstatic int sumSquares(int a, int b) {\n  return ___;\n}",
      "answers": [
        "square(a) + square(b)",
        "square(b) + square(a)"
      ],
      "solution": "static int square(int n) {\n  return n * n;\n}\nstatic int sumSquares(int a, int b) {\n  return square(a) + square(b);\n}",
      "hint": "Call the helper once for each argument.",
      "explanation": "square(a) and square(b) each return an integer; add the returned values.",
      "cases": [
        {
          "input": "sumSquares(3, 4)",
          "output": "25"
        },
        {
          "input": "sumSquares(0, 5)",
          "output": "25"
        },
        {
          "input": "sumSquares(-2, 1)",
          "output": "5"
        }
      ]
    },
    {
      "id": "java-p06",
      "topicId": "java-objects",
      "title": "Update object state",
      "difficulty": "Beginner",
      "prompt": "Complete Wallet.add so it adds amount to this wallet and returns the updated coins. Inputs are nonnegative integers at most 100.",
      "starter": "static class Wallet {\n  int coins;\n  Wallet(int coins) { this.coins = coins; }\n  int add(int amount) {\n    coins = ___;\n    return coins;\n  }\n}",
      "answers": [
        "coins + amount",
        "this.coins + amount",
        "amount + coins",
        "amount + this.coins"
      ],
      "solution": "static class Wallet {\n  int coins;\n  Wallet(int coins) { this.coins = coins; }\n  int add(int amount) {\n    coins = coins + amount;\n    return coins;\n  }\n}",
      "hint": "Combine the current field value with the parameter.",
      "explanation": "The constructor sets the starting coins. add calculates the new value and assigns it back to the field.",
      "cases": [
        {
          "input": "new Wallet(3).add(2)",
          "output": "5"
        },
        {
          "input": "new Wallet(0).add(1)",
          "output": "1"
        },
        {
          "input": "new Wallet(7).add(0)",
          "output": "7"
        }
      ]
    },
    {
      "id": "java-p07",
      "topicId": "java-collections",
      "title": "Count long words",
      "difficulty": "Beginner",
      "prompt": "Count strings with length at least minLength. words and its elements are non-null; minLength is nonnegative.",
      "starter": "static int countLongWords(java.util.List<String> words, int minLength) {\n  int count = 0;\n  for (String word : words) {\n    if (___) {\n      count++;\n    }\n  }\n  return count;\n}",
      "answers": [
        "word.length() >= minLength",
        "minLength <= word.length()"
      ],
      "solution": "static int countLongWords(java.util.List<String> words, int minLength) {\n  int count = 0;\n  for (String word : words) {\n    if (word.length() >= minLength) {\n      count++;\n    }\n  }\n  return count;\n}",
      "hint": "At least includes strings exactly as long as the threshold.",
      "explanation": "Visit each word, compare its length with the threshold, and increase count only when it qualifies.",
      "cases": [
        {
          "input": "countLongWords(java.util.List.of(\"hi\", \"Java\", \"code\"), 4)",
          "output": "2"
        },
        {
          "input": "countLongWords(java.util.List.of(), 3)",
          "output": "0"
        },
        {
          "input": "countLongWords(java.util.List.of(\"\", \"a\"), 0)",
          "output": "2"
        }
      ]
    },
    {
      "id": "java-p08",
      "topicId": "java-errors",
      "title": "Parse an integer with a fallback",
      "difficulty": "Beginner",
      "prompt": "Return the parsed int, or 0 when text is not valid integer text. Do not trim text before parsing.",
      "starter": "static int parseOrZero(String text) {\n  try {\n    return ___;\n  } catch (NumberFormatException ex) {\n    return 0;\n  }\n}",
      "answers": [
        "Integer.parseInt(text)",
        "Integer.valueOf(text)"
      ],
      "solution": "static int parseOrZero(String text) {\n  try {\n    return Integer.parseInt(text);\n  } catch (NumberFormatException ex) {\n    return 0;\n  }\n}",
      "hint": "Use the Integer conversion method inside try.",
      "explanation": "Successful parsing returns the number. Invalid or out-of-range text throws NumberFormatException and the catch returns 0.",
      "cases": [
        {
          "input": "parseOrZero(\"42\")",
          "output": "42"
        },
        {
          "input": "parseOrZero(\"-7\")",
          "output": "-7"
        },
        {
          "input": "parseOrZero(\"oops\")",
          "output": "0"
        },
        {
          "input": "parseOrZero(\" 7\")",
          "output": "0"
        }
      ]
    }
  ],
  "references": [
    {
      "id": "java-length",
      "name": "String.length()",
      "group": "Strings",
      "summary": "Count UTF-16 code units.",
      "syntax": "text.length()",
      "example": "class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Java\".length());\n  }\n}",
      "output": "4",
      "steps": [
        "Read the text.",
        "Count its four code units.",
        "Print the count."
      ],
      "returns": "int",
      "mutation": "None",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/String.html"
    },
    {
      "id": "java-char-at",
      "name": "String.charAt()",
      "group": "Strings",
      "summary": "Read one UTF-16 code unit.",
      "syntax": "text.charAt(index)",
      "example": "class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Java\".charAt(1));\n  }\n}",
      "output": "a",
      "steps": [
        "Indexing starts at zero.",
        "Read index 1.",
        "Print a."
      ],
      "returns": "char",
      "mutation": "None",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/String.html"
    },
    {
      "id": "java-substring",
      "name": "String.substring()",
      "group": "Strings",
      "summary": "Extract a range; end is exclusive.",
      "syntax": "text.substring(begin, end)",
      "example": "class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Java\".substring(1, 3));\n  }\n}",
      "output": "av",
      "steps": [
        "Start at index 1.",
        "Stop before index 3.",
        "Print the result."
      ],
      "returns": "String",
      "mutation": "None",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/String.html"
    },
    {
      "id": "java-contains",
      "name": "String.contains()",
      "group": "Strings",
      "summary": "Check for literal text.",
      "syntax": "text.contains(part)",
      "example": "class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Java\".contains(\"av\"));\n  }\n}",
      "output": "true",
      "steps": [
        "Search for av.",
        "The sequence exists.",
        "Print true."
      ],
      "returns": "boolean",
      "mutation": "None",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/String.html"
    },
    {
      "id": "java-max",
      "name": "Math.max()",
      "group": "Math",
      "summary": "Choose the greater argument.",
      "syntax": "Math.max(a, b)",
      "example": "class Main {\n  public static void main(String[] args) {\n    System.out.println(Math.max(3, 8));\n  }\n}",
      "output": "8",
      "steps": [
        "Compare 3 and 8.",
        "Choose 8.",
        "Print it."
      ],
      "returns": "int for this overload",
      "mutation": "None",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Math.html"
    },
    {
      "id": "java-abs",
      "name": "Math.abs()",
      "group": "Math",
      "summary": "Find magnitude; integer minimum values overflow.",
      "syntax": "Math.abs(value)",
      "example": "class Main {\n  public static void main(String[] args) {\n    System.out.println(Math.abs(-7));\n  }\n}",
      "output": "7",
      "steps": [
        "Read -7.",
        "Find its magnitude.",
        "Print 7."
      ],
      "returns": "int for this overload",
      "mutation": "None",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Math.html"
    },
    {
      "id": "java-sqrt",
      "name": "Math.sqrt()",
      "group": "Math",
      "summary": "Compute the nonnegative square root.",
      "syntax": "Math.sqrt(value)",
      "example": "class Main {\n  public static void main(String[] args) {\n    System.out.println(Math.sqrt(81));\n  }\n}",
      "output": "9.0",
      "steps": [
        "Use 81.",
        "Find its square root.",
        "Print the double result."
      ],
      "returns": "double; negative arguments produce NaN",
      "mutation": "None",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Math.html"
    },
    {
      "id": "java-round",
      "name": "Math.round()",
      "group": "Math",
      "summary": "Round to nearest integer; ties go toward positive infinity.",
      "syntax": "Math.round(value)",
      "example": "class Main {\n  public static void main(String[] args) {\n    System.out.println(Math.round(2.5));\n    System.out.println(Math.round(-2.5));\n  }\n}",
      "output": "3\n-2",
      "steps": [
        "Round 2.5 to 3.",
        "Round -2.5 to -2.",
        "Print both."
      ],
      "returns": "long for double input",
      "mutation": "None",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Math.html"
    },
    {
      "id": "java-arrays-sort",
      "name": "Arrays.sort()",
      "group": "Arrays",
      "summary": "Sort an array in ascending order.",
      "syntax": "Arrays.sort(array)",
      "example": "import java.util.Arrays;\n\nclass Main {\n  public static void main(String[] args) {\n    int[] values = {3, 1, 2};\n    Arrays.sort(values);\n    System.out.println(Arrays.toString(values));\n  }\n}",
      "output": "[1, 2, 3]",
      "steps": [
        "Create the array.",
        "Sort its elements.",
        "Print the changed array."
      ],
      "returns": "void",
      "mutation": "Changes the input array",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Arrays.html"
    },
    {
      "id": "java-copy-of",
      "name": "Arrays.copyOf()",
      "group": "Arrays",
      "summary": "Copy into a new array of a requested length.",
      "syntax": "Arrays.copyOf(array, length)",
      "example": "import java.util.Arrays;\n\nclass Main {\n  public static void main(String[] args) {\n    int[] values = {4, 7};\n    int[] copy = Arrays.copyOf(values, 3);\n    System.out.println(Arrays.toString(copy));\n  }\n}",
      "output": "[4, 7, 0]",
      "steps": [
        "Copy two integers.",
        "Pad the third position with zero.",
        "Print the new array."
      ],
      "returns": "int[] for this overload",
      "mutation": "Input unchanged",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Arrays.html"
    },
    {
      "id": "java-arrays-equals",
      "name": "Arrays.equals()",
      "group": "Arrays",
      "summary": "Compare array contents in order.",
      "syntax": "Arrays.equals(first, second)",
      "example": "import java.util.Arrays;\n\nclass Main {\n  public static void main(String[] args) {\n    System.out.println(Arrays.equals(new int[]{1, 2}, new int[]{1, 2}));\n  }\n}",
      "output": "true",
      "steps": [
        "Compare each position.",
        "Both sequences match.",
        "Print true."
      ],
      "returns": "boolean",
      "mutation": "None",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Arrays.html"
    },
    {
      "id": "java-arrays-to-string",
      "name": "Arrays.toString()",
      "group": "Arrays",
      "summary": "Format a one-dimensional array.",
      "syntax": "Arrays.toString(array)",
      "example": "import java.util.Arrays;\n\nclass Main {\n  public static void main(String[] args) {\n    System.out.println(Arrays.toString(new int[]{5, 9}));\n  }\n}",
      "output": "[5, 9]",
      "steps": [
        "Read both elements.",
        "Build readable text.",
        "Print the text."
      ],
      "returns": "String",
      "mutation": "None",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Arrays.html"
    },
    {
      "id": "java-list-add",
      "name": "ArrayList.add()",
      "group": "Collections",
      "summary": "Append an element.",
      "syntax": "list.add(value)",
      "example": "import java.util.ArrayList;\n\nclass Main {\n  public static void main(String[] args) {\n    ArrayList<String> names = new ArrayList<>();\n    System.out.println(names.add(\"Ada\"));\n    System.out.println(names);\n  }\n}",
      "output": "true\n[Ada]",
      "steps": [
        "Start with an empty list.",
        "Append Ada.",
        "Print success and state."
      ],
      "returns": "boolean; true for ArrayList append",
      "mutation": "Changes the list",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/ArrayList.html"
    },
    {
      "id": "java-list-get",
      "name": "ArrayList.get()",
      "group": "Collections",
      "summary": "Read an element by zero-based index.",
      "syntax": "list.get(index)",
      "example": "import java.util.ArrayList;\n\nclass Main {\n  public static void main(String[] args) {\n    ArrayList<String> names = new ArrayList<>(java.util.List.of(\"Ada\", \"Lin\"));\n    System.out.println(names.get(1));\n  }\n}",
      "output": "Lin",
      "steps": [
        "Create two elements.",
        "Read index 1.",
        "Print Lin."
      ],
      "returns": "Element type",
      "mutation": "None",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/ArrayList.html"
    },
    {
      "id": "java-list-set",
      "name": "ArrayList.set()",
      "group": "Collections",
      "summary": "Replace an element and return its old value.",
      "syntax": "list.set(index, value)",
      "example": "import java.util.ArrayList;\n\nclass Main {\n  public static void main(String[] args) {\n    ArrayList<String> names = new ArrayList<>(java.util.List.of(\"Ada\", \"Lin\"));\n    System.out.println(names.set(1, \"Grace\"));\n    System.out.println(names);\n  }\n}",
      "output": "Lin\n[Ada, Grace]",
      "steps": [
        "Replace index 1.",
        "Return the old value.",
        "Print the changed list."
      ],
      "returns": "Previous element",
      "mutation": "Changes the list",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/ArrayList.html"
    },
    {
      "id": "java-list-remove",
      "name": "ArrayList.remove(int)",
      "group": "Collections",
      "summary": "Remove an indexed element and shift later elements.",
      "syntax": "list.remove(index)",
      "example": "import java.util.ArrayList;\n\nclass Main {\n  public static void main(String[] args) {\n    ArrayList<String> names = new ArrayList<>(java.util.List.of(\"Ada\", \"Lin\"));\n    System.out.println(names.remove(0));\n    System.out.println(names);\n  }\n}",
      "output": "Ada\n[Lin]",
      "steps": [
        "Remove index zero.",
        "Lin shifts left.",
        "Print removed value and state."
      ],
      "returns": "Removed element",
      "mutation": "Changes the list",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/ArrayList.html"
    },
    {
      "id": "java-parse-int",
      "name": "Integer.parseInt()",
      "group": "Conversions",
      "summary": "Convert decimal integer text to int.",
      "syntax": "Integer.parseInt(text)",
      "example": "class Main {\n  public static void main(String[] args) {\n    System.out.println(Integer.parseInt(\"42\") + 1);\n  }\n}",
      "output": "43",
      "steps": [
        "Parse 42.",
        "Add one numerically.",
        "Print 43."
      ],
      "returns": "int; invalid or out-of-range text throws NumberFormatException",
      "mutation": "None",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Integer.html"
    },
    {
      "id": "java-integer-to-string",
      "name": "Integer.toString()",
      "group": "Conversions",
      "summary": "Convert an integer to decimal text.",
      "syntax": "Integer.toString(value)",
      "example": "class Main {\n  public static void main(String[] args) {\n    String text = Integer.toString(42);\n    System.out.println(text + 1);\n  }\n}",
      "output": "421",
      "steps": [
        "Convert 42 to text.",
        "Concatenate the digit 1.",
        "Print 421."
      ],
      "returns": "String",
      "mutation": "None",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Integer.html"
    },
    {
      "id": "java-parse-double",
      "name": "Double.parseDouble()",
      "group": "Conversions",
      "summary": "Convert floating-point text to double.",
      "syntax": "Double.parseDouble(text)",
      "example": "class Main {\n  public static void main(String[] args) {\n    System.out.println(Double.parseDouble(\"3.5\") + 1);\n  }\n}",
      "output": "4.5",
      "steps": [
        "Parse 3.5.",
        "Add one numerically.",
        "Print 4.5."
      ],
      "returns": "double; invalid text throws NumberFormatException",
      "mutation": "None",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Double.html"
    },
    {
      "id": "java-builder-append",
      "name": "StringBuilder.append()",
      "group": "Text builders",
      "summary": "Append text to a mutable builder.",
      "syntax": "builder.append(value)",
      "example": "class Main {\n  public static void main(String[] args) {\n    StringBuilder text = new StringBuilder(\"Hi\");\n    text.append(\" Java\");\n    System.out.println(text);\n  }\n}",
      "output": "Hi Java",
      "steps": [
        "Create Hi.",
        "Append a space and Java.",
        "Print the builder."
      ],
      "returns": "Same StringBuilder",
      "mutation": "Changes the builder",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/StringBuilder.html"
    },
    {
      "id": "java-builder-reverse",
      "name": "StringBuilder.reverse()",
      "group": "Text builders",
      "summary": "Reverse the builder sequence.",
      "syntax": "builder.reverse()",
      "example": "class Main {\n  public static void main(String[] args) {\n    StringBuilder text = new StringBuilder(\"code\");\n    text.reverse();\n    System.out.println(text);\n  }\n}",
      "output": "edoc",
      "steps": [
        "Create code.",
        "Reverse its sequence.",
        "Print edoc."
      ],
      "returns": "Same StringBuilder",
      "mutation": "Changes the builder",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/StringBuilder.html"
    },
    {
      "id": "java-builder-to-string",
      "name": "StringBuilder.toString()",
      "group": "Text builders",
      "summary": "Create an immutable String snapshot.",
      "syntax": "builder.toString()",
      "example": "class Main {\n  public static void main(String[] args) {\n    StringBuilder builder = new StringBuilder(\"Hi\");\n    String snapshot = builder.toString();\n    builder.append(\"!\");\n    System.out.println(snapshot);\n    System.out.println(builder);\n  }\n}",
      "output": "Hi\nHi!",
      "steps": [
        "Capture a String.",
        "Append to the builder.",
        "The snapshot stays Hi."
      ],
      "returns": "String",
      "mutation": "Builder unchanged by toString",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/StringBuilder.html"
    },
    {
      "id": "java-collections-sort",
      "name": "Collections.sort()",
      "group": "Collections",
      "summary": "Sort a modifiable list by natural order.",
      "syntax": "Collections.sort(list)",
      "example": "import java.util.ArrayList;\nimport java.util.Collections;\n\nclass Main {\n  public static void main(String[] args) {\n    ArrayList<Integer> numbers = new ArrayList<>(java.util.List.of(3, 1, 2));\n    Collections.sort(numbers);\n    System.out.println(numbers);\n  }\n}",
      "output": "[1, 2, 3]",
      "steps": [
        "Create a modifiable list.",
        "Sort ascending.",
        "Print its new order."
      ],
      "returns": "void",
      "mutation": "Changes the list",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Collections.html"
    },
    {
      "id": "java-collections-max",
      "name": "Collections.max()",
      "group": "Collections",
      "summary": "Find the greatest element of a nonempty collection.",
      "syntax": "Collections.max(collection)",
      "example": "import java.util.Collections;\n\nclass Main {\n  public static void main(String[] args) {\n    System.out.println(Collections.max(java.util.List.of(3, 8, 2)));\n  }\n}",
      "output": "8",
      "steps": [
        "Compare the three values.",
        "Choose the greatest.",
        "Print 8."
      ],
      "returns": "Element type; empty input throws NoSuchElementException",
      "mutation": "None",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Collections.html"
    },
    {
      "id": "java-map-default",
      "name": "HashMap.getOrDefault()",
      "group": "Collections",
      "summary": "Read a key or return a fallback if absent.",
      "syntax": "map.getOrDefault(key, fallback)",
      "example": "import java.util.HashMap;\n\nclass Main {\n  public static void main(String[] args) {\n    HashMap<String, Integer> scores = new HashMap<>();\n    scores.put(\"Ada\", 9);\n    System.out.println(scores.getOrDefault(\"Lin\", 0));\n    System.out.println(scores.size());\n  }\n}",
      "output": "0\n1",
      "steps": [
        "Lin is absent.",
        "Return fallback zero.",
        "The map still has one entry."
      ],
      "returns": "Value type",
      "mutation": "Does not insert the fallback",
      "source": "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/HashMap.html"
    }
  ]
};
