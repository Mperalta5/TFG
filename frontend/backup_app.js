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
        x: canvas.width / 2,
        y: 140,
        image: marioImage,
        mushrooms: 0
    },

    luigi: {
        x: 180,
        y: canvas.height - 230,
        image: luigiImage,
        mushrooms: 0
    },

    toad: {
        x: canvas.width - 180,
        y: canvas.height - 230,
        image: toadImage,
        mushrooms: 0
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
let snapshotText = "";
const pendingStates = [];
const mushroomImage = new Image();

mushroomImage.src = "public/carta.png";

const backgroundImage = new Image();

backgroundImage.src = "public/fondo.png?v=1";

const socket = new SockJS("http://localhost:8080/ws");

const stompClient = Stomp.over(socket);

stompClient.connect({}, () => {

    console.log("Conectado al WebSocket");

    stompClient.subscribe("/topic/events", (message) => {

        const event = JSON.parse(message.body);

        console.log("Evento recibido:", event);
        if (event.type === "snapshot") {

            snapshotText = event.content;

            return;
        }

        // actualizar estado nodo
        if (
            event.node &&
            event.mushrooms != null
        ) {

            pendingStates.push({

                node: event.node,

                mushrooms: Number(event.mushrooms),

                applyAt: Date.now() + 3500
            });

            return;
        }

        // seta visual
        if (event.type === "mushroom") {

            movingObjects.push({
                type: "mushroom",
                from: event.from,
                to: event.to,
                progress: 0
            });
        }

        // marker visual
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
    ctx.fillStyle = "#ffcc00";

    ctx.font = "24px Arial";

    ctx.fillText(
        "🍄 " + node.mushrooms,
        node.x,
        node.y - 80
    );
}
function drawSnapshotPanel() {

    const panelX = canvas.width - 700;

    const panelWidth = 660;
    const panelHeight = 420;
    const panelY = 20;


    // fondo
    ctx.fillStyle = "rgba(0,0,0,0.78)";

    ctx.fillRect(
        panelX,
        panelY,
        panelWidth,
        panelHeight
    );

    // borde
    ctx.strokeStyle = "#ffffff";

    ctx.lineWidth = 2;

    ctx.strokeRect(
        panelX,
        panelY,
        panelWidth,
        panelHeight
    );

    // texto
    ctx.fillStyle = "#ffffff";

    ctx.font = "22px monospace";

    const padding = 20;

    //const maxWidth = panelWidth - padding * 2;
    const maxWidth = panelWidth - 40;

    const lineHeight = 28;

    let currentY = panelY + 40;

    const lines = snapshotText.split("\n");

    for (const line of lines) {

        // wrap automático
        let currentLine = "";

        const words = line.split(" ");

        for (const word of words) {

            const testLine =
                currentLine + word + " ";

            const metrics =
                ctx.measureText(testLine);

            if (
                metrics.width > maxWidth &&
                currentLine !== ""
            ) {

                ctx.fillText(
                    currentLine,
                    panelX + padding + 320,
                    currentY
                );

                currentLine = word + " ";

                currentY += lineHeight;

            } else {

                currentLine = testLine;
            }
        }

        ctx.fillText(
            currentLine,
            panelX + padding + 200,
            currentY
        );

        currentY += lineHeight;
    }
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
    // separación canales ida/vuelta
    let offset = 45;

    // invertir dirección opuesta
    if (
        (from === "luigi" && to === "mario") ||
        (from === "toad" && to === "mario") ||
        (from === "toad" && to === "luigi")
    ) {
        offset = -18;
    }

    const px = -uy * offset;
    const py = ux * offset;

    // desplazar línea
    /*const startX = start.x + px;
    const startY = start.y + py;

    const endX = end.x + px;
    const endY = end.y + py;
    */
   let extraX = 0;
    let extraY = 0;

    // mover mario <-> toad
    if (
        (from === "mario" && to === "toad") ||
        (from === "toad" && to === "mario")
    ) {
        extraX = 35;
        extraY = -35;
    }

    const startX =
        start.x + px + extraX;

    const startY =
        start.y + py + extraY;

    const endX =
        end.x + px + extraX;

    const endY =
        end.y + py + extraY;
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
    ctx.lineWidth = 4;

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
    obj.progress += 0.00476;

    if (obj.progress >= 1) {

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

    // dirección
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    const length = Math.sqrt(dx * dx + dy * dy);

    const ux = dx / length;
    const uy = dy / length;

    // offset canal
    let offset = 45;

    if (
        (obj.from === "luigi" && obj.to === "mario") ||
        (obj.from === "toad" && obj.to === "mario") ||
        (obj.from === "toad" && obj.to === "luigi")
    ) {
        offset = -18;
    }

    // perpendicular
    const px = -uy * offset;
    const py = ux * offset;
    let extraX = 0;
    let extraY = 0;

    if (
        (obj.from === "mario" && obj.to === "toad") ||
        (obj.from === "toad" && obj.to === "mario")
    ) {
        extraX = 35;
        extraY = -35;
    }
    // posición animada
    const x =
        start.x +px + extraX +
        (end.x - start.x) * obj.progress;

    const y =
        start.y +
        py +
        extraY +
        (end.y - start.y) * obj.progress;

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

    obj.progress += 0.00476;

    if (obj.progress >= 1) {

        const index =
            movingObjects.indexOf(obj);

        if (index > -1) {

            movingObjects.splice(index, 1);
        }
    }
}

function draw() {

    ctx.drawImage(
        backgroundImage,
        0,
        0,
        canvas.width,
        canvas.height
    );

    for (const [from, to] of channels) {
        drawArrow(from, to);
    }
    for (const obj of movingObjects) {
    drawMovingObject(obj);
    }
    for (const name in nodes) {
        drawNode(name, nodes[name]);
    }
    const now = Date.now();

    for (
        let i = pendingStates.length - 1;
        i >= 0;
        i--
    ) {

        const pending = pendingStates[i];

        if (now >= pending.applyAt) {

            nodes[pending.node].mushrooms =
                pending.mushrooms;

            pendingStates.splice(i, 1);
        }
    }
        drawSnapshotPanel();
        requestAnimationFrame(draw);
}
function triggerSnapshot() {

    fetch(

        "http://localhost:5001/triggerSnapshot",

        {

            method: "POST"

        }

    );

}

draw();