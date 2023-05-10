const int LED_PIN = 13;
const int buttonPin = 2;
const int PHOTOCELL_PIN = A0;

int photocellValue = 0;
bool ledState = false;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
  pinMode(buttonPin, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {

    int buttonState = digitalRead(buttonPin);
  if (buttonState == LOW) {
    Serial.write("speedup");
  }
  delay(50);
  photocellValue = analogRead(PHOTOCELL_PIN);
  Serial.println(photocellValue);

  if (Serial.available() > 0) {
    char command = Serial.read();
    if (command == '1') {
      ledState = true;
    } else if (command == '0') {
      ledState = false;
    }
     if (digitalRead(buttonPin) == LOW) {
    Serial.write('1');
  }
  }

  digitalWrite(LED_PIN, ledState ? HIGH : LOW);

}
