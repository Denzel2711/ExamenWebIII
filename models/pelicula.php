<?php
require_once("../config/conexion.php");

class Pelicula extends Conectar
{
    public function obtener_peliculas()
    {
        $conexion = parent::conectar_bd();
        $consulta = $conexion->prepare("SELECT * FROM peliculas WHERE Estado=1");
        $consulta->execute();
        return $consulta->fetchAll(PDO::FETCH_ASSOC);
    }

    public function insertar_pelicula($titulo, $genero, $duracion)
    {
        $conexion = parent::conectar_bd();
        $sql = "INSERT INTO peliculas (Titulo, Genero, Duracion, Estado) VALUES (?, ?, ?, 1)";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$titulo, $genero, $duracion]);
    }

    public function eliminar_pelicula($id)
    {
        $conexion = parent::conectar_bd();
        $sql = "UPDATE peliculas SET Estado=0 WHERE Id=?";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$id]);
    }

    public function actualizar_pelicula($id, $titulo, $genero, $duracion)
    {
        $conexion = parent::conectar_bd();
        $sql = "UPDATE peliculas SET Titulo=?, Genero=?, Duracion=? WHERE Id=?";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$titulo, $genero, $duracion, $id]);
    }
}
