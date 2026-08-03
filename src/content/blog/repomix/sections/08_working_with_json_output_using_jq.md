# Working with JSON Output Using jq

The JSON format makes it easy to extract specific information programmatically. Here are common examples:

## Basic File Operations

### List all file paths

```bash
cat repomix-output.json | jq -r '.files | keys[]'
```

### Count total number of files

```bash
cat repomix-output.json | jq '.files | keys | length'
```

### Extract specific file content

```bash
cat repomix-output.json | jq -r '.files["README.md"]'
cat repomix-output.json | jq -r '.files["src/index.js"]'
```

## File Filtering and Analysis

### Find files by extension

```bash
cat repomix-output.json | jq -r '.files | keys[] | select(endswith(".ts"))'
cat repomix-output.json | jq -r '.files | keys[] | select(endswith(".js") or endswith(".ts"))'
```

### Get files containing specific text

```bash
cat repomix-output.json | jq -r '.files | to_entries[] | select(.value | contains("function")) | .key'
```

### Create a file list with character counts

```bash
cat repomix-output.json | jq -r '.files | to_entries[] | "\(.key): \(.value | length) characters"'
```

## Metadata Extraction

### Extract directory structure

```bash
cat repomix-output.json | jq -r '.directoryStructure'
```

### Get file summary information

```bash
cat repomix-output.json | jq '.fileSummary.purpose'
cat repomix-output.json | jq -r '.fileSummary.generationHeader'
```

### Extract user-provided header (if exists)

```bash
cat repomix-output.json | jq -r '.userProvidedHeader // "No header provided"'
```

### Get custom instructions

```bash
cat repomix-output.json | jq -r '.instruction // "No instructions provided"'
```

## Advanced Analysis

### Find largest files by content length

```bash
cat repomix-output.json | jq -r '.files | to_entries[] | [.key, (.value | length)] | @tsv' | sort -k2 -nr | head -10
```

### Search for files containing specific patterns

```bash
cat repomix-output.json | jq -r '.files | to_entries[] | select(.value | test("import.*react"; "i")) | .key'
```

### Extract file paths matching multiple extensions

```bash
cat repomix-output.json | jq -r '.files | keys[] | select(test("\.(js|ts|jsx|tsx)$"))'
```
