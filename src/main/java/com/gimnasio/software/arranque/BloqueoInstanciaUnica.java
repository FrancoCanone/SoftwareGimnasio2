package com.gimnasio.software.arranque;

import java.io.File;
import java.io.RandomAccessFile;
import java.nio.channels.FileChannel;
import java.nio.channels.FileLock;

public class BloqueoInstanciaUnica {

    // Mantenemos estas referencias vivas como estaticas: si se "cierran" (garbage collection),
    // Windows libera el bloqueo antes de tiempo. Al ser estaticas, viven mientras viva el programa.
    private static RandomAccessFile archivo;
    private static FileChannel canal;
    private static FileLock bloqueo;

    public static boolean intentarTomarControl() {
        try {
            File carpeta = new File(System.getProperty("user.home"), ".imagengym");
            if (!carpeta.exists()) {
                carpeta.mkdirs();
            }
            File archivoBloqueo = new File(carpeta, "imagengym.lock");

            archivo = new RandomAccessFile(archivoBloqueo, "rw");
            canal = archivo.getChannel();
            bloqueo = canal.tryLock();

            return bloqueo != null;
        } catch (Exception e) {
            // Si algo falla al intentar tomar el bloqueo, dejamos que arranque igual
            // (mejor arrancar de mas que directamente no arrancar nunca)
            return true;
        }
    }
}
