## 3. Handling "Stale" Graph Links (Freshness Awareness)

Because running background consolidation on a massive graph takes time, there is a risk that a user just said something 10 seconds ago that has not been woven into a Mental Model node yet. [7]

Reflect handles this with Freshness Awareness. [7]

- The underlying database query checks the timestamp edge weights on the Raw Facts network and compares them to the last updated timestamp of the Observations network. [6, 7]
- If reflect notices that new raw facts exist after the last graph consolidation, it flags the observation node as stale. [7]
- The reflect engine will then intentionally force a hybrid query, fusing the structured graph network with a live text scan of the absolute newest raw database rows, to patch the gap and prevent memory hallucinations. [2, 7]
