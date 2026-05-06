#include <WiFiS3.h>
#include <ArduinoJson.h> // Ensure you install the ArduinoJson library

// ===================== DEVICE SETTINGS =====================
String myDeviceId = "POT_001"; // Must match the ID in the web dashboard

// ===================== WIFI SETTINGS =====================
char ssid[] = "Tanny";
char pass[] = "israttan";

// ===================== SERVER SETTINGS =====================
// The local IP of your laptop/PC running the Django backend
char serverAddress[] = "192.168.1.10"; 
int serverPort = 8000;

WiFiServer server(80);
WiFiClient client;

// ===================== PIN SETTINGS =====================
const int SENSOR_PIN = A0;
const int RELAY_PIN  = 7;

// ===================== CALIBRATION =====================
const int WET_RAW = 250;
const int DRY_RAW = 430;
const int PUMP_START_DRY = 400;
const int PUMP_STOP_WET = 380;

// ===================== TIMING =====================
const unsigned long PUSH_INTERVAL = 60000; // Push sensor data every 60 seconds
unsigned long lastPushAt = 0;

int soilRaw = 0;
int moisturePercent = 0;
bool pumpOn = false;
String systemMessage = "System Active";

void setup() {
  Serial.begin(9600);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Off

  connectWiFi();
}

void loop() {
  maintainWiFi();
  readSensors();
  handleInboundRequests();
  
  // Active Push Logic
  if (millis() - lastPushAt >= PUSH_INTERVAL) {
    pushDataToServer();
    lastPushAt = millis();
  }
}

void connectWiFi() {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("Local IP: ");
  Serial.println(WiFi.localIP());
  server.begin();
}

void maintainWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
}

void readSensors() {
  soilRaw = analogRead(SENSOR_PIN);
  moisturePercent = map(soilRaw, DRY_RAW, WET_RAW, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);
}

void handleInboundRequests() {
  WiFiClient localClient = server.available();
  if (!localClient) return;

  String request = localClient.readStringUntil('\r');
  localClient.flush();

  if (request.indexOf("GET /water") >= 0) {
    startPump();
    sendJsonResponse(localClient, "Watering Started");
  } else if (request.indexOf("GET /data") >= 0) {
    sendJsonResponse(localClient, "Current Stats");
  } else {
    localClient.println("HTTP/1.1 404 Not Found");
  }
  localClient.stop();
}

void startPump() {
  pumpOn = true;
  digitalWrite(RELAY_PIN, LOW); // Relay On
  delay(5000); // Water for 5 seconds
  digitalWrite(RELAY_PIN, HIGH); // Relay Off
  pumpOn = false;
}

void sendJsonResponse(WiFiClient &c, String msg) {
  c.println("HTTP/1.1 200 OK");
  c.println("Content-Type: application/json");
  c.println("Access-Control-Allow-Origin: *");
  c.println();
  
  StaticJsonDocument<200> doc;
  doc["soil"] = soilRaw;
  doc["percent"] = moisturePercent;
  doc["pump"] = pumpOn ? 1 : 0;
  doc["message"] = msg;
  doc["ip"] = WiFi.localIP().toString();
  
  serializeJson(doc, c);
}

void pushDataToServer() {
  if (client.connect(serverAddress, serverPort)) {
    Serial.println("Pushing data to Django...");
    
    StaticJsonDocument<200> doc;
    doc["moisture"] = moisturePercent;
    doc["temp"] = 25; // Placeholder or read from DHT if available
    doc["water_level"] = 100;
    
    String jsonBody;
    serializeJson(doc, jsonBody);
    
    // Dynamic path using the configured Device ID
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
  }
}
