pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdf.worker.js';

function normalizarTexto(texto) {
    if (!texto) return "";
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

async function buscarEnPDF(rutaPdf, terminoNorm) {
    let coincidencias = [];
    try {
        let loadingTask = pdfjsLib.getDocument(rutaPdf);
        let pdf = await loadingTask.promise;

        for (let i = 1; i <= pdf.numPages; i++) {
            let page = await pdf.getPage(i);
            let textContent = await page.getTextContent();
            let pageText = textContent.items.map(s => s.str).join(' ');
            let pageTextNorm = normalizarTexto(pageText);

            if (pageTextNorm.includes(terminoNorm)) {
                let limpio = pageText.replace(/\n/g, ' ');
                let idx = pageTextNorm.indexOf(terminoNorm);
                let inicio = Math.max(0, idx - 80);
                let fin = Math.min(limpio.length, idx + 150);
                let extracto = limpio.substring(inicio, fin);

                coincidencias.push({
                    pagina: i,
                    extracto: `...${extracto}...`
                });
            }
        }
    } catch (e) {
        console.error("Error leyendo PDF:", rutaPdf, e);
    }
    return coincidencias;
}

document.getElementById('searchBtn').addEventListener('click', async () => {
    const termino = document.getElementById('searchInput').value.trim();
    if (!termino) return;

    const terminoNorm = normalizarTexto(termino);
    const loading = document.getElementById('loading');
    const resultsLeyes = document.getElementById('resultsLeyes');
    const resultsProfes = document.getElementById('resultsProfes');

    loading.classList.remove('hidden');
    resultsLeyes.innerHTML = '';
    resultsProfes.innerHTML = '';

// Coloca aquí los nombres exactos de tus archivos PDF
    const LEYES = [
        'Ley_del_ISSSTE.pdf',
        'CGT.pdf',
        'Ley_Federal_de_los_Trabajadores_al_Servicio_del_Estado.pdf',
        'Ley_Federal_de_Procedimiento_Administrativo.pdf',
        'Ley_General_de_Responsabilidades_Administrativas.pdf'
    ];

    // Como aún no tienes los archivos de profesionogramas, déjalo así (lista vacía):
    const PROFES = [];

    for (let archivo of LEYES) {
        let res = await buscarEnPDF(`Assets/Leyes/${archivo}`, terminoNorm);
        if (res.length > 0) {
            let html = `<div class="card"><h4>📁 ${archivo}</h4>`;
            res.forEach(c => { html += `<p><strong>Pág. ${c.pagina}:</strong> ${c.extracto}</p>`; });
            html += `</div>`;
            resultsLeyes.innerHTML += html;
        }
    }

    for (let archivo of PROFES) {
        let res = await buscarEnPDF(`Assets/Profesionogramas/${archivo}`, terminoNorm);
        if (res.length > 0) {
            let html = `<div class="card"><h4>📋 ${archivo}</h4>`;
            res.forEach(c => { html += `<p><strong>Pág. ${c.pagina}:</strong> ${c.extracto}</p>`; });
            html += `</div>`;
            resultsProfes.innerHTML += html;
        }
    }

    loading.classList.add('hidden');
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(reg => console.log('Service Worker registrado con éxito', reg))
    .catch(err => console.error('Error al registrar Service Worker', err));
}