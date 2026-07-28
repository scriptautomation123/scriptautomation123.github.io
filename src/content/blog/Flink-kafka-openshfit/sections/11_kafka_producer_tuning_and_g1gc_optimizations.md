## Kafka Producer Tuning and G1GC Optimizations

### Java Producer Properties

```java
kafkaProps.setProperty("acks", "all");
kafkaProps.setProperty("retries", String.valueOf(Integer.MAX_VALUE));
kafkaProps.setProperty("delivery.timeout.ms", "120000");
kafkaProps.setProperty("linger.ms", "20");
kafkaProps.setProperty("batch.size", "65536");

```

### Final Native OpenShift Deployment Script

```bash
./bin/flink run-application \
    --target kubernetes-application \
    -Dkubernetes.cluster-id=flink-java-secure-app \
    -Dkubernetes.container.image=quay.io/myorg/flink-java-pipeline:2.2.1 \
    -Dkubernetes.namespace=my-flink-jobs \
    -Dkubernetes.jobmanager.service-account=default \
    \
    -- Memory Allocation
    -Djobmanager.memory.process.size=2048m \
    -Dtaskmanager.memory.process.size=4096m \
    \
    -- G1GC Tuning Parameters
    -Dkubernetes.jobmanager.jvm-options="-XX:+UseG1GC -XX:MaxGCPauseMillis=100 -XX:InitiatingHeapOccupancyPercent=45" \
    -Dkubernetes.taskmanager.jvm-options="-XX:+UseG1GC -XX:MaxGCPauseMillis=50 -XX:InitiatingHeapOccupancyPercent=42 -XX:ParallelGCThreads=4" \
    -Dkubernetes.taskmanager.cpu.amount=2.0 \
    -Dkubernetes.taskmanager.memory.limit-factor=1.0 \
    \
    -- Reactive Auto-Scaling
    -Dscheduler-mode=reactive \
    -Dadaptive-scheduler.resource-stabilization.timeout=10s \
    -Dadaptive-scheduler.min-parallelism-increase=1 \
    \
    -- Health Probes
    -Dkubernetes.rest-service.exposed.type=ClusterIP \
    -Dkubernetes.jobmanager.readiness-probe.http-get.path=/config \
    -Dkubernetes.jobmanager.readiness-probe.http-get.port=8081 \
    -Dkubernetes.taskmanager.readiness-probe.tcp-socket.port=6122 \
    -Dkubernetes.taskmanager.liveness-probe.tcp-socket.port=6122 \
    \
    -- Prometheus Observability
    -Dmetrics.reporter.prom.class=org.apache.flink.metrics.prometheus.PrometheusReporter \
    -Dmetrics.reporter.prom.port=9249 \
    \
    -- Secret Injections
    -Dkubernetes.jobmanager.env.KAFKA_USER=fromSecret:flink-stream-secrets:kafka-user \
    -Dkubernetes.jobmanager.env.KAFKA_PASS=fromSecret:flink-stream-secrets:kafka-password \
    -Dkubernetes.jobmanager.env.ORACLE_USER=fromSecret:flink-stream-secrets:oracle-user \
    -Dkubernetes.jobmanager.env.ORACLE_PASS=fromSecret:flink-stream-secrets:oracle-password \
    -Dkubernetes.taskmanager.env.KAFKA_USER=fromSecret:flink-stream-secrets:kafka-user \
    -Dkubernetes.taskmanager.env.KAFKA_PASS=fromSecret:flink-stream-secrets:kafka-password \
    -Dkubernetes.taskmanager.env.ORACLE_USER=fromSecret:flink-stream-secrets:oracle-user \
    -Dkubernetes.taskmanager.env.ORACLE_PASS=fromSecret:flink-stream-secrets:oracle-password \
    -Dkubernetes.secrets=flink-stream-secrets:/opt/flink/secrets \
    \
    -- Application Entrypoint
    -c com.myorg.flink.SecureFlinkPipeline \
    local:///opt/flink/usrlib/my-pipeline.jar

```

---
