# 1. Use a Broadcast Matching Strategy for Ride Requests

## Context
When a rider needs a car, the backend has to match them with a nearby driver. If we ping drivers one by one and wait for each to accept or decline, the rider gets stuck staring at a loading screen. If each driver takes 5 to 10 seconds to decide, finding a match could easily take several minutes. That creates a frustrating user experience.

## Decision
Instead of a sequential queue, we are going with a "Broadcast" (or "Fastest Finger") approach. When a ride is requested, the server blasts the offer to every available driver in the immediate area all at once. The first driver to tap accept wins the ride.

## Consequences
* **The Good:** Riders get matched almost instantly, making the app feel incredibly fast and responsive. 
* **The Trade-off:** This creates a classic race condition. If three drivers tap "Accept" at the exact same millisecond, the backend could accidentally assign the same ride to all three. We have to implement strict, atomic concurrency controls in the database to prevent double-booking.