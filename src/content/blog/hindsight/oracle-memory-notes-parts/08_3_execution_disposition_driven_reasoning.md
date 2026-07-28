## 3. Execution: Disposition-Driven Reasoning

When you call `agent.reflect()`, Hindsight triggers a multi-step agentic loop that can run up to 10 automated tool-calling iterations to build an answer. [1, 2]

1. Explores Memory: Traverses the four networks using the query.
2. Applies Behavioral Profiles: The loop injects Disposition Parameters, such as specialized character traits or reasoning styles, unique to that memory bank. For example, a customer support bank might reflect diplomatically, whereas a technical code-review bank will evaluate mistakes strictly and directly.
3. Synthesizes Output: Melds mental models, observations, and raw facts to construct a cohesive summary. [1, 5, 9, 10, 11]
