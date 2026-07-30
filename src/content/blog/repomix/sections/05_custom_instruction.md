Custom Instruction
The output.instructionFilePath option allows you to specify a separate file containing detailed instructions or context about your project. This allows AI systems to understand the specific context and requirements of your project, potentially leading to more relevant and tailored analysis or suggestions.

Here's an example of how you might use this feature:

Create a file named repomix-instruction.md in your project root:
# Coding Guidelines

- Follow the Airbnb JavaScript Style Guide
- Suggest splitting files into smaller, focused units when appropriate
- Add comments for non-obvious logic. Keep all text in English
- All new features should have corresponding unit tests

# Generate Comprehensive Output

- Include all content without abbreviation, unless specified otherwise
- Optimize for handling large codebases while maintaining output quality
In your repomix.config.json, add the instructionFilePath option:
{
  "output": {
    "instructionFilePath": "repomix-instruction.md",
    // other options...
  }
}


repomix --init

