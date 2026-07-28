## Part 6: Memory Banks — Organizing Knowledge

### What Is a Memory Bank?

A memory bank is an isolated container for memories — like a separate brain for each context. Common patterns:

| Pattern              | Example                  | Why                                  |
| -------------------- | ------------------------ | ------------------------------------ |
| One bank per user    | `user_alice`, `user_bob` | Each user's memories are private     |
| One bank per project | `project_landing_page`   | Project-specific knowledge           |
| One bank per agent   | `support_agent_1`        | Each AI agent has its own experience |
| Shared knowledge     | `company_wiki`           | Shared facts available to all agents |

### Dispositions

Each memory bank can have a **disposition** — a personality or perspective that influences how it interprets memories during the Reflect operation:

> **Disposition**: "You are a senior technical architect who values simplicity, performance, and maintainability. You're cautious about adopting new technologies without clear benefits."

This means when the agent reflects on memories about a technology choice, it'll respond with the perspective of a cautious architect — not an excited early adopter.

---
