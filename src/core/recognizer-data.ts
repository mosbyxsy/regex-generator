export const simpleRecognizers = [
  {
    "kind": "echo",
    "name": "Character",
    "pattern": "."
  },
  {
    "kind": "echo",
    "name": "Exact number",
    "pattern": "[0-9]{2,}"
  },
  {
    "kind": "echo",
    "name": "Repeating character",
    "pattern": "(.)\\1{2,}"
  },
  {
    "kind": "simple",
    "name": "One whitespace",
    "pattern": "\\s"
  },
  {
    "kind": "simple",
    "name": "Whitespaces",
    "pattern": "\\s+"
  },
  {
    "kind": "simple",
    "name": "One arbitrary character",
    "pattern": "[a-zA-Z]"
  },
  {
    "kind": "simple",
    "name": "Multiple characters",
    "pattern": "[a-zA-Z]+"
  },
  {
    "kind": "simple",
    "name": "Digit",
    "pattern": "\\d"
  },
  {
    "kind": "simple",
    "name": "Number",
    "pattern": "[0-9]+"
  },
  {
    "kind": "simple",
    "name": "Decimal number",
    "pattern": "[0-9]*\\.[0-9]+"
  },
  {
    "kind": "simple",
    "name": "Floating point number (with optional exponent)",
    "pattern": "([+-]?(?=\\.\\d|\\d)(?:\\d+)?(?:\\.?\\d*))(?:[eE]([+-]?\\d+))?",
    "search": "(%s)\\b"
  },
  {
    "kind": "simple",
    "name": "Alphanumeric characters",
    "pattern": "[A-Za-z0-9]+"
  },
  {
    "kind": "simple",
    "name": "URL encoded character",
    "pattern": "%[0-9A-Fa-f][0-9A-Fa-f]"
  },
  {
    "kind": "simple",
    "name": "Day",
    "pattern": "(0?[1-9]|[12][0-9]|3[01])",
    "search": "(?:^|\\D)(%s)($|\\D)"
  },
  {
    "kind": "simple",
    "name": "Month",
    "pattern": "(0?[1-9]|[1][0-2])",
    "search": "(?:^|\\D)(%s)($|\\D)"
  },
  {
    "kind": "simple",
    "name": "Hour",
    "pattern": "(0?[0-9]|1[0-9]|2[0-3])",
    "search": "(?:^|\\D)(%s)($|\\D)"
  },
  {
    "kind": "simple",
    "name": "Minute/ Second",
    "pattern": "(0?[0-9]|[1-5][0-9])",
    "search": "(?:^|\\D)(%s)($|\\D)"
  },
  {
    "kind": "simple",
    "name": "Date",
    "pattern": "[0-9]{4}-[0-9]{2}-[0-9]{2}"
  },
  {
    "kind": "simple",
    "name": "Time",
    "pattern": "[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,3})?"
  },
  {
    "kind": "simple",
    "name": "ISO8601",
    "pattern": "[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]+)?([zZ]|([\\+-])([01]\\d|2[0-3]):?([0-5]\\d)?)?"
  },
  {
    "kind": "simple",
    "name": "RFC2822 e-mail",
    "pattern": "[-a-z0-9!#$%&'*+/=?^_`{|}~]+(?:\\.[-a-z0-9!#$%&'*+/=?^_`{|}~]+)*@(?:[a-z0-9](?:[-a-z0-9]*[a-z0-9])?\\.)+[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
  },
  {
    "kind": "simple",
    "name": "IPv4 address",
    "pattern": "\\b(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))\\b"
  },
  {
    "kind": "simple",
    "name": "UUID",
    "pattern": "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",
    "search": "\\b(%s)\\b"
  },
  {
    "kind": "simple",
    "name": "Hashtag",
    "pattern": "\\B#([a-z0-9]{2,})(?![~!@#$%^&*()=+_`\\-\\|\\/'\\[\\]\\{\\}]|[?.,]*\\w)"
  },
  {
    "kind": "simple",
    "name": "Simple CSS Color",
    "pattern": "#(?:[a-f0-9]{3}){1,2}\\b"
  },
  {
    "kind": "simple",
    "name": "US ZIP code",
    "pattern": "\\d{5}(?:-\\d{4})?"
  },
  {
    "kind": "simple",
    "name": "Postleitzahl",
    "pattern": "\\d{5}"
  },
  {
    "kind": "simple",
    "name": "US phone number",
    "pattern": "[+]?(?:\\(\\d+(?:\\.\\d+)?\\)|\\d+(?:\\.\\d+)?)(?:[ -]?(?:\\(\\d+(?:\\.\\d+)?\\)|\\d+(?:\\.\\d+)?))*(?:[ ]?(?:x|ext)\\.?[ ]?\\d{1,5})?"
  },
  {
    "kind": "simple",
    "name": "Log level",
    "pattern": "(TRACE|DEBUG|INFO|NOTICE|WARN|WARNING|ERROR|SEVERE|FATAL)"
  }
];

export const bracketRecognizers = [
  {
    "name": "Parentheses",
    "start": "\\(",
    "end": "\\)",
    "centers": [
      [
        "no parentheses",
        "[^)]*"
      ]
    ]
  },
  {
    "name": "Square brackets",
    "start": "\\[",
    "end": "\\]",
    "centers": [
      [
        "no square bracket",
        "[^\\]]*"
      ]
    ]
  },
  {
    "name": "Curly braces",
    "start": "\\{",
    "end": "\\}",
    "centers": [
      [
        "no curly braces",
        "[^}]*"
      ]
    ]
  },
  {
    "name": "String (quotation mark)",
    "start": "\"",
    "end": "\"",
    "centers": [
      [
        "no quotation mark",
        "[^\"]*"
      ],
      [
        "backslash escaped quotation mark",
        "(?:[^\\\\\"]|\\\\\\\\|\\\\\")*"
      ],
      [
        "double escaped quotation mark",
        "(?:[^\"]|\"\")*"
      ]
    ]
  },
  {
    "name": "String (apostrophe)",
    "start": "'",
    "end": "'",
    "centers": [
      [
        "no apostrophe",
        "[^']*"
      ],
      [
        "backslash escaped apostrophe",
        "(?:[^\\\\']|\\\\\\\\|\\\\')*"
      ],
      [
        "double escaped apostrophe",
        "(?:[^']|'')*"
      ]
    ]
  }
];
