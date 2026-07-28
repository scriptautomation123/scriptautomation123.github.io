## Part 7: Token Budget Management

### Why Budget Matters

Language models can only process a limited amount of text at once (their "context window"). If Hindsight retrieves 500 relevant facts, the language model can't use all of them. Token budget management ensures we return the **most valuable** information within the available space.

### How It Works

After ranking all candidate facts, Hindsight fills the context window one fact at a time:

```
remaining_budget = 4096 tokens (configurable)

For each fact (in ranked order):
    tokens_needed = estimate_tokens(fact.text)
    if remaining_budget >= tokens_needed:
        include this fact
        remaining_budget -= tokens_needed
    else:
        stop — we've filled the context
```

This is a **greedy algorithm** — it always picks the next highest-ranked fact that fits. While not mathematically optimal (there might be a combination of smaller facts that collectively gives better coverage), it's fast and works well in practice because higher-ranked facts are almost always more valuable.

---
