## 3. How Hindsight Implements This Efficiently

In raw graph theory, spreading activation can cause a graph explosion where searching a massive web takes too long, ruining real-time chat latency. Hindsight solves this by placing hard physical constraints on the database implementation. [15]

- The 5-Hop Ceiling: The BFS traversal is strictly capped at 5 iterations. It will never wander deeper than 5 links away from the source memory. [15]
- The 10-Neighbor Limit: At each node, Hindsight only expands to a maximum of 10 neighbors. It picks the 10 edges with the heaviest weights or highest semantic relevance. [14, 15]
- Constant Latency: Because of these caps, $5 \times 10$, the time it takes to search the graph remains completely flat and constant, even if your memory bank grows to millions of entries over months of use. [14, 15]
