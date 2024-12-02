<?php
require_once("../config/conexion.php");

class Usuario extends Conectar
{
    public function obtener_clave_por_cedula($cedula)
    {
        $conexion = parent::conectar_bd();
        $consulta = $conexion->prepare("SELECT Contraseña FROM usuarios WHERE Cedula=?");
        $consulta->execute([$cedula]);
        return $consulta->fetchColumn();
    }
}