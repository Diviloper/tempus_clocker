var buttons = {};
var new_clocks = [];

function delay(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function paint_row(row) {
    cells = row.cells;
    data = cells[0];
    saldo = cells[cells.length - 1].textContent.trim();
    if (saldo.includes('-')) {
        color = 'table-danger';
    } else {
        color = 'table-success';
    }
    row.classList.add(color);
}

function getLastCellWithTextIndex(tdElements) {
    let i = 0;
    while (i < tdElements.length && tdElements[i].innerHTML !== '') {
        i++;
    }

    return i;
}

function addButtons() {
    let rows = document.getElementById('tableList').tBodies[0].rows;
    rows.forEach(addButtonsToRow);
}

function addButtonsToRow(row) {
    let cells = Array.from(row.cells);
    let date = cells[0].innerText;
    let lastClock = getLastCellWithTextIndex(cells) + 1;
    if (lastClock > 11) return;
    let clocks = cells.slice(3, lastClock);
    buttons[date] = [];
    clocks.forEach((element, index) => {
        const icon = document.createElement('i');
        icon.classList.add('bi', 'bi-plus-lg', 'text-success');
        icon.style.paddingRight = '4px';
        icon.style.display = 'inline-block';

        let minHour = index > 0 ? clocks[index - 1].textContent : '00:00';
        let maxHour = index < clocks.length - 1 ? clocks[index].textContent : '24:00';

        icon.onclick = () => addClock(row, element, minHour, maxHour);
        element.insertBefore(icon, element.firstChild);
        buttons[date].push(icon);
    });
}

function addClock(row, nextElement, min_h, max_h) {
    const date = row.cells[0].innerText;
    let new_clock = document.createElement('input');
    new_clock.customDate = date;
    new_clock.type = 'text';
    new_clock.classList.add('time', 'mascara', 'text-center', 'form-control');
    new_clock.style.maxWidth = '80px';
    new_clock.placeholder = 'Hora';
    new_clock.autocomplete = 'off';
    new_clock.style.display = 'inline-block';

    let new_cell = document.createElement('td');
    new_cell.appendChild(new_clock);

    const delete_icon = document.createElement('i');
    delete_icon.classList.add('bi', 'bi-trash3-fill', 'text-danger');
    delete_icon.style.paddingLeft = '4px';
    delete_icon.style.display = 'inline-block';
    delete_icon.onclick = () => removeClock(new_clock, row);
    new_cell.appendChild(delete_icon);

    mdtimepicker(new_clock, {
        is24hour: true,
        hourPadding: false,
        minTime: min_h,
        maxTime: max_h,
        events: {
            timeChanged: (data) => { updateRowCounter(row, new_cell, data.value); paintRow(row, new_cell, data.value); },
        }
    });

    row.insertBefore(new_cell, nextElement);
    if (nextElement == row.cells[11]) row.cells[11].remove();
    else row.cells[10].remove();

    new_clocks.push(new_clock);

    removeButtons(date);
    addButtonsToRow(row);
}

function removeClock(clock, row) {
    mdtimepicker(clock, 'destroy');
    const index = new_clocks.indexOf(clock);
    if (index > -1) {
        new_clocks.splice(index, 1);
    }
    clock.parentElement.remove();
    row.insertBefore(document.createElement('td'), row.cells[9]);
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
    /* Not working due to cross origin probably */
    const formData = new FormData();
    formData.set('codiSolicitudMarcatge', reason);
    formData.set('data', date);
    formData.set('hora', hour);
    formData.set('_action_save', 'Crear');

    let response = await fetch(
        'https://tempus.upc.edu/RLG/solicitudMarcatges/list',
        {
            method: 'POST',
            body: formData,
            referrer: 'https://tempus.upc.edu/RLG/solicitudMarcatges/list',
            redirect: 'manual',
        }
    );
    console.log(response);
    return response.status < 400;
}

function openTabWithRequestFilled(date, hour, reason) {
    const url = new URL('https://tempus.upc.edu/RLG/solicitudMarcatges/list');
    url.searchParams.append('codiSolicitudMarcatge', reason);
    url.searchParams.append('data', date);
    url.searchParams.append('hora', hour);
    window.open(url, '_blank');
    return true;
}

async function clockIn() {
    const reason = document.getElementById('codiSolicitudMarcatge').value;
    for (const clock of new_clocks) {
        if (!clock.value) {
            alert('Tens algun marcatge buit. Comprova-ho i torna a provar.');
            return;
        }
    }
    let confirmation = confirm('Per seguretat, el tempus no permet fer fitxatges des d\'aquesta pàgina.\n' +
        'Es procedirà a obrir una pàgina nova per cada fitxatge amb les dades ompler-tes per a que el facis tu mateix.\n' +
        'Assegura\'t de permetre la pàgina obrir finestres emergents abans. Si no hi ha la opció, continua normal.\n' +
        'Si veus que només s\'obre una pàgina quan has fet diversos marcatges, t\'hauria de sortir també una icona indicant que s\'han bloquejat les finestres' +
        '(acostuma a estar a dreta o esquerra de la URL). Permet les finestres i torna a clicar \'\'Realitzar Marcatges\'\'.');
    if (!confirmation) return;

    for (const clock of new_clocks) {
        let delete_button = clock.nextSibling;
        const queue_icon = document.createElement('i');
        queue_icon.classList.add('bi', 'bi-hourglass-top', 'text-warning');
        queue_icon.style.paddingLeft = '4px';
        queue_icon.style.display = 'inline-block';
        delete_button.parentElement.replaceChild(queue_icon, delete_button);
    }

    for (const clock of new_clocks) {
        let queue_icon = clock.nextSibling;
        const working_icon = document.createElement('i');
        working_icon.classList.add('bi', 'bi-hourglass-split', 'text-info');
        working_icon.style.paddingLeft = '4px';
        working_icon.style.display = 'inline-block';
        queue_icon.parentElement.replaceChild(working_icon, queue_icon);
        // const result = await clockInRequest(clock.customDate, clock.value, reason);
        const result = openTabWithRequestFilled(clock.customDate, clock.value, reason);
        if (result) {
            const success_icon = document.createElement('i');
            success_icon.classList.add('bi', 'bi-check-lg', 'text-success');
            success_icon.style.paddingLeft = '4px';
            success_icon.style.display = 'inline-block';
            working_icon.parentElement.replaceChild(success_icon, working_icon);
        } else {
            const failure_icon = document.createElement('i');
            failure_icon.classList.add('bi', 'bi-x-lg', 'text-danger');
            failure_icon.style.paddingLeft = '4px';
            failure_icon.style.display = 'inline-block';
            working_icon.parentElement.replaceChild(failure_icon, working_icon);
        }
    }

}

function addConfigMenu() {
    let old_llegenda = document.getElementsByClassName('llegenda')[0];
    old_llegenda.classList.remove('llegenda');
    old_llegenda.style.flex = '1 1 0';

    let new_llegenda = document.createElement('div');
    new_llegenda.classList.add('llegenda');
    new_llegenda.style.display = 'flex';
    new_llegenda.style.justifyContent = 'space-between';
    new_llegenda.style.gap = '20px;';

    let options = document.createElement('div');

    let type_div = document.createElement('div');
    type_div.style.flex = '1 1 0';
    type_div.style.display = 'flex';
    type_div.style.flexDirection = 'column';
    type_div.style.alignItems = 'center';
    type_div.innerHTML = '<b>Tingues en compte:</b>' +
        '<ul>' +
        '<li>Els marcatges marcats en vermell són previs/posteriors a l\'hora d\'inici/fi de la flexibilitat.</li>' +
        '<li>Comprova si tens algun marcatge pendent que no estigui encara aquí</li>';

    let label = document.createElement('label');
    label.for = 'codiSolicitudMarcatge';
    label.classList.add('text-left');
    label.style.marginTop = '10px';
    label.innerText = 'Tipus d\'incidència';

    let select = document.createElement('select');
    select.classList.add('form-select');
    select.name = 'codiSolicitudMarcatge';
    select.style.width = '100%';
    select.title = 'Selecctionar tipus d\'incidència';
    select.autocomplete = 'off';
    select.id = 'codiSolicitudMarcatge';

    options = [
        [8006, 'E/S Fora lloc habitual'],
        [8010, 'E/S Teletreball '],
        [8002, 'Manca de fluid elèctric'],
        [8004, 'Oblit'],
        [8007, 'Pèrdua targeta'],
        [8001, 'Rellotge espatllat'],
        [8005, 'Targeta espatllada'],
        [8008, 'Targeta pendent d\'alta'],
    ];

    options.forEach(element => {
        const [value, text] = element;
        let new_option = document.createElement('option');
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

    let clock_button = document.createElement('button');
    clock_button.classList.add('btn', 'btn-primary', 'rounded-pill', 'btnMarcatgeGreen');
    clock_button.type = 'button';
    clock_button.onclick = clockIn;

    let clock_content = document.createElement('div');
    clock_content.style.display = 'flex';
    clock_content.style.justifyContent = 'space-between';
    clock_content.style.padding = '0 15px';

    let clock_image = document.createElement('img');
    clock_image.src = '../images/icons/computerClock1.svg';
    clock_image.width = '32';
    clock_image.height = '32';
    clock_image.style.alignContent = 'flex-end';

    let clock_text = document.createElement('p');
    clock_text.classList.add('btn-green-inv-nouMarcatge');
    clock_text.style.fontSize = '22px';
    clock_text.style.fontWeight = '500';
    clock_text.innerText = 'Realitzar Marcatges';

    clock_content.appendChild(clock_image);
    clock_content.appendChild(clock_text);

    clock_button.appendChild(clock_content);

    type_div.appendChild(clock_button);
}

function hourStringToMins(hour) {
    return parseInt(hour.split(':')[0]) * 60 + parseInt(hour.split(':')[1]);
}

function hourDiff(start, end) {
    if (start == '' || end == '') return 0;
    return hourStringToMins(end) - hourStringToMins(start);
}

function minsToHourString(mins) {
    let h = `${Math.floor(Math.abs(mins) / 60)}`.padStart(2, '0');
    let m = `${Math.abs(mins) % 60}`.padStart(2, '0');
    let s = mins < 0 ? '-' : '+';
    return `${s} ${h}:${m}`;
}

function computeTotalDiff(clocks, theorical_hours, start, end) {
    for (const i in clocks) {
        if (clocks[i].innerText && clocks[i].innerText < start.innerText) clocks[i] = start;
        else if (clocks[i].innerText && clocks[i].innerText > end.innerText) clocks[i] = end;
    }
    let worked_mins = hourDiff(clocks[0].innerText, clocks[1].innerText) +
        hourDiff(clocks[2].innerText, clocks[3].innerText) +
        hourDiff(clocks[4].innerText, clocks[5].innerText) +
        hourDiff(clocks[6].innerText, clocks[7].innerText);
    let expected_mins = hourStringToMins(theorical_hours.innerText);
    let diff = worked_mins - expected_mins;
    return minsToHourString(diff);
}

function addCounterColumn() {
    let table = document.getElementById('tableList');

    let header_cell = document.createElement('th');
    header_cell.innerText = 'Nou saldo';
    table.tHead.rows[0].appendChild(header_cell);

    let rows = table.tBodies[0].rows;

    for (const row of rows) {
        let new_cell = document.createElement('td');
        row.appendChild(new_cell);
    }
    updateNewCounters();
}

function updateNewCounters() {
    let rows = document.getElementById('tableList').tBodies[0].rows;
    for (const row of rows) {
        updateRowCounter(row);
    }
}

function updateRowCounter(row, cell, value) {
    let clocks = Array.from(row.cells).slice(3, 11);
    let index = clocks.indexOf(cell);
    if (index > -1) {
        clocks[clocks.indexOf(cell)] = { innerText: value };
    }
    let start = row.cells[2];
    let end = row.cells[11];
    let new_count = computeTotalDiff(clocks, row.cells[1], start, end);
    let counter_cell = row.cells[row.cells.length - 1];
    counter_cell.innerText = new_count;
    counter_cell.classList.remove('table-danger', 'table-success');
    counter_cell.classList.add(new_count.includes('-') ? 'table-danger' : 'table-success');
}

function modifyTitle() {
    document.getElementById('imatge-principal').remove();
    document.getElementsByClassName('peu')[0].firstElementChild.firstElementChild.innerText += ' · Diviloper';
}

function getWeekDay(date) {
    let d = date.split('-');
    return (new Date(d[2], d[1] - 1, d[0])).getDay() - 1;
}

async function getSchedule() {
    let response = await fetch('https://tempus.upc.edu/RLG/horariPersonal/list');
    let resp = (new DOMParser()).parseFromString(await response.text(), 'text/html');
    let schedule_id = resp.getElementById('tr0').lastElementChild.firstElementChild.lastElementChild.innerText.match(/id:(\d+)/)[1];

    const formData = new FormData();
    formData.set('horariInstance', schedule_id);
    formData.set('_action_detall', "detall");


    response = await fetch(
        'https://tempus.upc.edu/RLG/horariPersonal/list',
        {
            method: 'POST',
            body: formData
        }
    );
    resp = (new DOMParser()).parseFromString(await response.text(), 'text/html');
    let days = resp.getElementsByClassName('claseDia');
    let schedule = [];

    for (const day of days) {
        let ini = day.children[3].firstElementChild.value;
        let end = day.children[4].firstElementChild.value;
        schedule.push([ini, end]);
    }
    return schedule;
}

async function addScheduleColumns() {
    let schedule = await getSchedule();
    let table = document.getElementById('tableList');

    let header = table.tHead.rows[0];
    let ini_header = document.createElement('th');
    ini_header.innerText = 'Ini. flex.';
    let end_header = document.createElement('th');
    end_header.innerText = 'Fi flex.';
    header.insertBefore(ini_header, header.children[2]);
    header.insertBefore(end_header, header.children[11]);

    let llegenda = document.getElementsByClassName('llegenda')[0];
    let ini_tit = document.createElement('b');
    ini_tit.innerText = 'Ini. flex.:';
    let end_tit = document.createElement('b');
    end_tit.innerText = 'Fi flex.:';

    let ref = llegenda.childNodes[6];
    llegenda.insertBefore(document.createTextNode(' \u00A0'), ref);
    llegenda.insertBefore(ini_tit, ref);
    llegenda.insertBefore(document.createTextNode(' Inici flexibilitat'), ref);
    llegenda.insertBefore(document.createElement('br'), ref);
    llegenda.insertBefore(document.createTextNode(' \u00A0'), ref);
    llegenda.insertBefore(end_tit, ref);
    llegenda.insertBefore(document.createTextNode(' Fi flexibilitat'), ref);
    llegenda.insertBefore(document.createElement('br'), ref);


    let rows = table.tBodies[0].rows;
    for (const row of rows) {
        let cells = Array.from(row.cells);
        let weekDay = getWeekDay(cells[0].innerText);
        let daySchedule = schedule[weekDay];
        let ini = document.createElement('td');
        ini.innerText = daySchedule[0];
        let end = document.createElement('td');
        end.innerText = daySchedule[1];
        row.insertBefore(ini, row.children[2]);
        row.insertBefore(end, row.children[11]);
    }
}

function paintRow(row, updated_cell, updated_value) {
    let start = row.cells[2].innerText;
    let end = row.cells[11].innerText;
    let cells = Array.from(row.cells).slice(3, 11);
    for (const cell of cells) {
        let t = cell != updated_cell ? cell.innerText : updated_value;
        if (t && (t < start || t > end)) {
            cell.classList.add('table-danger');
        } else {
            cell.classList.remove('table-danger');
        }
    }
}

function paintClocks() {
    let rows = document.getElementById('tableList').tBodies[0].rows;
    rows.forEach(paintRow);
}

async function main() {
    modifyTitle();
    await addScheduleColumns();
    addCounterColumn();
    addButtons();
    addConfigMenu();
    paintClocks()
}

main();
