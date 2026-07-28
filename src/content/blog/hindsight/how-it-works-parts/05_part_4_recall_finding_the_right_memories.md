## Part 4: Recall — Finding the Right Memories

### The Challenge

When you ask "What did we decide about the landing page?", Hindsight needs to search through potentially thousands of facts and return the most relevant ones. But different questions need different search strategies:

| Question                                     | Best Search Strategy          |
| -------------------------------------------- | ----------------------------- |
| "What did we decide about the landing page?" | Meaning-based (semantic)      |
| "Find mentions of Sarah Chen"                | Exact word matching (keyword) |
| "Who else works with Sarah?"                 | Following connections (graph) |
| "What happened last Tuesday?"                | Time-based (temporal)         |

No single search method works best for everything. So Hindsight uses **all four simultaneously** and combines the results.

### Strategy 1: Semantic Search

**How it works**: Convert the question into an embedding (the same way we convert facts), then find facts with the most similar embeddings.

**Example**:

```
Question: "What color scheme was chosen?"
    ↓ embedding
[0.75, 0.12, 0.58, ...]

Compare against all stored fact embeddings:
  "Team decided to use blue color scheme" → similarity: 0.91 ✓
  "CEO prefers minimalist designs"        → similarity: 0.62 ✓
  "Sarah's deadline is March 15th"        → similarity: 0.28 ✗
  "Database migration plan"               → similarity: 0.15 ✗
```

Facts above the 0.3 threshold are kept as candidates.

**Why it's good**: Finds relevant results even when the exact words don't match. "Color scheme was chosen" matches "decided to use blue" because the _meaning_ is similar.

**Why it's not enough**: It misses exact names, codes, and specific terms. If you search for "PR-4521", semantic search might not find it because the model doesn't know that specific code.

### Strategy 2: Keyword Search (BM25)

**How it works**: Finds facts that contain the same words as your question, weighted by how rare and important those words are.

BM25 stands for "Best Match 25" (it was the 25th iteration of a ranking formula researchers were developing). It's the same algorithm that powers search engines like Elasticsearch.

**The key insight behind BM25**: Not all word matches are equal. If your question contains "the" and a fact also contains "the", that's not very helpful — almost every sentence has "the." But if your question contains "minimalist" and a fact also contains "minimalist", that's much more significant because "minimalist" is a rare word.

**The formula** (simplified):

```
Score = sum for each matching word:
    importance(word) × frequency_boost(word, fact)
```

Where:

**Importance** is measured by how rare the word is across all facts:

```
importance(word) = log((total_facts - facts_containing_word + 0.5) /
                       (facts_containing_word + 0.5))
```

In plain English: words that appear in few facts are more important than words that appear everywhere.

| Word         | Appears in        | Importance      |
| ------------ | ----------------- | --------------- |
| "the"        | 950 of 1000 facts | Very low (0.05) |
| "design"     | 50 of 1000 facts  | Moderate (2.9)  |
| "minimalist" | 5 of 1000 facts   | High (5.3)      |
| "PR-4521"    | 1 of 1000 facts   | Very high (6.9) |

**Frequency boost** rewards facts that mention the word multiple times, but with diminishing returns. Mentioning "design" 3 times is better than once, but 10 times isn't much better than 5:

```
frequency_boost = (count × 2.2) / (count + 1.2 × (1 - 0.75 + 0.75 × fact_length / avg_length))
```

The `fact_length / avg_length` part adjusts for fact length — a long fact naturally has more words, so matching a word in a short fact is more impressive than matching it in a long one.

**Example**:

```
Question: "minimalist design preferences"

Fact 1: "The CEO prefers minimalist designs"
  → "minimalist" (importance: 5.3) + "design" (importance: 2.9)
  → Score: 8.2

Fact 2: "The new design system was approved"
  → "design" (importance: 2.9)
  → Score: 2.9

Fact 3: "The meeting was scheduled for Tuesday"
  → No matching words
  → Score: 0
```

**Why it's good**: Excellent for specific terms, names, acronyms, and exact phrases.

**Why it's not enough**: Doesn't understand meaning. "automobile" won't match "car."

### Strategy 3: Graph Traversal

**How it works**: Start from known relevant facts, then follow connections to discover related facts that you might not find through text matching.

Think of it like asking a friend: "Tell me what you know about Sarah." Your friend says "Sarah works on the landing page project." You then ask "Tell me more about the landing page project" and discover "The landing page deadline is March 15th." By following connections, you found something relevant that might not have matched your original question.

Hindsight supports two graph traversal algorithms:

#### Algorithm A: Spreading Activation (BFS)

This is inspired by how neurons fire in the brain. When you think of "Sarah", related concepts like "design team" and "landing page" also light up, but less strongly.

**How it works**:

1. **Start**: Find the facts most relevant to your question (the "seed" facts)
2. **Spread**: Follow connections from those facts to neighboring facts
3. **Decay**: Each hop reduces the activation strength
4. **Stop**: When the activation gets too weak (below 0.1) or we've explored enough

**The activation formula**:

```
new_activation = parent_activation × link_weight × type_boost × 0.8
```

Let's walk through an example:

```
Start: "Sarah prefers the blue color scheme" (activation: 1.0)

Hop 1 — Follow entity link to Sarah:
  "Sarah's deadline is March 15th"
  activation = 1.0 × 1.0 × 1.0 × 0.8 = 0.80

Hop 1 — Follow causal link:
  "CEO's preference influenced the choice"
  activation = 1.0 × 0.8 × 2.0 × 0.8 = 1.28 → capped at 1.0

Hop 2 — From "CEO's preference influenced the choice", follow entity link to CEO:
  "CEO is reviewing Q2 budget"
  activation = 1.0 × 0.6 × 1.0 × 0.8 = 0.48

Hop 3 — From "CEO is reviewing Q2 budget":
  "Q2 budget includes design software"
  activation = 0.48 × 0.5 × 1.0 × 0.8 = 0.19

Hop 4 — Getting weak...
  "Design software license expires in June"
  activation = 0.19 × 0.4 × 1.0 × 0.8 = 0.06 → STOP (below 0.1)
```

Notice how causal links get a **type boost** — "causes" and "caused_by" relationships get a 2× boost because cause-effect chains are especially valuable for understanding context.

#### Algorithm B: Multi-Path Fact Propagation (MPFP)

This is a more sophisticated algorithm based on **Personalized PageRank** — the same family of algorithms that Google originally used to rank web pages.

**The intuition**: Imagine you're exploring a city by randomly walking through streets. Sometimes you teleport back to your starting point. After walking for a while, the places you visit most often are the most "connected" to your starting point.

MPFP is smarter than random walking — it uses pre-defined **path templates** to explore:

| Template             | What It Finds    | Example                                      |
| -------------------- | ---------------- | -------------------------------------------- |
| semantic → semantic  | Topic expansion  | "blue color scheme" → other design decisions |
| entity → temporal    | Entity timeline  | "Sarah" → what Sarah did last week           |
| semantic → causes    | Reasoning chains | "chose blue" → _why_ blue was chosen         |
| semantic → caused_by | Root causes      | "chose blue" → what led to that choice       |
| entity → semantic    | Entity context   | "Sarah" → topics Sarah is involved in        |

**The forward push algorithm**:

At each step, every active node either:

- **Keeps** some of its importance (controlled by α = 0.15)
- **Pushes** the rest to its neighbors

```
For each active node:
    score[node] += 0.15 × current_mass     ← "I'll remember 15% happened here"
    push_mass = 0.85 × current_mass          ← "Send 85% onward to neighbors"

    For each connected neighbor:
        neighbor_mass += push_mass × connection_weight
```

**Why α = 0.15?** This creates a balance: 15% of the "importance" stays at each node (representing the chance of being directly relevant), and 85% flows to neighbors (representing the chance of finding something relevant nearby). This is the same value Google used in the original PageRank paper — it turns out to work well across many domains.

**Why MPFP is faster**: It only explores paths that follow meaningful patterns (entity → temporal, semantic → causal, etc.) rather than blindly exploring all connections. It also uses a **threshold** (0.000001) to stop exploring paths that have become insignificant — like pruning dead branches from a tree.

### Strategy 4: Temporal Search

**How it works**: Finds facts based on when they happened, not what they're about.

**Example**:

```
Question: "What happened at last week's design meeting?"

Step 1: Detect temporal reference → "last week" → March 10-14
Step 2: Find facts with dates in that range
Step 3: Rank by how close to the center of the range
```

**Temporal proximity calculation**:

```
                    days from center of time range
proximity = 1.0 - ─────────────────────────────────
                     half the range width
```

**Example**: If the time range is March 10-14 (5 days), the center is March 12:

| Fact Date | Days from Center | Proximity            |
| --------- | ---------------- | -------------------- |
| March 12  | 0                | 1.00 (perfect match) |
| March 13  | 1                | 0.60                 |
| March 10  | 2                | 0.20                 |
| March 8   | 4                | 0.00 (outside range) |

### Combining Results: Reciprocal Rank Fusion

Now we have four lists of results — one from each strategy. How do we combine them into a single ranked list?

Hindsight uses **Reciprocal Rank Fusion (RRF)**, and it's beautifully simple.

**The problem with just averaging scores**: Each strategy produces scores on completely different scales. Semantic similarity ranges from 0 to 1, BM25 might range from 0 to 15, and graph activation from 0 to 1. You can't meaningfully average 0.85 (semantic) with 12.3 (BM25).

**RRF's solution**: Ignore the scores entirely. Only look at **ranks** (positions in each list).

**The formula**:

```
RRF_score(fact) = sum over all strategies:  1 / (60 + rank)
```

The constant 60 prevents any single top-ranked result from dominating.

**Example**: Let's say we're combining results from all four strategies:

| Fact                           | Semantic Rank | BM25 Rank | Graph Rank | Temporal Rank |               RRF Score                |
| ------------------------------ | :-----------: | :-------: | :--------: | :-----------: | :------------------------------------: |
| "Team chose blue scheme"       |       1       |     3     |     2      |       5       | 1/61 + 1/63 + 1/62 + 1/65 = **0.0635** |
| "CEO prefers minimalist"       |       2       |     —     |     1      |       —       |        1/62 + 1/61 = **0.0325**        |
| "Meeting with Sarah yesterday" |       —       |     1     |     4      |       1       |    1/61 + 1/64 + 1/61 = **0.0484**     |
| "Deadline is March 15th"       |       4       |     2     |     —      |       3       |    1/64 + 1/62 + 1/63 = **0.0477**     |

(— means the fact didn't appear in that strategy's results)

**Sorting by RRF score**: "Team chose blue scheme" (0.0635) > "Meeting with Sarah" (0.0484) > "Deadline is March 15th" (0.0477) > "CEO prefers minimalist" (0.0325)

**Why RRF is brilliant**:

- **No calibration needed**: It doesn't care about score scales
- **Consensus rewarded**: Facts that appear in multiple strategies rank higher
- **No single strategy dominates**: The 60 constant ensures a #1 ranking in one strategy doesn't overwhelm everything else
- **Robust**: Even if one strategy is completely wrong, the others compensate

### The Final Step: Cross-Encoder Reranking

After RRF gives us a ranked list, Hindsight does one final check using a **cross-encoder** — a neural network that directly evaluates "how well does this fact answer this question?"

**Why not just use the cross-encoder for everything?** Speed. The cross-encoder is slow — it needs to process each question-fact pair individually. Running it on 10,000 facts would take too long. Instead, we use the fast strategies (semantic, BM25, graph, temporal) to narrow down to ~100 candidates, then use the cross-encoder for precise ranking.

**How the cross-encoder works**:

1. **Input**: The question and a candidate fact, formatted together
2. **Output**: A raw score (can be any number)
3. **Normalization**: Convert to 0-1 range using the **sigmoid function**

**The sigmoid function**:

```
sigmoid(x) = 1 / (1 + e^(-x))
```

This is an S-shaped curve that squishes any number into the range (0, 1):

| Raw Score | sigmoid | Meaning                       |
| --------- | ------- | ----------------------------- |
| -5        | 0.007   | Almost certainly not relevant |
| -2        | 0.12    | Unlikely relevant             |
| 0         | 0.50    | Uncertain                     |
| 2         | 0.88    | Likely relevant               |
| 5         | 0.993   | Almost certainly relevant     |

**Adding time awareness**:

The cross-encoder score is adjusted by two time-based factors:

**Recency boost** — slightly prefer recent facts:

```
recency = max(0.1, 1.0 - days_ago / 365)
recency_boost = 1.0 + 0.2 × (recency - 0.5)
```

| Age          | Recency | Boost            |
| ------------ | ------- | ---------------- |
| Today        | 1.0     | 1.10 (+10%)      |
| 6 months ago | 0.5     | 1.00 (no change) |
| 1+ year ago  | 0.1     | 0.92 (-8%)       |

**Temporal relevance boost** — if the question mentions a time, prefer facts from that time:

```
temporal_boost = 1.0 + 0.2 × (temporal_proximity - 0.5)
```

**Combined final score**:

```
final_score = cross_encoder_score × recency_boost × temporal_boost
```

**Why multiplicative, not additive?** If we _added_ the recency bonus, a very relevant old fact (cross-encoder: 0.95) might get the same final score as a moderately relevant new fact (cross-encoder: 0.60 + 0.35 recency bonus). By _multiplying_, the cross-encoder score remains dominant, and the time factors only create small adjustments (±10% each, ±21% combined). Relevance always wins over recency.

---
