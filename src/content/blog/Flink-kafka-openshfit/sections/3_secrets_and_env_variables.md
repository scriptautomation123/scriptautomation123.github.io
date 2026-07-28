## Secrets and Environment Variables

### Step 1: Create OpenShift Secret

```bash
oc create secret generic flink-stream-secrets \
  --from-literal=kafka-user='my_kafka_user' \
  --from-literal=kafka-password='my_kafka_password' \
  --from-literal=oracle-user='oracle_user' \
  --from-literal=oracle-password='oracle_password' \
  --from-file=kafka.truststore.jks=./kafka.truststore.jks \
  --namespace=my-flink-jobs

```

### Step 2: Parameterized SQL Script

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
    'properties.security.protocol' = 'SASL_SSL',
    'properties.sasl.mechanism' = 'SCRAM-SHA-256',
    'properties.sasl.jaas.config' = 'org.apache.kafka.common.security.scram.ScramLoginModule required username="${env:KAFKA_USER}" password="${env:KAFKA_PASS}";',
    'properties.ssl.truststore.location' = '/opt/flink/secrets/kafka.truststore.jks',
    'properties.ssl.truststore.password' = '${env:KAFKA_PASS}'
);

CREATE TABLE jdbc_lookup (
    item_id INT,
    item_name STRING,
    category STRING
) WITH (
    'connector' = 'jdbc',
    'url' = 'jdbc:oracle:thin:@//oracle-service:1521/XEPDB1',
    'table-name' = 'MY_SCHEMA.ITEMS',
    'username' = '${env:ORACLE_USER}',
    'password' = '${env:ORACLE_PASS}',
    'lookup.cache.max-rows' = '5000',
    'lookup.cache.ttl' = '10min'
);

```

### Step 3: Inject Secrets in CLI

```bash
./bin/flink run-application \
    --target kubernetes-application \
    -Dkubernetes.cluster-id=flink-secure-pipeline \
    -Dkubernetes.container.image=quay.io/myorg/flink-sql-pipeline:2.2.0 \
    -Dkubernetes.namespace=my-flink-jobs \
    -Dkubernetes.jobmanager.service-account=default \
    -Djobmanager.memory.process.size=2048m \
    -Dtaskmanager.memory.process.size=4096m \
    -Dtaskmanager.numberOfTaskSlots=2 \
    -Dkubernetes.jobmanager.env.KAFKA_USER=fromSecret:flink-stream-secrets:kafka-user \
    -Dkubernetes.jobmanager.env.KAFKA_PASS=fromSecret:flink-stream-secrets:kafka-password \
    -Dkubernetes.jobmanager.env.ORACLE_USER=fromSecret:flink-stream-secrets:oracle-user \
    -Dkubernetes.jobmanager.env.ORACLE_PASS=fromSecret:flink-stream-secrets:oracle-password \
    -Dkubernetes.taskmanager.env.KAFKA_USER=fromSecret:flink-stream-secrets:kafka-user \
    -Dkubernetes.taskmanager.env.KAFKA_PASS=fromSecret:flink-stream-secrets:kafka-password \
    -Dkubernetes.taskmanager.env.ORACLE_USER=fromSecret:flink-stream-secrets:oracle-user \
    -Dkubernetes.taskmanager.env.ORACLE_PASS=fromSecret:flink-stream-secrets:oracle-password \
    -Dkubernetes.secrets=flink-stream-secrets:/opt/flink/secrets \
    -c org.apache.flink.table.client.SqlClient \
    local:///opt/flink/opt/flink-sql-client-2.2.0.jar \
    -i /opt/flink/sql/pipeline.sql

```

---
