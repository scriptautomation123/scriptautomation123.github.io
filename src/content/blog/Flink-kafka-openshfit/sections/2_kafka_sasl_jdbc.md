## Kafka SASL and Oracle JDBC

### 1. Kafka Table with SASL Configuration

```sql
CREATE TABLE kafka_source (
    user_id INT,
    item_id INT,
    behavior STRING,
    ts TIMESTAMP(3),
    proc_time AS PROCTIME()
) WITH (
    'connector' = 'kafka',
    'topic' = 'user_behaviors',
    'properties.bootstrap.servers' = 'kafka-cluster-kafka-bootstrap:9092',
    'properties.group.id' = 'flink-sql-consumer',
    'scan.startup.mode' = 'latest-offset',
    'format' = 'json',

    -- SASL Authentication
    'properties.security.protocol' = 'SASL_SSL',
    'properties.sasl.mechanism' = 'SCRAM-SHA-256',
    'properties.sasl.jaas.config' = 'org.apache.kafka.common.security.scram.ScramLoginModule required username="my_kafka_user" password="my_kafka_password";'
);

```

### 2. Oracle JDBC Reference Table

```sql
CREATE TABLE jdbc_lookup (
    item_id INT,
    item_name STRING,
    category STRING
) WITH (
    'connector' = 'jdbc',
    'url' = 'jdbc:oracle:thin:@//oracle-service:1521/XEPDB1',
    'table-name' = 'MY_SCHEMA.ITEMS',
    'username' = 'oracle_user',
    'password' = 'oracle_password',
    'lookup.cache.max-rows' = '5000',
    'lookup.cache.ttl' = '10min'
);

```

---
