const puppeteer = require('puppeteer');

async function generarPdf(listaDeEncabezados) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    let encabezados = '';
    listaDeEncabezados.forEach(encabezado => {
        encabezados += `<th scope="col" class="col-2">${encabezado}</th>`;
    });

    console.log(encabezados);
    
    await page.setContent(`
    <!doctype html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Sistema de gestion Estudiantil</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"
            integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    </head>
    <body>
        <main>
            <table class="table table-responsive table-bordered table-hover table-striped" id="tablaEStudiantes">
                <thead id="encabezado">
                    <tr id="encabezadosTablaEStudiantes" class="table-active">
                        ${encabezados}
                    </tr>
                </thead>
                <tbody id="infoTablaEstudiantes">
                </tbody>
            </table>
            hola mario
        </main>
    </body>
    </html>
    `);

    await page.waitForSelector('#tablaEStudiantes');

    await page.pdf({ path: 'reporte_estudiantes.pdf', format: 'A4' });

    await browser.close();
    console.log('PDF generado con éxito');
}

module.exports = generarPdf;
