# Chapter 3: Methodology and System Design

## PHASE 1 — PROJECT MODULES, USER ROLES & SYSTEM REQUIREMENTS

### 3.1 Chapter Overview
This chapter delineates the foundational blueprint of the "Easy Grow Plants" ecosystem. It focuses on the architectural planning, modular decomposition, and structural design required to bridge IoT hardware with a modern web-based marketplace and community. The design follows an iterative methodology, ensuring that every software module serves a specific biological or community need.

### 3.2 Final System Modules Confirmation
The system is divided into four major functional domains: **IoT Management**, **Marketplace & E-Commerce**, **Community & Exchange**, and **Intelligent Services**.

| Module Domain | Specific Features |
| :--- | :--- |
| **IoT Management** | Device Dashboard, Live Moisture Monitoring, Temperature Tracking, Manual/Auto Watering, Watering Logs. |
| **Marketplace** | Plant Catalog, Category Search, Shopping Cart, Checkout, Order Tracking, Seller Payment Requests. |
| **Community** | Community Echo (Social Feed), Like/Comment System, Plant Exchange Portal (P2P Swaps), Proposal Messaging. |
| **Intelligent Services** | Face Recognition Login, AI Disease Detection, Smart Plant Finder (Orientation-Based), Dual-Language Support (EN/BN), Voice Assistant. |

### 3.3 User Roles & Permission Model
The system architecture defines four distinct user roles, each with specific access control lists (ACLs) within the Django/React ecosystem:

1.  **Guest User**:
    *   *Permissions*: View marketplace products, read plant care guides, and browse the community feed.
    *   *Constraints*: Cannot add items to cart, post in community, or register IoT devices.
2.  **Registered User / Plant Owner**:
    *   *Permissions*: Manage personal profile, register and monitor IoT Smart Pots, purchase plants, participate in community discussions, and post plant exchange requests.
    *   *Security*: Authenticated via JWT tokens and optional biometric Face ID.
3.  **Seller / Nursery Partner**:
    *   *Permissions*: Includes all Registered User permissions plus the ability to create plant listings, manage customer orders, request shipping pickups (ShipFast), and track financial earnings.
4.  **System Administrator**:
    *   *Permissions*: Full access to the Django Admin Panel. Oversees user accounts, validates botanist applications, manages global plant categories, and monitors system-wide telemetry logs.

### 3.4 Hardware-Software Requirements Specification

#### 3.4.1 Hardware Requirements (The Smart Pot)
- **Microcontroller**: Arduino UNO R4 WiFi (ARM Cortex-M4).
- **Sensors**: Capacitive Soil Moisture Sensor (Analog).
- **Actuators**: 5V Submersible Water Pump + 5V Relay Module.
- **Power**: External 5V/2A power source for the pump; USB-C for Arduino.

#### 3.4.2 Software Requirements (The Platform)
- **Backend**: Python 3.x, Django 5.x, Django REST Framework.
- **Frontend**: React 18 (Vite), Tailwind CSS.
- **Database**: SQLite (Development) / PostgreSQL (Production).
- **Biometrics**: Face-API.js (Local Browser Processing).
- **Communication**: HTTP/REST over Local Area Network (LAN).

---
**Phase 1 Complete.** 
*Status: Modules confirmed, User Roles defined, and Requirements specified.*
Please command: **"continue phase 2"**

---

## PHASE 2 — SYSTEM ARCHITECTURE & USE CASE DESIGN

### 3.5 Overall System Architecture
The system architecture follows a **Decoupled Three-Tier Model**, designed to maintain high performance and scalability while integrating physical hardware with web services. The design prioritizes asynchronous communication to ensure that the user interface remains responsive even during high-frequency sensor telemetry.

#### 3.5.1 Architecture Block Diagram (Description)
The system is logically structured into three primary layers:
1.  **Client Tier (The Interface)**: 
    - Composed of a React-based Single Page Application (SPA).
    - Responsible for rendering the IoT Dashboard, Marketplace, and Community feeds.
    - Handles local processing for Face Recognition and Voice commands.
2.  **Logic Tier (The Server)**: 
    - Powered by the Django REST Framework.
    - Acts as the central hub for data validation, business logic execution (e.g., automated watering triggers), and API gateway for both web users and IoT devices.
3.  **Data Tier (The Persistence)**: 
    - Relational database managing user profiles, marketplace transactions, and historical telemetry logs.
    - Ensures transactional integrity for orders and community interactions.

### 3.6 Communication Architecture (LAN Strategy)
To ensure low latency and user privacy, the project utilizes a **LAN-centric Communication Strategy**. 
- **IoT-to-Server**: The Arduino Smart Pot communicates directly with the Django backend via the local Wi-Fi router using HTTP POST requests. 
- **Server-to-IoT**: The system uses a "Command Flag" pattern. The server records a watering command in the database, which the Arduino fetches during its periodic heartbeat checks.
- **Client-to-Server**: The React frontend interacts with the API via standard RESTful calls, utilizing JWT tokens for secure session management.

### 3.7 Use Case Design
The following use cases define the primary interactions within the system, categorizing activities based on the user roles defined in Phase 1.

#### 3.7.1 IoT & Dashboard Use Cases
- **Register Device**: A Registered User inputs a unique `device_id` to link a physical Smart Pot to their account.
- **Monitor Real-Time Data**: Users view live moisture and temperature gauges on the dashboard.
- **Trigger Manual Watering**: Users override automatic logic to activate the pump instantly via the "Water Now" interface.
- **Configure Thresholds**: Users set custom moisture levels (e.g., 30%) at which the system should alert or auto-water.

#### 3.7.2 Marketplace & Community Use Cases
- **Browse & Search Plants**: Users filter plants by category or search by name.
- **Manage Shopping Cart**: Users add, remove, and adjust quantities of plants and accessories.
- **Complete Checkout**: Users provide shipping details and select payment methods.
- **Post Community Update**: Users upload plant photos and captions to the Community Echo social feed.
- **Propose Plant Exchange**: Users contact other gardeners to initiate a P2P plant swap.

#### 3.7.3 Intelligent Service Use Cases
- **Biometric Login**: Users authenticate using face recognition for faster access.
- **Diagnose Plant Health**: Users upload an image of a leaf for AI-based disease analysis.
- **Smart Plant Discovery**: Users input their balcony orientation and sunlight hours to receive personalized recommendations.

---
**Phase 2 Complete.** 
*Status: Software Architecture and Use Case Design finalized (Hardware sections skipped per request).*
Please command: **"continue phase 3"**

---

## PHASE 3 — DATABASE DESIGN & ENTITY RELATIONSHIPS

### 3.8 Database Schema Overview
The database for "Easy Grow Plants" is designed to handle high-frequency time-series data (telemetry) alongside standard relational data for e-commerce and social interactions. The schema is optimized to ensure that data retrieval for the IoT dashboard is independent of marketplace transaction processing.

### 3.9 Entity Relationship Diagram (ERD) Description
The system's database structure is built around the following primary relationship clusters:

1.  **User-Centric Relationships**: 
    - A **User** has a *one-to-many* relationship with **Devices**, **Plants** (as a seller), **Orders**, **Posts**, and **ExchangeRequests**.
2.  **IoT-Telemetry Relationships**: 
    - A **Device** has a *one-to-many* relationship with **DeviceReadings** and **WateringLogs**. This allows for historical analysis of plant health over time.
3.  **Marketplace-Transactional Relationships**: 
    - An **Order** consists of *one-to-many* **OrderItems**, each linked to a specific **Plant**.
    - **CartItems** serve as a persistent storage between a **User** and a **Plant** before purchase.
4.  **Community-Interaction Relationships**: 
    - A **Post** has *one-to-many* **Comments**. 
    - An **ExchangeProposal** links two **Users** to a specific **ExchangePost**.

### 3.10 Core Database Models and Field Specifications

| Model Entity | Primary Fields | Description & Purpose |
| :--- | :--- | :--- |
| **User** | `id`, `username`, `email`, `role`, `face_descriptor`, `profile_pic` | Stores identity, role-based access levels, and biometric data for Face ID. |
| **Device** | `device_id`, `owner`, `moisture_threshold`, `auto_watering_enabled`, `last_seen` | Stores hardware metadata, user-defined care settings, and connection status. |
| **DeviceReading** | `device`, `soil_moisture`, `temperature`, `pump_status`, `timestamp` | High-frequency telemetry log for real-time and historical dashboard visualization. |
| **WateringLog** | `device`, `trigger_type` (Manual/Auto), `duration`, `success`, `timestamp` | Records every irrigation event to track water usage and system reliability. |
| **Plant** | `seller`, `plant_name`, `price`, `stock_quantity`, `category`, `image` | Core marketplace entity representing products listed by sellers or partners. |
| **Order** | `user`, `total_bill`, `status`, `shipping_address`, `tracking_id` | Manages the lifecycle of a purchase from pending to delivered. |
| **ExchangePost** | `user`, `plant_name`, `looking_for`, `location`, `status` | Facilitates P2P plant swaps by listing available plants and user requirements. |
| **PlantCategory** | `name`, `care_type`, `water_care`, `light_care`, `image` | Stores botanical knowledge used for the Care Guide and Recommendation Engine. |
| **Notification** | `user`, `message`, `is_read`, `created_at` | System-generated alerts for low moisture, new orders, or community interactions. |

### 3.11 Normalization and Data Integrity
The database is normalized to the **Third Normal Form (3NF)** to eliminate redundancy. For instance, the separation of `Device` and `DeviceReading` ensures that device-specific settings (like the moisture threshold) are not repeated for every telemetry entry, significantly reducing storage overhead and improving query performance for the live dashboard.

---
**Phase 3 Complete.** 
*Status: Database Design, ERD Logic, and Model Field Specifications finalized.*
Please command: **"continue phase 4"**

---

## PHASE 4 — API DESIGN & SYSTEM WORKFLOWS

### 3.12 API Design and Endpoint Architecture
The "Easy Grow Plants" backend utilizes a **RESTful API Architecture** to facilitate communication between the various components of the ecosystem. The API is designed to be stateless, utilizing JSON for data exchange and JWT for secure authentication.

#### 3.12.1 Core API Categories and Endpoints
| Category | Endpoint | HTTP Method | Purpose |
| :--- | :--- | :--- | :--- |
| **Authentication** | `/api/auth/login/` | `POST` | Authenticates user and returns JWT tokens. |
| **Authentication** | `/api/users/verify-face/` | `POST` | Validates biometric facial descriptors. |
| **Marketplace** | `/api/plants/` | `GET` | Retrieves the list of available plants with filters. |
| **E-Commerce** | `/api/orders/` | `POST` | Processes the shopping cart and creates a new order. |
| **IoT Control** | `/api/devices/` | `GET/POST` | Registers a new Smart Pot or lists existing devices. |
| **IoT Data** | `/api/devices/sensor-data/` | `POST` | Ingestion point for Arduino telemetry packets. |
| **IoT Control** | `/api/iot/water-now/` | `POST` | Triggers a manual override for the irrigation pump. |
| **Community** | `/api/posts/` | `GET/POST` | Manages the social feed and image-based posts. |

### 3.13 System Workflow Design
The following workflows define the step-by-step logic used to handle data transmission and automated responses within the system.

#### 3.13.1 Real-Time IoT Data Flow Workflow
1.  **Sensing**: The Arduino UNO R4 reads the soil moisture sensor at the hardware level.
2.  **Payload Creation**: The microcontroller packages the moisture percentage, temperature, and device ID into a JSON object.
3.  **Transmission**: A RESTful `POST` request is sent to the `/api/devices/sensor-data/` endpoint.
4.  **Persistence**: The Django backend validates the `device_id`, saves the reading to the `DeviceReading` table, and updates the "last seen" timestamp.
5.  **Visualization**: The React Dashboard performs a 5-second poll to fetch the latest reading and updates the graphical gauges for the user.

#### 3.13.2 Manual Watering Workflow (Remote Override)
1.  **User Action**: The user clicks the "Water Now" button on the web dashboard.
2.  **API Command**: React sends a `POST` request to `/api/iot/command/` with the desired duration.
3.  **State Update**: Django records the command and sets a `pending_watering` flag in the `Device` model.
4.  **Hardware Fetch**: During its next heartbeat check, the Arduino detects the pending command via a `GET` request.
5.  **Actuation**: The Arduino activates the relay, runs the pump for the specified duration, and sends a success confirmation back to the API.

#### 3.13.3 Automatic Watering Workflow (Threshold Logic)
1.  **Threshold Check**: The system constantly monitors incoming telemetry against the user-defined `moisture_threshold` (e.g., 30%).
2.  **Trigger**: If the moisture falls below the threshold, the backend verifies if `auto_watering_enabled` is set to true.
3.  **Safety Validation**: The system checks the `WateringLog` to ensure the "Cooldown Period" has passed to prevent overwatering.
4.  **Execution**: The automated command is issued to the Arduino.
5.  **Logging**: The event is recorded as a "Scheduled Auto" trigger in the `WateringLog` for user review.

---
**Phase 4 Complete.** 
*Status: API Endpoint Architecture and System Workflows finalized.*
Please command: **"continue phase 5"**

---

## PHASE 5 — METHODOLOGY SUMMARY & SYSTEM DESIGN CONCLUSION

### 3.14 Development Methodology: The Iterative Approach
The development of "Easy Grow Plants" followed an **Iterative and Incremental Development (IID) Methodology**, specifically tailored for IoT projects. This approach allowed for the simultaneous development of hardware and software components, ensuring that changes in sensor calibration (hardware) were immediately reflected in the API and UI layers (software).

#### 3.14.1 Stages of Development
1.  **Requirements Analysis**: Identifying the biological needs of plants and the social needs of gardeners.
2.  **Architectural Design**: Selecting the LAN-based decoupled architecture (Django + React + Arduino).
3.  **Prototyping**: Building the basic "Telemetry-to-Dashboard" pipeline.
4.  **Integration & Testing**: Bridging the marketplace with the IoT dashboard.
5.  **Refinement**: Implementing AI features and optimizing the noise-filtering algorithms.

### 3.15 System Design Conclusion
In summary, the system design of "Easy Grow Plants" is a multidisciplinary blueprint that integrates hardware automation with sophisticated web-based social and economic services. By employing a **Decoupled Three-Tier Architecture**, the platform ensures that real-time sensor data is delivered with low latency while maintaining the transactional integrity required for an e-commerce marketplace.

The design phase established:
- A clear **User Permission Model** supporting multiple roles (Users, Sellers, Admins).
- A **Normalized Database Schema** optimized for high-frequency time-series telemetry.
- A **State-Machine Workflow** for both automated and manual irrigation.
- A **Scalable API Architecture** capable of supporting hundreds of concurrent IoT nodes within a Local Area Network.

This comprehensive structural design serves as the foundation for the implementation details discussed in the following chapters, ensuring that the "Easy Grow Plants" ecosystem is not just a collection of features, but a stable and scalable environmental platform.

---
**Chapter 3: Methodology and System Design — COMPLETE.**
*Document Status: Finalized.*
