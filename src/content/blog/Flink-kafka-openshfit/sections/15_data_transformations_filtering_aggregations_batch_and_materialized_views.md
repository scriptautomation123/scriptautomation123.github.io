## Data Transformations, Filtering, Aggregations, Batch Processing, and Materialized Views

To build a comprehensive data processing architecture using Flink 2.2, your pipeline must be split into two core design patterns:

1. **Real-Time Streaming:** For ingest, filtering, enrichment, and tumbling window aggregations.
2. **Batch/Micro-Batch Processing:** For heavy analytical rollups and populating materialized views.

Flink 2.2 introduces unified APIs that allow you to seamlessly mix these patterns within a single programmatic Java application or a unified Flink SQL script.

---

### Step 1: Real-Time Stream Transformations, Filtering, & Aggregations

For low-latency transformations and real-time aggregations (e.g., counting user behaviors per item over a rolling time window), leverage Flink's Windowing API. This processes unbounded Kafka event streams and merges them with your static Oracle JDBC reference data.

```java
package com.myorg.flink.analytics;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.myorg.flink.model.UserBehavior;
import com.myorg.flink.model.EnrichedAggregation;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.functions.AggregateFunction;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.assigners.TumblingEventTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.api.windowing.windows.TimeWindow;
import org.apache.flink.util.Collector;

import java.time.Duration;
import java.time.Instant;

public class StreamAnalyticsPipeline {

    public static void main(String[] args) throws Exception {
        final StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        ObjectMapper objectMapper = new ObjectMapper();

        // 1. Kafka Source with bounded-out-of-orderness Watermarks (Essential for accurate time windows)
        KafkaSource<String> kafkaSource = KafkaSource.<String>builder() /* properties */ .build();

        DataStream<UserBehavior> stream = env.fromSource(
                kafkaSource,
                WatermarkStrategy.<String>forBoundedOutOfOrderness(Duration.ofSeconds(10))
                        .withTimestampAssigner((event, timestamp) -> Instant.parse(UserBehavior.fromJson(event).ts).toEpochMilli()),
                "KafkaSource"
        ).map(json -> objectMapper.readValue(json, UserBehavior.class));

        // 2. High-Performance Filtering and Transformation
        DataStream<UserBehavior> filteredStream = stream
                .filter(event -> !"click".equals(event.behavior)) // Omit low-value clicks; process only high-value signals (e.g., buys, carts)
                .map(event -> {
                    event.behavior = event.behavior.toUpperCase(); // In-line field level data transformation
                    return event;
                });

        // 3. Windowed Aggregations (Tumbling Event-Time Windows)
        // Group events by item_id and sum counts across distinct 5-minute blocks
        DataStream<ItemCountWindowResult> windowedCounts = filteredStream
                .keyBy(event -> event.item_id)
                .window(TumblingEventTimeWindows.of(Time.minutes(5)))
                .aggregate(new ItemCountAggregator());

        // Next, pass 'windowedCounts' to your Oracle Cached Async Lookup Function built previously
        // to enrich item names before sinking to Kafka or JDBC.
    }

    // High-performance accumulator logic for stream rollups
    public static class ItemCountAggregator implements AggregateFunction<UserBehavior, Long, Long> {
        @Override public Long createAccumulator() { return 0L; }
        @Override public Long add(UserBehavior value, Long accumulator) { return accumulator + 1; }
        @Override public Long getResult(Long accumulator) { return accumulator; }
        @Override public Long merge(Long a, Long b) { return a + b; }
    }
}

```

---

### Step 2: Batch Processing Optimization

If you want to read a massive raw dataset directly out of Oracle or a historical Kafka topic to execute a resource-intensive query (e.g., calculating all-time historical sales ranks), switch Flink's runtime mode from `STREAMING` to `BATCH`.

This forces Flink to optimize execution graphs using sort-merge joins instead of continuous streaming state allocations.

```java
// Force Batch execution layout on your Stream Environment
env.setRuntimeMode(org.apache.flink.api.common.RuntimeExecutionMode.BATCH);

// Configure a non-blocking JDBC Source to scan historical tables entirely in one execution sweep
JdbcInputFormat jdbcInputFormat = JdbcInputFormat.buildJdbcInputFormat()
        .setDrivername("oracle.jdbc.OracleDriver")
        .setDBUrl("jdbc:oracle:thin:@//oracle-host:1521/ORCL")
        .setUsername(oracleUser)
        .setPassword(oraclePassword)
        .setQuery("SELECT item_id, price FROM MY_SCHEMA.HISTORICAL_SALES")
        .setRowTypeInfo(new RowTypeInfo(BasicTypeInfo.INT_TYPE_INFO, BasicTypeInfo.DOUBLE_TYPE_INFO))
        .finish();

DataStream<Row> historicalSales = env.createInput(jdbcInputFormat);
// Execute historical analytics safely without continuous checkpoint overhead...

```

---

### Step 3: Materialized Views via Flink SQL

Instead of manually organizing streams inside complex Java classes, leverage Flink SQL. Flink SQL handles the underlying data transformation, lookup joins, and tumbling windows natively.

Any continuous aggregation query in Flink SQL acts inherently as a live, dynamic **Materialized View** over Kafka and JDBC. Flink recalculates the state dynamically and streams incremental updates (`upsert-kafka` or JDBC upsert) straight into your target data stores.

```sql
-- Use Flink's unified catalog processing
CREATE CATALOG my_oracle_catalog WITH (
  'connector' = 'jdbc',
  'url' = 'jdbc:oracle:thin:@//://apps-cluster.com',
  'username' = '${env:ORACLE_USER}',
  'password' = '${env:ORACLE_PASS}'
);

-- Register our real-time Kafka Source with a row-time attribute for Windowing
CREATE TABLE kafka_realtime_source (
    user_id INT,
    item_id INT,
    behavior STRING,
    ts_string STRING,
    -- Convert string timestamp into a real timestamp event-time tracker for watermarking
    event_time AS TO_TIMESTAMP(ts_string, 'yyyy-MM-dd''T''HH:mm:ss''Z'''),
    WATERMARK FOR event_time AS event_time - INTERVAL '10' SECOND
) WITH (
    'connector' = 'kafka',
    'topic' = 'user_behaviors',
    'properties.bootstrap.servers' = 'kafka-cluster-kafka-bootstrap:9092',
    'format' = 'json'
);

-- Target Destination: Acts as the storage mechanism for our Materialized View
-- We use the 'upsert-kafka' or 'jdbc' connector to continuously overwrite keys as counts scale
CREATE TABLE materialized_view_sink (
    window_start TIMESTAMP(3),
    window_end TIMESTAMP(3),
    item_id INT,
    item_name STRING,
    action_count BIGINT,
    PRIMARY KEY (window_start, item_id) NOT ENFORCED
) WITH (
    'connector' = 'jdbc',
    'url' = 'jdbc:oracle:thin:@//://apps-cluster.com',
    'table-name' = 'MY_SCHEMA.MV_ITEM_ANALYTICS',
    'username' = '${env:ORACLE_USER}',
    'password' = '${env:ORACLE_PASS}'
);

-- EXECUTION PIPELINE (Materialized View Definition)
-- Consumes Kafka, Filters trash data, joins JDBC reference tables, aggregates by 10-minute blocks, and upserts into Oracle
INSERT INTO materialized_view_sink
SELECT
    TUMBLE_START(k.event_time, INTERVAL '10' MINUTE) as window_start,
    TUMBLE_END(k.event_time, INTERVAL '10' MINUTE) as window_end,
    k.item_id,
    o.item_name,
    COUNT(k.user_id) as action_count
FROM kafka_realtime_source k
-- Temporal Join against the Oracle Catalog table for real-time dimension enrichment
LEFT JOIN my_oracle_catalog.MY_SCHEMA.ITEMS FOR SYSTEM_TIME AS OF k.event_time AS o
ON k.item_id = o.item_id
WHERE k.behavior IN ('buy', 'cart') -- Filter out raw click streams immediately
GROUP BY
    TUMBLE(k.event_time, INTERVAL '10' MINUTE),
    k.item_id,
    o.item_name;

```

---

### Step 4: Submitting Compiled Analytical Frameworks

When packaging this SQL infrastructure inside your custom Dockerfile image layers, submit the streaming application using your native OpenShift CLI template. Configure adequate Managed Memory settings (`taskmanager.memory.managed.size`), as Flink SQL uses RocksDB under the hood to store and sort open window states before committing them to your materialized views.

```bash
    -Dtaskmanager.memory.managed.size=1024m \
    -Dstate.backend=rocksdb \
    -Dstate.backend.incremental=true \

```

---
