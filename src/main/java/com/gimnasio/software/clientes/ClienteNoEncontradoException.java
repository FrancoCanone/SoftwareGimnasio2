package com.gimnasio.software.clientes;

public class ClienteNoEncontradoException extends RuntimeException {
    public ClienteNoEncontradoException(String mensaje) { super(mensaje); }
}