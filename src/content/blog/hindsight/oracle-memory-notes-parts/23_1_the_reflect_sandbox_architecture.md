## 1. The Reflect Sandbox Architecture

When reflect is invoked, Hindsight initializes a temporary runtime state called the Reflection Workspace. This workspace is populated with:

1. The Target Query: The analytical question you are asking.
2. The Disposition Manifest: A system prompt mapping the tone, constraints, and analytical strictness of the specific memory bank.
3. The Core Tools: Programmatic functions that allow the LLM to interact directly with the Oracle 26ai database.

The LLM is then released into a while loop, capped by your budget parameter, usually 3 to 10 iterations. The LLM does not generate your answer on turn one. Instead, it uses tool-calling to browse the memory graph step-by-step.
