## Metrics, Checkpointing, and Health Probes

### Pipeline Programmatic Configuration

Add checkpointing configuration to your Java main method:

```java
// Checkpointing Settings
env.enableCheckpointing(300000); // Trigger every 5 minutes
env.getCheckpointConfig().setCheckpointingMode(org.apache.flink.streaming.api.CheckpointingMode.EXACTLY_ONCE);
env.getCheckpointConfig().setMinPauseBetweenCheckpoints(60000);
env.getCheckpointConfig().setCheckpointTimeout(600000);
env.getCheckpointConfig().setMaxConcurrentCheckpoints(1);
env.getCheckpointConfig().setExternalizedCheckpointCleanup(
        org.apache.flink.streaming.api.environment.CheckpointConfig.ExternalizedCheckpointCleanup.RETAIN_ON_CANCELLATION
);

```

### CLI Options for Storage, Prometheus, and Health Probes

```bash
    # State Storage Backend
    -Dstate.backend=hashmap \
    -Dstate.checkpoints.dir=s3://my-openshift-storage-bucket/flink/checkpoints/ \
    -Dstate.savepoints.dir=s3://my-openshift-storage-bucket/flink/savepoints/ \

    # Prometheus Metrics Port
    -Dmetrics.reporter.prom.class=org.apache.flink.metrics.prometheus.PrometheusReporter \
    -Dmetrics.reporter.prom.port=9249 \

    # JobManager Health Probes
    -Dkubernetes.jobmanager.readiness-probe.http-get.path=/config \
    -Dkubernetes.jobmanager.readiness-probe.http-get.port=8081 \
    -Dkubernetes.jobmanager.readiness-probe.initial-delay-seconds=30 \
    -Dkubernetes.jobmanager.readiness-probe.period-seconds=10 \
    -Dkubernetes.jobmanager.readiness-probe.timeout-seconds=5 \
    -Dkubernetes.jobmanager.readiness-probe.failure-threshold=3 \
    -Dkubernetes.jobmanager.liveness-probe.http-get.path=/config \
    -Dkubernetes.jobmanager.liveness-probe.http-get.port=8081 \
    -Dkubernetes.jobmanager.liveness-probe.initial-delay-seconds=45 \
    -Dkubernetes.jobmanager.liveness-probe.period-seconds=20 \
    -Dkubernetes.jobmanager.liveness-probe.timeout-seconds=5 \
    -Dkubernetes.jobmanager.liveness-probe.failure-threshold=4 \

    # TaskManager Health Probes
    -Dkubernetes.taskmanager.readiness-probe.tcp-socket.port=6122 \
    -Dkubernetes.taskmanager.readiness-probe.initial-delay-seconds=20 \
    -Dkubernetes.taskmanager.readiness-probe.period-seconds=10 \
    -Dkubernetes.taskmanager.readiness-probe.timeout-seconds=3 \
    -Dkubernetes.taskmanager.readiness-probe.failure-threshold=3 \
    -Dkubernetes.taskmanager.liveness-probe.tcp-socket.port=6122 \
    -Dkubernetes.taskmanager.liveness-probe.initial-delay-seconds=30 \
    -Dkubernetes.taskmanager.liveness-probe.period-seconds=20 \
    -Dkubernetes.taskmanager.liveness-probe.timeout-seconds=3 \
    -Dkubernetes.taskmanager.liveness-probe.failure-threshold=3 \

```

---
