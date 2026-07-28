## DLQ and LRU Cache

### Step 1: Caffeine Cache Dependency

```xml
<dependency>
    <groupId>com.github.ben-manes.caffeine</groupId>
    <artifactId>caffeine</artifactId>
    <version>3.1.8</version>
</dependency>

```

### Step 2: Safe JSON Process Function with DLQ Side Output

```java
package com.myorg.flink.functions;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.myorg.flink.model.UserBehavior;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.ProcessFunction;
import org.apache.flink.util.Collector;
import org.apache.flink.util.OutputTag;

public class SafeJsonProcessFunction extends ProcessFunction<String, UserBehavior> {

    public static final OutputTag<String> DLQ_TAG = new OutputTag<String>("kafka-dlq-stream"){};
    private transient ObjectMapper objectMapper;

    @Override
    public void open(Configuration parameters) throws Exception {
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public void processElement(String value, Context ctx, Collector<UserBehavior> out) throws Exception {
        try {
            UserBehavior behavior = objectMapper.readValue(value, UserBehavior.class);
            out.collect(behavior);
        } catch (Exception e) {
            ctx.output(DLQ_TAG, "Error: " + e.getMessage() + " | Raw Payload: " + value);
        }
    }
}

```

### Step 3: Async Oracle Lookup with Caffeine LRU Cache & Prometheus Metrics

```java
package com.myorg.flink.functions;

import com.github.ben-manes.caffeine.cache.Cache;
import com.github.ben-manes.caffeine.cache.Caffeine;
import com.myorg.flink.model.EnrichedBehavior;
import com.myorg.flink.model.UserBehavior;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.connector.jdbc.JdbcConnectionOptions;
import org.apache.flink.metrics.Counter;
import org.apache.flink.streaming.api.functions.async.ResultFuture;
import org.apache.flink.streaming.api.functions.async.RichAsyncFunction;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Collections;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class OracleCachedAsyncLookupFunction extends RichAsyncFunction<UserBehavior, EnrichedBehavior> {

    private final JdbcConnectionOptions jdbcOptions;
    private transient Connection connection;
    private transient PreparedStatement preparedStatement;
    private transient ExecutorService executorService;
    private transient Cache<Integer, ItemReference> itemCache;

    private transient Counter cacheHitCounter;
    private transient Counter cacheMissCounter;

    public OracleCachedAsyncLookupFunction(JdbcConnectionOptions jdbcOptions) {
        this.jdbcOptions = jdbcOptions;
    }

    private static class ItemReference {
        final String name;
        final String category;
        ItemReference(String name, String category) {
            this.name = name;
            this.category = category;
        }
    }

    @Override
    public void open(Configuration parameters) throws Exception {
        super.open(parameters);
        Class.forName(jdbcOptions.getDriverName());
        this.connection = DriverManager.getConnection(
                jdbcOptions.getDbURL(),
                jdbcOptions.getUsername().orElse(null),
                jdbcOptions.getPassword().orElse(null)
        );

        String query = "SELECT item_name, category FROM MY_SCHEMA.ITEMS WHERE item_id = ?";
        this.preparedStatement = connection.prepareStatement(query);
        this.executorService = Executors.newFixedThreadPool(10);

        this.itemCache = Caffeine.newBuilder()
                .maximumSize(5000)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .recordStats()
                .build();

        this.cacheHitCounter = getRuntimeContext()
                .getMetricGroup()
                .addGroup("database_enrichment")
                .counter("cache_hits");

        this.cacheMissCounter = getRuntimeContext()
                .getMetricGroup()
                .addGroup("database_enrichment")
                .counter("cache_misses");

        getRuntimeContext()
                .getMetricGroup()
                .addGroup("database_enrichment")
                .gauge("cache_size", () -> itemCache.estimatedSize());
    }

    @Override
    public void asyncInvoke(UserBehavior input, ResultFuture<EnrichedBehavior> resultFuture) {
        ItemReference cachedItem = itemCache.getIfPresent(input.item_id);

        if (cachedItem != null) {
            cacheHitCounter.inc();
            EnrichedBehavior cachedOutput = new EnrichedBehavior(
                    input.user_id, cachedItem.name, cachedItem.category, input.behavior
            );
            resultFuture.complete(Collections.singletonList(cachedOutput));
            return;
        }

        cacheMissCounter.inc();

        executorService.submit(() -> {
            try {
                ResultSet resultSet;
                synchronized (preparedStatement) {
                    preparedStatement.setInt(1, input.item_id);
                    resultSet = preparedStatement.executeQuery();
                }

                String itemName = "UNKNOWN";
                String category = "UNKNOWN";

                if (resultSet.next()) {
                    itemName = resultSet.getString("item_name");
                    category = resultSet.getString("category");
                    itemCache.put(input.item_id, new ItemReference(itemName, category));
                }
                resultSet.close();

                EnrichedBehavior output = new EnrichedBehavior(
                        input.user_id, itemName, category, input.behavior
                );
                resultFuture.complete(Collections.singletonList(output));

            } catch (Exception e) {
                resultFuture.completeExceptionally(e);
            }
        });
    }

    @Override
    public void close() throws Exception {
        if (preparedStatement != null) preparedStatement.close();
        if (connection != null) connection.close();
        if (executorService != null) executorService.shutdown();
        super.close();
    }
}

```

---
