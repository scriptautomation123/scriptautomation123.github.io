## Part 2: Retain — How Memories Are Stored

### From Conversations to Facts

When Hindsight receives new information (a conversation, a document, a note), it doesn't just store the raw text. It breaks it down into **facts** — individual pieces of knowledge that can be searched and connected independently.

**Example**: Imagine a user tells their AI assistant:

> "I had a great meeting with Sarah from the design team yesterday. We decided to go with the blue color scheme for the new landing page. She mentioned that the CEO prefers minimalist designs, which influenced our choice. Oh, and the deadline is March 15th."

Hindsight extracts these individual facts:

| #   | Fact                                                                 | Type       | When       |
| --- | -------------------------------------------------------------------- | ---------- | ---------- |
| 1   | User had a meeting with Sarah from the design team                   | Experience | Yesterday  |
| 2   | The team decided to use a blue color scheme for the new landing page | World      | Yesterday  |
| 3   | The CEO prefers minimalist designs                                   | World      | —          |
| 4   | The CEO's design preference influenced the color scheme decision     | World      | Yesterday  |
| 5   | The landing page deadline is March 15th                              | World      | March 15th |

Notice how each fact stands on its own. Fact #3 ("The CEO prefers minimalist designs") is useful even without the context of the meeting — it might be relevant months later when someone asks about the CEO's preferences.

### Two Types of Facts

Hindsight distinguishes between:

- **World facts**: Things that are true about the world — "The CEO prefers minimalist designs", "The deadline is March 15th"
- **Experience facts**: Things that happened in conversations or interactions — "User had a meeting with Sarah"

This distinction matters because world facts tend to be more broadly useful, while experience facts provide context about _when_ and _how_ you learned something.

### Extracting Entities

Beyond facts, Hindsight identifies **entities** — the people, places, organizations, and concepts mentioned in the text:

From our example above:

- **Sarah** (Person, design team)
- **CEO** (Person)
- **Design Team** (Organization)
- **Landing Page** (Product)

### The Entity Resolution Problem

Here's a tricky challenge: people refer to the same thing in different ways. In one conversation, someone might say "Sarah Chen", in another just "Sarah", and in a third "the lead designer". Hindsight needs to figure out these all refer to the same person.

It uses a scoring system that considers three factors:

**1. Name Similarity (up to 50% of the score)**

How similar are the names? Hindsight uses _sequence matching_ — comparing the strings character by character.

Think of it like a spelling test. "Sarah Chen" and "Sarah" share all of "Sarah", so they score high. "Sarah Chen" and "Bob Smith" share almost nothing, so they score low.

```
Name Similarity Score = (matching characters / total characters) × 0.5
```

**Examples**:

| Comparing                   | Similarity | Score (× 0.5) |
| --------------------------- | ---------- | ------------- |
| "Sarah Chen" vs "Sarah"     | 0.77       | 0.38          |
| "Sarah Chen" vs "S. Chen"   | 0.70       | 0.35          |
| "Sarah Chen" vs "Bob Smith" | 0.10       | 0.05          |

**2. Co-occurring Entities (up to 30% of the score)**

If two entity mentions appear alongside the same other entities, they're probably the same thing. If "Sarah" always appears in conversations that also mention "Design Team" and "Landing Page", and so does "Sarah Chen", they're likely the same person.

```
Co-occurrence Score = (shared nearby entities / total nearby entities) × 0.3
```

**3. Recency (up to 20% of the score)**

More recently mentioned entities are preferred. If we saw "Sarah Chen" yesterday but "Sarah Johnson" six months ago, and someone now says "Sarah", we lean toward "Sarah Chen".

```
Recency Score = max(0, 1 - (days since last mention / 365)) × 0.2
```

This means an entity seen today gets the full 0.2 bonus, one seen six months ago gets about 0.1, and one not seen for over a year gets 0.

**The total resolution score is the sum of all three**:

```
Total Score = Name Similarity + Co-occurrence + Recency
            = (0 to 0.5)     + (0 to 0.3)    + (0 to 0.2)
            = 0 to 1.0
```

### Building the Knowledge Graph

After extracting facts and entities, Hindsight creates **connections** (called links) between related facts. This is where it builds a knowledge graph — a web of interconnected memories.

There are four types of connections:

#### 1. Entity Links

If two facts mention the same entity, they're connected. Simple.

> Fact: "Sarah prefers the blue color scheme"  
> Fact: "Sarah's deadline is March 15th"  
> → Connected through the entity "Sarah"

#### 2. Semantic Links (Meaning-Based)

Facts that are about similar topics get connected, even if they don't share specific words. We'll explain _how_ this similarity is measured in [Part 3](#part-3-the-math-of-meaning--embeddings), but for now, think of it as "these facts are about the same kind of thing."

Only facts that are at least 70% similar get linked:

```
If similarity(fact_A, fact_B) ≥ 0.7 → create link with weight = similarity
```

#### 3. Temporal Links (Time-Based)

Facts that happened around the same time are connected. The connection gets weaker the further apart in time they are.

The formula uses something called a **Gaussian decay** (a bell curve):

```
weight = e^(-(days_apart / 30)²)
```

Don't let the math scare you — here's what it means in plain English:

| Days Apart   | Weight | In Plain English          |
| ------------ | ------ | ------------------------- |
| 0 (same day) | 1.00   | Strongly connected        |
| 7 days       | 0.95   | Still very connected      |
| 15 days      | 0.78   | Noticeably weaker         |
| 30 days      | 0.37   | Moderate connection       |
| 60 days      | 0.02   | Very weak                 |
| 90 days      | ~0.00  | Effectively no connection |

This makes intuitive sense: things that happened on the same day are probably related, things a week apart might be, and things months apart probably aren't (unless connected by other means).

**Why a bell curve?** The bell curve (Gaussian) is special because it decays smoothly — there's no sharp cutoff. This is more natural than saying "facts within 30 days are connected, facts beyond 30 days are not."

#### 4. Causal Links

Sometimes facts have cause-and-effect relationships. Hindsight's AI identifies these during extraction:

> Fact: "The CEO prefers minimalist designs" (cause)  
> Fact: "The team chose the blue color scheme" (effect)  
> → Connected with relationship type "caused_by", strength 0.8

### Turning Text Into Numbers (A Preview)

One crucial step in Retain is converting each fact into a list of numbers (called an **embedding**). This is what makes searching possible later. We'll explain this fully in [Part 3](#part-3-the-math-of-meaning--embeddings), but the key idea is:

> Every fact gets converted into a list of 384 numbers that represent its _meaning_. Facts about similar topics end up with similar numbers.

---
