#include <WiFiS3.h>
#include <WiFiUdp.h>
#include <ArduinoJson.h>

// ===================== DEVICE SETTINGS =====================
String myDeviceId = "POT_001"; // Must match the ID in the web dashboard

// ===================== WIFI SETTINGS =====================
char ssid[] = "Tanny";
char pass[] = "israttan";

// ===================== SERVER SETTINGS =====================
// NOTE: The backend no longer needs to be hard-coded here. The device announces
// itself over the LAN (UDP broadcast below) and the backend auto-detects it, so
// changing DHCP IPs no longer break the presentation. serverAddress is only used
// by the optional legacy telemetry push (disabled by default in loop()).
char serverAddress[] = "10.206.38.220";
int serverPort = 8000;

WiFiServer server(80);
WiFiClient client;

// ===================== AUTO-DISCOVERY (UDP broadcast) =====================
// The device shouts "{device_id, ip}" onto the local network every few seconds.
// The backend's `python manage.py device_discovery` listener hears it and keeps
// the registered device's IP up to date automatically — zero configuration.
WiFiUDP udp;
const int DISCOVERY_PORT = 45454;
const unsigned long BROADCAST_INTERVAL = 4000; // announce presence every 4s
unsigned long lastBroadcastAt = 0;

// ===================== PIN SETTINGS =====================
const int SENSOR_PIN = A0;
const int RELAY_PIN  = 7;

// ===================== CALIBRATION =====================
// History: Air dry 373-381, Water wet 308-320
const int WET_RAW = 310; // Target value in water
const int DRY_RAW = 375; // Target value in air
float smoothedRaw = 375.0; // Initialized to DRY point
const float EMA_ALPHA = 0.2; 

// ===================== TIMING & SAFETY =====================
const unsigned long PUSH_INTERVAL = 5000; // 5s for fast testing
const unsigned long DEBUG_PRINT_INTERVAL = 2000; // Serial logs
const unsigned long COOLDOWN_INTERVAL = 60000; 
unsigned long lastPushAt = 0;
unsigned long lastDebugPrint = 0;
unsigned long lastWateringAt = 0;

unsigned long pumpStartTime = 0;
unsigned long pumpDurationMs = 0;
bool pumpActive = false;

// Sensor state
int soilRaw = 0;
int moisturePercent = 0;

void setup() {
  Serial.begin(115200);
  
  // Safety: Force relay OFF immediately
  pinMode(RELAY_PIN, OUTPUT);
  turnPumpOff();

  connectWiFi();
  broadcastPresence(); // announce ourselves immediately on boot
}

// Compute the network broadcast address (e.g. 192.168.0.255) and shout our
// identity + IP to every device on the LAN, including the backend listener.
void broadcastPresence() {
  if (WiFi.status() != WL_CONNECTED) return;

  IPAddress ip = WiFi.localIP();
  IPAddress mask = WiFi.subnetMask();
  IPAddress bcast;
  for (int i = 0; i < 4; i++) {
    bcast[i] = (ip[i] & mask[i]) | (~mask[i] & 0xFF);
  }

  StaticJsonDocument<128> doc;
  doc["device_id"] = myDeviceId;
  doc["ip"] = ip.toString();
  char buf[128];
  size_t n = serializeJson(doc, buf);

  udp.beginPacket(bcast, DISCOVERY_PORT);
  udp.write((const uint8_t *)buf, n);
  udp.endPacket();
}

void loop() {
  maintainWiFi();
  updateSensors();
  handleSafetyCutoff();
  handleInboundRequests();

  // Auto-discovery: announce our ID + current IP so the backend always finds us.
  if (WiFi.status() == WL_CONNECTED && millis() - lastBroadcastAt >= BROADCAST_INTERVAL) {
    broadcastPresence();
    lastBroadcastAt = millis();
  }

  // Legacy telemetry push disabled: the backend now pulls /data using the IP it
  // learned via discovery, so we don't need (or want) a hard-coded backend IP.
  // Re-enable only if you also set a correct serverAddress above.
  // if (millis() - lastPushAt >= PUSH_INTERVAL) {
  //   pushDataToServer();
  //   lastPushAt = millis();
  // }

  // Debug Calibration Monitor
  if (millis() - lastDebugPrint >= DEBUG_PRINT_INTERVAL) {
    Serial.print("MONITOR | IP: "); Serial.print(WiFi.localIP());
    Serial.print(" | Raw: "); Serial.print(soilRaw);
    Serial.print(" | Filtered: "); Serial.print(smoothedRaw);
    Serial.print(" | Moisture: "); Serial.print(moisturePercent);
    Serial.print("% | Pump: "); Serial.println(pumpActive ? "ON" : "OFF");
    lastDebugPrint = millis();
  }
}

void turnPumpOff() {
  digitalWrite(RELAY_PIN, HIGH); // ACTIVE LOW: HIGH = OFF
  pumpActive = false;
  Serial.println("Pump turned OFF.");
}

void turnPumpOn(int durationSeconds) {
  // Clamp duration to safe bounds
  if (durationSeconds < 1) durationSeconds = 1;
  if (durationSeconds > 10) durationSeconds = 10;
  
  // Check cooldown
  if (millis() - lastWateringAt < COOLDOWN_INTERVAL && lastWateringAt != 0) {
    Serial.println("Watering rejected: Cooldown active.");
    return;
  }
  
  pumpDurationMs = durationSeconds * 1000UL;
  pumpStartTime = millis();
  pumpActive = true;
  lastWateringAt = pumpStartTime;
  
  digitalWrite(RELAY_PIN, LOW); // ACTIVE LOW: LOW = ON
  Serial.print("Pump turned ON for ");
  Serial.print(durationSeconds);
  Serial.println(" seconds.");
}

void handleSafetyCutoff() {
  if (pumpActive && (millis() - pumpStartTime >= pumpDurationMs)) {
    turnPumpOff();
  }
}

void connectWiFi() {
  turnPumpOff(); // Safety: Pump off during network operations
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, pass);
  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 15000) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("Local IP: ");
    Serial.println(WiFi.localIP());
    server.begin();
  } else {
    Serial.println("\nWiFi connection failed.");
  }
}

void maintainWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    turnPumpOff(); // Safety
    connectWiFi();
  }
}

void updateSensors() {
  const int NUM_SAMPLES = 30;
  int samples[NUM_SAMPLES];
  
  // 1. Take samples
  for(int i=0; i<NUM_SAMPLES; i++) {
    samples[i] = analogRead(SENSOR_PIN);
    delay(5);
  }
  
  // 2. Simple Sort (Bubble Sort for small array)
  for (int i = 0; i < NUM_SAMPLES-1; i++) {
    for (int j = 0; j < NUM_SAMPLES-i-1; j++) {
      if (samples[j] > samples[j+1]) {
        int temp = samples[j];
        samples[j] = samples[j+1];
        samples[j+1] = temp;
      }
    }
  }
  
  // 3. Average middle 10 samples (Ignore outliers)
  long middleSum = 0;
  for(int i=10; i<20; i++) {
    middleSum += samples[i];
  }
  int currentFilteredRaw = middleSum / 10;
  
  // 4. Exponential Moving Average (Smooth jitter)
  smoothedRaw = (currentFilteredRaw * EMA_ALPHA) + (smoothedRaw * (1.0 - EMA_ALPHA));
  
  // 5. Final Mapping
  soilRaw = currentFilteredRaw; // Keep raw for display
  moisturePercent = map((int)smoothedRaw, DRY_RAW, WET_RAW, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);
}

void handleInboundRequests() {
  WiFiClient localClient = server.available();
  if (!localClient) return;

  // Read the first line of the request
  String request = localClient.readStringUntil('\r');
  
  // CRITICAL FIX: Read the rest of the HTTP headers to clear the buffer.
  // If we don't do this, calling stop() with unread data in the buffer
  // forces a TCP RST (Connection Reset) packet, crashing the Django request!
  boolean currentLineIsBlank = true;
  while (localClient.connected()) {
    if (localClient.available()) {
      char c = localClient.read();
      if (c == '\n' && currentLineIsBlank) {
        // End of HTTP headers
        break;
      }
      if (c == '\n') {
        currentLineIsBlank = true;
      } else if (c != '\r') {
        currentLineIsBlank = false;
      }
    }
  }

  if (request.indexOf("GET /data") >= 0) {
    sendJsonResponse(localClient, "OK");
  } 
  else if (request.indexOf("GET /water") >= 0) {
    // Extract duration if present: /water?duration=5
    int duration = 5; // default
    int durIdx = request.indexOf("duration=");
    if (durIdx >= 0) {
      int endIdx = request.indexOf(" ", durIdx);
      if (endIdx > durIdx) {
        duration = request.substring(durIdx + 9, endIdx).toInt();
      }
    }
    
    // Safety check for cooldown
    if (pumpActive) {
      sendJsonResponse(localClient, "Pump already running");
    } else if (millis() - lastWateringAt < COOLDOWN_INTERVAL && lastWateringAt != 0) {
      sendJsonResponse(localClient, "Cooldown active");
    } else {
      turnPumpOn(duration);
      sendJsonResponse(localClient, "Watering started");
    }
  } 
  else {
    localClient.println("HTTP/1.1 404 Not Found");
  }
  
  delay(1);
  localClient.stop();
}

void sendJsonResponse(WiFiClient &c, String msg) {
  c.println("HTTP/1.1 200 OK");
  c.println("Content-Type: application/json");
  c.println("Access-Control-Allow-Origin: *");
  c.println();
  
  StaticJsonDocument<200> doc;
  doc["moisture"] = moisturePercent;
  doc["soil_raw"] = soilRaw;
  doc["pump_status"] = pumpActive;
  doc["message"] = msg;
  doc["uptime_s"] = millis() / 1000;
  doc["ip"] = WiFi.localIP().toString();
  
  serializeJson(doc, c);
}

void pushDataToServer() {
  if (client.connect(serverAddress, serverPort)) {
    StaticJsonDocument<200> doc;
    doc["moisture"] = moisturePercent;
    doc["soil_raw"] = soilRaw;
    doc["pump_status"] = pumpActive;
    doc["temp"] = 25; 
    doc["water_level"] = 100;
    doc["ip"] = WiFi.localIP().toString();
    
    String jsonBody;
    serializeJson(doc, jsonBody);
    
    client.print("POST /api/devices/");
    client.print(myDeviceId);
    client.println("/sensor-data/ HTTP/1.1");
    client.print("Host: "); client.println(serverAddress);
    client.println("Content-Type: application/json");
    client.print("Content-Length: "); client.println(jsonBody.length());
    client.println("Connection: close");
    client.println();
    client.println(jsonBody);
    
    client.stop();
    Serial.println("Telemetry pushed.");
  } else {
    Serial.println("Telemetry push failed.");
  }
}
