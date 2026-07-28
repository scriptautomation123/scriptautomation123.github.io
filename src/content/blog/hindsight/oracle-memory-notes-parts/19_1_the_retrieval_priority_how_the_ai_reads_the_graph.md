## 1. The Retrieval Priority (How the AI Reads the Graph)

When traditional recall runs, it executes the graph path matching query to find raw facts. But during reflect, the LLM does not just want to look at a chaotic list of single conversations. It queries the graph table using a strict priority order. [2, 3, 4]

1. Mental Models or Observations, highest priority: Consolidated clusters of nodes.
2. Opinion or Evolving Belief Networks: Subjective edge weights and confidence metrics.
3. Raw Facts, lowest priority: Individual interaction history nodes. [2, 4, 5, 6]

By querying the Observations and Mental Models first, the graph allows the reflect loop to say: "I don't need to read the 50 distinct database errors this user had. I can see a consolidated graph node stating 'User has persistent connection timeouts due to firewall rules' backed by a high edge proof-count." [4, 7]
