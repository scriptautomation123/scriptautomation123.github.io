## Setting Up the Connection

Integrate Hindsight's LLM wrapper using a SQLAlchemy-style connection URL compatible with the `oracledb` driver:

```python
from hindsight.agent import HindsightAgent
import os

# Connect to Oracle Database 26ai
db_url = "oracle+oracledb://USER:PASSWORD@HOST:PORT/SERVICE_NAME"

agent = HindsightAgent(
    api_key=os.environ["OPENAI_API_KEY"],
    storage_url=db_url,
    bank_id="user_profile_bank",
)
```

Use code with caution.
