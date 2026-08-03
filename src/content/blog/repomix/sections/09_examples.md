# Examples

## Basic usage

```bash
repomix
```

## Custom output file and format

```bash
repomix -o my-output.md --style markdown
repomix -o my-output.json --style json
```

## Output to stdout

```bash
repomix --stdout > custom-output.txt
```

## Send output to stdout, then pipe into another command (for example, simonw/llm)

```bash
repomix --stdout | llm "Please explain what this code does."
```

## Custom output with compression

```bash
repomix --compress
```

## Split output into multiple files (max size per part)

```bash
repomix --split-output 20mb
```

## Process specific files with patterns

```bash
repomix --include "src/**/*.ts,*.md" --ignore "*.test.js,docs/**"
```

## Remote repository with branch

```bash
repomix --remote https://github.com/user/repo/tree/main
```

## Remote repository with commit

```bash
repomix --remote https://github.com/user/repo/commit/836abcd7335137228ad77feb28655d85712680f1
```

## Remote repository with shorthand

```bash
repomix --remote user/repo
```

## Remote repository with shorthand (auto-detected, no --remote needed)

```bash
repomix user/repo
```

## Using stdin for file list

```bash
find src -name "*.ts" -type f | repomix --stdin
git ls-files "*.js" | repomix --stdin
echo -e "src/index.ts\nsrc/utils.ts" | repomix --stdin
```

## Git integration

```bash
repomix --include-diffs  # Include git diffs for uncommitted changes
repomix --include-logs   # Include git logs (last 50 commits by default)
repomix --include-logs --include-logs-count 10  # Include last 10 commits
repomix --include-diffs --include-logs  # Include both diffs and logs
```

## Token count analysis

```bash
repomix --token-count-tree
repomix --token-count-tree 1000  # Only show files/directories with 1000+ tokens
```

## Watch mode — automatically re-pack on file changes

```bash
repomix --watch
repomix -w --include "src/**/*.ts"
```
