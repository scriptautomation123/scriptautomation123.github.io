## Phase 2: Walking the Web (SQL/PGQ Path Matching)

Once Hindsight gathers the initial `memory_id` array, for example `[104, 302, 501]`, it forwards those starting points to Oracle's SQL Property Graph Queries, or SQL/PGQ, engine. [6, 9]

Using the standard `GRAPH_TABLE` operator and the `MATCH` pattern-matching syntax introduced natively in the database, Hindsight executes a multi-hop traversal out to neighboring nodes. The underlying SQL structure looks like this. [6, 9, 10, 11]

```sql
SELECT *
FROM GRAPH_TABLE (
  hindsight_memory_graph
  MATCH (seed IS node) -[e IS edge]->{1, 3} (neighbor IS node)
  WHERE seed.memory_id IN (:seed_ids)
  COLUMNS (
    seed.entity_name AS initial_topic,
    e.relationship_type AS connection_type,
    e.weight AS edge_strength,
    neighbor.entity_name AS related_topic,
    neighbor.fact_summary AS retrieved_fact
  )
)
ORDER BY edge_strength DESC
FETCH FIRST 25 ROWS ONLY;
```
