document.addEventListener("DOMContentLoaded", () => {
    // Referencias a los elementos del formulario y botones
    const form = document.getElementById("formPelicula");
    const tabla = document.getElementById("tablaPeliculas").querySelector("tbody");
    const btnAgregar = document.getElementById("btnAgregarPelicula");
    const btnEditar = document.getElementById("btnEditarPelicula");
    const btnEliminar = document.getElementById("btnEliminarPelicula");
    const btnLimpiar = document.getElementById("btnLimpiarPelicula");
    const filtro = document.getElementById("filtroPeliculas");

    // URL base de la API y credenciales de prueba
    const baseUrl = "http://localhost/ExamenWebIII/controller/api_peliculas.php";
    const cedula = "504360028";
    const clave = "nr5e67n4567m4768678m584n56n47n67";

    let peliculas = []; // Declarar como variable global para el filtro dinámico

    // Cifrar datos con AES
    const cifrarDatos = (datos) => {
        const jsonString = JSON.stringify(datos); // Convertir a JSON string
        const key = CryptoJS.enc.Utf8.parse(clave);
        const encrypted = CryptoJS.AES.encrypt(jsonString, key, {
            mode: CryptoJS.mode.ECB, // Modo ECB
            padding: CryptoJS.pad.Pkcs7, 
        });
        return encrypted.toString(); // Retorna el texto cifrado
    };

    // Desencriptar datos con AES
    const desencriptarDatos = (datosCifrados) => {
        try {
            const key = CryptoJS.enc.Utf8.parse(clave);
            const decrypted = CryptoJS.AES.decrypt(datosCifrados, key, {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7,
            });
            const jsonString = decrypted.toString(CryptoJS.enc.Utf8);

            if (!jsonString) {
                throw new Error("Desencriptación fallida");
            }

            return JSON.parse(jsonString);
        } catch (e) {
            console.error("Error al desencriptar los datos:", e);
            return null;
        }
    };

    // Listar películas
    const listarPeliculas = async () => {
        try {
            const response = await fetch(baseUrl, {
                method: "GET",
                headers: { "X-Cedula": cedula },
            });

            const responseText = await response.text();

            if (!response.ok) {
                console.error("Error en la respuesta del servidor:", responseText);
                throw new Error("Error al obtener las películas");
            }

            peliculas = desencriptarDatos(responseText);

            if (!peliculas) {
                throw new Error("Error al desencriptar los datos");
            }

            mostrarPeliculas(peliculas);
        } catch (error) {
            console.error("Error:", error.message);
            alert("No se pudo obtener la lista de películas.");
        }
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
                </tr>`
            )
            .join("");
        agregarEventosTabla();
    };

    // Filtrar películas en tiempo real
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

    // Agregar eventos a las filas de la tabla
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
        if (!form.PeliculaTitulo.value || !form.PeliculaGenero.value || !form.PeliculaDuracion.value) {
            alert("Todos los campos son obligatorios.");
            return;
        }

        const data = {
            Titulo: form.PeliculaTitulo.value,
            Genero: form.PeliculaGenero.value,
            Duracion: form.PeliculaDuracion.value,
        };
        const bodyCifrado = cifrarDatos(data);
        try {
            const response = await fetch(baseUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Cedula": cedula },
                body: bodyCifrado,
            });

            const responseText = await response.text();

            if (!response.ok) {
                console.error("Error en la respuesta del servidor:", responseText);
                throw new Error("Error al agregar la película");
            }

            form.reset();
            listarPeliculas();
        } catch (error) {
            console.error("Error:", error.message);
            alert("No se pudo agregar la película.");
        }
    });

    // Editar película
    btnEditar.addEventListener("click", async () => {
        if (!form.PeliculaId.value) {
            alert("Debes seleccionar una película para editar.");
            return;
        }

        const data = {
            Id: form.PeliculaId.value,
            Titulo: form.PeliculaTitulo.value,
            Genero: form.PeliculaGenero.value,
            Duracion: form.PeliculaDuracion.value,
        };
        const bodyCifrado = cifrarDatos(data);
        try {
            const response = await fetch(baseUrl, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "X-Cedula": cedula },
                body: bodyCifrado,
            });

            const responseText = await response.text();

            if (!response.ok) {
                console.error("Error en la respuesta del servidor:", responseText);
                throw new Error("Error al editar la película");
            }

            form.reset();
            btnEditar.disabled = true;
            btnEliminar.disabled = true;
            btnAgregar.disabled = false;
            listarPeliculas();
        } catch (error) {
            console.error("Error:", error.message);
            alert("No se pudo editar la película.");
        }
    });

    // Eliminar película
    btnEliminar.addEventListener("click", async () => {
        if (!form.PeliculaId.value) {
            alert("Debes seleccionar una película para eliminar.");
            return;
        }

        const confirmar = confirm("¿Estás seguro de que deseas eliminar esta película?");
        if (confirmar) {
            const data = { Id: form.PeliculaId.value };
            const bodyCifrado = cifrarDatos(data);
            try {
                const response = await fetch(baseUrl, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json", "X-Cedula": cedula },
                    body: bodyCifrado,
                });

                const responseText = await response.text();

                if (!response.ok) {
                    console.error("Error en la respuesta del servidor:", responseText);
                    throw new Error("Error al eliminar la película");
                }

                form.reset();
                btnEditar.disabled = true;
                btnEliminar.disabled = true;
                btnAgregar.disabled = false;
                listarPeliculas();
            } catch (error) {
                console.error("Error:", error.message);
                alert("No se pudo eliminar la película.");
            }
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

    // Listar películas al cargar la página
    listarPeliculas();
});