## Tekton CI/CD and Chaos Testing

### Tekton Pipeline Definition (`tekton-pipeline.yaml`)

```yaml
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: flink-java-pipeline-deploy
  namespace: my-flink-jobs
spec:
  workspaces:
    - name: shared-workspace
  params:
    - name: repo-url
      type: string
      default: 'https://github.com/myorg/flink-pipeline.git'
    - name: image-tag
      type: string
      default: 'quay.io/myorg/flink-java-pipeline:latest'
  tasks:
    - name: fetch-repository
      taskRef:
        name: git-clone
        kind: ClusterTask
      workspaces:
        - name: output
          workspace: shared-workspace
      params:
        - name: url
          value: $(params.repo-url)
        - name: revision
          value: 'main'

    - name: maven-build
      runAfter: [fetch-repository]
      taskRef:
        name: maven
        kind: ClusterTask
      workspaces:
        - name: source
          workspace: shared-workspace
      params:
        - name: GOALS
          value: ['clean', 'package', '-DskipTests']

    - name: build-and-push-image
      runAfter: [maven-build]
      taskRef:
        name: buildah
        kind: ClusterTask
      workspaces:
        - name: source
          workspace: shared-workspace
      params:
        - name: IMAGE
          value: $(params.image-tag)

    - name: deploy-to-openshift
      runAfter: [build-and-push-image]
      workspaces:
        - name: source
          workspace: shared-workspace
      taskSpec:
        workspaces:
          - name: source
        steps:
          - name: run-flink-cli
            image: 'apache/flink:2.2.0-java17'
            script: |
              #!/usr/bin/env bash
              /opt/flink/bin/flink run-application \
                  --target kubernetes-application \
                  -Dkubernetes.cluster-id=flink-java-secure-app \
                  -Dkubernetes.container.image=$(params.image-tag) \
                  -Dkubernetes.namespace=my-flink-jobs \
                  -Dkubernetes.jobmanager.service-account=default \
                  -Djobmanager.memory.process.size=2048m \
                  -Dtaskmanager.memory.process.size=4096m \
                  -Dscheduler-mode=reactive \
                  -Dkubernetes.jobmanager.env.KAFKA_USER=fromSecret:flink-stream-secrets:kafka-user \
                  -Dkubernetes.jobmanager.env.KAFKA_PASS=fromSecret:flink-stream-secrets:kafka-password \
                  -Dkubernetes.jobmanager.env.ORACLE_USER=fromSecret:flink-stream-secrets:oracle-user \
                  -Dkubernetes.jobmanager.env.ORACLE_PASS=fromSecret:flink-stream-secrets:oracle-password \
                  -Dkubernetes.secrets=flink-stream-secrets:/opt/flink/secrets \
                  -c com.myorg.flink.SecureFlinkPipeline \
                  local:///opt/flink/usrlib/my-pipeline.jar
```

### Chaos Testing Script (`flink-chaos-test.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="my-flink-jobs"
CLUSTER_ID="flink-java-secure-app"

echo "=== STARTING FLINK OPENSHIFT CHAOS ENGINEERING SUITE ==="

if ! oc project "$NAMESPACE" >/dev/null 2>&1; then
    echo "ERROR: Cannot access namespace $NAMESPACE."
    exit 1
fi

get_taskmanagers() {
    oc get pods -l flink-app=$CLUSTER_ID,component=taskmanager -o jsonpath='{.items[*].metadata.name}'
}

# --- SCENARIO 1: Simulated TaskManager Process Crash ---
echo "--> SCENARIO 1: Simulating TaskManager failure..."
TM_PODS=($(get_taskmanagers))

if [ ${#TM_PODS[@]} -gt 0 ]; then
    TARGET_TM=${TM_PODS[0]}
    echo "Killing pod: $TARGET_TM"
    oc delete pod "$TARGET_TM" --grace-period=0 --force

    echo "Waiting 30 seconds for self-healing..."
    sleep 30

    NEW_TM_COUNT=$(oc get pods -l flink-app=$CLUSTER_ID,component=taskmanager --no-headers | wc -l)
    echo "Active TaskManager count: $NEW_TM_COUNT"
fi

# --- SCENARIO 2: Database Network Partition ---
echo "--> SCENARIO 2: Injecting Network Policy to isolate Oracle DB..."

cat <<EOF | oc apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: chaos-block-oracle
  namespace: $NAMESPACE
spec:
  podSelector:
    matchLabels:
      flink-app: $CLUSTER_ID
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          flink-app: $CLUSTER_ID
EOF

echo "Network partition applied. Waiting 45 seconds..."
sleep 45

echo "Removing Network Partition block..."
oc delete networkpolicy chaos-block-oracle

# --- SCENARIO 3: Scaling Under Load ---
echo "--> SCENARIO 3: Inducing scaling event..."
oc scale replicaset -l flink-app=$CLUSTER_ID,component=taskmanager --replicas=0
sleep 15
oc scale replicaset -l flink-app=$CLUSTER_ID,component=taskmanager --replicas=2

echo "=== CHAOS TESTING COMPLETED ==="

```

---
