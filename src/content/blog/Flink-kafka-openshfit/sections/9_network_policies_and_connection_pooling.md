## Network Policies and Connection Pooling

### Step 1: OpenShift NetworkPolicy (`flink-network-policy.yaml`)

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: flink-inter-pod-restrictions
  namespace: my-flink-jobs
spec:
  podSelector:
    matchLabels:
      flink-app: flink-java-secure-app
  policyTypes:
    - Ingress
  ingress:
    # Internal Flink RPC, Task, and Blob Ports
    - from:
        - podSelector:
            matchLabels:
              flink-app: flink-java-secure-app
      ports:
        - protocol: TCP
          port: 6121
        - protocol: TCP
          port: 6122
        - protocol: TCP
          port: 6123
    # OpenShift Prometheus Monitoring
    - from:
        - namespaceSelector:
            matchLabels:
              network.openshift.io/policy-group: monitoring
      ports:
        - protocol: TCP
          port: 9249
    # REST API
    - ports:
        - protocol: TCP
          port: 8081
```

### Step 2: HikariCP Dependency

```xml
<dependency>
    <groupId>com.zaxxer</groupId>
    <artifactId>HikariCP</artifactId>
    <version>5.1.0</version>
</dependency>

```

### Step 3: HikariCP Connection Pooling in Async Function

```java
package com.myorg.flink.functions;

import com.github.ben-manes.caffeine.cache.Cache;
import com.github.ben-manes.caffeine.cache.Caffeine;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import com.myorg.flink.model.EnrichedBehavior;
import com.myorg.flink.model.UserBehavior;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.connector.jdbc.JdbcConnectionOptions;
import org.apache.flink.streaming.api.functions.async.ResultFuture;
import org.apache.flink.streaming.api.functions.async.RichAsyncFunction;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Collections;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class OraclePoolAsyncLookupFunction extends RichAsyncFunction<UserBehavior, EnrichedBehavior> {

    private final JdbcConnectionOptions jdbcOptions;
    private transient HikariDataSource dataSource;
    private transient ExecutorService executorService;
    private transient Cache<Integer, ItemReference> itemCache;

    public OraclePoolAsyncLookupFunction(JdbcConnectionOptions jdbcOptions) {
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

        HikariConfig config = new HikariConfig();
        config.setDriverClassName(jdbcOptions.getDriverName());
        config.setJdbcUrl(jdbcOptions.getDbURL());
        config.setUsername(jdbcOptions.getUsername().orElse(null));
        config.setPassword(jdbcOptions.getPassword().orElse(null));
        config.setMaximumPoolSize(5);
        config.setMinimumIdle(1);
        config.setIdleTimeout(30000);
        config.setConnectionTimeout(5000);

        this.dataSource = new HikariDataSource(config);
        this.executorService = Executors.newFixedThreadPool(5);
        this.itemCache = Caffeine.newBuilder().maximumSize(5000).build();
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
                resultFuture.completeExceptionally(e);
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

---
