<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Cedula");
header("Content-Type: application/json");

// Requerimientos del proyecto
require_once("../config/conexion.php");
require_once("../models/pelicula.php");

// Configuración del cifrado
define("CIFRADO", "aes-256-ecb");

// Inicialización de clases y variables
$conectar = new Conectar();
$pdo = $conectar->conectar_bd(); 
$peliculas = new Pelicula($pdo); 

// Obtener todas las cabeceras
$headers = getallheaders();

// Obtener la cédula del encabezado
$cedula = $headers['X-Cedula'] ?? null;

// Validación de la cédula
if (!$cedula) {
    http_response_code(400);
    echo json_encode(["error" => "Cédula no proporcionada"]);
    exit;
}

// Función para buscar la contraseña en la base de datos
function obtener_contrasena_por_cedula($cedula) {
    global $pdo; // Conexión PDO
    $query = "SELECT Contraseña FROM usuarios WHERE Cedula = :cedula";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':cedula', $cedula, PDO::PARAM_STR);
    $stmt->execute();
    $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
    return $resultado ? $resultado['Contraseña'] : null;
}

// Obtener la contraseña correspondiente a la cédula
$contraseña = obtener_contrasena_por_cedula($cedula);
if (!$contraseña) {
    http_response_code(400);
    echo json_encode(["error" => "Cédula inválida o no registrada"]);
    exit;
}

// Obtener el método de la solicitud
$method = $_SERVER['REQUEST_METHOD'];

// Intentar obtener y desencriptar el cuerpo del mensaje si no es GET
if ($method !== 'GET') {
    $body_encriptado = file_get_contents("php://input"); // Cuerpo de la solicitud

    // Función para desencriptar JSON
    function desencriptar_json($json_encriptado, $clave) {
        $json_desencriptado = openssl_decrypt(
            base64_decode($json_encriptado),
            CIFRADO,
            $clave,
            OPENSSL_RAW_DATA
        );
        return $json_desencriptado ? json_decode($json_desencriptado, true) : null;
    }

    // Intentar desencriptar el cuerpo del mensaje
    $body = desencriptar_json($body_encriptado, $contraseña);
    if (!$body) {
        http_response_code(400);
        echo json_encode(["error" => "Error al desencriptar el JSON o clave incorrecta"]);
        exit;
    }
}

try {
    switch ($method) {
        case "GET":
            // Obtener la lista de películas
            $peliculas_lista = $peliculas->obtener_peliculas();
            $json_peliculas = json_encode($peliculas_lista);

            // Cifrar los datos
            $datos_cifrados = openssl_encrypt(
                $json_peliculas,
                CIFRADO,
                $contraseña,
                OPENSSL_RAW_DATA
            );

            // Codificar en Base64
            echo base64_encode($datos_cifrados);
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
?>
