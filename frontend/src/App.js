import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

function App() {

  const cyRef = useRef(null);
  //const nodeState = useRef({});
  const [counts, setCounts] = useState({});
  const total =
  (counts.mario || 0) +
  (counts.luigi || 0) +
  (counts.toad || 0);

  useEffect(() => {

    const cy = cytoscape({
      container: document.getElementById("cy"),

      elements: [
        { data: { id: "mario", img: "/mario.png", label: "" }, position: { x: 300, y: 100 } },
        { data: { id: "luigi", img: "/luigi.png", label: "" }, position: { x: 500, y: 400 } },
        { data: { id: "toad", img: "/toad.png", label: "" }, position: { x: 100, y: 400 } }
      ],

      style: [
        {
        selector: "node",
        style: {
          "background-image": "data(img)",
          "background-fit": "contain",
          "background-opacity": 0,
          "border-width": 0,

          width: 80,
          height: 80,

          "label": "data(label)",

          "text-valign": "top",        
          "text-halign": "center",

          "text-margin-y": -30,        

          "font-size": 20,
          "color": "#FFD700",
          "text-outline-color": "#000",
          "text-outline-width": 3
        }
      },
        {
          selector: ".mushroom",
          style: {
            "background-image": "url('/carta.png')",
            "background-fit": "contain",
            width: 30,
            height: 30,
            "z-index": 10
          }
        }
      ],

      layout: { name: "preset" }
    });

    cyRef.current = cy;

    // WEBSOCKET
    const socket = new SockJS("http://localhost:8080/ws");
    const stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {

      stompClient.subscribe("/topic/events", (msg) => {

        const event = JSON.parse(msg.body);

        
        console.log("EVENTO:", event);

        // animación de seta
        if (event.from && event.to) {
          animateMushroom(event);
        }

        // estado de setas
        if (event.node !== undefined) {
          setCounts(prev => ({
            ...prev,
            [event.node]: event.mushrooms
          }));
        }

      });

    });

  }, []);

  
  function animateMushroom(event) {

    const cy = cyRef.current;

    const source = cy.getElementById(event.from);
    const target = cy.getElementById(event.to);

    if (!source || !target) return;

    const sourcePos = source.position();
    const targetPos = target.position();

    const mushroom = cy.add({
      group: "nodes",
      position: { x: sourcePos.x, y: sourcePos.y },
      classes: "mushroom",
      selectable: false,
      grabbable: false
    });

    const midX = (sourcePos.x + targetPos.x) / 2;
    const midY = (sourcePos.y + targetPos.y) / 2 - 120;

    setTimeout(() => {

      mushroom.animate(
        { position: { x: midX, y: midY } },
        { duration: 600, easing: "ease-out" }
      );

      setTimeout(() => {
        mushroom.animate(
          { position: { x: targetPos.x, y: targetPos.y } },
          {
            duration: 600,
            easing: "ease-in",
            complete: () => mushroom.remove()
          }
        );
      }, 600);

    }, 50);
  }

  //  ACTUALIZAR CONTADORES
 /* function updateLabels() {

    const cy = cyRef.current;

    Object.keys(nodeState.current).forEach(id => {

      const node = cy.getElementById(id);

      if (node) {
        node.data("label", "🍄 " + nodeState.current[id]);
      }
    });
  }*/

  return (
    <div>
      <h2 style={{ textAlign: "center" }}>Sistema Distribuido 🍄</h2>
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,

          background: "rgba(20,20,20,0.85)",
          border: "2px solid #FFD700",
          boxShadow: "0 0 15px #000",

          color: "white",
          padding: "15px",
          borderRadius: "10px",
          fontSize: "18px",
          zIndex: 1000,
          minWidth: "170px"
        }}
      >
        <div>🍄 Mario: {counts.mario ?? "-"}</div>
        <div>🍄 Luigi: {counts.luigi ?? "-"}</div>
        <div>🍄 Toad: {counts.toad ?? "-"}</div>
        <hr />

        <div style={{
          marginTop: "10px",
          fontWeight: "bold",
          color: "#FFD700"
        }}>
          🌍 TOTAL GLOBAL: {total} 🍄
        </div>
      </div>
      <div
        style={{
          width: "100%",
          height: "90vh",
          backgroundImage: "url('/fondo.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      >
        <div
          id="cy"
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.1)"
          }}
        />
      </div>
    </div>
  );
}

export default App;