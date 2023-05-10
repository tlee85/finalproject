let aliens = [];
let lastAlienTime = 0;
let kills = 0;
let stars = [];
let meteors = [];
let lastMeteorTime = 0;
let crosshairSize = 20;
let gameStarted = false;
let gameOver = false;
let gameStartTime = 0;
let gameDuration = 30000;
let sun;
let spaceLoop;
let meteorSynth;
let screamSynth
let port;
let serial;
let writer;
let ledState = { on: false };
let ledPin = 13;
let ledOn = false;
let ledTimeout;
let buttonPin = 2;
let isBackgroundColorSkyBlue = false;
let buttonState = 0;
let alienSpeed = 1;
let connectButton;


function draw() {

  
  if (!gameStarted) {
    
    drawStartScreen();
    return;
  }

  if (gameOver) {
    drawGameOverScreen();
    return;
  }

  let s = new Star(random(width), random(height));
  stars.push(s);

  if (stars.length > 100) {
    stars.splice(0, 1);
  }

  let currentTime = millis();
  if (currentTime - lastMeteorTime > 5000) {
    let m = new Meteor(random(width), -50);
    meteors.push(m);
    lastMeteorTime = currentTime;
  
    // play meteor sound effect
    meteorSynth.triggerAttackRelease("C5", "8n");
  }
  

  background(0);
  
  if (currentTime - lastAlienTime > random(100, 5000)) {
    let a = new Alien(random(width), random(height/2), random(2, 5), random(20, 40), color(0, 255, 0));
    aliens.push(a);
    lastAlienTime = currentTime;
  }
  for (let i = 0; i < aliens.length; i++) {
    aliens[i].update();
    aliens[i].display();
  }
  
  // add space loop to the draw function
  spaceLoop.start();

  // draw sun
  

  for (let i = 0; i < stars.length; i++) {
    stars[i].display();
  }

  for (let i = 0; i < meteors.length; i++) {
    meteors[i].update();
    meteors[i].display();
  }

  
  // draw crosshair
  stroke(255, 0, 0);
  strokeWeight(2);
  noFill();
  ellipse(mouseX, mouseY, crosshairSize * 2);
  line(mouseX - crosshairSize, mouseY, mouseX + crosshairSize, mouseY);
  line(mouseX, mouseY - crosshairSize, mouseX, mouseY + crosshairSize);

  // draw timer
  let timeLeft = gameDuration - (currentTime - gameStartTime);
  if (timeLeft < 0) {
    gameOver = true;
    return;
  }
  textSize(32);
  fill(255);
  textAlign(LEFT, TOP);
  text("Time left: " + Math.ceil(timeLeft / 1000), 10, 10);
  
  // draw score
  textSize(32);
  fill(255);
  textAlign(RIGHT, TOP);
  text("Score: " + kills, width - 10, 10);
}
function serialWrite(jsonObject) {
  if (writer) {
    let value = jsonObject.on ? "1" : "0";
    let encoder = new TextEncoder();
    writer.write(encoder.encode(value));
  }
}
async function connect() {
  port = await navigator.serial.requestPort();

  await port.open({ baudRate: 9600 });

  writer = port.writable.getWriter();

  const reader = port.readable
    .pipeThrough(new TextDecoderStream())
    .getReader();

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    brightness = parseInt(value);
  }
  serial = new SerialPort();
  serial.on('data', readSerial);
}

function readSerial(data) {
  if (data == '1') {
    mousePressed();
  }
}
function mouseClicked() {
  if (ledTimeout) {
    // If the LED timeout is set, cancel it
    clearTimeout(ledTimeout);
    ledTimeout = undefined;
  }

  // Toggle the LED state
  ledState.on = !ledState.on;
  serialWrite(ledState);

  // Set a timeout to turn off the LED after 1 second
  ledTimeout = setTimeout(() => {
    ledState.on = false;
    serialWrite(ledState);
    ledTimeout = undefined;
  }, 10);

  // Check if there is a meteor on the screen
  for (let i = 0; i < meteors.length; i++) {
    let meteor = meteors[i];
    if (crosshair.intersects(meteor)) {
      // If the crosshair intersects the meteor, increment the score by 5
      kills += 5;
      // Remove the meteor from the screen
      meteors.splice(i, 1);
      // Play the meteor sound
      meteorSynth.triggerAttackRelease("C4", "8n");
      // Exit the loop since we don't need to check for other meteors
      break;
    }
  }
}

 

function setup() {
  
  createCanvas(windowWidth, windowHeight);

  if ("serial" in navigator) {
    // The Web Serial API is supported.
    let button = createButton("connect");
    button.position(0, 0);
    button.mousePressed(connect);
  }
  Tone.Transport.start();

  // create space loop
  spaceLoop = new Tone.Loop(function(time) {
    // play a random sound on each loop
    let synth = new Tone.MonoSynth().toDestination();
    let notes = ["C3", "D3", "E3", "G3", "A3", "B3"];
    let note = notes[Math.floor(Math.random() * notes.length)];
    synth.triggerAttackRelease(note, "16n", time);
  }, "16n"); // set loop interval

  // create gunshot sound
  let gunshot = new Tone.MembraneSynth({
    pitchDecay: 0.01,
    octaves: 2,
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 0.001,
      decay: 0.1,
      sustain: 0,
      release: 0.1
    }
  }).toDestination();
  meteorSynth = new Tone.Synth({
    envelope: {
      attack: 0.1,
      decay: 0.2,
      sustain: 0.2,
      release: 0.5
    }
  }).toDestination();
  screamSynth = new Tone.Synth({
    oscillator: {
      type: "triangle"
    },
    envelope: {
      attack: 0.01,
      decay: 0.5,
      sustain: 0,
      release: 0.5
    }
  }).toDestination();

  // handle mouse click events
  document.addEventListener("mousedown", function() {
    if (gameStarted && !gameOver) {
      gunshot.triggerAttackRelease("C4", "8n");
    }
  });
  spaceLoop = new Tone.Loop(function(time) {
    // play a random sound on each loop
    let synth = new Tone.MonoSynth().toDestination();
    let notes = ["C3", "D3", "E3", "G3", "A3", "B3"];
    let note = notes[Math.floor(Math.random() * notes.length)];
    synth.triggerAttackRelease(note, "16n", time);
  }, "16n"); // set loop interval
  let meteorSound = new Tone.Synth({
    oscillator: {
      type: "sawtooth"
    },
    envelope: {
      attack: 0.1,
      decay: 0.2,
      sustain: 0.3,
      release: 0.5
    }
  }).toDestination();
  }

  function keyTyped() {
    if (key === 'a') {
      ledState.on = !ledState.on;
      serialWrite(ledState);
    }
  }




function drawStartScreen() {
  
  background(0);
  textSize(64);
  fill(255);
  textAlign(CENTER, CENTER);
  text("Slime Space Shooters", width / 2, height / 2);
  textSize(32);
  text("Press any key to start", width / 2, height / 2 + 100);
  fill(0, 255, 0);
  
  // move the head up by changing the y coordinate
  ellipse(width/2, height/4, 200, 200);
  
  // move the eyes up by subtracting from their y coordinates
  fill(255);
  ellipse(width/2 - 50, height/4 - 20, 30, 30);
  ellipse(width/2 + 50, height/4 - 20, 30, 30);
  fill(0);
  ellipse(width/2 - 50, height/4 - 20, 10, 10);
  ellipse(width/2 + 50, height/4 - 20, 10, 10);
  
  // move the mouth up by subtracting from its y coordinate
  fill(255, 0, 0);
  arc(width/2, height/4 + 40, 80, 60, 0, PI);
}

function drawGameOverScreen() {
  background(0);
  textSize(64);
  fill(255);
  textAlign(CENTER, CENTER);
  text("Game Over", width / 2, height / 2 - 100);
  textSize(32);
  text(`Score: ${kills}`, width / 2, height / 2);
  
  // Retrieve the highest score from local storage
  let highScore = localStorage.getItem("highScore");
  
  // If there is no high score yet or if the final score is higher than the current high score,
  // update the high score in local storage
  if (!highScore || kills > highScore) {
    highScore = kills;
    localStorage.setItem("highScore", highScore);
  }
  
  // Display the high score
  textSize(24);
  text(`High Score: ${highScore}`, width / 2, height / 2 + 50);
}


function keyPressed() {
  if (!gameStarted) {
    gameStarted = true;
    gameStartTime = millis();
  }
  
}
  
class Star {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = random(1, 5);
  }

  display() {
    fill(255);
    noStroke();
    ellipse(this.x, this.y, this.size);
  }
}

class Meteor {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = random(5, 10);
    this.size = random(10, 30);
    this.trail = [];

    for (let i = 0; i < 20; i++) {
      let p = new Particle(this.x, this.y, random(2, 4), color(255, 150, 0));
      this.trail.push(p);
    }
  }

  update() {
    this.x += this.speed / 2;
    this.y += this.speed;

    for (let i = 0; i < 20; i++) {
      let p = new Particle(this.x, this.y, random(2, 4), color(255, 150, 0));
      this.trail.push(p);
    }
  }

  update() {
    this.x += this.speed / 2;
    this.y += this.speed;

    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].update();
    }

    let p = new Particle(this.x, this.y, random(2, 4), color(255, 150, 0));
    this.trail.push(p);

    if (this.trail.length > 20) {
      this.trail.splice(0, 1);
    }
  }

  display() {
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].display();
      
    }

    stroke(255);
    noFill();
    strokeWeight(this.size);
    point(this.x, this.y);
  }
}

class Particle {
  constructor(x, y, speed, color) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.color = color;
    this.alpha = 255;
    this.size = random(5, 10);
  }

  update() {
    this.y += this.speed;
    this.alpha -= 5;
  }

  display() {
    stroke(red(this.color), green(this.color), blue(this.color), this.alpha);
    noFill();
    strokeWeight(this.size);
    point(this.x, this.y);
  }

  isDead() {
    return this.alpha < 0;
  }
}
class Sun {
  constructor(x, y, size, color) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    this.isGlowing = true;
  }

  display() {
    if (this.isGlowing) {
      this.color.setAlpha(random(150, 200));
      this.size = random(195, 205);
    } else {
      this.color.setAlpha(random(50, 100));
      this.size = random(190, 200);
    }
    fill(this.color);
    noStroke();
    ellipse(this.x, this.y, this.size);
    this.isGlowing = !this.isGlowing;
  }
}
class Alien {
  handleClick() {
    if (dist(mouseX, mouseY, this.x, this.y) < this.size / 2) {
      // play scream sound effect
      this.screamSynth.triggerAttackRelease("B5", "16n");
      kills++;
      this.reset();
    }
  }
  
  constructor(x, y, speed, size, color, screamSynth) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.size = size;
    this.color = color;
    this.screamSynth = screamSynth; // store the screamSynth // flag to indicate if the alien was clicked
  }
  
  update() {
  this.y += this.speed;
  if (this.y > height) {
  this.color = color(0, 255, 0); // reset color when the alien exits the screen
  this.clicked = false; // reset clicked flag
  }
  }
  
  display() {
  fill(this.color);
  ellipse(this.x, this.y, this.size);
  }
  
  checkClicked(x, y) {
    
  let d = dist(x, y, this.x, this.y);
  if (d < this.size / 2) {
  if (!this.clicked) { // check if the alien wasn't clicked before
  this.color = color(255, 0, 0);
  
  this.clicked = true;
  kills++;
  screamSynth.triggerAttackRelease("G5", "8n");
  
  }
  }
  }
 
  
  }
  
  function mousePressed() {
  for (let i = 0; i < aliens.length; i++) {
  aliens[i].checkClicked(mouseX, mouseY);
  
  }
  let buttonState = digitalRead(buttonPin);
  if (buttonState === LOW) {
    for (let i = 0; i < meteors.length; i++) {
      let d = dist(meteors[i].x, meteors[i].y, mouseX, mouseY);
      if (d < meteors[i].size / 2) {
        kills++;
        kills += 5; // Add 5 extra points
        meteors.splice(i, 1);
        meteorSynth.triggerAttackRelease("C4", "8n");
        break;
      }
    }
  }

  } 
