## 1. The Under-the-Hood Data Layer (The 4 Networks)

Behind the scenes, Hindsight maps memories across four distinct graph-traversable networks. Reflection runs over these structures to figure out what is currently true. [6, 7, 8]

- World Network (W): Objective, third-person facts about the external environment.
- Experience Network (B): First-person, agent-centric traces such as actions, recommendations, and past mistakes.
- Opinion Network (O): Subjective beliefs mapped with confidence scores and timestamps that adjust over time.
- Observation Network (S): Preference-neutral entity summaries distilled continuously from W and B. [6, 7, 9]
