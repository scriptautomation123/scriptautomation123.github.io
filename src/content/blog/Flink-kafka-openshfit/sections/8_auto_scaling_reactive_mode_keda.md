## Auto-Scaling (Reactive Mode & KEDA)

### Step 1: CLI Configuration for Reactive Scheduler

```bash
    # Enable Reactive Mode
    -Dscheduler-mode=reactive \
    -Dadaptive-scheduler.resource-stabilization.timeout=10s \
    -Dadaptive-scheduler.min-parallelism-increase=1 \

    # Resource Allocations
    -Dkubernetes.jobmanager.cpu.amount=1.0 \
    -Dkubernetes.jobmanager.memory.limit-factor=1.0 \
    -Dkubernetes.taskmanager.cpu.amount=2.0 \
    -Dkubernetes.taskmanager.memory.limit-factor=1.0 \

```

### Step 2: OpenShift Horizontal Pod Autoscaler (`flink-hpa.yaml`)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: flink-taskmanager-autoscaler
  namespace: my-flink-jobs
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: ReplicaSet
    name: flink-java-secure-app-taskmanager
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 75
```

### Alternative: KEDA Autoscaler based on Kafka Lag (`keda-scaler.yaml`)

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: flink-kafka-lag-scaler
  namespace: my-flink-jobs
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: ReplicaSet
    name: flink-java-secure-app-taskmanager
  minReplicas: 2
  maxReplicas: 10
  triggers:
    - type: kafka
      metadata:
        bootstrapServers: kafka-cluster-kafka-bootstrap:9092
        consumerGroup: flink-java-consumer
        topic: user_behaviors
        lagThreshold: '5000'
```

---
