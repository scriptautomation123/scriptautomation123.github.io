## Savepoints and Upgrades

### 1. Gracefully Stop Job with a Savepoint

```bash
# List running jobs
./bin/flink list \
    --target kubernetes-application \
    --namespace my-flink-jobs \
    -Dkubernetes.cluster-id=flink-java-secure-app

# Stop job and create savepoint
./bin/flink stop \
    --target kubernetes-application \
    --namespace my-flink-jobs \
    -Dkubernetes.cluster-id=flink-java-secure-app \
    --savepointPath s3://my-openshift-storage-bucket/flink/savepoints/ \
    <YOUR_FLINK_JOB_ID>

```

### 2. Rebuild Container Image

```bash
podman build -t quay.io/myorg/flink-java-pipeline:2.2.1 .
podman push quay.io/myorg/flink-java-pipeline:2.2.1

```

### 3. Resume from Savepoint

```bash
./bin/flink run-application \
    --target kubernetes-application \
    -Dkubernetes.cluster-id=flink-java-secure-app \
    -Dkubernetes.container.image=quay.io/myorg/flink-java-pipeline:2.2.1 \
    -Dkubernetes.namespace=my-flink-jobs \
    -Dkubernetes.jobmanager.service-account=default \
    -Djobmanager.memory.process.size=2048m \
    -Dtaskmanager.memory.process.size=4096m \
    -s s3://my-openshift-storage-bucket/flink/savepoints/savepoint-a1b2c3-456def789ghi \
    -c com.myorg.flink.SecureFlinkPipeline \
    local:///opt/flink/usrlib/my-pipeline.jar

```

---
