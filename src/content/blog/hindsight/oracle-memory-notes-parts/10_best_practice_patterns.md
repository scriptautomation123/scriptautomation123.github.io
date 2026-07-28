## Best Practice Patterns

- Pre-response, fast path: Avoid running reflect on every incoming chat message because it increases token costs and latency. Instead, use recall paired with a direct mental model fetch for quick conversational context injection. [2]
- Analytical or periodic, slow path: Run reflect when initializing a new multi-tenant session, compiling complex tasks, handling agent handoffs, or running deep evaluations on a user profile. [3]

If you want, tell me:

- Do you want to build a profile configuration to change the tone or disposition of the reflection layer?
- Do you need to set up temporal filtering so it prioritizes recent weeks over historical memory?

To understand how Hindsight handles memory retrieval, you do not need a math degree. At its core, Hindsight's recall feature uses a concept called Graph Theory to find connected memories that traditional search tools completely miss. [1, 2, 3, 4, 5]
