export const snippetTemplates = [
  {
    "languageName": "C (regex.h)",
    "highlightLanguage": "c",
    "valueForCaseInsensitive": "REG_ICASE",
    "valueForMultiline": "REG_NEWLINE",
    "separator": " | ",
    "prefix": " | ",
    "code": "#include <regex.h>\n\nint useRegex(char* textToCheck) {\n    regex_t compiledRegex;\n    int reti;\n    int actualReturnValue = -1;\n    char messageBuffer[100];\n\n    /* Compile regular expression */\n    reti = regcomp(&compiledRegex, \"%1$s\", REG_EXTENDED%2$s);\n    if (reti) {\n        fprintf(stderr, \"Could not compile regex\\n\");\n        return -2;\n    }\n\n    /* Execute compiled regular expression */\n    reti = regexec(&compiledRegex, textToCheck, 0, NULL, 0);\n    if (!reti) {\n        puts(\"Match\");\n        actualReturnValue = 0;\n    } else if (reti == REG_NOMATCH) {\n        puts(\"No match\");\n        actualReturnValue = 1;\n    } else {\n        regerror(reti, &compiledRegex, messageBuffer, sizeof(messageBuffer));\n        fprintf(stderr, \"Regex match failed: %s\\n\", messageBuffer);\n        actualReturnValue = -3;\n    }\n\n    /* Free memory allocated to the pattern buffer by regcomp() */\n    regfree(&compiledRegex);\n    return actualReturnValue;\n}"
  },
  {
    "languageName": "C#",
    "highlightLanguage": "csharp",
    "valueForCaseInsensitive": "RegexOptions.IgnoreCase",
    "valueForMultiline": "RegexOptions.Multiline",
    "valueForDotAll": "RegexOptions.Singleline",
    "separator": " | ",
    "prefix": ", ",
    "code": "using System;\nusing System.Text.RegularExpressions;\n\npublic class Sample\n{\n    public static bool useRegex(String input)\n    {\n        const Regex regex = new Regex(\"%1$s\"%2$s);\n        return regex.IsMatch(input);\n    }\n}"
  },
  {
    "languageName": "Go",
    "highlightLanguage": "go",
    "valueForCaseInsensitive": "i",
    "valueForDotAll": "s",
    "valueForMultiline": "m",
    "separator": "",
    "prefix": "(?",
    "postfix": ")",
    "code": "package main\n\nimport (\n\t\"regexp\"\n)\n\nfunc useRegex(s string) bool {\n\tre := regexp.MustCompile(\"%2$s%1$s\")\n\treturn re.MatchString(s)\n}"
  },
  {
    "languageName": "grep",
    "highlightLanguage": "bash",
    "valueForCaseInsensitive": "-i",
    "separator": " ",
    "prefix": " ",
    "code": "grep -P%2$s '%1$s' [FILE...]"
  },
  {
    "languageName": "Java",
    "highlightLanguage": "java",
    "valueForCaseInsensitive": "Pattern.CASE_INSENSITIVE",
    "valueForMultiline": "Pattern.MULTILINE",
    "valueForDotAll": "Pattern.DOTALL",
    "prefix": ", ",
    "separator": " | ",
    "code": "import java.util.regex.Pattern;\nimport java.util.regex.Matcher;\n\npublic class Sample {\n    public static boolean useRegex(final String input) {\n        // Compile regular expression\n        final Pattern pattern = Pattern.compile(\"%1$s\"%2$s);\n        // Match regex against input\n        final Matcher matcher = pattern.matcher(input);\n        // Use results...\n        return matcher.matches();\n    }\n}"
  },
  {
    "languageName": "JavaScript",
    "highlightLanguage": "javascript",
    "valueForCaseInsensitive": "i",
    "valueForMultiline": "m",
    "valueForDotAll": "s",
    "code": "function useRegex(input) {\n    let regex = /%1$s/%2$s;\n    return regex.test(input);\n}"
  },
  {
    "languageName": "Kotlin",
    "highlightLanguage": "kotlin",
    "valueForCaseInsensitive": "RegexOption.IGNORE_CASE",
    "valueForMultiline": "RegexOption.MULTILINE",
    "valueForDotAll": "RegexOption.DOT_MATCHES_ALL",
    "prefix": ", options = setOf(",
    "postfix": ")",
    "separator": ", ",
    "code": "fun useRegex(input: String): Boolean {\n    val regex = Regex(pattern = \"%1$s\"%2$s)\n    return regex.matches(input)\n}"
  },
  {
    "languageName": "PHP",
    "highlightLanguage": "php",
    "valueForCaseInsensitive": "i",
    "valueForMultiline": "m",
    "valueForDotAll": "s",
    "code": "<?php\nfunction useRegex($input) {\n    $regex = '/%1$s/%2$s';\n    return preg_match($regex, $input);\n}\n?>"
  },
  {
    "languageName": "Python",
    "highlightLanguage": "python",
    "valueForCaseInsensitive": "re.IGNORECASE",
    "valueForDotAll": "re.DOTALL",
    "valueForMultiline": "re.MULTILINE",
    "separator": ", ",
    "prefix": ", ",
    "code": "import re\n\ndef use_regex(input_text):\n    pattern = re.compile(%1$s%2$s)\n    return pattern.match(input_text)"
  },
  {
    "languageName": "Ruby",
    "highlightLanguage": "ruby",
    "valueForCaseInsensitive": "Regexp::IGNORECASE",
    "valueForDotAll": "Regexp::MULTILINE",
    "separator": " | ",
    "prefix": ", ",
    "code": "def use_regex(input)\n    regex = Regexp.new('%1$s'%2$s)\n    regex.match input\nend"
  },
  {
    "languageName": "Swift",
    "highlightLanguage": "swift",
    "valueForCaseInsensitive": ".caseInsensitive",
    "valueForDotAll": ".dotMatchesLineSeparators",
    "valueForMultiline": ".anchorsMatchLines",
    "separator": ", ",
    "prefix": ", options: [",
    "postfix": "]",
    "code": "func useRegex(for text: String) -> Bool {\n    let regex = try! NSRegularExpression(pattern: \"%1$s\"%2$s)\n    let range = NSRange(location: 0, length: text.count)\n    let matches = regex.matches(in: text, options: [], range: range)\n    return matches.first != nil\n}"
  },
  {
    "languageName": "Visual Basic .NET",
    "highlightLanguage": "vbnet",
    "valueForCaseInsensitive": "RegexOptions.IgnoreCase",
    "valueForMultiline": "RegexOptions.Multiline",
    "valueForDotAll": "RegexOptions.Singleline",
    "separator": " Or ",
    "prefix": ", ",
    "code": "Imports System.Text.RegularExpressions\n\nPublic Module Sample\n    Public Function useRegex(ByVal input As String) As Boolean\n        Dim regex = New Regex(\"%1$s\"%2$s)\n        Return regex.IsMatch(input)\n    End Function\nEnd Module"
  }
];
