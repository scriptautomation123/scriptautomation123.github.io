# Skill Generation Format-Specific Options

```json
{
  "output": {
    "style": "xml",
    "instructionFilePath": "ai-instructions.md"
  },
  "include": [
    "src/main/java/**/*.java",
    "src/main/resources/**/*.properties",
    "src/main/resources/**/*.yml",
    "pom.xml",
    "build.gradle"
  ],
  "ignore": [
    "**/target/**",
    "**/build/**",
    "**/.gradle/**",
    "**/*.class",
    "**/mvnw",
    "**/mvnw.cmd",
    "**/gradlew",
    "**/gradlew.bat",
    "**/node_modules/**",
    ".git/**"
  ],
  "security": {
    "noGitignore": false,
    "noDefaultPatterns": false
  },
  "compress": {
    "stripComments": false,
    "compressBlankLines": true
  }
}
```
