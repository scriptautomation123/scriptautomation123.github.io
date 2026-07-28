## 2. The Recall Algorithm: Spreading Activation

When you query Hindsight, it does not just look for words that match your query. It uses a graph traversal algorithm called Spreading Activation via a Breadth-First Search, or BFS, pattern. [12, 13, 14, 15, 16]

Here is how Hindsight executes it step-by-step:

### Step 1: Drop the Anchor (The Entry Nodes)

Hindsight first runs a standard vector search to find the nodes that are most semantically similar to your query. These become your Seed Nodes, or entry points. [12, 13, 15]

### Step 2: Push the Energy Outward (Spreading)

Imagine dropping a pebble into a pond; ripples move outward. Hindsight sends a pulse of energy, or activation score, from your seed nodes along the edges to neighboring nodes. [12, 14]

- If Node A, Database, is highly active, it passes energy to Node B, Error 404, and Node C, Oracle 26ai.
- Node D, Python Tutorial, does not get any energy because it is not connected.

### Step 3: Layer-by-Layer Walk (BFS)

Hindsight explores the graph using BFS. This means it explores all immediate neighbors, Layer 1, before moving deeper to neighbors-of-neighbors, Layer 2. [6, 15, 17, 18]

This is crucial for multi-hop reasoning. If a user asks "Why did my pipeline crash yesterday?", Hindsight can jump:

$$
\text{Query} \rightarrow \text{Pipeline} \xrightarrow{\text{Layer 1}} \text{Database} \xrightarrow{\text{Layer 2}} \text{Oracle 26ai Upgrade}
$$

Even if the word "Upgrade" was not in the user's query, the graph safely carries the agent to that context. [13, 19]
