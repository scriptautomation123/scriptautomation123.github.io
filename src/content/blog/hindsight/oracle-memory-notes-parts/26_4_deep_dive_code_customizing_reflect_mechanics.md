## 4. Deep-Dive Code: Customizing Reflect Mechanics

To tap into this deep behavior, you do not just pass a string query. You configure the Disposition Profile and the execution bounds. Here is how you configure a deep-dive reflection task:

```python
from hindsight.agent import HindsightAgent
from hindsight.profiles import DispositionProfile

# Define custom guardrails for the reasoning engine
custom_profile = DispositionProfile(
    system_instruction=(
        "You are an elite enterprise architect analyzing a developer's memory bank. "
        "Be fiercely analytical. Prioritize technical architectural choices over subjective opinions. "
        "If you discover a contradiction in their coding patterns, explicitly point out "
        "when and why their pattern changed based on the graph timestamps."
    ),
    temperature=0.1,  # Keep it low to enforce strict logic and avoid hallucinations
)

agent = HindsightAgent(
    storage_url="oracle+oracledb://...",
    bank_id="dev_workspace_alpha",
    profile=custom_profile,
)

# Trigger a deep-dive reflection
deep_analysis = agent.reflect(
    query="Trace the evolution of the user's database scaling strategies and flag where their approach failed.",
    budget=8,           # Give the LLM up to 8 tool-calling turns to dig through the graph
    include_stale=True, # Force it to read unconsolidated raw facts alongside the graph
    max_tokens=3000,
)

print(f"Analysis Status: {deep_analysis.status}")  # For example, SUCCESS or CONTRADICTION_DETECTED
print(f"Graph Confidence Level: {deep_analysis.confidence}")
print(f"\nDeep Analysis:\n{deep_analysis.answer}")
```
