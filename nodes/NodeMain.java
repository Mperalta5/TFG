import com.sun.net.httpserver.HttpServer;
import java.io.OutputStream;
import java.net.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.HashSet;
import java.util.Set;

public class NodeMain {

    public static void main(String[] args) throws Exception {

        String id = args[0];
        int port = Integer.parseInt(args[1]);

        int initialMushrooms = Integer.parseInt(args[2]);

        int[] mushrooms = {initialMushrooms};
        boolean[] snapshotStarted = {false};
        boolean[] snapshotCompleted = {false};
        boolean[] snapshotTriggered = {false};
        boolean[] globalSnapshotPrinted = {false};

        int[] recordedState = {-1};
        Map<String, List<String>> channelStates = new HashMap<>();
        Set<String> markersReceived = new HashSet<>();
        Map<String, Integer> globalSnapshot = new HashMap<>();
        Map<String, String> globalChannels = new HashMap<>();
        //System.out.println("📡 MARKER RECIBIDO DESDE: " + sender);
        //System.out.println("📡 MARKERS: " + markersReceived);

        System.out.println(id + " iniciado con " + mushrooms[0] + " 🍄 en puerto " + port);
        sendState(id, mushrooms[0]);
        Map<String, Integer> ports = Map.of(
                "mario", 5001,
                "luigi", 5002,
                "toad", 5003
        );
        String[] nodes = {"mario", "luigi", "toad"};
        for (String node : nodes) {

            if (!node.equals(id)) {

                String channel = node + "->" + id;

                channelStates.put(channel, new ArrayList<>());
            }
        }


        // SERVIDOR PARA RECIBIR SETAS
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        server.createContext("/receive", exchange -> {
            if ("POST".equals(exchange.getRequestMethod())) {
                String query = exchange.getRequestURI().getQuery();

                String sender = query.split("=")[1];
                
                try {

                    //Thread.sleep(1200);

                    //mushrooms[0]++;

                    String channel = sender + "->" + id;

                    if (snapshotStarted[0] && !markersReceived.contains(channel)) {

                        channelStates.get(channel).add("🍄");

                        System.out.println(
                            "🧺 MENSAJE EN TRÁNSITO capturado en " + id
                        );
                    }

                    mushrooms[0]++;

                    sendState(id, mushrooms[0]);

                    System.out.println(
                        id + " recibió 🍄 → ahora tiene: "
                        + mushrooms[0]
                    );

                } catch (Exception e) {

                    e.printStackTrace();
                }

                //System.out.println(id + " recibió 🍄 → ahora tiene: " + mushrooms[0]);

                exchange.sendResponseHeaders(200, 0);
                exchange.getResponseBody().close();
            }
        });
        server.createContext("/marker", exchange -> {

            if ("POST".equals(exchange.getRequestMethod())) {
                String query = exchange.getRequestURI().getQuery();

                String sender = query.split("=")[1];

                System.out.println("📡 MARKER RECIBIDO DESDE: " + sender);

                String channel = sender + "->" + id;

                //markersReceived.add(channel);

                //System.out.println("📡 MARKERS: " + markersReceived);

                // ✅ comprobar si snapshot terminó

                

                if (!snapshotStarted[0]) {
                    markersReceived.clear();

                    for (List<String> channels : channelStates.values()) {
                        channels.clear();
                    }

                    snapshotCompleted[0] = false;

                    snapshotStarted[0] = true;

                    recordedState[0] = mushrooms[0];

                    System.out.println("📸 SNAPSHOT " + id + " = " + recordedState[0]);
                    // reenviar markers
                    for (String node : nodes) {

                        if (!node.equals(id)) {

                            new Thread(() ->
                            sendMarker(id, node, ports.get(node))).start();
                        }
                    }
                }
                markersReceived.add(channel);

                System.out.println("📡 MARKERS: " + markersReceived);
                if (!snapshotCompleted[0] && markersReceived.size() == channelStates.size()) {

                    snapshotCompleted[0] = true;
                    snapshotStarted[0] = false;

                    System.out.println("✅ SNAPSHOT COMPLETADO EN " + id);

                    System.out.println("📸 ESTADO FINAL = " + recordedState[0]);

                    System.out.println("🧺 CANALES FINALES = " + channelStates);

                    if (!id.equals("mario")) {

                        sendSnapshotToInitiator(
                            id,
                            recordedState[0],
                            channelStates
                        );
                    }
                    if (id.equals("mario")) {

                        globalSnapshot.put(
                            id,
                            recordedState[0]
                        );

                        globalChannels.put(
                            id,
                            channelStates.toString()
                        );
                    }
                }

                exchange.sendResponseHeaders(200, 0);
                exchange.getResponseBody().close();
            }
        });
        server.createContext("/snapshot", exchange -> {

            if ("POST".equals(exchange.getRequestMethod())) {

                String body = new String(
                    exchange.getRequestBody().readAllBytes()
                );

                String node =
                    body.split("\"node\":\"")[1]
                        .split("\"")[0];

                int snapshot =
                    Integer.parseInt(
                        body.split("\"snapshot\":")[1]
                            .split(",")[0]
                );
                String channels =
                    body.split("\"channels\":\"")[1]
                        .split("\"")[0]
                        .replace("'", "\"");

                globalSnapshot.put(node, snapshot);
                globalChannels.put(node, channels);

                if (!globalSnapshotPrinted[0] &&globalSnapshot.size() == nodes.length &&globalChannels.size() == nodes.length) {
                    globalSnapshotPrinted[0] = true;
                    System.out.println(
                        "🌍 SNAPSHOT GLOBAL FINAL = "
                        + globalSnapshot
                    );

                    System.out.println(
                        "🧺 TODOS LOS CANALES = "
                        + globalChannels
                    );

                    int total = 0;

                    for (int value : globalSnapshot.values()) {

                        total += value;
                    }

                    for (String channelState : globalChannels.values()) {

                        int channelMushrooms =
                            channelState.split("🍄", -1).length - 1;

                        total += channelMushrooms;
                    }

                    System.out.println(
                        "🍄 TOTAL GLOBAL = " + total
                    );
                }

                exchange.sendResponseHeaders(200, 0);
                exchange.getResponseBody().close();
            }
        });
        server.setExecutor(java.util.concurrent.Executors.newCachedThreadPool());

        server.start();

        Random random = new Random();
        

        while (true) {
            ////////////////////////////
            if (id.equals("mario") && !snapshotTriggered[0]) {

                snapshotTriggered[0] = true;

                Thread.sleep(10000);

                markersReceived.clear();

                for (List<String> channels : channelStates.values()) {
                    channels.clear();
                }

                snapshotCompleted[0] = false;

                snapshotStarted[0] = true;
                globalSnapshotPrinted[0] = false;

                recordedState[0] = mushrooms[0];

                /*for (String node : nodes) {

                    if (!node.equals(id)) {

                        String channel = node + "->" + id;

                        markersReceived.add(channel);
                    }
                }*/

                System.out.println("📸 SNAPSHOT INICIADO EN "+ id + " = " + recordedState[0]);

                //globalSnapshot.put(id, recordedState[0]);
                //globalChannels.put(id, channelStates.toString());

                for (String node : nodes) {

                    if (!node.equals(id)) {

                        new Thread(() ->
                            sendMarker(id, node, ports.get(node))
                        ).start();
                    }
                }
            }
            ////////////////////////////

            Thread.sleep(1200);

            String target = nodes[random.nextInt(nodes.length)];

            if (target.equals(id)) continue;

            if (mushrooms[0] <= 0) continue;

            
            mushrooms[0]--;

            sendState(id, mushrooms[0]);
            //Thread.sleep(1200);
            boolean success =
                sendToNode(id, target, ports.get(target));

            if (!success) {

                mushrooms[0]++;

                sendState(id, mushrooms[0]);

                System.out.println(target + " no disponible ");

                continue;
            }

            sendEvent(id, target, mushrooms[0]);

            System.out.println(
                id + " envía 🍄 a "
                + target
                + " → ahora tiene: "
                + mushrooms[0]
            );
        }
    }

  
    private static boolean sendToNode(String from, String target, int port) {
        try {
            URL url = new URL("http://localhost:" + port + "/receive?from=" + from);

            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setConnectTimeout(500);
            Thread.sleep(300);
            String json = String.format(
            "{\"from\":\"%s\"}",from);

            conn.getOutputStream().write(json.getBytes());

            int responseCode = conn.getResponseCode();

            return responseCode == 200;

        } catch (Exception e) {
            return false;
        }
    }

    //  ENVÍA EVENTO AL VISUALIZER
    private static void sendEvent(String from, String to, int mushrooms) {
        try {
            URL url = new URL("http://localhost:8080/event");

            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json");

            String json = String.format(
                    "{\"from\":\"%s\",\"to\":\"%s\",\"mushrooms\":%d}",
                    from, to, mushrooms
            );

            OutputStream os = conn.getOutputStream();
            os.write(json.getBytes());
            os.flush();

            conn.getInputStream().close();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    private static void sendState(String node, int mushrooms) {
    try {
        URL url = new URL("http://localhost:8080/event");

        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setConnectTimeout(1000);

        String json = String.format(
                "{\"node\":\"%s\",\"mushrooms\":%d}",
                node, mushrooms
        );

        try (OutputStream os = conn.getOutputStream()) {
            os.write(json.getBytes());
            os.flush();
        }

        int responseCode = conn.getResponseCode();
        System.out.println("STATE ENVIADO → " + node + " = " + mushrooms + " (" + responseCode + ")");

        conn.disconnect();

    } catch (Exception e) {
        e.printStackTrace();
    }
    }
    private static void sendMarker(String from, String target, int port) {

    try {

        URL url = new URL("http://localhost:" + port +"/marker?from=" + from);

        HttpURLConnection conn = (HttpURLConnection) url.openConnection();

        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        Thread.sleep(500);
        conn.getOutputStream().write("{}".getBytes());

        conn.getInputStream().close();

        System.out.println("📨 MARKER enviado a " + target);

    } catch (Exception e) {
        e.printStackTrace();
    }
    }
    private static void sendSnapshotToInitiator(String node, int snapshot, Map<String, List<String>> channels) {

        try {

            URL url = new URL(
                "http://localhost:5001/snapshot"
            );

            HttpURLConnection conn =
                (HttpURLConnection) url.openConnection();

            conn.setRequestMethod("POST");
            conn.setDoOutput(true);

            String json = String.format(
                "{\"node\":\"%s\",\"snapshot\":%d,\"channels\":\"%s\"}",
                node,
                snapshot,
                channels.toString().replace("\"", "'")
            );

            conn.getOutputStream().write(json.getBytes());

            conn.getInputStream().close();

        } catch (Exception e) {

            e.printStackTrace();
        }
    }

}