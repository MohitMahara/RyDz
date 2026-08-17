# 4. Use Redis Geospatial for Real-Time Driver Tracking

## Context
Drivers continuously ping their GPS coordinates to the server every few seconds. Writing this massive volume of high-frequency telemetry data directly to a disk-based relational database (like PostgreSQL) creates severe I/O bottlenecks and degrades overall system performance. We need a way to track live driver locations and execute radius queries without overwhelming our primary database.

## Decision
We will use Redis (an in-memory datastore) with its native Geospatial commands (`GEOADD`, `GEOSEARCH`) to handle all live driver tracking and serve as our "Cheap Filter" for nearby candidates. Our primary SQL database will be strictly reserved for persistent business data (user profiles, ride history, financial transactions).

## Consequences
* **The Good:** In-memory read/write speeds allow the backend to easily absorb thousands of concurrent location pings per second. It enforces a clean architectural separation between ephemeral state and permanent truth.
* **The Trade-off:** Redis is volatile. If the Redis cache restarts or crashes, we temporarily lose the global map of available drivers. However, because the driver applications ping their location every few seconds, the map will automatically rebuild itself almost instantly, making this an highly acceptable risk.