## Java DataStream Application

### Step 1: Maven Dependencies (`pom.xml`)

```xml
<dependencies>
    <dependency>
        <groupId>org.apache.flink</groupId>
        <artifactId>flink-streaming-java</artifactId>
        <version>2.2.0</version>
        <scope>provided</scope>
    </dependency>
    <dependency>
        <groupId>org.apache.flink</groupId>
        <artifactId>flink-connector-kafka</artifactId>
        <version>3.4.0-2.2</version>
    </dependency>
    <dependency>
        <groupId>org.apache.flink</groupId>
        <artifactId>flink-connector-jdbc</artifactId>
        <version>3.2.0-2.2</version>
    </dependency>
    <dependency>
        <groupId>com.oracle.database.jdbc</groupId>
        <artifactId>ojdbc11</artifactId>
        <version>23.3.0.23.09</version>
    </dependency>
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
        <version>2.17.2</version>
    </dependency>
</dependencies>

```

### Step 2: POJO Definitions

```java
package com.myorg.flink.model;

import java.io.Serializable;

public class UserBehavior implements Serializable {
    public int user_id;
    public int item_id;
    public String behavior;
    public String ts;

    public UserBehavior() {}
}

```

```java
package com.myorg.flink.model;

import java.io.Serializable;

public class EnrichedBehavior implements Serializable {
    public int user_id;
    public String item_name;
    public String category;
    public String behavior;

    public EnrichedBehavior() {}

    public EnrichedBehavior(int user_id, String item_name, String category, String behavior) {
        this.user_id = user_id;
        this.item_name = item_name;
        this.category = category;
        this.behavior = behavior;
    }
}

```

---
