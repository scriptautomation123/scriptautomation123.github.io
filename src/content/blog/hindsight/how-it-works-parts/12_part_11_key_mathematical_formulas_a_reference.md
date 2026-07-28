## Part 11: Key Mathematical Formulas — A Reference

Here's every formula used in Hindsight, collected in one place for reference.

### Cosine Similarity

```
similarity(A, B) = (A · B) / (|A| × |B|)

Range: [-1, 1] (in practice [0, 1] for text embeddings)
Used in: Semantic search, semantic link creation
```

### BM25 Relevance Score

```
BM25(query, fact) = Σ  IDF(word) × f(word, fact) × 2.2
                   word              ────────────────────────────────
                   in query    f(word, fact) + 1.2 × (0.25 + 0.75 × |fact|/avg_length)

IDF(word) = log((N - n(word) + 0.5) / (n(word) + 0.5))

Where:
  N = total number of facts
  n(word) = number of facts containing this word
  f(word, fact) = how many times the word appears in this fact
  |fact| = length of this fact
  avg_length = average length of all facts
```

### Reciprocal Rank Fusion

```
RRF(fact) = Σ  1 / (60 + rank_i(fact))
           strategies

Where rank_i = position in strategy i's result list (starting from 1)
If fact doesn't appear in strategy i, it contributes 0
```

### Sigmoid Normalization

```
sigmoid(x) = 1 / (1 + e^(-x))

Range: (0, 1)
Used in: Normalizing cross-encoder scores
```

### Temporal Link Weight (Gaussian Decay)

```
weight(fact_A, fact_B) = e^(-(days_apart / 30)²)

Range: (0, 1]
Decays smoothly: 1.0 at 0 days, 0.37 at 30 days, ~0 at 60+ days
```

### Spreading Activation

```
activation(next) = activation(current) × link_weight × type_boost × 0.8

Type boosts:
  causes / caused_by: 2.0×
  enables / prevents: 1.5×
  all others: 1.0×

Stops when: activation < 0.1
```

### MPFP Forward Push

```
For each node with mass ≥ threshold:
  score[node] += α × mass          (α = 0.15)
  push_mass = (1 - α) × mass

  For each neighbor:
    next_mass[neighbor] += push_mass × normalized_weight
```

### Recency Decay

```
recency = max(0.1, 1.0 - days_ago / 365)

Range: [0.1, 1.0]
1.0 for today, 0.5 at ~6 months, 0.1 at 1+ year
```

### Combined Reranking Score

```
final = cross_encoder_score × (1 + 0.2 × (recency - 0.5)) × (1 + 0.2 × (temporal - 0.5))

Maximum adjustment: ±21% from base cross-encoder score
```

### Entity Resolution Score

```
score = name_similarity × 0.5  +  cooccurrence_ratio × 0.3  +  recency × 0.2

Range: [0, 1]
```

---
