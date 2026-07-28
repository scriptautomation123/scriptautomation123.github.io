## Example Configuration

To change or define which LLM Hindsight uses behind the scenes, for instance when spinning it up alongside Oracle Database 26ai, configure it via environment variables. [13]

### Example 1: Connecting Hindsight to OpenAI

```bash
export HINDSIGHT_API_LLM_PROVIDER="openai"
export HINDSIGHT_API_LLM_MODEL="gpt-4o"
export OPENAI_API_KEY="sk-..."
```

### Example 2: Connecting Hindsight to a Local Ollama Instance

```bash
export HINDSIGHT_API_LLM_PROVIDER="ollama"
export HINDSIGHT_API_LLM_BASE_URL="http://localhost:11434/v1"
export HINDSIGHT_API_LLM_MODEL="llama3"
```

Would you like to see how to write a custom prompt template for Hindsight's Reflection layer, or do you need assistance configuring LiteLLM to bridge an enterprise model deployment? [4]

In the Hindsight framework, reflect is an expensive, agentic reasoning loop rather than a simple text lookup. While recall returns raw, ranked data chunks, reflect instructs an LLM to evaluate past raw facts, deduplicate conflicting memories, apply behavioral profiles, and return a fully synthesized, grounded markdown response. [1, 2, 3, 4, 5]

The reflection architectural layer is split into two parts: background network consolidation and on-demand agentic query execution. [1, 2, 4]
