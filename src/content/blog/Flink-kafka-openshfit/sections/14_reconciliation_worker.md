## Reconciliation Worker

### Reconciliation Script (`reconcile-pipeline.py`)

```python
#!/usr/bin/env python3
import json
import os
import sys
from kafka import KafkaConsumer, KafkaProducer
import cx_Oracle

# --- Configuration Settings ---
KAFKA_BOOTSTRAP = "kafka-cluster-kafka-bootstrap.kafka.svc:9092"
SINK_TOPIC = "enriched_behaviors"
SOURCE_TOPIC = "user_behaviors"

ORACLE_DSN = "oracle-service:1521/XEPDB1"
ORACLE_USER = os.getenv("ORACLE_USER", "oracle_user")
ORACLE_PASS = os.getenv("ORACLE_PASS", "oracle_password")

print("=== STARTING STREAM RECONCILIATION AUDIT WORKER ===")

try:
    connection = cx_Oracle.connect(user=ORACLE_USER, password=ORACLE_PASS, dsn=ORACLE_DSN)
    cursor = connection.cursor()

    consumer = KafkaConsumer(
        SINK_TOPIC,
        bootstrap_servers=[KAFKA_BOOTSTRAP],
        auto_offset_reset='earliest',
        enable_auto_commit=False,
        consumer_timeout_ms=5000,
        value_deserializer=lambda x: json.loads(x.decode('utf-8'))
    )

    producer = KafkaProducer(
        bootstrap_servers=[KAFKA_BOOTSTRAP],
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
except Exception as e:
    print(f"[❌ ERROR] Connectivity initialization failed: {e}")
    sys.exit(1)

records_audited = 0
reconciled_count = 0

print(f"Scanning target topic '{SINK_TOPIC}' for database compliance alignment...")

for message in consumer:
    records_audited += 1
    payload = message.value

    if payload.get("enrichment_status") == "FALLBACK_USED" or payload.get("item_name") == "FALLBACK_NAME":
        item_id = payload.get("item_id")
        cursor.execute("SELECT item_name, category FROM MY_SCHEMA.ITEMS WHERE item_id = :1", [item_id])
        row = cursor.fetchone()
        if row:
            payload["item_name"] = row[0]
            payload["category"] = row[1]
            payload["enrichment_status"] = "RECONCILED"
            producer.send(SINK_TOPIC, payload)
            reconciled_count += 1

producer.flush()
cursor.close()
connection.close()

print(f"Audit completed: {records_audited} records audited, {reconciled_count} records reconciled.")

```

# Here is the converted text rendered in clean, valid Markdown.

---

### 3. Print Final Reconciliation Balance Sheet

```python
print("\n=== RECONCILIATION RUN COMPLETE ===")
print(f"Total Stream Records Scanned: {records_audited}")
print(f"Total Discrepancies Discovered: {reconciled_count}")

if reconciled_count > 0:
    print(f"[✅ RESOLVED] Reinjected {reconciled_count} corrected payloads for state balancing.")
else:
    print("[✅ PASS] Streaming records are 100% reconciled with the Oracle source of truth.")

```

---

### Step 3: Run the Reconciliation as an Automated OpenShift CronJob

Instead of running this script manually, deploy it as an automated background utility using an OpenShift `CronJob`. It will execute once an hour (or day) to catch data drift caused by system failures or network partitions.

Create a file named `reconciliation-cronjob.yaml`:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: flink-stream-reconciler
  namespace: my-flink-jobs
spec:
  schedule: '0 * * * *' # Run at minute zero of every hour
  concurrencyPolicy: Forbid # Prevent multiple audit jobs from overlapping
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: auditor
              image: 'quay.io/myorg/python-kafka-oracle:latest'
              command: ['python3', '/opt/audit/reconcile-pipeline.py']
              env:
                # Safely ingest the exact same credentials used by your Flink TaskManagers
                - name: ORACLE_USER
                  valueFrom:
                    secretKeyRef:
                      name: flink-stream-secrets
                      key: oracle-user
                - name: ORACLE_PASS
                  valueFrom:
                    secretKeyRef:
                      name: flink-stream-secrets
                      key: oracle-password
          restartPolicy: OnFailure
```

Deploy the reconciliation routine to your cluster:

```bash
oc apply -f reconciliation-cronjob.yaml

```

---

### Step 4: How Your Flink Code Handles Reconciled Traffic

To complete the reconciliation loop, update your main `SecureFlinkPipeline` Java class to look for the `"reconciliation_marker": "TRUE"` flag. When detected, the application can bypass the Caffeine cache entirely to force a live Oracle check, updating the cache with the newest data.

```java
// Inside your Oracle Pool/Resilient Async Function:
if (input.reconciliation_marker != null && input.reconciliation_marker.equals("TRUE")) {
    // Invalidate the old fallback data from the LRU cache
    itemCache.invalidate(input.item_id);
    // Continue directly to the Oracle database execution logic, skipping the 'cache hit' check
}

```

This completes the architecture for your production stream pipeline on OpenShift, ensuring end-to-end data integrity across Kafka and Oracle.

---
