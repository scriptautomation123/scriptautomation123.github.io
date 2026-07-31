


# Oracle26AI 

The production example below demonstrates a Customer Support Intelligence scenario. It retrieves semantically similar error tickets using vector similarity, expands those candidates across a multi-hop graph to find the assigned engineer and components, and returns a unified context.

```
-- Core relational tables storing data and embeddings
CREATE TABLE it_components (
    comp_id INT PRIMARY KEY,
    comp_name VARCHAR2(100),
    severity VARCHAR2(20)
);

CREATE TABLE helpdesk_tickets (
    ticket_id INT PRIMARY KEY,
    summary VARCHAR2(4000),
    ticket_vector VECTOR(384, FLOAT32), -- Native vector type
    comp_id INT REFERENCES it_components(comp_id)
);

CREATE TABLE engineers (
    eng_id INT PRIMARY KEY,
    name VARCHAR2(100),
    team VARCHAR2(50)
);

CREATE TABLE ticket_assignments (
    ticket_id INT REFERENCES helpdesk_tickets(ticket_id),
    eng_id INT REFERENCES engineers(eng_id),
    assigned_date DATE,
    PRIMARY KEY (ticket_id, eng_id)
);

-- Production-grade memory-optimized vector index
CREATE VECTOR INDEX h_ticket_v_idx ON helpdesk_tickets(ticket_vector)
ORGANIZATION INMEMORY NEIGHBOR GRAPH
DISTANCE COSINE;

-- Declarative SQL:2023 Property Graph structure over tables
CREATE PROPERTY GRAPH support_knowledge_graph
    VERTEX TABLES (
        helpdesk_tickets KEY (ticket_id) LABEL Ticket PROPERTIES (summary),
        it_components KEY (comp_id) LABEL Component PROPERTIES (comp_name, severity),
        engineers KEY (eng_id) LABEL Engineer PROPERTIES (name)
    )
    EDGE TABLES (
        helpdesk_tickets KEY (ticket_id) 
            REFERENCES it_components (comp_id) LABEL AFFECTS,
        ticket_assignments KEY (ticket_id, eng_id)
            SOURCE KEY (ticket_id) REFERENCES helpdesk_tickets (ticket_id)
            DESTINATION KEY (eng_id) REFERENCES engineers (eng_id) LABEL ASSIGNED_TO
    );
```
### The Production PL/SQL Package

This production architecture uses a strongly-typed PL/SQL package containing optimized cursors. The cursor blends semantic similarity distance filters (`VECTOR_DISTANCE`) with graph pattern matching tables (`GRAPH_TABLE`)
<!--stackedit_data:
eyJoaXN0b3J5IjpbLTUwOTA3MzE0MV19
-->