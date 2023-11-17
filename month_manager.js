var buttons = {};
var new_clocks = [];

function delay(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function paint_row(row) {
    cells = row.cells;
    data = cells[0];
    saldo = cells[cells.length - 1].textContent.trim();
    if (saldo.includes("-")) {
        color = "table-danger";
    } else {
        color = "table-success";
    }
    row.classList.add(color);
}

function getLastCellWithTextIndex(tdElements) {
    let i = 0;
    while (i < tdElements.length && tdElements[i].innerHTML !== "") {
        i++;
    }

    return i;
}

function addButtonsToRow(row) {
    let cells = Array.from(row.cells);
    let date = cells[0].innerText;
    let lastClock = getLastCellWithTextIndex(cells) + 1;
    if (lastClock > 10) return;
    let clocks = cells.slice(2, lastClock);
    buttons[date] = [];
    clocks.forEach((element, index) => {
        const icon = document.createElement("i");
        icon.classList.add("bi", "bi-plus-lg", "text-success");
        icon.style.paddingRight = "4px";
        icon.style.display = "inline-block";

        let minHour = index > 0 ? clocks[index - 1].textContent : "00:00";
        let maxHour = index < clocks.length - 1 ? clocks[index].textContent : "24:00";

        icon.onclick = () => addClock(row, element, minHour, maxHour);
        element.insertBefore(icon, element.firstChild);
        buttons[date].push(icon);
    });
}

function addClock(row, nextElement, min_h, max_h) {
    const date = row.cells[0].innerText;
    let new_clock = document.createElement("input");
    new_clock.customDate = date;
    new_clock.type = "text";
    new_clock.classList.add("time", "mascara", "text-center", "form-control");
    new_clock.style.maxWidth = "80px";
    new_clock.placeholder = "Hora";
    new_clock.autocomplete = "off";
    new_clock.style.display = "inline-block";

    let new_cell = document.createElement("td");
    new_cell.appendChild(new_clock);

    const delete_icon = document.createElement("i");
    delete_icon.classList.add("bi", "bi-trash3-fill", "text-danger");
    delete_icon.style.paddingLeft = "4px";
    delete_icon.style.display = "inline-block";
    delete_icon.onclick = () => removeClock(new_clock, row);
    new_cell.appendChild(delete_icon);

    mdtimepicker(new_clock, {
        is24hour: true,
        hourPadding: false,
        minTime: min_h,
        maxTime: max_h
    });

    row.insertBefore(new_cell, nextElement);
    if (nextElement == row.cells[10]) row.cells[10].remove();
    else row.cells[9].remove();

    new_clocks.push(new_clock);

    removeButtons(date);
    addButtonsToRow(row);
}

function removeClock(clock, row) {
    mdtimepicker(clock, "destroy");
    const index = new_clocks.indexOf(clock);
    if (index > -1) {
        new_clocks.splice(index, 1);
    }
    clock.parentElement.remove();
    row.insertBefore(document.createElement("td"), row.cells[9]);
    removeButtons(clock.customDate);
    addButtonsToRow(row);
}

function removeButtons(date) {
    if (buttons.hasOwnProperty(date)) {
        buttons[date].forEach((e) => e.remove());
        buttons[date].length = 0;
    }
}

async function clockInRequest(date, hour, reason) {
    console.log(date, hour, reason);
    const formData = new FormData();
    formData.set("codiSolicitudMarcatge", reason);
    formData.set("data", date);
    formData.set("hora", hour);
    formData.set("_action_save", "Crear");

    let response = await fetch(
        "https://tempus.upc.edu/RLG/solicitudMarcatges/list",
        {
            method: "POST",
            body: formData,
            referrer: "https://tempus.upc.edu/RLG/solicitudMarcatges/list",
            redirect: "manual",
        }
    );
    console.log(response);
    return response.status < 400;
}

function openTabWithRequestFilled(date, hour, reason) {
    const url = new URL("https://tempus.upc.edu/RLG/solicitudMarcatges/list");
    url.searchParams.append("codiSolicitudMarcatge", reason);
    url.searchParams.append("data", date);
    url.searchParams.append("hora", hour);
    window.open(url, "_blank");
    return true;
}

async function clockIn() {
    const reason = document.getElementById("codiSolicitudMarcatge").value;
    for (const clock of new_clocks) {
        if (!clock.value) {
            alert("Tens algun marcatge buit. Comprova-ho i torna a provar.");
            return;
        }
    }
    let confirmation = confirm("Per seguretat, el tempus no permet fer fitxatges des d'aquesta pàgina.\n" + 
    "Es procedirà a obrir una pàgina nova per cada fitxatge amb les dades ompler-tes per a que el facis tu mateix.\n" + 
    "Assegura't de permetre la pàgina obrir finestres emergents abans");
    if (!confirmation) return;

    for (const clock of new_clocks) {
        let delete_button = clock.nextSibling;
        const queue_icon = document.createElement("i");
        queue_icon.classList.add("bi", "bi-hourglass-top", "text-warning");
        queue_icon.style.paddingLeft = "4px";
        queue_icon.style.display = "inline-block";
        delete_button.parentElement.replaceChild(queue_icon, delete_button);
    }

    for (const clock of new_clocks) {
        let queue_icon = clock.nextSibling;
        const working_icon = document.createElement("i");
        working_icon.classList.add("bi", "bi-hourglass-split", "text-info");
        working_icon.style.paddingLeft = "4px";
        working_icon.style.display = "inline-block";
        queue_icon.parentElement.replaceChild(working_icon, queue_icon);
        // const result = await clockInRequest(clock.customDate, clock.value, reason);
        const result = openTabWithRequestFilled(clock.customDate, clock.value, reason);
        if (result) {
            const success_icon = document.createElement("i");
            success_icon.classList.add("bi", "bi-check-lg", "text-success");
            success_icon.style.paddingLeft = "4px";
            success_icon.style.display = "inline-block";
            working_icon.parentElement.replaceChild(success_icon, working_icon);
        } else {
            const failure_icon = document.createElement("i");
            failure_icon.classList.add("bi", "bi-x-lg", "text-danger");
            failure_icon.style.paddingLeft = "4px";
            failure_icon.style.display = "inline-block";
            working_icon.parentElement.replaceChild(failure_icon, working_icon);
        }
    }

}

function addConfigMenu() {
    let old_llegenda = document.getElementsByClassName("llegenda")[0];
    old_llegenda.classList.remove("llegenda");

    let new_llegenda = document.createElement("div");
    new_llegenda.classList.add("llegenda");
    new_llegenda.style.display = "flex";
    new_llegenda.style.justifyContent = "space-between";

    let options = document.createElement("div");

    let type_div = document.createElement("div");

    let label = document.createElement("label");
    label.for = "codiSolicitudMarcatge";
    label.classList.add("text-left");
    label.style.marginTop = "10px";
    label.innerText = "Tipus d'incidència";

    let select = document.createElement("select");
    select.classList.add("form-select");
    select.name = "codiSolicitudMarcatge";
    select.style.width = "100%";
    select.title = "Selecctionar tipus d'incidència";
    select.autocomplete = "off";
    select.id = "codiSolicitudMarcatge";

    options = [
        [8006, "E/S Fora lloc habitual"],
        [8010, "E/S Teletreball "],
        [8002, "Manca de fluid elèctric"],
        [8004, "Oblit"],
        [8007, "Pèrdua targeta"],
        [8001, "Rellotge espatllat"],
        [8005, "Targeta espatllada"],
        [8008, "Targeta pendent d'alta"],
    ];

    options.forEach(element => {
        const [value, text] = element;
        let new_option = document.createElement("option");
        new_option.value = value;
        new_option.innerText = text;
        select.options.add(new_option);
    });
    select.value = 8004;

    type_div.appendChild(label);
    type_div.appendChild(select);

    old_llegenda.parentElement.replaceChild(new_llegenda, old_llegenda);
    new_llegenda.appendChild(old_llegenda);
    new_llegenda.appendChild(type_div);

    let clock_button = document.createElement("button");
    clock_button.classList.add("btn", "btn-primary", "rounded-pill", "btnMarcatgeGreen");
    clock_button.type = "button";
    clock_button.onclick = clockIn;

    let clock_content = document.createElement("div");
    clock_content.style.display = "flex";
    clock_content.style.justifyContent = "space-between";
    clock_content.style.padding = "0 15px";

    let clock_image = document.createElement("img");
    clock_image.src = "../images/icons/computerClock1.svg";
    clock_image.width = "32";
    clock_image.height = "32";
    clock_image.style.alignContent = "flex-end";

    let clock_text = document.createElement("p");
    clock_text.classList.add("btn-green-inv-nouMarcatge");
    clock_text.style.fontSize = "22px";
    clock_text.style.fontWeight = "500";
    clock_text.innerText = "Realitzar Marcatges";

    clock_content.appendChild(clock_image);
    clock_content.appendChild(clock_text);

    clock_button.appendChild(clock_content);

    type_div.appendChild(clock_button);
}

rows = document.getElementById("tableList").tBodies[0].rows;

rows.forEach(addButtonsToRow);

addConfigMenu();

alert("Recorda comprovar si tens marcatges pendents d'aprovar.")