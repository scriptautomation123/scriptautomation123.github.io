## Part 8: Putting It All Together

### A Complete Example

Let's trace a full question through the system. Imagine a memory bank contains 5,000 facts accumulated over 6 months of conversations.

**Question**: "Why did we switch from PostgreSQL to MongoDB for the user service?"

**Step 1: Semantic Search** (10ms)
Converts the question to an embedding and finds the closest facts:

1. "Team decided to migrate user service from PostgreSQL to MongoDB" (similarity: 0.94)
2. "MongoDB handles the user service's flexible schema requirements better" (0.89)
3. "PostgreSQL performance was degrading with nested JSON queries" (0.82)
4. "User service now uses MongoDB 7.0" (0.78)

**Step 2: BM25 Keyword Search** (50ms)
Finds facts containing key terms "PostgreSQL", "MongoDB", "user service":

1. "PostgreSQL performance was degrading with nested JSON queries" (BM25: 12.3)
2. "Team decided to migrate user service from PostgreSQL to MongoDB" (BM25: 11.8)
3. "MongoDB handles the user service's flexible schema requirements" (BM25: 9.2)
4. "PostgreSQL backup schedule changed to daily" (BM25: 6.1)

**Step 3: Graph Traversal** (100ms)
Starting from top semantic hits, follows connections:

1. "CTO approved the migration after performance review" (via causal link from migration decision)
2. "Performance review showed 3x latency increase on user queries" (via causal link)
3. "New hire Maria has MongoDB expertise, assigned to migration" (via entity link from user service)
4. "MongoDB handles flexible schema requirements better" (via semantic link)

**Step 4: Temporal Search** (20ms)
No specific time mentioned in question, so this returns facts weighted by recency.

**Step 5: RRF Fusion** (2ms)
Combines all four lists by rank position:

| Fact                                 | Sem | BM25 | Graph | Temp | RRF Score | Final Rank  |
| ------------------------------------ | :-: | :--: | :---: | :--: | :-------: | :---------: |
| Migration decision                   |  1  |  2   |   —   |  3   |  0.0487   |    **1**    |
| Flexible schema requirements         |  2  |  3   |   4   |  —   |  0.0475   |    **2**    |
| PostgreSQL degrading                 |  3  |  1   |   —   |  2   |  0.0487   | **1 (tie)** |
| CTO approved migration               |  —  |  —   |   1   |  —   |  0.0164   |    **5**    |
| Performance review showed 3x latency |  —  |  —   |   2   |  —   |  0.0161   |    **6**    |
| User service uses MongoDB 7.0        |  4  |  —   |   —   |  1   |  0.0320   |    **3**    |
| Maria assigned to migration          |  —  |  —   |   3   |  —   |  0.0159   |    **7**    |
| PostgreSQL backup schedule           |  —  |  4   |   —   |  4   |  0.0313   |    **4**    |

**Step 6: Cross-Encoder Reranking** (80ms)
The top candidates are re-scored by the neural reranker, which deeply understands the question-answer relationship:

| Fact                                 | RRF Rank | Cross-Encoder |  Final  |
| ------------------------------------ | :------: | :-----------: | :-----: |
| PostgreSQL performance degrading     |    1     |     0.95      |  **1**  |
| Migration decision                   |    1     |     0.93      |  **2**  |
| Flexible schema requirements         |    2     |     0.91      |  **3**  |
| Performance review showed 3x latency |    6     |     0.88      |  **4**  |
| CTO approved after review            |    5     |     0.82      |  **5**  |
| User service uses MongoDB 7.0        |    3     |     0.45      |  **6**  |
| PostgreSQL backup schedule           |    4     |     0.12      | **7** ↓ |

Notice how the cross-encoder demoted "PostgreSQL backup schedule" — it contains the right keywords but doesn't answer the question about _why_ the switch happened. It also promoted "Performance review showed 3x latency" from rank 6 to rank 4 because it directly explains the reason for switching.

**Step 7: Token Budget** (1ms)
With a 4096 token budget, the top 5-6 facts fit, giving a comprehensive answer about:

- What happened (migration from PostgreSQL to MongoDB)
- Why (performance degradation, flexible schema needs, 3x latency increase)
- Who decided (CTO, after performance review)
- Who's implementing (Maria)

**Total time**: ~260ms

---
