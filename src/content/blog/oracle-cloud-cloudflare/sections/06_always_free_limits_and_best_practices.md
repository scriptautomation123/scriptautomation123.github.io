## Always Free Limits and Best Practices

### Resource Caps

| Resource                    | Free Tier Limit                           |
| --------------------------- | ----------------------------------------- |
| ARM Ampere A1 compute       | Up to 2 OCPUs and 12 GB RAM total         |
| AMD Micro instances         | Up to 2 instances (1 OCPU, 1 GB RAM each) |
| Block volume                | 200 GB total                              |
| Object Storage              | 20 GB combined                            |
| Object Storage API requests | 50,000 per month                          |
| Autonomous Databases        | 2 instances (1 OCPU, 20 GB each)          |
| NoSQL tables                | 3 tables, 25 GB each                      |
| VCNs                        | 2                                         |
| Email Delivery              | 3,000 emails per month                    |

### Pay-As-You-Go Upgrade Recommendation

Upgrading to a Pay-As-You-Go (PAYG) account does not cost anything as long as you
stay within Always Free limits. Oracle may place a temporary authorization hold
on your payment method for verification. The main benefit is that PAYG accounts
are less likely to be reclaimed for low utilization.

### Important OCIDs to Keep Handy

| Identifier           | Why It Matters                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| **Tenancy OCID**     | Root identifier for the entire account; needed for billing, support, and root-level budgets.          |
| **Compartment OCID** | Use a dedicated compartment (for example, `Free-Tier-Resources`) to isolate and audit free resources. |
| **User OCID**        | Required for OCI CLI, API, and infrastructure-as-code authentication.                                 |
