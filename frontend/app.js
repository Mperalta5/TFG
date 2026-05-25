const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const marioImage = new Image();
marioImage.src = "public/mario.png?v=1";

const luigiImage = new Image();
luigiImage.src = "public/luigi.png?v=1";

const toadImage = new Image();
toadImage.src = "public/toad.png?v=1";

const nodes = {

    mario: {
        x: 500,
        y: 120,
        image: marioImage
    },

    luigi: {
        x: 250,
        y: 450,
        image: luigiImage
    },

    toad: {
        x: 750,
        y: 450,
        image: toadImage
    }
};

const channels = [
    ["mario", "luigi"],
    ["luigi", "mario"],

    ["mario", "toad"],
    ["toad", "mario"],

    ["luigi", "toad"],
    ["toad", "luigi"]
];
const movingObjects = [];
const mushroomImage = new Image();

mushroomImage.src = "public/carta.png";

const socket = new SockJS("http://localhost:8080/ws");

const stompClient = Stomp.over(socket);

stompClient.connect({}, () => {

    console.log("Conectado al WebSocket");

    stompClient.subscribe("/topic/events", (message) => {

        const event = JSON.parse(message.body);

        console.log(
            "TIPO:",
            event.type,
            event
        );

        // ignorar estados
        if (!event.type) {
            return;
        }

        if (event.type === "mushroom") {

            movingObjects.push({
                type: "mushroom",
                from: event.from,
                to: event.to,
                progress: 0
            });
        }

        if (event.type === "marker") {

            movingObjects.push({
                type: "marker",
                from: event.from,
                to: event.to,
                progress: 0
            });
        }
    });
});

/*movingObjects.push({
    type: "mushroom",
    from: "mario",
    to: "luigi",
    progress: 0
});*/


function drawNode(name, node) {

    ctx.drawImage(
        node.image,
        node.x - 50,
        node.y - 50,
        100,
        100
    );

    ctx.fillStyle = "white";

    ctx.font = "20px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        name,
        node.x,
        node.y + 75
    );
}

function drawArrow(from, to) {

    const start = nodes[from];
    const end = nodes[to];

    // vector dirección
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    const length = Math.sqrt(dx * dx + dy * dy);

    const ux = dx / length;
    const uy = dy / length;

    // perpendicular para separar canales
    const offset = 12;

    const px = -uy * offset;
    const py = ux * offset;

    // desplazar línea
    const startX = start.x + px;
    const startY = start.y + py;

    const endX = end.x + px;
    const endY = end.y + py;

    // recortar para no entrar dentro del nodo
    const radius = 45;

    const lineStartX = startX + ux * radius;
    const lineStartY = startY + uy * radius;

    const lineEndX = endX - ux * radius;
    const lineEndY = endY - uy * radius;

    // dibujar línea
    ctx.beginPath();

    ctx.moveTo(lineStartX, lineStartY);
    ctx.lineTo(lineEndX, lineEndY);

    ctx.strokeStyle = "#777";
    ctx.lineWidth = 2;

    ctx.stroke();

    // dibujar flecha
    const arrowSize = 10;

    ctx.beginPath();

    ctx.moveTo(lineEndX, lineEndY);

    ctx.lineTo(
        lineEndX - ux * arrowSize - uy * arrowSize / 2,
        lineEndY - uy * arrowSize + ux * arrowSize / 2
    );

    ctx.lineTo(
        lineEndX - ux * arrowSize + uy * arrowSize / 2,
        lineEndY - uy * arrowSize - ux * arrowSize / 2
    );

    ctx.closePath();

    ctx.fillStyle = "#777";
    ctx.fill();
}
/*function drawMovingObject(obj) {

    const start = nodes[obj.from];
    const end = nodes[obj.to];

    const x =
        start.x + (end.x - start.x) * obj.progress;

    const y =
        start.y + (end.y - start.y) * obj.progress;

    /*ctx.beginPath();

    ctx.arc(x, y, 12, 0, Math.PI * 2);

    if (obj.type === "mushroom") {
        ctx.fillStyle = "orange";
    } else {
        ctx.fillStyle = "cyan";
    }

    ctx.fill();
////////////////////
    if (obj.type === "mushroom") {

        ctx.beginPath();

        ctx.arc(x, y, 12, 0, Math.PI * 2);

        ctx.fillStyle = "#ff9933";

        ctx.fill();

    } else if (obj.type === "marker") {

        ctx.fillStyle = "#999";

        ctx.fillRect(

            x - 10,

            y - 10,

            20,

            20

        );

        ctx.strokeStyle = "#ddd";

        ctx.lineWidth = 2;

        ctx.strokeRect(

            x - 10,

            y - 10,

            20,

            20

        );

    }
    obj.progress += 0.005;

    if (obj.progress > 1) {

    const index = movingObjects.indexOf(obj);

        if (index > -1) {
            movingObjects.splice(index, 1);
        }
    }
}*/
function drawMovingObject(obj) {

    console.log("DRAW TYPE:", obj.type);

    const start = nodes[obj.from];
    const end = nodes[obj.to];

    const x =
        start.x + (end.x - start.x) * obj.progress;

    const y =
        start.y + (end.y - start.y) * obj.progress;

    // MARKER
    if (String(obj.type).trim() === "marker") {

        ctx.fillStyle = "#b31414";

        ctx.fillRect(
            x - 10,
            y - 10,
            20,
            20
        );

        ctx.strokeStyle = "#ddd";

        ctx.lineWidth = 2;

        ctx.strokeRect(
            x - 10,
            y - 10,
            20,
            20
        );
    }

    // MUSHROOM
    else {

        ctx.drawImage(
            mushroomImage,
            x - 16,
            y - 16,
            32,
            32
        );
    }

    obj.progress += 0.005;

    if (obj.progress > 1) {

        const index =
            movingObjects.indexOf(obj);

        if (index > -1) {

            movingObjects.splice(index, 1);
        }
    }
}

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const [from, to] of channels) {
        drawArrow(from, to);
    }
    for (const obj of movingObjects) {
    drawMovingObject(obj);
    }
    for (const name in nodes) {
        drawNode(name, nodes[name]);
    }

    requestAnimationFrame(draw);
}

draw();