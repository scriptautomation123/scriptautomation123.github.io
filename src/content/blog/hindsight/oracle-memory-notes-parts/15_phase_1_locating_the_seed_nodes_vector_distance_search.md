## Phase 1: Locating the Seed Nodes (Vector Distance Search)

Before traversing the graph, Hindsight must determine where to drop the anchor. It embeds the incoming user query and searches a table of entities and facts to grab the closest starting points using native [Oracle AI Vector Search](https://blogs.oracle.com/database/oracle-database-23ai-vector-search-spatial-graphs-and-grounded-generative-ai-in-enterprise-data-systems). [5, 6, 7]

```sql
-- Step 1: Find the internal IDs of the most relevant memories to use as entry points
SELECT memory_id, content
FROM memory_nodes
ORDER BY VECTOR_DISTANCE(embedding, :query_vector, COSINE)
FETCH FIRST 5 ROWS ONLY;
```

If a user types a highly specific phrase, a HYBRID VECTOR INDEX query executing a concurrent text or keyword match, BM25, may run alongside this to catch precise strings. [4, 8]
