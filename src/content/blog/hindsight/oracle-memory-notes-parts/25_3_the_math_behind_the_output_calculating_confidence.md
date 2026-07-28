## 3. The Math Behind the Output: Calculating Confidence

When reflect returns its final markdown answer, it also outputs a mathematical metadata property, `reflection.confidence`. This is not a random guess by the LLM; it is a calculated score derived from the graph's topology and metadata fields. [2]

$$
\text{Confidence} = \frac{\sum(\text{Proof Counts}) \times \text{Average Recency Weight}}{\text{Number of Contradictions Found} + 1}
$$

- Proof Count: Every time a user reinforces a fact, Hindsight bumps an edge counter in Oracle 26ai. High proof counts mean high confidence.
- Recency Weight: Memories decay over time based on an exponential decay formula. Recent interactions carry higher weights.
- Contradictions: If the graph contains conflicting nodes, for example Node A says X and Node B says Y, the denominator increases, dropping the final confidence score. This warns your application that the memory foundation for this answer is highly unstable.
