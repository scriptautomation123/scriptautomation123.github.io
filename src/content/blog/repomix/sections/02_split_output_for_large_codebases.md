# Splitting Output for Large Codebases

When working with large codebases, the packed output may exceed file size limits imposed by some AI tools (e.g., Google AI Studio's 1MB limit). Use `--split-output` to automatically split the output into multiple files:

```bash
repomix --split-output 1mb
```

This generates numbered files like:

```text
repomix-output.1.xml
repomix-output.2.xml
repomix-output.3.xml
```

```json
{
  "$schema": "https://repomix.com/schemas/latest/schema.json",
  "input": {
    "maxFileSize": 50000000
    // Optional: transform matching files with an external command before packing (local CLI only)
    // "processors": [
    //   { "pattern": "**/*.json", "command": "npx @toon-format/cli {file}" }
    // ]
  },
  "output": {
    "filePath": "repomix-output.xml",
    "style": "xml",
    "filePathStyle": "target-relative",
    "parsableStyle": false,
    "compress": false,
    // Optional: override the inclusion level per glob (first match wins)
    // "patterns": [
    //   { "pattern": "docs/**/*", "compress": true },
    //   { "pattern": "website/**/*", "directoryStructureOnly": true }
    // ],
    "headerText": "Custom header information for the packed file.",
    "fileSummary": true,
    "directoryStructure": true,
    "files": true,
    "removeComments": false,
    "removeEmptyLines": false,
    "topFilesLength": 5,
    "tokenCountTree": false,
    // "tokenBudget": 180000,
    "showLineNumbers": false,
    "truncateBase64": false,
    "copyToClipboard": false,
    // "splitOutput": 1000000,
    "includeEmptyDirectories": false,
    "git": {
      "sortByChanges": true,
      "sortByChangesMaxCommits": 100,
      "includeDiffs": false,
      "includeLogs": false,
      "includeLogsCount": 50
    }
  },
  "include": ["**/*"],
  "ignore": {
    "useGitignore": true,
    "useDefaultPatterns": true,
    "customPatterns": [
      "additional-folder",
      "**/*.log"
    ]
  },
  "security": {
    "enableSecurityCheck": true
  },
  "tokenCount": {
    "encoding": "o200k_base"
  }
}
```
