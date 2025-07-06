// KODE INI UNTUK KONEKSI VIA KABEL USB
// Arduino Uno R4 WiFi

#include <Servo.h>

Servo gateServo;
const int servoPin = 9;
const int openAngle = 90;
const int closeAngle = 0;

// Variabel untuk menyimpan perintah dari Python
String command;

void setup() {
  Serial.begin(9600);
  gateServo.attach(servoPin);
  gateServo.write(closeAngle);
  Serial.println("Arduino R4 (Mode USB) Siap. Menunggu perintah...");
}

void loop() {
  if (Serial.available() > 0) {
    command = Serial.readStringUntil('\n');
    command.trim();
    if (command == "COMPLETE") {
      gateServo.write(openAngle); // Buka gerbang
    }
    else {
      // Untuk perintah lainnya (NO_VEST, NO_HELMET, dll), tutup gerbang.
      gateServo.write(closeAngle);
    }
  }
}
