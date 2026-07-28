## 2. The Multi-Step Agentic Loop (Tool-Calling)

The reflect operation relies on Disposition-Driven Reasoning. When you pass a query to reflect, the LLM is given access to the underlying Graph SQL queries as a programmatic tool. [1, 8]

```text
[User Query]
     |
     v
[Reflect LLM Engine]
     |
     |- Step 1: "I need to understand the structural context."
     |- Action: Calls Oracle 26ai Vector Search (Seed Nodes)
     |
     |- Step 2: "Let me expand on these seeds to find connections."
     |- Action: Calls Oracle 26ai SQL/PGQ Graph Query (1 to 3 Hops)
     |
     v
[Graph Results Returned to LLM]
     |
     |- Step 3: Evaluates data using "Disposition Profile" (for example, Analytical, Diplomatic)
     |
     v
[Final Synthesized Answer]
```

Instead of running a single static query, reflect can use the graph dynamically. If the first hop query reveals a connected node it did not expect, the LLM can issue a second graph query targeting that specific cluster to dig deeper before formulating its response. [1, 8]
