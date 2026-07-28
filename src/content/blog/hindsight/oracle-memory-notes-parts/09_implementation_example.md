## Implementation Example

Because reflect is a heavy, expensive compute step, it is typically used for complex multi-session reasoning, compiling summaries, or analyzing recurring patterns, for example assessing an account's overall friction points over the last 6 months. [2, 3, 12]

```python
from hindsight.agent import HindsightAgent

# Querying the reflection layer on your memory bank
reflection = agent.reflect(
    query="Summarize our user's persistent system integration challenges and any code design anti-patterns they repeatedly hit.",
    budget=3,          # Controls how deeply the agent searches or explores the graph networks
    max_tokens=1500,    # Limits final answer length
)

# Output is a fully reasoned narrative, not a list of chunks
print(f"Confidence Score: {reflection.confidence}")
print(f"Synthesized Analysis:\n{reflection.answer}")
```
