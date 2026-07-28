## Part 10: Why Four Strategies? A Real-World Comparison

To understand why Hindsight uses four search strategies instead of one, let's see what each one misses on its own:

### Test Question: "What did Sarah say about the API changes last month?"

**Semantic search alone** ✗ Finds facts about API changes but doesn't filter by Sarah or last month.

**Keyword search alone** ✗ Finds facts mentioning "Sarah" and "API" but misses paraphrased references like "she suggested modifying the endpoints."

**Graph search alone** ✗ Starting from "Sarah", finds related facts but might wander to Sarah's other projects unrelated to APIs.

**Temporal search alone** ✗ Finds facts from last month but doesn't know they should be about Sarah or APIs.

**All four together** ✓ Semantic narrows to API-related facts. Keyword ensures "Sarah" is mentioned. Graph follows Sarah's connections to API discussions. Temporal filters to last month. RRF fusion surfaces facts that appear across multiple strategies — exactly the ones about Sarah discussing APIs last month.

---
