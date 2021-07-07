import config from './config.js';

class GameState {
    constructor(app, playerNum, socket) {
        this.app = app;
        this.socket = socket;

        this.bullet = new Bullet(app, app.loader.resources.bullet.texture);
        this.player = new Player(
                        app,
                        app.loader.resources.player.texture, 
                        playerNum,
                        keyboard(config.p1Input[0]), 
                        keyboard(config.p1Input[1]), 
                        config.p1Computer
                    );
        this.enemy = new Enemy(
                        app,
                        app.loader.resources.enemy.texture, 
                        playerNum === 1 ? 2 : 1,
                        config.p2Computer
                    ); 
        
        // allocate p1 and p2
        this.p1 = this.player;
        this.p2 = this.enemy;

        if (this.player.side == 1) {
            this.p1 = this.player;
            this.p2 = this.enemy;
        } else {
            this.p1 = this.enemy;
            this.p2 = this.player;
        }
                

        app.stage.addChild(this.bullet);
        app.stage.addChild(this.player);
        app.stage.addChild(this.enemy);

        // Score display
        // let scoreStyle = new PIXI.TextStyle({
        //     fontSize: 36,
        //     fill: "white",
        // })

        // this.p1Display = new PIXI.Text(player, scoreStyle);
        // p1Display.anchor.x = 1;
        // p1Display.position.set(370, 10);
        // p2Display = new PIXI.Text(p2Score, scoreStyle);
        // p2Display.position.set(430, 10);
        // app.stage.addChild(p1Display);
        // app.stage.addChild(p2Display);

    }   

    emitBullet() {
        this.socket.emit('bulletUpdate', {
            x : this.bullet.x,
            y : this.bullet.y,
            vx : this.bullet.vx,
            vy : this.bullet.vy
        });
    }

    paddleCollision(b, p) {
        if (
            ((b.y + (b.height / 2)) > (p.y - (p.height / 2))) &&
            ((b.y - (b.height / 2)) < (p.y + (p.height / 2))) &&
            (b.x - (b.width / 2)) < (p.x + (p.width / 2)) &&
            (b.x + (b.width / 2)) > (p.x - (p.width / 2))  
        ) {                
            // Calculate new velocities
            let dist = (p.y - b.y) / (p.height / 1.5);
            let bounceAngle = dist * config.maxAngle;

            let mult = p.side === 1 ? 1 : -1;

            b.vx = config.ballSpeed*mult*Math.cos(bounceAngle);
            b.vy = config.ballSpeed*-Math.sin(bounceAngle);

            b.x += b.vx * config.ballSpeed; // Help out direction change 

            console.log(b);

            console.log(b.vx + " " + b.vy);

            console.log('boing');
            this.emitBullet();
        }
    }

    checkWin() {
        if (this.bullet.x - this.bullet.width / 2 < 0 || this.bullet.x + this.bullet.width / 2 > this.app.renderer.width) {
            // Find the closest paddle and add score to other player
            let d1 = Math.abs(this.bullet.x - this.player.x);
            let d2 = Math.abs(this.bullet.x - this.enemy.x);

            if (d1 > d2) {
                this.player.score ++;
            } else {
                this.enemy.score ++;
            }
            
            this.bullet.reset();
            this.emitBullet();
        }
    }

    tick() {
        this.bullet.tick();
        this.player.tick();
        this.enemy.tick(this.bullet);

        if (this.bullet.x < this.app.renderer.width / 2) {
            this.paddleCollision(this.bullet, this.p1);
        } else {
            this.paddleCollision(this.bullet, this.p2);
        }

        this.checkWin();

        
    }

}

class Bullet extends PIXI.Sprite {
    constructor(app, texture) {
        super(texture);
        this.app = app;

        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        
        this.reset(1);
    }

    reset(winSide) {
        // Serve to opposite side
        let direction = winSide === 2 ? -1 : 1;

        let angle = (Math.random() - 0.5) * 0.5;
        this.x = this.app.renderer.width / 2;
        this.y = this.app.renderer.height / 2;
        this.vx = config.ballSpeed * direction * Math.cos(angle); 
        this.vy = config.ballSpeed * -Math.sin(angle);
    }

    tick() {
        // Bounce off ceiling and floor 
        if (this.y - this.height / 2 < 0 || this.y + this.height / 2 > this.app.renderer.height) {
            this.vy *= -1
            if (this.y < 0) {
                this.y = 0 + this.height;
            }

            if (this.y > this.app.renderer.height) {
                this.y = this.app.renderer.height - this.height;
            }
        }

        this.x += this.vx;
        this.y += this.vy;
    }
}

class Paddle extends PIXI.Sprite {
    constructor(app, texture, side) {
        super(texture);

        this.anchor.x = 0.5;
        this.anchor.y = 0.5;

        this.vy = 0;

        this.side = side;

        this.app = app;

        this.score = 0;

        if (side === 1) {
            this.x = config.playerX;
        } else {
            this.x = app.renderer.width - config.playerX;
        }

        this.y = app.renderer.height / 2;
    }

    tick() {
        let nextY = this.y + this.vy;

        if (nextY - this.height / 2 > 0 && nextY + this.height / 2 < this.app.renderer.height) {
            this.y += this.vy;
        }
    }
}

class Player extends Paddle { 
    constructor(app, texture, side, upKey, downKey) {
        super(app, texture, side);

        upKey.press = downKey.release = () => { this.vy -= config.playerVel; }
        upKey.release = downKey.press = () => { this.vy += config.playerVel; }
    }
}

class Enemy extends Paddle {
    constructor (app, texture, side) {
        super(app, texture, side);
    }

    tick() {
    }
}

export { GameState, Player, Enemy, Bullet };