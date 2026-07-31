


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

```
CREATE OR REPLACE PACKAGE support_analytics_pkg AS
    -- Define structured record for production pipelined pipeline text consumption
    TYPE context_rec IS RECORD (
        ticket_id        INT,
        similarity_score NUMBER,
        summary          VARCHAR2(4000),
        component_name   VARCHAR2(100),
        engineer_name    VARCHAR2(100)
    );
    TYPE context_tbl IS TABLE OF context_rec;

    -- Core function to match vector vectors and resolve graph connections
    FUNCTION get_graph_rag_context(
        p_query_vector IN VECTOR,
        p_max_distance IN NUMBER DEFAULT 0.35,
        p_limit        IN INT DEFAULT 5
    ) RETURN context_tbl PIPELINED;
END support_analytics_pkg;
/

CREATE OR REPLACE PACKAGE BODY support_analytics_pkg AS

    FUNCTION get_graph_rag_context(
        p_query_vector IN VECTOR,
        p_max_distance IN NUMBER DEFAULT 0.35,
        p_limit        IN INT DEFAULT 5
    ) RETURN context_tbl PIPELINED IS
    BEGIN
        -- Query processes inline vectors first, then pushes them directly into graph paths
        FOR r IN (
            WITH vector_candidates AS (
                SELECT ticket_id,
                       VECTOR_DISTANCE(ticket_vector, p_query_vector, COSINE) AS v_dist,
                       summary
                FROM helpdesk_tickets
                WHERE VECTOR_DISTANCE(ticket_vector, p_query_vector, COSINE) <= p_max_distance
                ORDER BY v_dist ASC
                FETCH FIRST p_limit ROWS ONLY
            )
            SELECT 
                vc.ticket_id,
                (1 - vc.v_dist) * 100 AS similarity_score,
                vc.summary,
                gt.comp_name,
                gt.eng_name
            FROM vector_candidates vc
            CROSS JOIN GRAPH_TABLE(support_knowledge_graph
                MATCH (t IS Ticket) -[is_aff IS AFFECTS]-> (c IS Component),
                      (t) -[is_asg IS ASSIGNED_TO]-> (e IS Engineer)
                WHERE t.ticket_id = vc.ticket_id
                COLUMNS (
                    c.comp_name AS comp_name,
                    e.name AS eng_name
                )
            ) gt
            ORDER BY vc.v_dist ASC
        ) LOOP
            PIPE ROW(r);
        END LOOP;
        RETURN;
    EXCEPTION
        WHEN OTHERS THEN
            -- Production logging architecture hook goes here
            RAISE_APPLICATION_ERROR(-20001, 'Execution failed: ' || SQLERRM);
    END get_graph_rag_context;

END support_analytics_pkg;
/
```

### execution 

```
-- Simulating a runtime execution with a dummy 384-dimensional query vector
SELECT ticket_id, 
       ROUND(similarity_score, 2) AS match_pct, 
       summary, 
       component_name, 
       engineer_name
FROM TABLE(
    support_analytics_pkg.get_graph_rag_context(
        p_query_vector => VECTOR_EMBEDDING(doc_model USING 'Database connection timed out during ETL migration'),
        p_max_distance => 0.40,
        p_limit        => 3
    )
);
```
### Hybrid Vector Index
To allow `DBMS_HYBRID_VECTOR` to fuse vector and text scores via RRF, we update the table by creating a unified hybrid index over both the text column and the vector column. [[1](https://blogs.oracle.com/coretec/hybrid-vector-index-the-combination-of-full-text-and-semantic-vector-search)]

sql

```
-- Drop the standalone vector index from step 1
DROP INDEX h_ticket_v_idx;

-- Create a production-grade Hybrid Index for combined text & vector search
CREATE INDEX hybrid_ticket_idx ON helpdesk_tickets(summary) 
INDEXTYPE IS CTXSYS.CONTEXT
PARAMETERS ('VECTOR COLUMN ticket_vector');
```
2. The Production PL/SQL Package (Text Input + RRF + Graph)

This updated package replaces the raw `VECTOR` input with a `VARCHAR2` natural language prompt. It dynamically invokes the embedding model, passes it to the hybrid text engine using RRF scoring, and cross-references the winners with your Property Graph. [[1](https://blogs.oracle.com/coretec/hybrid-vector-index-the-combination-of-full-text-and-semantic-vector-search), [2](https://docs.oracle.com/en/database/oracle/oracle-database/26/vecse/access-third-party-models-vector-generation-leveraging-third-party-rest-apis.html), [3](https://github.com/oracle/skills/blob/main/db/features/dbms-vector.md)]

sql

```
CREATE OR REPLACE PACKAGE support_analytics_pkg AS
    -- Define structured record for production pipeline consumption
    TYPE context_rec IS RECORD (
        ticket_id        INT,
        rrf_score        NUMBER,
        summary          VARCHAR2(4000),
        component_name   VARCHAR2(100),
        engineer_name    VARCHAR2(100)
    );
    TYPE context_tbl IS TABLE OF context_rec;

    -- Production Entry Point: Accepts natural language string directly
    FUNCTION get_hybrid_graph_context(
        p_search_text  IN VARCHAR2,
        p_limit        IN INT DEFAULT 5
    ) RETURN context_tbl PIPELINED;
END support_analytics_pkg;
/

CREATE OR REPLACE PACKAGE BODY support_analytics_pkg AS

    FUNCTION get_hybrid_graph_context(
        p_search_text  IN VARCHAR2,
        p_limit        IN INT DEFAULT 5
    ) RETURN context_tbl PIPELINED IS
        v_query_vector VECTOR(384, FLOAT32);
        v_json_param   VARCHAR2(1000);
    BEGIN
        -- 1. Native Embedding Generation
        -- Uses your loaded database ONNX model or registered REST provider credentials
        v_json_param := '{"model": "doc_model"}';
        v_query_vector := DBMS_VECTOR.GENERATE_TEXT_EMBEDDING(
                             text  => p_search_text,
                             params => v_json_param
                          );

        -- 2. Hybrid Search with Reciprocal Rank Fusion (RRF) & Graph Expansion
        FOR r IN (
            WITH hybrid_candidates AS (
                SELECT ticket_id, 
                       score AS rrf_score,
                       summary
                FROM DBMS_HYBRID_VECTOR.SEARCH(
                    JSON('{
                        "hybrid_index" : "hybrid_ticket_idx",
                        "search": {
                            "text": "' || p_search_text || '",
                            "vector": ' || VECTOR_SERIALIZE(v_query_vector) || '
                        },
                        "scoring": {
                            "algorithm": "RRF"
                        }
                    }')
                )
                FETCH FIRST p_limit ROWS ONLY
            )
            SELECT 
                hc.ticket_id,
                hc.rrf_score,
                hc.summary,
                gt.comp_name,
                gt.eng_name
            FROM hybrid_candidates hc
            CROSS JOIN GRAPH_TABLE(support_knowledge_graph
                MATCH (t IS Ticket) -[is_aff IS AFFECTS]-> (c IS Component),
                      (t) -[is_asg IS ASSIGNED_TO]-> (e IS Engineer)
                WHERE t.ticket_id = hc.ticket_id
                COLUMNS (
                    c.comp_name AS comp_name,
                    e.name AS eng_name
                )
            ) gt
            ORDER BY hc.rrf_score DESC
        ) LOOP
            PIPE ROW(r);
        END LOOP;
        RETURN;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE_APPLICATION_ERROR(-20002, 'Hybrid Graph Execution failed: ' || SQLERRM);
    END get_hybrid_graph_context;

END support_analytics_pkg;
/

```

Architectural Breakdown

-   **`DBMS_VECTOR.GENERATE_TEXT_EMBEDDING`**: Computes text strings into vector coordinates natively inside memory, preventing payload exposure to application middleware boundaries. [[1](https://docs.oracle.com/en/database/oracle/oracle-database/26/vecse/pl-sql-packages-generate-embeddings.html), [2](https://blogs.oracle.com/cloud-infrastructure/oci-database-ai-vector-search-guide)]
-   **`DBMS_HYBRID_VECTOR.SEARCH` with `"RRF"`**: Intersects exact structural matches (like specific logs or text IDs) with loose conceptual matches, resolving keyword vs. vector trade-offs cleanly via standardized mathematical rank merging. [[1](https://blogs.oracle.com/coretec/hybrid-vector-index-the-combination-of-full-text-and-semantic-vector-search), [2](https://github.com/oracle/skills/blob/main/db/features/dbms-vector.md)]
-   **`GRAPH_TABLE` Path Matching**: Resolves highly nested data dependencies (e.g., finding the manager of the engineer handling the affected infrastructure component) without forcing resource-heavy multi-table relational `JOIN` conditions.

1. Unified Compliance Verification Query

Run this unified administrative diagnostic query to ensure that the core security configurations, underlying audit tables, blockchain metadata, and data redaction policies are active.

sql

```
SELECT 'Unified Audit Trail' AS audit_component, 
       enabled_option AS policy_name, 
       success, 
       failure 
FROM audit_unified_enabled_policies
WHERE enabled_option = 'ORA_SECURECONFIG'
UNION ALL
SELECT 'Blockchain Ledger Logging', 
       table_name, 
       row_retention_days || ' days retention', 
       blockchain_table_type
FROM user_blockchain_tables
WHERE table_name = 'BLOCKCHAIN_CAMPAIGN_ATTRIBUTION'
UNION ALL
SELECT 'Data Redaction Policy', 
       policy_name, 
       expression, 
       enable
FROM user_redaction_policies
WHERE object_name = 'HELPDESK_TICKETS' OR policy_name LIKE '%PAN%';
```
<!--stackedit_data:
eyJoaXN0b3J5IjpbMjA5ODgwODE4NSwtMTI2Mzc2NzE0OV19
-->