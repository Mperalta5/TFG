import com.sun.net.httpserver.HttpServer;
import java.io.OutputStream;
import java.net.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

public class NodeMain {

    public static void main(String[] args) throws Exception {

        String id = args[0];
        int port = Integer.parseInt(args[1]);

        int initialMushrooms = Integer.parseInt(args[2]);

        int[] mushrooms = {initialMushrooms};
        boolean[] snapshotStarted = {false};

        int[] recordedState = {-1};
        List<String> channelState = new ArrayList<>();

        System.out.println(id + " iniciado con " + mushrooms[0] + " 🍄 en puerto " + port);
        sendState(id, mushrooms[0]);
        Map<String, Integer> ports = Map.of(
                "mario", 5001,
                "luigi", 5002,
                "toad", 5003
        );

        // SERVIDOR PARA RECIBIR SETAS
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        server.createContext("/receive", exchange -> {
            if ("POST".equals(exchange.getRequestMethod())) {

                new Thread(() -> {
                    try {

                        Thread.sleep(1200);

                        mushrooms[0]++;

                        sendState(id, mushrooms[0]);

                        System.out.println(id + " recibió 🍄 → ahora tiene: " + mushrooms[0]);

                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }).start();

                System.out.println(id + " recibió 🍄 → ahora tiene: " + mushrooms[0]);

                exchange.sendResponseHeaders(200, 0);
                exchange.getResponseBody().close();
            }
        });
        server.createContext("/marker", exchange -> {

            if ("POST".equals(exchange.getRequestMethod())) {

                if (!snapshotStarted[0]) {

                    snapshotStarted[0] = true;

                    recordedState[0] = mushrooms[0];

                    System.out.println("📸 SNAPSHOT " + id + " = " + recordedState[0]);

                    // reenviar markers
                    for (String node : nodes) {

                        if (!node.equals(id)) {

                            sendMarker(node, ports.get(node));
                        }
                    }
                }

                exchange.sendResponseHeaders(200, 0);
                exchange.getResponseBody().close();
            }
        });

        server.start();

        Random random = new Random();
        String[] nodes = {"mario", "luigi", "toad"};

        while (true) {
            ////////////////////////////
            if (id.equals("mario") && !snapshotStarted[0]) {

                Thread.sleep(10000);

                snapshotStarted[0] = true;

                recordedState[0] = mushrooms[0];

                System.out.println("📸 SNAPSHOT INICIADO EN " + id +
                        " = " + recordedState[0]);

                for (String node : nodes) {

                    if (!node.equals(id)) {

                        sendMarker(node, ports.get(node));
                    }
                }
            }
            ////////////////////////////

            Thread.sleep(2000);

            String target = nodes[random.nextInt(nodes.length)];

            if (target.equals(id)) continue;

            if (mushrooms[0] <= 0) continue;

            
            boolean success = sendToNode(target, ports.get(target));

            if (!success) {
                System.out.println(target + " no disponible ");
                continue;
            }

            // 👇 solo si ha funcionado
            mushrooms[0]--;
            sendState(id, mushrooms[0]);

            sendEvent(id, target, mushrooms[0]);

            System.out.println(id + " envía 🍄 a " + target + " → ahora tiene: " + mushrooms[0]);
        }
    }

  
    private static boolean sendToNode(String target, int port) {
        try {
            URL url = new URL("http://localhost:" + port + "/receive");

            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setConnectTimeout(500);

            conn.getOutputStream().write("{}".getBytes());

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
    private static void sendMarker(String target, int port) {

    try {

        URL url = new URL("http://localhost:" + port + "/marker");

        HttpURLConnection conn = (HttpURLConnection) url.openConnection();

        conn.setRequestMethod("POST");
        conn.setDoOutput(true);

        conn.getOutputStream().write("{}".getBytes());

        conn.getInputStream().close();

        System.out.println("📨 MARKER enviado a " + target);

    } catch (Exception e) {
        e.printStackTrace();
    }
    }

}