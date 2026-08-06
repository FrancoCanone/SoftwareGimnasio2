package com.gimnasio.software.actualizacion;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class ActualizacionService {

    @Value("${app.version}")
    private String versionActual;

    @Value("${actualizacion.repositorio}")
    private String repositorio;

    private volatile String versionRemota;
    private volatile boolean descargando = false;
    private volatile boolean listaParaInstalar = false;
    private volatile String rutaInstalador;
    private volatile String error;

    private final HttpClient cliente = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    @Scheduled(initialDelay = 30000, fixedRate = 3600000)
    public void chequearActualizacion() {
        try {
            error = null;
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.github.com/repos/" + repositorio + "/releases/latest"))
                    .header("Accept", "application/vnd.github+json")
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> respuesta = cliente.send(request, HttpResponse.BodyHandlers.ofString());
            if (respuesta.statusCode() != 200) {
                error = "No se pudo consultar actualizaciones (HTTP " + respuesta.statusCode() + ")";
                return;
            }

            JsonNode json = mapper.readTree(respuesta.body());
            String tag = json.path("tag_name").asText("").replaceFirst("^v", "");

            if (tag.isBlank() || !esVersionMasNueva(tag, versionActual)) {
                versionRemota = null;
                return;
            }

            String urlDescarga = null;
            for (JsonNode asset : json.path("assets")) {
                String nombre = asset.path("name").asText("");
                if (nombre.toLowerCase().endsWith(".exe")) {
                    urlDescarga = asset.path("browser_download_url").asText();
                    break;
                }
            }

            if (urlDescarga == null) {
                error = "Hay una version nueva (" + tag + ") pero no tiene un .exe adjunto en la Release";
                return;
            }

            versionRemota = tag;

            if (!listaParaInstalar) {
                descargarInstalador(urlDescarga, tag);
            }
        } catch (Exception e) {
            error = "No se pudo chequear actualizaciones: " + e.getMessage();
        }
    }

    private void descargarInstalador(String url, String version) {
        descargando = true;
        File destino = null;
        try {
            File carpeta = new File(System.getProperty("user.home"), ".imagengym/actualizaciones");
            carpeta.mkdirs();
            destino = new File(carpeta, "ImagenGym-" + version + ".exe");

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofMinutes(5))
                    .build();

            HttpResponse<java.nio.file.Path> respuesta =
                    cliente.send(request, HttpResponse.BodyHandlers.ofFile(destino.toPath()));

            if (respuesta.statusCode() != 200 || destino.length() < 1_000_000) {
                destino.delete();
                error = "La descarga parece incompleta o invalida (HTTP " + respuesta.statusCode()
                        + ", " + destino.length() + " bytes). Se descarta y se reintenta en el proximo chequeo.";
                return;
            }

            rutaInstalador = destino.getAbsolutePath();
            listaParaInstalar = true;
            System.out.println("Actualizacion " + version + " descargada y lista para instalar.");
        } catch (Exception e) {
            if (destino != null) destino.delete();
            error = "No se pudo descargar la actualizacion: " + e.getMessage();
        } finally {
            descargando = false;
        }
    }

    private boolean esVersionMasNueva(String remota, String local) {
        String[] r = remota.split("\\.");
        String[] l = local.split("\\.");
        int max = Math.max(r.length, l.length);
        for (int i = 0; i < max; i++) {
            int rv = i < r.length ? parseSeguro(r[i]) : 0;
            int lv = i < l.length ? parseSeguro(l[i]) : 0;
            if (rv != lv) return rv > lv;
        }
        return false;
    }

    private int parseSeguro(String s) {
        try {
            return Integer.parseInt(s.replaceAll("[^0-9]", ""));
        } catch (Exception e) {
            return 0;
        }
    }

    public String getVersionActual() { return versionActual; }
    public String getVersionRemota() { return versionRemota; }
    public boolean isDescargando() { return descargando; }
    public boolean isListaParaInstalar() { return listaParaInstalar; }
    public String getError() { return error; }
    public String getRutaInstalador() { return rutaInstalador; }
}