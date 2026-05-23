const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const nodes = {
    mario: { x: 500, y: 120, color: "#ff4d4d" },
    luigi: { x: 250, y: 450, color: "#4dff88" },
    toad:  { x: 750, y: 450, color: "#4da6ff" }
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

const socket = new SockJS("http://localhost:8080/ws");

const stompClient = Stomp.over(socket);

stompClient.connect({}, () => {

    console.log("Conectado al WebSocket");

    stompClient.subscribe("/topic/events", (message) => {

        const event = JSON.parse(message.body);

        console.log("Evento recibido:", event);

        // evento envío seta
        if (event.from && event.to) {

            movingObjects.push({
                type: "mushroom",
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

    ctx.beginPath();
    ctx.arc(node.x, node.y, 45, 0, Math.PI * 2);

    ctx.fillStyle = node.color;
    ctx.fill();

    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";

    ctx.fillText(name, node.x, node.y + 7);
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
function drawMovingObject(obj) {

    const start = nodes[obj.from];
    const end = nodes[obj.to];

    const x =
        start.x + (end.x - start.x) * obj.progress;

    const y =
        start.y + (end.y - start.y) * obj.progress;

    ctx.beginPath();

    ctx.arc(x, y, 12, 0, Math.PI * 2);

    if (obj.type === "mushroom") {
        ctx.fillStyle = "orange";
    } else {
        ctx.fillStyle = "cyan";
    }

    ctx.fill();

    obj.progress += 0.005;

    if (obj.progress > 1) {

    const index = movingObjects.indexOf(obj);

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