<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, Cedula");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

require_once("../config/conexion.php");
require_once("../models/pelicula.php");
require_once("../models/usuario.php");

define("CIFRADO", "aes-256-ecb");

$peliculas = new Pelicula();
$usuarios = new Usuario();
$cedula = $_SERVER["HTTP_CEDULA"] ?? null;
$body_encriptado = file_get_contents("php://input");

function desencriptar_json($json_encriptado, $clave)
{
    $json_desencriptado = openssl_decrypt(base64_decode($json_encriptado), CIFRADO, $clave, OPENSSL_RAW_DATA);
    return $json_desencriptado ? json_decode($json_desencriptado, true) : null;
}

if (!$cedula) {
    http_response_code(400);
    echo json_encode(["error" => "Cédula no proporcionada"]);
    exit;
}

$clave = $usuarios->obtener_clave_por_cedula($cedula);

if (!$clave) {
    http_response_code(400);
    echo json_encode(["error" => "Cédula inválida"]);
    exit;
}

$body = desencriptar_json($body_encriptado, $clave);

if (!$body) {
    http_response_code(400);
    echo json_encode(["error" => "Error al desencriptar el JSON o contraseña inválida"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case "GET":
            echo json_encode($peliculas->obtener_peliculas());
            break;

        case "POST":
            if (!isset($body["Titulo"], $body["Genero"], $body["Duracion"])) {
                throw new Exception("Faltan datos para insertar la película");
            }
            $peliculas->insertar_pelicula($body["Titulo"], $body["Genero"], $body["Duracion"]);
            echo json_encode(["mensaje" => "Película agregada"]);
            break;

        case "PUT":
            if (!isset($body["Id"], $body["Titulo"], $body["Genero"], $body["Duracion"])) {
                throw new Exception("Faltan datos para actualizar la película");
            }
            $peliculas->actualizar_pelicula($body["Id"], $body["Titulo"], $body["Genero"], $body["Duracion"]);
            echo json_encode(["mensaje" => "Película actualizada"]);
            break;

        case "DELETE":
            if (!isset($body["Id"])) {
                throw new Exception("Falta el ID para eliminar la película");
            }
            $peliculas->eliminar_pelicula($body["Id"]);
            echo json_encode(["mensaje" => "Película eliminada"]);
            break;

        default:
            http_response_code(405);
            echo json_encode(["error" => "Método no permitido"]);
            break;
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["error" => $e->getMessage()]);
}
