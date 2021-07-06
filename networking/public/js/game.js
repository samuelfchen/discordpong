const canvas = document.getElementById('mycanvas');

const WHITE = 0xFFFFFF;
const BLUE = 0x0000FF;

let draw = false, timeout = false, data = [];

const app = new PIXI.Application({
    view: canvas,
    width: 600,
    height: 600
});

// Socket stuff
var socket = io('http://localhost:3000', { transports: ['websocket', 'polling', 'flashsocket'] });
socket.on('mouse', 
    function(data) {
        for (let i = 0; i < data.length; i++) {
            drawCircle(data[i].x, data[i].y, BLUE);
        }
    }
);

let interaction = app.renderer.plugins.interaction;

let drawCircle = (x, y, color) => {
    let gr = new PIXI.Graphics();
        gr.beginFill(color);
        gr.lineStyle(0);
        gr.drawCircle(x,y,20);
        gr.endFill();
    app.stage.addChild(gr);
}

let mouseDown = () => {
    draw = true;
}

let mouseUp = () => {
    draw = false;
}

let unlock = () => {
    timeout = false;
}

let mouseMove = () => {
    if (draw && !timeout) {
        timeout = true;
        setTimeout(unlock, 1);
        var pos = app.renderer.plugins.interaction.mouse.global;
        data.push({x: pos.x, y: pos.y});

        drawCircle(pos.x, pos.y, WHITE);
    }
}


app.renderer.plugins.interaction.on('pointerdown', mouseDown);
app.renderer.plugins.interaction.on('pointerup', mouseUp);
app.renderer.plugins.interaction.on('pointermove', mouseMove);

let transmit = () => {
    // Send that object to the socket
    if (data.length > 0) {
        socket.emit('mouse',data);
        data = [];
    }
}

app.ticker.add(transmit);
