## Supported LLM Providers

Hindsight integrates across the following primary environments: [1]

- Cloud API Providers: Full native support for OpenAI, for example `gpt-4o` and `gpt-4-turbo`, Anthropic, for example `claude-3-5-sonnet`, Google Gemini, Groq, OpenRouter, and MiniMax. [1, 3, 4, 6, 7]
- LiteLLM Integration: By setting your provider environment variable to `litellm` or `litellmrouter`, Hindsight can interface with Azure OpenAI, Together AI, Fireworks AI, and any other endpoint supported by LiteLLM. [4]
- Local Open-Source Models via Ollama or vLLM: You can run Hindsight fully local and private using tools like Ollama, llama.cpp, LM Studio, or vLLM. Popular local configurations include Llama 3, Qwen 2.5 or 3.5, and Hermes models. [1, 5, 8, 9, 10]
