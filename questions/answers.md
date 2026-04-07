# Trust Signals Pipeline — Assessment Answers

## Question 1: False Positives
**Scenario:** A legitimate user triggered high risk due to 3 distinct IPs in 24 hours, 2 screen resolutions, and 2 timezones.

**Answer:** 
The scenario highlights common user behaviors like travel, VPN usage, or switching between home and office networks. To mitigate false positives, the risk scoring logic needs refinement. Instead of raw counts, we should implement **time-gap weighting**. For example, IPs seen separated by 8+ hours (typical commute or travel time) should contribute significantly less to the `ip_factor` than IPs seen simultaneously. Additionally, the **timezone change rate** should be used instead of a absolute count; a single sudden jump is more suspicious than a sequential progression.

Crucially, implementing a **device continuity bonus** is vital. If the device fingerprint remains identical across IP address changes, the weight of the `ip_factor` should be dynamically reduced. This acknowledges the reality of mobile hotspots and dynamic IP allocation. To further improve accuracy, we should collect and baseline **ISP/ASN data** to distinguish residential networks from known VPN/datacenter exit nodes. Historical baseline data per account would allow the system to "learn" that a specific user regularly fluctuates between two office locations, treating it as expected behavior rather than an anomaly.

## Question 2: Adversarial Evasion
**Scenario:** An attacker knows the formula and attempts to bypass it (e.g., 5 people sharing one account).

**Answer:**
Attackers aware of the scoring formula will employ several techniques to evade detection. **Technique 1: Session Time-Slicing**: By ensuring users never access the account simultaneously, they keep the `session_velocity_factor` low. To counter this, we must track **concurrent session overlap** and cumulative session duration, rather than simple counts per hour. **Technique 2: Shared VPN/Proxy**: Attackers can use a single VPN exit node or residential proxy to keep `distinct_ip_prefixes` at 1. In this case, the **device fingerprint variety** becomes the primary signal, as it's harder to synchronize hardware fingerprints across five different users without specialized spoofing tools.

**Technique 3: Fingerprint Spoofing**: Advanced attackers may rotate user-agent strings and canvas fingerprints. The counter-measure is to move beyond structural signals toward **behavioral biometrics**. Tracking typing cadence, scroll patterns, and mouse movement trajectories provides signals that are significantly harder to fake than HTTP headers. Ultimately, static heuristics like the current formula have fundamental limits against adaptive adversaries. Scaling this system would require **ML-driven anomaly detection** that builds individual behavioral baselines, flagging deviations from established user patterns rather than relying on global structural thresholds that attackers can easily model and stay beneath.

## Question 3: Scaling to 10,000 events/second
**Scenario:** How to scale the system to handle 10k events/second.

**Answer:**
Scaling to this volume requires a complete architectural shift from in-memory processing to a distributed, horizontally scalable system. **Change 1: Distributed State Management**: Replace the local `Map` store with a **Redis Cluster**. To efficiently handle distinct counts for thousands of users, use **HyperLogLog** for cardinality estimation (low memory footprint) or **Sorted Sets** for sliding window velocity tracking. This allows multiple API instances to share global state and maintain consistency.

**Change 2: Stream Processing Pipeline**: Ingest should be decoupled from logic using a **Write-Ahead Log (WAL)** like **Apache Kafka** or AWS Kinesis. A stream processor (e.g., Flink or Spark Streaming) can consume events asynchronously, performing aggregations and updating risk scores in the background. This ensures that the ingest endpoint (`POST /v1/events`) has minimal latency, merely acknowledging the write before moving on. **Change 3: Calculated Risk Caching**: Instead of computing risk on every GET request, the system should **pre-compute and cache** the `RiskResult` whenever a significant update occurs in the aggregation layer. GET requests then become simple cache lookups with O(1) performance. 

New failure modes would include **partition lag** in the Kafka pipeline causing stale risk scores, and **hot-key issues** in Redis for extremely active accounts. Comprehensive monitoring of p99 ingest latency, Kafka consumer lag, and cache hit ratios would be essential for operational stability at this scale.
