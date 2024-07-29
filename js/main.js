const canvas = document.getElementById('canvas');
const c = canvas.getContext('2d');

canvas.width = 1280;
canvas.height = 720;

const backgroundImage = new Image();
backgroundImage.src = '../img/bg.png';

class StarShip {
  constructor() {
    this.velocity = { x: 0, y: 0 };
    const image = new Image();
    image.src = '../img/ship.png';
    image.onload = () => {
      const scale = 0.07;
      this.image = image;
      this.width = image.width * scale;
      this.height = image.height * scale;
      this.position = {
        x: canvas.width / 2 - this.width / 2,
        y: canvas.height - this.height / 2 - this.height
      };
    };
  }

  draw() {
    if (this.image) {
      c.drawImage(
        this.image,
        this.position.x,
        this.position.y,
        this.width,
        this.height
      );
    }
  }

  moveLeft() {
    this.position.x -= 5;
    if (this.position.x < 0) {
      this.position.x = 0;
    }
  }

  moveRight() {
    this.position.x += 5;
    if (this.position.x + this.width > canvas.width) {
      this.position.x = canvas.width - this.width;
    }
  }
}

class Bullet {
  constructor(x, y, velocityY = -10) {
    this.position = { x, y };
    this.width = 5;
    this.height = 15;
    this.velocity = { x: 0, y: velocityY };
  }

  draw() {
    c.fillStyle = 'white';
    c.fillRect(
      this.position.x,
      this.position.y,
      this.width,
      this.height);
  }

  update() {
    this.position.y += this.velocity.y;
    this.draw();
  }
}

class Asteroid {
  constructor(x, y) {
    this.position = { x, y };
    this.radius = 60;
    const image = new Image();
    image.src = '../img/asteroid.png';
    image.onload = () => {
      this.image = image;
      this.width = image.width / 15;
      this.height = image.height / 15;
    };
  }

  draw() {
    if (this.image) {
      c.drawImage(
        this.image,
        this.position.x - this.width / 2,
        this.position.y - this.height / 2,
        this.width,
        this.height);
    }
  }
}

class Boss {
  constructor() {
    this.position = { x: canvas.width / 2, y: 150 };
    this.velocity = { x: 2, y: 0 };
    this.hp = 4;
    this.maxHp = 4;
    this.shootingCooldown = 0;
    const image = new Image();
    image.src = '../img/boss.png';
    image.onload = () => {
      this.image = image;
      this.width = image.width * 0.5;
      this.height = image.height * 0.5;
    };
  }

  draw() {
    if (this.image) {
      c.drawImage(this.image, this.position.x - this.width / 2, this.position.y - this.height / 2, this.width, this.height);
    }

    const barWidth = 200;
    const barHeight = 20;
    const barX = canvas.width / 2 - barWidth / 2;
    const barY = 20;

    c.fillStyle = 'black';
    c.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

    c.fillStyle = 'red';
    c.fillRect(barX, barY, barWidth * (this.hp / this.maxHp), barHeight);
    c.strokeStyle = 'white';
    c.strokeRect(barX, barY, barWidth, barHeight);

    c.fillStyle = 'white';
    c.font = '20px Arial';
    c.fillText('DeathStar', barX - 100, barY + barHeight / 2 + 5);

    c.fillText(`${this.hp}/${this.maxHp}`, barX + barWidth + 10, barY + barHeight / 2 + 5);
  }

  update() {
    this.position.x += this.velocity.x;
    if (this.position.x < 0 || this.position.x > canvas.width) {
      this.velocity.x *= -1;
    }
    this.shootingCooldown++;
    if (this.shootingCooldown > 120) {
      this.shoot();
      this.shootingCooldown = 0;
    }
    this.draw();
  }

  shoot() {
    bossBullets.push(new Bullet(this.position.x + this.width / 2 - 2.5, this.position.y + this.height / 2, 5));
  }
}

const player = new StarShip();
const bullets = [];
const bossBullets = [];
const asteroids = [];
const maxBullets = 10;
let bulletCount = 0;
let gameOver = false;
let timeLeft = 60;
let level = 1;
let boss;

for (let i = 0; i < 5; i++) {
  const x = Math.random() * (canvas.width - 40) + 20;
  const y = Math.random() * (canvas.height / 2);
  asteroids.push(new Asteroid(x, y));
}

const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

function animate() {
  if (gameOver) return;

  requestAnimationFrame(animate);
  c.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

  player.draw();

  if (keys['ArrowLeft']) player.moveLeft();
  if (keys['ArrowRight']) player.moveRight();
  if (keys[' '] && bulletCount < maxBullets) {
    const bullet = new Bullet(player.position.x + player.width / 2 - 2.5, player.position.y);
    bullets.push(bullet);
    bulletCount++;
    keys[' '] = false;
    updateAmmo();
  }

  bullets.forEach((bullet, index) => {
    bullet.update();
    if (bullet.position.y + bullet.height < 0) {
      bullets.splice(index, 1);
    }
  });

  if (level === 1) {
    asteroids.forEach((asteroid, aIndex) => {
      asteroid.draw();
      bullets.forEach((bullet, bIndex) => {
        if (hitTestRectangle(bullet, asteroid)) {
          bullets.splice(bIndex, 1);
          asteroids.splice(aIndex, 1);
          updateAmmo();
        }
      });
    });

    if (bulletCount === 10) {
      showMessage("YOU LOSE");
      gameOver = true;
    }

    if (asteroids.length === 0) {
      level = 2;
      bulletCount = 0;
      updateAmmo();
      boss = new Boss();
    }

  } else if (level === 2) {
    boss.update();
    bullets.forEach((bullet, bIndex) => {
      if (hitTestRectangle(bullet, boss)) {
        bullets.splice(bIndex, 1);
        boss.hp--;
        updateAmmo();
        console.log(`Boss HP after hit: ${boss.hp}`);

        if (boss.hp <= 0) {
          boss.hp = 0;
          updateAmmo();
          setTimeout(() => {
            showMessage("YOU WIN");
            gameOver = true;
          }, 100);
        }
      }
    });

    bossBullets.forEach((bullet, index) => {
      bullet.update();
      if (bullet.position.y > canvas.height) {
        bossBullets.splice(index, 1);
      } else if (hitTestRectangle(bullet, player)) {
        showMessage("YOU LOSE");
        gameOver = true;
      }
    });

    bullets.forEach((playerBullet, pIndex) => {
      bossBullets.forEach((bossBullet, bIndex) => {
        if (hitTestRectangle(playerBullet, bossBullet)) {
          bullets.splice(pIndex, 1);
          bossBullets.splice(bIndex, 1);
        }
      });
    });

    if (bulletCount >= maxBullets && bullets.length === 0) {
      console.log(bulletCount)
      showMessage("YOU LOSE");
      gameOver = true;
    }
  }
}

function hitTestRectangle(r1, r2) {
  const dx = r1.position.x - r2.position.x;
  const dy = r1.position.y - r2.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (r2.width / 2 + r1.width / 2);
}

function showMessage(text) {
  c.fillStyle = 'white';
  c.font = '72px Arial';
  c.fillText(text, canvas.width / 2 - c.measureText(text).width / 2, canvas.height / 2);
}

const timerText = document.getElementById('timer');
const ammoText = document.getElementById('ammo');
const hpText = document.getElementById('hp');

function updateAmmo() {
  ammoText.textContent = `Ammo: ${maxBullets - bulletCount}/10`;
}

const timer = setInterval(() => {
  if (gameOver) {
    clearInterval(timer);
    return;
  }
  timeLeft--;
  timerText.textContent = `Time: ${timeLeft}s`;

  if (timeLeft <= 0) {
    clearInterval(timer);
    showMessage("YOU LOSE");
    gameOver = true;
  }
}, 1000);

updateAmmo();
animate();