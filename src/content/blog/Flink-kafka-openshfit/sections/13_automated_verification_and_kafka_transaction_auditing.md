## Automated Verification and Kafka Transaction Auditing

### Validation Script (`validate-chaos-results.sh`)

```bash
#!/usr/bin/env bash
set -eo pipefail

NAMESPACE="my-flink-jobs"
CLUSTER_ID="flink-java-secure-app"

PASS="[✅ PASS]"
FAIL="[❌ FAIL]"

echo "=== STARTING AUTOMATED CHAOS VALIDATION SUITE ==="

get_jm_pod() {
    oc get pods -n "$NAMESPACE" -l flink-app=$CLUSTER_ID,component=jobmanager -o jsonpath='{.items[0].metadata.name}'
}

JM_POD=$(get_jm_pod)
JOB_ID=$(oc exec -n "$NAMESPACE" "$JM_POD" -- curl -s http://localhost:8081/jobs | jq -r '.jobs[0].id')

# 1. Checkpoint Recovery
echo -n "Validating State Recovery: "
JOB_STATUS=$(oc exec -n "$NAMESPACE" "$JM_POD" -- curl -s http://localhost:8081/jobs/"$JOB_ID" | jq -r '.state')

if [ "$JOB_STATUS" == "RUNNING" ]; then
    echo -e "$PASS Pipeline restored to RUNNING state."
else
    echo -e "$FAIL Pipeline state: '$JOB_STATUS'."
    exit 1
fi

# 2. Circuit Breaker Fallback
echo -n "Validating Circuit Breaker Fallbacks: "
METRIC_URL="http://localhost:8081/jobs/$JOB_ID/metrics?get=database_enrichment.db_timeouts,database_enrichment.fallback_hits"
METRICS_JSON=$(oc exec -n "$NAMESPACE" "$JM_POD" -- curl -s "$METRIC_URL")

TIMEOUTS=$(echo "$METRICS_JSON" | jq -r '.[] | select(.id == "database_enrichment.db_timeouts") | .value // 0')
FALLBACKS=$(echo "$METRICS_JSON" | jq -r '.[] | select(.id == "database_enrichment.fallback_hits") | .value // 0')

if [ "${TIMEOUTS:-0}" -gt 0 ] && [ "${FALLBACKS:-0}" -gt 0 ]; then
    echo -e "$PASS Captured $TIMEOUTS timeouts and $FALLBACKS fallbacks."
else
    echo -e "$FAIL Fallback verification failed. Timeouts: $TIMEOUTS, Fallbacks: $FALLBACKS."
    exit 1
fi

# 3. Scaling Validation
echo -n "Validating TaskManager Replicas: "
READY_REPLICAS=$(oc get replicaset -n "$NAMESPACE" -l flink-app=$CLUSTER_ID,component=taskmanager -o jsonpath='{.items[0].status.readyReplicas}')

if [ "$READY_REPLICAS" -gt 0 ]; then
    echo -e "$PASS Active TaskManagers: $READY_REPLICAS."
else
    echo -e "$FAIL TaskManager replicas count invalid."
    exit 1
fi

echo "=== ALL CHAOS VERIFICATIONS PASSED ==="

```

---
