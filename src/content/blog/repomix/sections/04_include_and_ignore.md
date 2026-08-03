# Include and Ignore

## Include Patterns

Repomix now supports specifying files to include using glob patterns. This allows for more flexible and powerful file selection:

- Use `**/*.js` to include all JavaScript files in any directory
- Use `src/**/*` to include all files within the `src` directory and its subdirectories
- Combine multiple patterns like `["src/**/*.js", "**/*.md"]` to include JavaScript files in `src` and all Markdown files

## Ignore Patterns

Repomix offers multiple methods to set ignore patterns for excluding specific files or directories during the packing process:

- `.gitignore`: By default, patterns listed in your project's `.gitignore` files and `.git/info/exclude` are used. This behavior can be controlled with the `ignore.useGitignore` setting or the `--no-gitignore` CLI option.
- `.ignore`: You can use a `.ignore` file in your project root, following the same format as `.gitignore`. This file is respected by tools like ripgrep and the silver searcher, reducing the need to maintain multiple ignore files. This behavior can be controlled with the `ignore.useDotIgnore` setting or the `--no-dot-ignore` CLI option.
- Default patterns: Repomix includes a default list of commonly excluded files and directories (e.g., `node_modules`, `.git`, binary files). This feature can be controlled with the `ignore.useDefaultPatterns` setting or the `--no-default-patterns` CLI option. Please see `defaultIgnore.ts` for more details.
- `.repomixignore`: You can create a `.repomixignore` file in your project root to define Repomix-specific ignore patterns. This file follows the same format as `.gitignore`.
- Custom patterns: Additional ignore patterns can be specified using the `ignore.customPatterns` option in the configuration file. You can overwrite this setting with the `-i`, `--ignore` command line option.

### Priority Order (from highest to lowest)

1. Custom patterns (`ignore.customPatterns`)
2. Ignore files (`.repomixignore`, `.ignore`, `.gitignore`, and `.git/info/exclude`):
   - When in nested directories, files in deeper directories have higher priority
   - When in the same directory, these files are merged in no particular order
3. Default patterns (if `ignore.useDefaultPatterns` is `true` and `--no-default-patterns` is not used)

This approach allows for flexible file exclusion configuration based on your project's needs. It helps optimize the size of the generated pack file by ensuring the exclusion of security-sensitive files and large binary files, while preventing the leakage of confidential information.

Note: Binary files are not included in the packed output by default, but their paths are listed in the "Repository Structure" section of the output file. This provides a complete overview of the repository structure while keeping the packed file efficient and text-based.
