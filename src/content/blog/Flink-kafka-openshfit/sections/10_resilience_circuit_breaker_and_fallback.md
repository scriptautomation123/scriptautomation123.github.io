## Resilience, Circuit Breaker, and Fallback

### Resilient Async Lookup Function

```java
package com.myorg.flink.functions;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.ben-manes.caffeine.cache.Cache;
import com.github.ben-manes.caffeine.cache.Caffeine;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import com.myorg.flink.model.EnrichedBehavior;
import com.myorg.flink.model.UserBehavior;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.connector.jdbc.JdbcConnectionOptions;
import org.apache.flink.metrics.Counter;
import org.apache.flink.streaming.api.functions.async.ResultFuture;
import org.apache.flink.streaming.api.functions.async.RichAsyncFunction;

import java.io.File;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Collections;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class OracleResilientAsyncLookupFunction extends RichAsyncFunction<UserBehavior, EnrichedBehavior> {

    private final JdbcConnectionOptions jdbcOptions;
    private transient HikariDataSource dataSource;
    private transient ExecutorService executorService;
    private transient Cache<Integer, ItemReference> itemCache;
    private transient ObjectMapper objectMapper;

    private transient Counter dbTimeoutCounter;
    private transient Counter fallbackHitCounter;

    public OracleResilientAsyncLookupFunction(JdbcConnectionOptions jdbcOptions) {
        this.jdbcOptions = jdbcOptions;
    }

    private static class ItemReference {
        final String name;
        final String category;
        ItemReference(String name, String category) { this.name = name; this.category = category; }
    }

    @Override
    public void open(Configuration parameters) throws Exception {
        super.open(parameters);
        this.objectMapper = new ObjectMapper();

        HikariConfig config = new HikariConfig();
        config.setDriverClassName(jdbcOptions.getDriverName());
        config.setJdbcUrl(jdbcOptions.getDbURL());
        config.setUsername(jdbcOptions.getUsername().orElse(null));
        config.setPassword(jdbcOptions.getPassword().orElse(null));
        config.setMaximumPoolSize(5);
        config.setConnectionTimeout(3000);

        this.dataSource = new HikariDataSource(config);
        this.executorService = Executors.newFixedThreadPool(5);
        this.itemCache = Caffeine.newBuilder().maximumSize(5000).build();

        this.dbTimeoutCounter = getRuntimeContext().getMetricGroup().addGroup("database_enrichment").counter("db_timeouts");
        this.fallbackHitCounter = getRuntimeContext().getMetricGroup().addGroup("database_enrichment").counter("fallback_hits");
    }

    @Override
    public void asyncInvoke(UserBehavior input, ResultFuture<EnrichedBehavior> resultFuture) {
        ItemReference cachedItem = itemCache.getIfPresent(input.item_id);
        if (cachedItem != null) {
            resultFuture.complete(Collections.singletonList(
                new EnrichedBehavior(input.user_id, cachedItem.name, cachedItem.category, input.behavior)
            ));
            return;
        }

        executorService.submit(() -> {
            String query = "SELECT item_name, category FROM MY_SCHEMA.ITEMS WHERE item_id = ?";

            try (Connection connection = dataSource.getConnection();
                 PreparedStatement preparedStatement = connection.prepareStatement(query)) {

                preparedStatement.setInt(1, input.item_id);
                try (ResultSet resultSet = preparedStatement.executeQuery()) {
                    String itemName = "UNKNOWN";
                    String category = "UNKNOWN";

                    if (resultSet.next()) {
                        itemName = resultSet.getString("item_name");
                        category = resultSet.getString("category");
                        itemCache.put(input.item_id, new ItemReference(itemName, category));
                    }
                    resultFuture.complete(Collections.singletonList(
                        new EnrichedBehavior(input.user_id, itemName, category, input.behavior)
                    ));
                }
            } catch (Exception e) {
                dbTimeoutCounter.inc();
                fallbackHitCounter.inc();

                try {
                    File fallbackFile = new File("/opt/flink/sql/fallback_items.json");
                    String itemName = "FALLBACK_NAME";
                    String category = "FALLBACK_CAT";

                    if (fallbackFile.exists()) {
                        JsonNode root = objectMapper.readTree(fallbackFile);
                        JsonNode match = root.get(String.valueOf(input.item_id));
                        if (match != null) {
                            itemName = match.get("item_name").asText();
                            category = match.get("category").asText();
                        }
                    }

                    resultFuture.complete(Collections.singletonList(
                        new EnrichedBehavior(input.user_id, itemName, category, input.behavior)
                    ));
                } catch (Exception fallbackException) {
                    resultFuture.completeExceptionally(fallbackException);
                }
            }
        });
    }

    @Override
    public void close() throws Exception {
        if (dataSource != null) dataSource.close();
        if (executorService != null) executorService.shutdown();
        super.close();
    }
}

```

### Local Fallback Mapping (`fallback_items.json`)

```json
{
  "101": { "item_name": "Premium Gadget", "category": "Electronics" },
  "102": { "item_name": "Basic Tool", "category": "Hardware" }
}
```

### Grafana Dashboard Panel Snippet

```json
{
  "panels": [
    {
      "title": "Flink Cache Performance (Hits vs Misses)",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
      "targets": [
        {
          "expr": "rate(flink_taskmanager_job_task_operator_database_enrichment_cache_hits_total[1m])",
          "legendFormat": "Cache Hits"
        },
        {
          "expr": "rate(flink_taskmanager_job_task_operator_database_enrichment_cache_misses_total[1m])",
          "legendFormat": "Cache Misses"
        }
      ]
    },
    {
      "title": "Oracle Connection Health & Fallbacks",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 0 },
      "targets": [
        {
          "expr": "increase(flink_taskmanager_job_task_operator_database_enrichment_db_timeouts_total[5m])",
          "legendFormat": "Database Timeouts"
        },
        {
          "expr": "increase(flink_taskmanager_job_task_operator_database_enrichment_fallback_hits_total[5m])",
          "legendFormat": "Fallback File Queries"
        }
      ]
    },
    {
      "title": "Kafka Consumer Lag & Target Pod Scale",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 24, "x": 0, "y": 8 },
      "targets": [
        {
          "expr": "sum(kafka_consumergroup_lag{group=\"flink-java-consumer\"})",
          "legendFormat": "Total Kafka Message Lag"
        },
        {
          "expr": "kube_replicaset_status_replicas{replicaset=~\"flink-java-secure-app-taskmanager.*\"}",
          "legendFormat": "Active TaskManager Pods"
        }
      ]
    }
  ]
}
```

---
