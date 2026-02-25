#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <time.h>

// Network defaults (change if needed)
const char* WIFI_SSID = "Laziz";
const char* WIFI_PASSWORD = "20062006";

// Backend (canonical ESP32 endpoint)
const char* SERVER_URL = "https://tozahudud-production-d73f.up.railway.app/esp32/distance";

// Telegram (kept on device by request)
const char* BOT_TOKEN = "8455844654:AAHKaArgaiXGE9KyYunN4bvZMoe0VQb8q0k";
const char* CHAT_IDS[] = {"8093402925", "6186454238"};
const int USER_COUNT = sizeof(CHAT_IDS) / sizeof(CHAT_IDS[0]);

// Sensor and indicators
#define TRIG_PIN 5
#define ECHO_PIN 18
#define BUZZER_PIN 4
#define LED_PIN 2

// Behavior
const float ALERT_DISTANCE_CM = 30.0;
const int MAX_CHECKS = 3;
const unsigned long CHECK_INTERVAL_MS = 2000;

// Metadata sent to backend
const char* BIN_ID = "ESP32-IBN-SINO";
const char* OBJECT_NAME = "Ibn Sino ko'chasi";
const char* LOCATION = "Ibn Sino ko'chasi 17A";

WiFiUDP ntpUDP;
// UTC clock for ISO-8601 with Z suffix
NTPClient timeClient(ntpUDP, "pool.ntp.org", 0, 60000);

int checkCounter = 0;
bool alertSent = false;
unsigned long lastCheck = 0;

const unsigned long MIN_VALID_EPOCH = 1700000000UL;  // 2023-11-14T22:13:20Z
const unsigned long MAX_VALID_EPOCH = 4102444800UL;  // 2100-01-01T00:00:00Z

bool wifiReady() {
  return WiFi.status() == WL_CONNECTED;
}

void connectWiFi() {
  if (wifiReady()) return;

  Serial.print("[WiFi] Connecting");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (!wifiReady() && attempts < 30) {
    delay(500);
    Serial.print('.');
    attempts++;
  }

  if (wifiReady()) {
    Serial.println("\n[WiFi] Connected");
    Serial.println("[WiFi] IP: " + WiFi.localIP().toString());
    Serial.println("[WiFi] RSSI: " + String(WiFi.RSSI()) + " dBm");
  } else {
    Serial.println("\n[WiFi] Connection failed, restarting...");
    delay(1000);
    ESP.restart();
  }
}

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return -1.0;

  float distance = duration * 0.034 / 2.0;
  if (distance < 2.0 || distance > 400.0) return -1.0;

  return distance;
}

String getIsoTimestamp() {
  timeClient.update();
  unsigned long epoch = timeClient.getEpochTime();

  if (epoch < MIN_VALID_EPOCH || epoch > MAX_VALID_EPOCH) {
    Serial.println("[NTP] Invalid epoch, timestamp omitted");
    return "";
  }

  time_t unixTime = static_cast<time_t>(epoch);
  struct tm timeInfo;
  gmtime_r(&unixTime, &timeInfo);

  char buf[25];
  snprintf(
    buf,
    sizeof(buf),
    "%04d-%02d-%02dT%02d:%02d:%02dZ",
    timeInfo.tm_year + 1900,
    timeInfo.tm_mon + 1,
    timeInfo.tm_mday,
    timeInfo.tm_hour,
    timeInfo.tm_min,
    timeInfo.tm_sec
  );

  return String(buf);
}

bool sendToBackend(float distanceCm, const String& isoTime) {
  if (!wifiReady()) {
    Serial.println("[HTTP] WiFi not connected");
    return false;
  }

  WiFiClientSecure* client = new WiFiClientSecure;
  if (!client) {
    Serial.println("[HTTP] Failed to allocate secure client");
    return false;
  }

  client->setInsecure();

  HTTPClient http;
  http.begin(*client, SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(15000);

  String payload = "{";
  payload += "\"distance\":" + String(distanceCm, 1);
  payload += ",\"binId\":\"" + String(BIN_ID) + "\"";
  payload += ",\"location\":\"" + String(LOCATION) + "\"";
  if (isoTime.length() > 0) {
    payload += ",\"timestamp\":\"" + isoTime + "\"";
  }
  payload += "}";

  int code = http.POST(payload);
  bool ok = (code == 200 || code == 201);

  if (ok) {
    Serial.println("[HTTP] Sent OK (" + String(code) + ")");
  } else {
    Serial.println("[HTTP] Send failed, code=" + String(code));
    if (code > 0) {
      Serial.println("[HTTP] Response: " + http.getString());
    }
  }

  http.end();
  delete client;
  return ok;
}

void sendTelegram(float distanceCm, const String& isoTime) {
  if (!wifiReady()) {
    Serial.println("[TG] Skipped (WiFi not connected)");
    return;
  }

  String message = "🚨 Chiqindi idishi to'ldi!\n";
  message += "📍 " + String(OBJECT_NAME) + "\n";
  message += "📏 " + String(distanceCm, 1) + " sm\n";
  message += "🗺 " + String(LOCATION) + "\n";
  message += "⏰ " + (isoTime.length() > 0 ? isoTime : "NTP sync kutilmoqda") + "\n";
  message += "📡 ESP32 ID: " + String(BIN_ID);

  for (int i = 0; i < USER_COUNT; i++) {
    WiFiClientSecure* client = new WiFiClientSecure;
    if (!client) {
      Serial.println("[TG] Failed to allocate client");
      continue;
    }

    client->setInsecure();

    HTTPClient http;
    String url = "https://api.telegram.org/bot" + String(BOT_TOKEN) + "/sendMessage";
    http.begin(*client, url);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(15000);

    String json = "{";
    json += "\"chat_id\":\"" + String(CHAT_IDS[i]) + "\"";
    json += ",\"text\":\"" + message + "\"";
    json += "}";

    int code = http.POST(json);
    Serial.println("[TG] chat=" + String(CHAT_IDS[i]) + " code=" + String(code));

    http.end();
    delete client;
  }
}

void signalSuccess() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    delay(100);
  }
}

void signalError() {
  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(50);
    digitalWrite(LED_PIN, LOW);
    delay(50);
  }
}

void signalCheck() {
  digitalWrite(LED_PIN, HIGH);
  delay(150);
  digitalWrite(LED_PIN, LOW);
}

void setup() {
  Serial.begin(115200);
  delay(1200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  Serial.println("\nESP32 Toza Hudud Alert Firmware");
  Serial.println("Backend: " + String(SERVER_URL));
  Serial.println("Mode: alert-only, 3 checks, 2s interval");

  connectWiFi();
  timeClient.begin();
  timeClient.forceUpdate();
  Serial.println("[NTP] Epoch: " + String(timeClient.getEpochTime()));
}

void loop() {
  connectWiFi();

  unsigned long now = millis();
  if (now - lastCheck < CHECK_INTERVAL_MS) return;
  lastCheck = now;

  float distance = readDistanceCm();
  if (distance < 0) {
    Serial.println("[SENSOR] Invalid reading");
    return;
  }

  // Alert zone
  if (distance <= ALERT_DISTANCE_CM) {
    if (!alertSent) {
      checkCounter++;
      signalCheck();

      Serial.println(
        "[SENSOR] " + String(distance, 1) + " cm | check " + String(checkCounter) + "/" + String(MAX_CHECKS)
      );

      if (checkCounter >= MAX_CHECKS) {
        digitalWrite(LED_PIN, HIGH);
        digitalWrite(BUZZER_PIN, HIGH);

        String isoTime = getIsoTimestamp();
        bool backendOk = sendToBackend(distance, isoTime);
        sendTelegram(distance, isoTime);

        if (backendOk) {
          signalSuccess();
        } else {
          signalError();
        }

        alertSent = true;
        Serial.println("[ALERT] 3-check confirmed, sent to backend + telegram");
      }
    } else {
      Serial.println("[ALERT] Obstacle still present, already sent");
    }
    return;
  }

  // Reset when no obstacle
  if (distance > ALERT_DISTANCE_CM) {
    if (alertSent || checkCounter > 0) {
      Serial.println("[STATE] Reset (distance=" + String(distance, 1) + " cm, no obstacle)");
    }

    alertSent = false;
    checkCounter = 0;
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(LED_PIN, LOW);
  }
}
