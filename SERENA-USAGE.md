# Serena MCP Usage Examples

These examples show how to use Serena's semantic code tools with this project.

## Finding Symbols

To find symbols (classes, functions, etc.) in the codebase:

```
[find_symbol]
name_path = "MyersAlgorithm"
include_body = false
depth = 1
```

## Getting Symbol Overview

To get an overview of symbols in a specific file:

```
[get_symbols_overview]
relative_path = "src/algorithms/MyersAlgorithm.ts"
```

## Reading a File

To read the contents of a file:

```
[read_file]
relative_path = "src/App.tsx"
```

## Searching for Patterns

To search for specific patterns in the codebase:

```
[search_for_pattern]
pattern = "useComparison"
```

## Finding References

To find where a symbol is referenced:

```
[find_referencing_symbols]
name_path = "MyersAlgorithm"
```

## Editing Code

To replace the body of a symbol:

```
[replace_symbol_body]
name_path = "MyersAlgorithm.tokenize"
new_body = "// New implementation here"
```

## Creating Files

To create a new file:

```
[create_text_file]
relative_path = "src/new-feature.ts"
content = "console.log('New feature');"
```

These tools provide semantic understanding of the codebase, allowing for precise operations that go beyond simple text search and replace.