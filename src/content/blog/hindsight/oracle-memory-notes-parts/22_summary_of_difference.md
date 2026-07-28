## Summary of Difference

| Feature         | recall                                                  | reflect                                                               |
| --------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| Output Type     | Returns a list of raw data rows from the graph.         | Returns a fully written, synthesized narrative.                       |
| Database Burden | Runs one static hybrid vector and graph query pipeline. | May call the graph queries multiple times in an autonomous tool loop. |
| Token Cost      | Very low, no LLM reasoning required for retrieval.      | High, uses heavy LLM token usage for graph reasoning.                 |

If you'd like, let me know:

- Do you want to see how to implement disposition profiles to alter how reflect interprets the graph data?
- Are you interested in setting up the background consolidation worker to keep your graph networks deduplicated? [1, 6, 7]

To go deeper into reflect, we have to move past standard vector lookups and examine how Hindsight actually functions as a cognitive engine.

When you call reflect, Hindsight is not just fetching data to pass to an LLM prompt; it is executing an autonomous, multi-turn reasoning loop inside a sandboxed workspace. It acts like an investigator examining evidence tables, cross-referencing files, and adjusting a dynamic system of beliefs before delivering a final answer. [1]

Here is the exact, deep-level architecture of how Hindsight's reflect layer works under the hood.
