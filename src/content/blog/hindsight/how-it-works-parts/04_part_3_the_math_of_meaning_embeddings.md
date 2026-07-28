## Part 3: The Math of Meaning — Embeddings

### The Key Insight

How do you teach a computer to understand that "the dog chased the cat" and "the canine pursued the feline" mean the same thing? You can't just compare the words — they're completely different strings.

The answer is **embeddings**: converting text into lists of numbers where **similar meanings end up close together**.

### What Is an Embedding?

An embedding is a list of numbers that represents the meaning of a piece of text. In Hindsight's default configuration, each piece of text becomes a list of **384 numbers**.

```
"The CEO prefers minimalist designs"
    ↓ embedding model
[0.23, -0.15, 0.87, 0.02, ..., -0.41]   ← 384 numbers
```

You can think of each number as a coordinate in a 384-dimensional space. Just like a point on a map has 2 coordinates (latitude and longitude), each fact has 384 coordinates that place it in a "meaning space."

### Why Does This Work?

The embedding model has been trained on millions of text examples. During training, it learned that:

- "dog" and "canine" should have similar numbers
- "happy" and "sad" should have different numbers
- "Python programming" and "Java programming" should be close
- "Python programming" and "python snake" should be further apart

### Measuring Similarity: Cosine Similarity

Once we have embeddings, we need a way to measure how similar two pieces of text are. Hindsight uses **cosine similarity**.

**The intuition**: Imagine two arrows pointing from the center of a circle. If they point in the same direction, they're similar. If they point in opposite directions, they're different. The **angle** between them tells you how similar they are.

```
Cosine Similarity = (A · B) / (|A| × |B|)
```

Let's break that down with a tiny example. Suppose we have simplified 3-number embeddings:

```
"CEO prefers minimalist designs"  → A = [0.8, 0.1, 0.6]
"Executive favors simple aesthetics" → B = [0.7, 0.2, 0.5]
"Database migration deadline"     → C = [0.1, 0.9, 0.2]
```

**Step 1: Dot product (A · B)**
Multiply corresponding numbers and add them up:

```
A · B = (0.8 × 0.7) + (0.1 × 0.2) + (0.6 × 0.5)
      = 0.56 + 0.02 + 0.30
      = 0.88
```

**Step 2: Magnitudes (lengths)**

```
|A| = √(0.8² + 0.1² + 0.6²) = √(0.64 + 0.01 + 0.36) = √1.01 ≈ 1.005
|B| = √(0.7² + 0.2² + 0.5²) = √(0.49 + 0.04 + 0.25) = √0.78 ≈ 0.883
```

**Step 3: Divide**

```
Cosine Similarity(A, B) = 0.88 / (1.005 × 0.883) = 0.88 / 0.887 ≈ 0.99
```

That's very high! These two texts mean almost the same thing.

Now let's compare A with C (the unrelated text):

```
A · C = (0.8 × 0.1) + (0.1 × 0.9) + (0.6 × 0.2) = 0.08 + 0.09 + 0.12 = 0.29
|C| = √(0.01 + 0.81 + 0.04) = √0.86 ≈ 0.927

Cosine Similarity(A, C) = 0.29 / (1.005 × 0.927) ≈ 0.31
```

Much lower! The design preference and database migration are about different topics.

**The scale**:

| Similarity | Meaning                  |
| ---------- | ------------------------ |
| 0.9 – 1.0  | Nearly identical meaning |
| 0.7 – 0.9  | Closely related topics   |
| 0.4 – 0.7  | Somewhat related         |
| 0.0 – 0.4  | Different topics         |

Hindsight uses a threshold of **0.3** for search (anything above 0.3 is considered a potential match) and **0.7** for creating semantic links between facts (only strongly related facts get connected).

---
