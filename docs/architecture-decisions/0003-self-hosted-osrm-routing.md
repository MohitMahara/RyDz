# 3. Use Self-Hosted OSRM for Spatial Routing and ETAs

**Date:** 2026-08-13
**Status:** Accepted

## Context
Calculating which drivers are nearby using straight-line (Haversine/Euclidean) distancd:** 100% free routing, highly scalable, zero risk of unexpected API bills, and demonstrates strong microservice architecture skills.
* **Bad:** We take on the operational overhead of downloading OpenStreetMap data, compiling the routing graph, and managing the OSRM Docker container locally.
