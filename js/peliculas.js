document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formPelicula");
    const tabla = document.getElementById("tablaPeliculas").querySelector("tbody");
    const btnAgregar = document.getElementById("btnAgregarPelicula");
    const btnEditar = document.getElementById("btnEditarPelicula");
    const btnEliminar = document.getElementById("btnEliminarPelicula");
    const btnLimpiar = document.getElementById("btnLimpiarPelicula");
    const filtro = document.getElementById("filtroPeliculas");

    const baseUrl = "http://localhost/examenwebiii/controller/api_peliculas.php";
    const cedula = "12345678"; // Reemplazar con la cédula real
    const clave = "clave_secreta"; // Reemplazar con la clave correspondiente

    // Cifrar datos con AES
    const cifrarDatos = (datos) => {
        const jsonString = JSON.stringify(datos);
        const encrypted = CryptoJS.AES.encrypt(jsonString, clave).toString();
        return btoa(encrypted);
    };

    // Desencriptar datos con AES
    const desencriptarDatos = (datosCifrados) => {
        const decoded = atob(datosCifrados);
        const decrypted = CryptoJS.AES.decrypt(decoded, clave);
        const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
        return JSON.parse(jsonString);
    };

    // Listar películas
    const listarPeliculas = async () => {
        const response = await fetch(baseUrl, { 
            method: "GET", 
            headers: { "Cedula": cedula } 
        });
        const datosCifrados = await response.text();
        peliculas = desencriptarDatos(datosCifrados);
        mostrarPeliculas(peliculas);
    };

    // Mostrar películas en la tabla
    const mostrarPeliculas = (peliculasFiltradas) => {
        tabla.innerHTML = peliculasFiltradas
            .map(
                (p) => `
            <tr data-id="${p.Id}">
                <td>${p.Titulo}</td>
                <td>${p.Genero}</td>
                <td>${p.Duracion}</td>
            </tr>
        `
            )
            .join("");
        agregarEventosTabla();
    };

    // Filtrar películas dinámicamente
    filtro.addEventListener("input", () => {
        const texto = filtro.value.toLowerCase();
        const peliculasFiltradas = peliculas.filter(
            (p) =>
                p.Titulo.toLowerCase().includes(texto) ||
                p.Genero.toLowerCase().includes(texto) ||
                p.Duracion.toString().includes(texto)
        );
        mostrarPeliculas(peliculasFiltradas);
    });

    // Función para agregar eventos a las filas de la tabla
    const agregarEventosTabla = () => {
        const filas = tabla.querySelectorAll("tr");
        filas.forEach((fila) => {
            fila.addEventListener("click", () => {
                filas.forEach((f) => f.classList.remove("selected"));
                fila.classList.add("selected");

                const id = fila.getAttribute("data-id");
                const [titulo, genero, duracion] = fila.querySelectorAll("td");

                form.PeliculaId.value = id;
                form.PeliculaTitulo.value = titulo.textContent;
                form.PeliculaGenero.value = genero.textContent;
                form.PeliculaDuracion.value = duracion.textContent;

                btnEditar.disabled = false;
                btnEliminar.disabled = false;
                btnAgregar.disabled = true;
            });
        });
    };

    // Agregar película
    btnAgregar.addEventListener("click", async () => {
        const data = {
            Titulo: form.PeliculaTitulo.value,
            Genero: form.PeliculaGenero.value,
            Duracion: form.PeliculaDuracion.value,
        };
        const bodyCifrado = cifrarDatos(data);
        await fetch(baseUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Cedula": cedula },
            body: bodyCifrado,
        });
        form.reset();
        listarPeliculas();
    });

    // Editar película
    btnEditar.addEventListener("click", async () => {
        const data = {
            Id: form.PeliculaId.value,
            Titulo: form.PeliculaTitulo.value,
            Genero: form.PeliculaGenero.value,
            Duracion: form.PeliculaDuracion.value,
        };
        const bodyCifrado = cifrarDatos(data);
        await fetch(baseUrl, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Cedula": cedula },
            body: bodyCifrado,
        });
        form.reset();
        btnEditar.disabled = true;
        btnEliminar.disabled = true;
        btnAgregar.disabled = false;
        listarPeliculas();
    });

    // Eliminar película
    btnEliminar.addEventListener("click", async () => {
        const confirmar = confirm("¿Estás seguro de que deseas eliminar esta película?");
        if (confirmar) {
            const data = { Id: form.PeliculaId.value };
            const bodyCifrado = cifrarDatos(data);
            await fetch(baseUrl, {
                method: "DELETE",
                headers: { "Content-Type": "application/json", "Cedula": cedula },
                body: bodyCifrado,
            });
            form.reset();
            btnEditar.disabled = true;
            btnEliminar.disabled = true;
            btnAgregar.disabled = false;
            listarPeliculas();
        }
    });

    // Limpiar formulario
    btnLimpiar.addEventListener("click", () => {
        form.reset();
        btnEditar.disabled = true;
        btnEliminar.disabled = true;
        btnAgregar.disabled = false;
        tabla.querySelectorAll("tr").forEach((f) => f.classList.remove("selected"));
    });

    // Inicialización
    listarPeliculas();
});
