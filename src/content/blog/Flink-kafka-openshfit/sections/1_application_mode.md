## Application Mode on OpenShift

To submit a Flink 2.2 SQL job in Application Mode on OpenShift without using an operator, leverage Flink's **Native Kubernetes Integration**. Build a custom container image containing Flink dependencies, your SQL script, and a Java runner wrapper.

OpenShift runs containers using arbitrary user IDs (Security Context Constraints), requiring group `0` file permissions.

### Step 1: Download Connectors

Download FLIP-27/FLIP-143 compliant `.jar` files into a local `plugins/` directory:

- **Kafka Connector:** `flink-connector-kafka-*.jar`
- **Kafka Clients:** `kafka-clients-*.jar`
- **JDBC Connector:** `flink-connector-jdbc-*.jar`
- **Database Driver:** `postgresql-*.jar` or `ojdbc*.jar`

### Step 2: Build Image

Create a Dockerfile that packages configuration, connectors, and SQL scripts with root group permissions.

```dockerfile
FROM apache/flink:2.2.0-java17

# Create standard Flink user directory structure
USER root
RUN mkdir -p /opt/flink/usrlib /opt/flink/sql

# Copy required connectors to the user library path
COPY plugins/*.jar /opt/flink/usrlib/

# Copy your production SQL script
COPY pipeline.sql /opt/flink/sql/pipeline.sql

# OpenShift compatibility: Grant group permissions to group 0
RUN chown -R flink:root /opt/flink/usrlib /opt/flink/sql && \
    chmod -R g+rwX /opt/flink/usrlib /opt/flink/sql

USER 185

```

Build and push the image:

```bash
podman build -t quay.io/myorg/flink-sql-pipeline:2.2.0 .
podman push quay.io/myorg/flink-sql-pipeline:2.2.0

```

### Step 3: Write SQL Pipeline (`pipeline.sql`)

```sql
-- 1. Kafka Source
CREATE TABLE kafka_source (
    user_id INT,
    item_id INT,
    behavior STRING,
    ts TIMESTAMP(3),
    proc_time AS PROCTIME() -- Required for temporal lookup joins
) WITH (
    'connector' = 'kafka',
    'topic' = 'user_behaviors',
    'properties.bootstrap.servers' = 'kafka-cluster-kafka-bootstrap:9092',
    'properties.group.id' = 'flink-sql-consumer',
    'scan.startup.mode' = 'latest-offset',
    'format' = 'json'
);

-- 2. JDBC Reference Lookup Table
CREATE TABLE jdbc_lookup (
    item_id INT,
    item_name STRING,
    category STRING
) WITH (
    'connector' = 'jdbc',
    'url' = 'jdbc:postgresql://postgres-service:5432/mydb',
    'table-name' = 'items',
    'username' = 'dbuser',
    'password' = 'dbpassword',
    'lookup.cache.max-rows' = '5000',
    'lookup.cache.ttl' = '10min'
);

-- 3. Kafka Sink
CREATE TABLE kafka_sink (
    user_id INT,
    item_name STRING,
    category STRING,
    behavior STRING
) WITH (
    'connector' = 'kafka',
    'topic' = 'enriched_behaviors',
    'properties.bootstrap.servers' = 'kafka-cluster-kafka-bootstrap:9092',
    'format' = 'json'
);

-- 4. Execution Logic (Enrichment Join)
INSERT INTO kafka_sink
SELECT
    s.user_id,
    l.item_name,
    l.category,
    s.behavior
FROM kafka_source s
LEFT JOIN jdbc_lookup FOR SYSTEM_TIME AS OF s.proc_time AS l
ON s.item_id = l.item_id;

```

### Step 4: Submit Application

Grant permissions to the default ServiceAccount and submit via CLI:

```bash
# Login and set namespace
oc login --token=XXXX --server=https://openshift.example.com
oc project my-flink-jobs

# Grant role bindings for pod management
oc create rolebinding flink-pod-manager \
  --clusterrole=edit \
  --serviceaccount=my-flink-jobs:default \
  --namespace=my-flink-jobs

# Submit native application
./bin/flink run-application \
    --target kubernetes-application \
    -Dkubernetes.cluster-id=flink-sql-kafka-jdbc-app \
    -Dkubernetes.container.image=quay.io/myorg/flink-sql-pipeline:2.2.0 \
    -Dkubernetes.namespace=my-flink-jobs \
    -Dkubernetes.jobmanager.service-account=default \
    -Djobmanager.memory.process.size=2048m \
    -Dtaskmanager.memory.process.size=4096m \
    -Dtaskmanager.numberOfTaskSlots=2 \
    -Dkubernetes.rest-service.exposed.type=ClusterIP \
    -c org.apache.flink.table.client.SqlClient \
    local:///opt/flink/opt/flink-sql-client-2.2.0.jar \
    -i /opt/flink/sql/pipeline.sql

```

---
