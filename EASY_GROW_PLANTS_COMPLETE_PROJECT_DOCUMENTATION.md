# Easy Grow Plants – Smart IoT Based Plant Care and Marketplace Platform
## Comprehensive Thesis & Technical Project Documentation

---

## Table of Contents
1. [Phase 1: Project Overview & Introduction](#phase-1-project-overview--introduction)
2. [Phase 2: Complete Tech Stack](#phase-2-complete-tech-stack)
3. [Phase 3: System Architecture](#phase-3-system-architecture)
4. [Phase 4: Database & API Design](#phase-4-database--api-design)
5. [Phase 5: IoT Device & Arduino System](#phase-5-iot-device--arduino-system)
6. [Phase 6: Website Features & User Experience](#phase-6-website-features--user-experience)
7. [Phase 7: Authentication & Security](#phase-7-authentication--security)
8. [Phase 8: Unique Features & Innovations](#phase-8-unique-features--innovations)
9. [Phase 9: Challenges & Solutions](#phase-9-challenges--solutions)
10. [Phase 10: Future Improvements](#phase-10-future-improvements)
11. [Phase 11: Conclusion](#phase-11-conclusion)

---

## PHASE 1 — PROJECT OVERVIEW & INTRODUCTION

### 1.1 Project Title
**Easy Grow Plants** – An Integrated IoT Smart Pot System and Peer-to-Peer Plant Marketplace.

### 1.2 Problem Statement
Urbanization has significantly reduced available green space, leading many individuals to attempt indoor or balcony gardening. However, two primary obstacles remain:
1. **The Knowledge Gap**: High mortality rates for indoor plants due to incorrect watering, improper sunlight placement, and unrecognized diseases.
2. **Economic & Community Gap**: Lack of a specialized platform for urban gardeners to buy, sell, or exchange home-grown plants and accessories safely and efficiently.

### 1.3 Motivation
The motivation behind this project is to leverage the Internet of Things (IoT) and Artificial Intelligence (AI) to bridge the gap between human intuition and biological needs. By digitizing plant health, we can ensure sustainability in urban ecosystems while fostering a community of plant enthusiasts.

### 1.4 Objectives
- To develop a smart IoT-based hardware device for real-time monitoring of soil moisture and environmental conditions.
- To implement an automated irrigation system based on precise sensor calibration and noise-filtered algorithms.
- To create a feature-rich web platform for plant management, disease diagnosis, and e-commerce.
- To build an AI-driven recommendation engine for optimal plant selection based on balcony orientation and sunlight availability.

### 1.5 Target Users
- **Urban Gardeners**: Beginners and experts looking for automated care.
- **Plant Sellers**: Home-based nursery owners looking for a niche marketplace.
- **Community Enthusiasts**: Individuals looking to swap plants and share gardening experiences.

### 1.6 Innovation Summary
Easy Grow Plants is not just a "smart pot" or just a "website." It is a **holistic ecosystem**. It combines hardware telemetry, AI-based disease detection, and a P2P marketplace into a single, unified experience.

---

## PHASE 2 — COMPLETE TECH STACK

### 2.1 Software & Frontend Technologies
| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | React (Vite) | High performance, modular component architecture, and fast HMR. |
| **Styling** | Tailwind CSS | Utility-first styling for responsive, modern UI design. |
| **Routing** | React Router | Efficient client-side navigation for SPA. |
| **Icons** | Lucide React | Clean, scalable vector icons. |
| **State Management** | Context API / Hooks | Lightweight state handling for user auth and device status. |
| **Face Recognition** | Face-API.js | Client-side biometric authentication for enhanced security. |

### 2.2 Backend & Infrastructure
| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Core Framework** | Django | Robust, secure, and rapid development with "batteries included." |
| **API Engine** | Django REST Framework | Industry-standard for building flexible, scalable APIs. |
| **Authentication** | JWT (SimpleJWT) | Stateless, secure token-based authentication for web and IoT. |
| **Database** | SQLite / PostgreSQL | Relational storage for complex marketplace and user relationships. |
| **Static Serving** | Django StaticFiles | Integrated serving of compiled React production builds. |

### 2.3 IoT Hardware Components
| Component | Device | Purpose |
| :--- | :--- | :--- |
| **Microcontroller** | Arduino Uno R4 WiFi | 32-bit processing with built-in Wi-Fi for telemetry. |
| **Moisture Sensor** | Capacitive Soil Sensor | Corrosive-resistant monitoring of soil water content. |
| **Actuator** | Submersible Water Pump | Real-time automated irrigation. |
| **Switching** | 5V Relay Module | Safe isolation for high-power pump control. |
| **Communication** | HTTP / REST | Standardized communication with the Django backend. |

---

## PHASE 3 — SYSTEM ARCHITECTURE

### 3.1 High-Level Architecture
The system follows a **Three-Tier Architecture**:
1. **Perception Layer (Hardware)**: Arduino reads sensors, applies filtering, and pushes data.
2. **Transport Layer (Network)**: Data is transmitted via LAN (Wi-Fi) using RESTful POST requests.
3. **Application Layer (Backend/Frontend)**: Django processes data, provides endpoints, and React visualizes the state.

### 3.2 Real-Time Telemetry Flow
1. **Arduino Sensing**: Every 5 seconds, the Arduino samples the soil moisture 30 times.
2. **Noise Reduction**: A median filter removes outliers; an Exponential Moving Average (EMA) smoothes the result.
3. **Data Ingestion**: The Arduino sends a JSON payload to the `/api/devices/sensor-data/` endpoint.
4. **State Management**: Django saves the reading and updates the `latest_reading` for the specific device ID.
5. **UI Update**: The React dashboard polls the database every 5 seconds. If new data exists, the UI reflects moisture levels and pump status instantly without refreshing the page.

### 3.3 Scalability & Modularity
The system is built to be **Modular**. The marketplace logic is decoupled from the IoT logic. This allows for horizontal scaling where thousands of devices can report to a single backend cluster.

---

## PHASE 4 — DATABASE & API DESIGN

### 4.1 Major Database Entities
| Table | Description | Key Fields |
| :--- | :--- | :--- |
| **User** | Custom User model | email, username, role (Admin/Seller/User), profile_pic. |
| **Plant** | Marketplace listings | plant_name, scientific_name, price, stock_quantity, seller_id. |
| **Device** | Registered IoT units | device_id, name, owner_id, last_seen, is_active. |
| **Telemetry** | Live sensor logs | device_id, moisture_percent, raw_value, pump_status, timestamp. |
| **ExchangePost** | Community swaps | plant_offered, looking_for, user_id, status. |
| **Order** | E-commerce transactions | user_id, total_price, tracking_id, delivery_status. |

### 4.2 Core API Endpoints
- `POST /api/users/login/`: JWT authentication.
- `GET /api/devices/`: Lists user-owned IoT devices.
- `POST /api/devices/sensor-data/`: Ingestion point for Arduino telemetry.
- `GET /api/marketplace/plants/`: Paginated marketplace listing.
- `POST /api/iot/manual-water/`: Forces a pump activation command to the device.

---

## PHASE 5 — IOT DEVICE & ARDUINO SYSTEM

### 5.1 Professional Signal Processing
To solve the common "jittery sensor" problem in low-cost IoT, we implemented two layers of filtering:
1. **Statistical Outlier Removal (Median Filter)**: The system takes 30 raw samples in 300ms. It sorts them and takes the average of the middle 10 samples, discarding outliers caused by electrical noise.
2. **Exponential Moving Average (EMA)**:
   - Formula: `SmoothedValue = (Alpha * Current) + (1 - Alpha) * Previous`
   - This ensures that moisture percentage changes appear smooth and natural on the dashboard.

### 5.2 Moisture Calibration Logic
The system uses calibrated values derived from real-world testing:
- **DRY_RAW (Air)**: 375
- **WET_RAW (Water)**: 310
- **Logic**: `Percent = map(FilteredValue, DRY_RAW, WET_RAW, 0, 100)`

### 5.3 Arduino Firmware Core Logic
The firmware is written in C++ with a **Non-Blocking Architecture**. Using `millis()` instead of `delay()`, the system can simultaneously:
- Monitor sensors at 10Hz.
- Handle incoming HTTP requests for manual watering.
- Push telemetry every 5 seconds.
- Execute pump safety timeouts (Automatic cooldown after 5s of watering).

---

## PHASE 6 — WEBSITE FEATURES & USER EXPERIENCE

### 6.1 Smart Plant Finder
This feature uses a "Sustainability Logic" based on user environmental inputs:
- **Balcony Orientation**: Users select their balcony's compass direction (North, South, East, West).
- **Sunlight Analysis**: Inputting average sunlight hours per day.
- **Recommendation**: The system cross-references this with the `PlantCategory` database to suggest plants that thrive in those specific conditions (e.g., Succulents for South-facing, Ferns for North-facing).

### 6.2 Plant Doctor (Disease Detection)
A deep-learning integrated interface where users can upload a photo of a leaf.
- **Processing**: The image is analyzed for patterns of pests, fungi, or nutrient deficiencies.
- **Outcome**: Provides a diagnosis and a direct link to the relevant fertilizer or treatment in the Marketplace.

### 6.3 Community Echo & Exchange
- **Community Echo**: A social feed where users post pictures of their growth progress.
- **Plant Exchange**: A dedicated "No-Cash" zone where users can post swap requests (e.g., "Trading a Pothos cutting for a Snake Plant pup").

---

## PHASE 7 — AUTHENTICATION & SECURITY
- **Dual-Factor Readiness**: Supports standard email/password and Face Recognition login.
- **Device Security**: Devices use a unique `DEVICE_ID` hardcoded in firmware. Data is only accepted if the device is registered to a valid user in the database.
- **CORS Management**: The API is configured to allow LAN-based communication while blocking unauthorized external domains.

---

## PHASE 8 — UNIQUE FEATURES & INNOVATIONS
1. **Integrated Marketplace-IoT Loop**: If your IoT sensor detects low moisture, the system can suggest specific "Water-Retaining Soil" from the marketplace.
2. **Compass-Based Recommendation**: First-of-its-kind feature using orientation-based sunlight prediction for urban balcony gardening.
3. **Dual Language Support**: Fully localized in English and Bengali to reach a wider demographic of farmers and urban enthusiasts.

---

## PHASE 9 — CHALLENGES & SOLUTIONS
| Challenge | Technical Solution |
| :--- | :--- |
| **Sensor Jitter** | Implemented a 30-sample median filter + EMA smoothing. |
| **Arduino 504 Timeout** | Moved from "Direct Polling" to a "Telemetry Push + Database Fetch" model. |
| **Vite Cache Failures** | Added automated cache clearing (`node_modules/.vite`) in the production launcher. |
| **LAN Communication** | Configured Django to bind to `0.0.0.0` and implemented auto-IP detection in `run.bat`. |

---

## PHASE 10 — FUTURE IMPROVEMENTS
- **Smart Greenhouse Integration**: Controlling multiple pots from a single gateway.
- **Voice Assistant**: Integration with Alexa/Google Assistant to ask "How is my Cactus doing?"
- **Mobile Application**: Native Android/iOS apps with push notifications for low-water alerts.
- **Cloud Transition**: Moving from LAN to AWS/Heroku for global device accessibility.

---

## PHASE 11 — CONCLUSION
The **Easy Grow Plants** project successfully demonstrates that the intersection of IoT and modern web technologies can significantly improve urban agriculture. By providing users with data-driven insights and a centralized marketplace, the platform transforms plant care from a guessing game into a precise science. The project achieves its goal of being both a technical success and a social tool for environmental sustainability.

---
**Document Status**: Final Version
**Date**: May 07, 2026
**Author**: Engineering Documentation Team
