## How the Code Translates to Graph Limits

The parameters in that SQL/PGQ query enforce the physical constraints that prevent a latency explosion. [9]

- The `{1, 3}` Bound, the Hop Ceiling: This tells Oracle's graph engine to find relationships that are between 1 and 3 connections away from the seed node. It blocks the algorithm from wandering indefinitely into irrelevant clusters of memory. [12]
- The Edge Weight Filtering, `-[e IS edge]->`: Edges in Hindsight store confidence levels, proof counts, and usage recency. The database filters out weak paths, low weight, to prioritize deeply reinforced knowledge. [13, 14, 15]
- The Outer `FETCH FIRST` Limit: This prevents the database from dumping hundreds of rows into the application layer, guaranteeing a clean context window for the cross-encoder and LLM. [12, 16]
