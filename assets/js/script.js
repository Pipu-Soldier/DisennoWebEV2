const contenedorCartas = document.querySelector(".cartas-grid");
const btnMonstruos = document.querySelector("#btnMonstruos");
const btnMagicas = document.querySelector("#btnMagicas");
const btnTrampas = document.querySelector("#btnTrampas");
const botonesFiltro = document.querySelectorAll(".filter-btn");
const switchSets = document.querySelector("#switchSets");

const apiURL = "https://db.ygoprodeck.com/api/v7/cardinfo.php?archetype=D%2FD";
const apiSetsURL = "https://db.ygoprodeck.com/api/v7/cardsets.php";

let allCards = [];
let setsGlobal = [];
let setsCargados = false;
// Diccionario para relacionar rápidamente el nombre de un set con su fecha de lanzamiento
let mapaFechasSets = {};

async function obtenerCartasDD() {
    try {
        const res = await fetch(apiURL);
        const resultado = await res.json();
        allCards = resultado.data || [];
        renderizarCartas();
    } catch (error) {
        console.error("Error al obtener las cartas:", error);
        contenedorCartas.innerHTML = "<p class='text-danger text-center'>Error al conectar con la API.</p>";
    }
}

// Lógica del switch para llamar a la API y reagrupar por set
switchSets.addEventListener("change", async () => {
    if (switchSets.checked) {
        if (!setsCargados) {
            try {
                switchSets.disabled = true; // Deshabilita temporalmente mientras hace el fetch
                const res = await fetch(apiSetsURL);
                setsGlobal = await res.json();

                // Crea un mapa/diccionario para buscar la fecha de cada set de forma eficiente
                setsGlobal.forEach(s => {
                    mapaFechasSets[s.set_name] = s.tcg_date || "9999-12-31"; // Si no tiene fecha, se manda al final
                });

                setsCargados = true;
                switchSets.disabled = false;
            } catch (error) {
                console.error("Error al obtener los sets:", error);
                switchSets.checked = false; // Desmarca el switch si ocurre un error
                switchSets.disabled = false;
                return;
            }
        }
    } else {
        setsCargados = false; // Al apagar el switch, regresa a la vista sin agrupar
    }
    renderizarCartas();
});

function renderizarCartas() {
    const mostrarMonstruos = btnMonstruos.checked;
    const mostrarMagicas = btnMagicas.checked;
    const mostrarTrampas = btnTrampas.checked;

    const cartasFiltradas = allCards.filter(carta => {
        const tipoLower = carta.type.toLowerCase();
        const esMagica = tipoLower.includes("spell");
        const esTrampa = tipoLower.includes("trap");
        const esMonstruo = !esMagica && !esTrampa;

        if (esMonstruo && mostrarMonstruos) return true;
        if (esMagica && mostrarMagicas) return true;
        if (esTrampa && mostrarTrampas) return true;
        return false;
    });

    if (cartasFiltradas.length === 0) {
        contenedorCartas.innerHTML = "<p class='text-center text-secondary w-100'>No hay cartas que mostrar con los filtros actualizados.</p>";
        return;
    }

    let template = "";

    // Si el switch está encendido, se agrupan y ordenan las cartas por año de lanzamiento del set
    if (setsCargados) {
        let gruposPorSet = {};

        cartasFiltradas.forEach(carta => {
            let nombreSet = "Sin Set Asignado";
            if (carta.card_sets && carta.card_sets.length > 0) {
                nombreSet = carta.card_sets[0].set_name;
            }
            if (!gruposPorSet[nombreSet]) {
                gruposPorSet[nombreSet] = [];
            }
            gruposPorSet[nombreSet].push(carta);
        });

        // Se obtienen los nombres de los sets para orderalos cronológicamente por su fecha TCG
        const nombresSetsOrdenados = Object.keys(gruposPorSet).sort((a, b) => {
            const fechaA = mapaFechasSets[a] || "9999-12-31";
            const fechaB = mapaFechasSets[b] || "9999-12-31";
            return fechaA.localeCompare(fechaB); // Orden ascendente: del año más antiguo al más reciente
        });

        // Recorre los sets ya ordenados por fecha y arma el HTML
        nombresSetsOrdenados.forEach(nombreSet => {
            const cartasDelSet = gruposPorSet[nombreSet];

            // Extrae el año sacándolo de la fecha (primeros 4 caracteres "YYYY-MM-DD")
            const fechaSet = mapaFechasSets[nombreSet];
            const anioSet = (fechaSet && fechaSet !== "9999-12-31") ? `(${fechaSet.substring(0, 4)})` : "(Fecha desconocida)";

            template += `
                <div class="col-12 mt-4 mb-2">
                    <h3 class="text-info border-bottom border-secondary pb-2"> ${nombreSet} <span class="text-warning fs-5">${anioSet}</span></h3>
                </div>
            `;

            cartasDelSet.forEach(carta => {
                template += generarHTMLTarjeta(carta);
            });
        });
    } else {
        // Vista normal sin agrupar si el switch está apagado
        cartasFiltradas.forEach(carta => {
            template += generarHTMLTarjeta(carta);
        });
    }

    contenedorCartas.innerHTML = template;
}

// Función auxiliar para mantener limpia la creación de cada tarjeta
function generarHTMLTarjeta(carta) {
    const imagenURL = carta.card_images ? carta.card_images[0].image_url : "";

    const atributo = carta.attribute ? `<strong>Atributo:</strong> ${carta.attribute}` : "";
    const nivel = carta.level ? `<strong>Nivel/Rango:</strong> ${carta.level}` : "";
    const escala = carta.scale !== undefined ? `<strong>Escala Péndulo:</strong> ${carta.scale}` : "";
    const propiedad = carta.race ? `<strong>Propiedad:</strong> ${carta.race}` : "";

    return `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 d-flex align-items-stretch">
            <div class="carta-card w-100">
                <img src="${imagenURL}" alt="${carta.name}" class="img-fluid rounded mb-2">
                <h3 class="fs-6 text-warning text-center">${carta.name}</h3>
                <p class="mb-1 text-center small"><strong>Tipo de carta:</strong> ${carta.type}</p>
                ${atributo ? `<p class="mb-1 text-center small">${atributo}</p>` : ""}
                ${nivel ? `<p class="mb-1 text-center small">${nivel}</p>` : ""}
                ${escala ? `<p class="mb-1 text-center small">${escala}</p>` : ""}
                ${propiedad ? `<p class="mb-1 text-center small">${propiedad}</p>` : ""}
                <p class="mb-0 text-center small mt-2"><strong>ATK:</strong> ${carta.atk ?? "N/A"} | <strong>DEF:</strong> ${carta.def ?? "N/A"}</p>
            </div>
        </div>
    `;
}

// Escucha cambios en los filtros de categorías
botonesFiltro.forEach(btn => {
    btn.addEventListener("change", renderizarCartas);
});

// Inicia la carga del arquetipo al abrir la página
obtenerCartasDD();