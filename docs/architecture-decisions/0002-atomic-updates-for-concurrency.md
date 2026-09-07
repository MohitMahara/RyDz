# 2. Handle Ride Acceptance Concurrency with Atomic Updates

## Context
Because we blast ride requests to multiple nearby drivers at once, there is a very real chance that two or three drivers tap "Accept" at the exact same fraction of a second. If our backend first checks "is this ride available?" and then in a separate step updates "assign to driver," multiple drivers could pass the check before the state changes. That leads to double-booking a single ride.

## Decision
We handle this race condition directly at the database layer using atomic, conditional updates. We combine the status check and driver assignment into a single, indivisible command (`UPDATE ... WHERE id = ride_id AND status = 'SEARCHING'`). The database's built-in row lock guarantees that only the first query succeeds, while all subsequent requests instantly fail to update any rows. If traffic increases down the line, we can place an in-memory Redis lock (`SETNX`) in front of the database to handle the contention even faster.

## Consequences
* **The Good:** Completely eliminates the risk of double-booking with zero custom, fragile locking logic in our application code. 
* **The Trade-off:** Drivers who tap accept a few milliseconds too late will be rejected. The driver app needs clean, friendly UI handling (e.g., showing "Ride is no longer available" without throwing a jarring application crash).