var buttons = {};
var new_clocks = [];

var first_clocking_column_index = 2;
var last_clocking_column_index = 9;

// UTILS

function delay(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function hourStringToMins(hour) {
    let clean_hour = hour.replaceAll(' ', '');
    let multiplier = 1;
    if (clean_hour.length > 5) {
        multiplier = clean_hour[0] == '-' ? -1 : 1;
        clean_hour = clean_hour.slice(1);
    }
    return multiplier * (parseInt(clean_hour.split(':')[0]) * 60 + parseInt(clean_hour.split(':')[1]));
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

function getWeekDay(date) {
    let d = date.split('-');
    return (new Date(d[2], d[1] - 1, d[0])).getDay() - 1;
}

function ddmmyyyy_to_yyyymmdd(date) {
    let [d, m, y] = date.split("-")
    return `${y}-${m}-${d}`;
}

function yyyymmdd_to_ddmmyyyy(date) {
    let [y, m, d] = date.split("-")
    return `${d}-${m}-${y}`;
}

function date_compare(d1, d2) {
    return ddmmyyyy_to_yyyymmdd(d1).localeCompare(ddmmyyyy_to_yyyymmdd(d2));
}

// Clocker utils


function get_min_max_dates() {
    const dates = get_clocking_rows().map(get_date_of_row);
    dates.sort(date_compare);

    return [dates[0], dates[dates.length - 1]];
} 

function get_clocking_rows() {
    let table = document.getElementById('tableList');
    return Array.from(table.tBodies[0].rows);
}

function get_date_of_row(row) {
    return row.cells[0].innerText.trim();
}

function get_existing_clockings_of_row(row) {
    return Array.from(row.cells).slice(first_clocking_column_index, last_clocking_column_index).map((cell) => cell.innerText.trim()).filter((clocking) => clocking);
}

function get_row_of_date(date) {
    return get_clocking_rows().find((row) => get_date_of_row(row) === date);
}

function get_existing_clockings_of_date(date) {
    return get_existing_clockings_of_row(get_row_of_date(date));
}

// Functionality

function modifyTitle() {
    document.getElementById('imatge-principal').remove();
    document.getElementsByClassName('peu')[0].firstElementChild.firstElementChild.innerText += ' · Diviloper';
}

function enlargeTable() {
    let container;
    try {
        // Saldo per mesos
        container = document.getElementById("taulaDadesMulti").parentElement;
    } catch(error) {
        // Saldo per dies
        container = document.getElementById('tableList').parentElement.parentElement;
    }
    container.classList.add("table_container");

    const style = document.createElement('style');
    style.textContent = `
    @media only screen and (min-width: 1400px) {
        .table_container {
            width: 1370px;
            max-width: 1370px;
        }
    }
        
    @media only screen and (min-width: 1600px) {
        .table_container {
            width: 1570px;
            max-width: 1570px;
            }
    }
        
    @media only screen and (min-width: 1800px) {
        .table_container {
            width: 1770px;
            max-width: 1770px;
            }
    }
    `;
    document.head.appendChild(style);    
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

async function getPendingClockingRows(ini_date, end_date) {
    let data = new FormData();
    data.append("dataInici", ini_date.replaceAll('-', '/'));
    data.append("dataFi", end_date.replaceAll('-', '/'));
    data.append("marcatgeId", "");
    data.append("_action_list", "Cerca");
    let response = await fetch('https://tempus.upc.edu/RLG/solicitudMarcatges/list', {
        method: "POST",
        body: data
    });
    let body = (new DOMParser()).parseFromString(await response.text(), 'text/html');
    let table = body.getElementById("tableList");

    const rows = Array.from(table.tBodies[0].rows);

    const pagination = body.getElementsByClassName("paginateButtonsRlg")[0];
    if (pagination.childElementCount === 0) return rows;

    const num_pages = parseInt(pagination.children[pagination.childElementCount-2].innerText);

    const block_size = 30;
    for (let i=1; i < num_pages; ++i) {
        data = new FormData();
        data.append("dataInici", ini_date.replaceAll('-', '/'));
        data.append("dataFi", end_date.replaceAll('-', '/'));
        data.append("marcatgeId", "");
        data.append("_action_list", "Cerca");
        data.append("max", block_size);
        data.append("offset", block_size * i);
        response = await fetch('https://tempus.upc.edu/RLG/solicitudMarcatges/list', {
            method: "POST",
            body: data
        });
        body = (new DOMParser()).parseFromString(await response.text(), 'text/html');
        table = body.getElementById("tableList");

        rows.push(...table.tBodies[0].rows);
    }

    return rows;
}

async function getPendingClockings() {
    const [min_date, max_date] = get_min_max_dates();
    const rows = await getPendingClockingRows(min_date, max_date);
    // Date, Hour, State
    const clockings = rows.filter((row) => row.childElementCount > 3).map((row) => [row.cells[0].innerText.trim(), row.cells[3].innerText.trim()]).map(([d, s]) => [...d.split(" "), s]);
    const pending_clockings = clockings.filter(([clock_date, clock_hour, clock_state]) => !get_existing_clockings_of_date(clock_date).includes(clock_hour));
    return pending_clockings.map(([cd, ch, cs]) => ({"date": cd, "hour": ch, "state": cs}));
}

async function addPendingClockings() {
    try {

        const pending_clockings = await getPendingClockings();
        const pending_clockings_per_date = Object.groupBy(pending_clockings, (c) => c.date);
        
        for (const date in pending_clockings_per_date) {
            const existing_clockings = get_existing_clockings_of_date(date);
            const missing_clockings = pending_clockings_per_date[date].filter((clocking) => !existing_clockings.includes(clocking));
            if (missing_clockings.length === 0) continue;
            
            const all_clockings = [...existing_clockings, ...missing_clockings.map((clocking) => clocking.hour)];
            all_clockings.sort()
            
            const row = get_row_of_date(date);
            for (let i = 0; i < all_clockings.length; ++i) {
                const clocking = all_clockings[i];
                const cell = row.cells[first_clocking_column_index + i];
                cell.innerText = clocking;
                
                const missing = missing_clockings.find((mc) => mc.hour === clocking);
                if (missing) {
                    switch (missing.state) {
                        case "Pendent":
                            cell.classList.add(`table-warning`);
                            break;
                            case "Acceptat":
                                cell.classList.add(`table-info`);
                            }
                        }
                    }
                }
    } catch (error){
        console.error("There was an error while adding the pending clockings:", e);
    }
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
    first_clocking_column_index += 1;
    last_clocking_column_index += 1;
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

async function getRemoteWorkingDays() {
    try {
        let response = await fetch('https://tempus.upc.edu/RLG/teletreball/list');
        let resp = (new DOMParser()).parseFromString(await response.text(), 'text/html');
        return Array.from(resp.getElementById('tr0').cells).slice(2).map((c) => c.children.length != 0);
    } catch {
        return [false, false, false, false, false, false, false]
    }
}

async function addRemoteWorkingColumn() {
    let remote_days = await getRemoteWorkingDays();
    let table = document.getElementById('tableList');

    let header = table.tHead.rows[0];
    let remote_header = document.createElement('th');
    remote_header.innerText = 'Tele.';
    header.insertBefore(remote_header, header.children[15]);

    let llegenda = document.getElementsByClassName('llegenda')[0];
    let remote_tit = document.createElement('b');
    remote_tit.innerText = 'Tele.:';

    llegenda.appendChild(document.createTextNode(' \u00A0'));
    llegenda.appendChild(remote_tit);
    llegenda.appendChild(document.createTextNode(' Teletreball'));
    llegenda.appendChild(document.createElement('br'));


    let rows = table.tBodies[0].rows;
    for (const row of rows) {
        let cells = Array.from(row.cells);
        let weekDay = getWeekDay(cells[0].innerText);
        let is_remote = remote_days[weekDay];

        let remote = document.createElement('td');
        if (is_remote) {
            const yes_icon = document.createElement('i');
            yes_icon.classList.add('bi', 'bi-check-lg');
            yes_icon.style.paddingLeft = '4px';
            yes_icon.style.display = 'inline-block';
            remote.appendChild(yes_icon);
        } else {
            const no_icon = document.createElement('i');
            no_icon.classList.add('bi', 'bi-x-lg');
            no_icon.style.paddingLeft = '4px';
            no_icon.style.display = 'inline-block';
            remote.appendChild(no_icon);
        }

        row.insertBefore(remote, row.children[15]);
    }

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

        let minHour = index > 0 ? (clocks[index - 1].classList.contains('clock-cell') ? clocks[index - 1].children[1].value : clocks[index - 1].textContent) : '00:00';
        let maxHour = index < clocks.length - 1 ? (clocks[index].classList.contains('clock-cell') ? clocks[index].children[0].value : clocks[index].textContent) : '24:00';

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
    new_cell.classList.add('clock-cell');

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
            timeChanged: (data) => {
                updateRowCounter(row, new_cell, data.value);
                paintRow(row, new_cell, data.value);
                updateTotalCounter();
            },
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
    updateRowCounter(row);
    updateTotalCounter();
}

function removeButtons(date) {
    if (buttons.hasOwnProperty(date)) {
        buttons[date].forEach((e) => e.remove());
        buttons[date].length = 0;
    }
}

async function clockInRequest(date, hour, reason) {
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
        }
    );
    return response.status < 400;
}

function openTabWithRequestFilled(date, hour, reason) {
    const url = new URL('https://tempus.upc.edu/RLG/solicitudMarcatges/list');
    url.searchParams.append('codiSolicitudMarcatge', reason);
    url.searchParams.append('data', date.replaceAll('-', '/'));
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
    let confirmation = confirm('Es procedirà a realitzar els marcatges.\n' +
        'Es deixarà un marge d\'un segon entre peticions.');
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
        const result = await clockInRequest(clock.customDate.replaceAll("-", "/"), clock.value, reason);
        // const result = openTabWithRequestFilled(clock.customDate, clock.value, reason);
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
        await delay(1);
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
        '<li>Els marcatges marcats en: </li>' +
            '<ul>' +
            '<li><span class="table-danger" style="background-color: var(--bs-table-bg); padding: 2px;">Vermell</span> són previs/posteriors a l\'hora d\'inici/fi de la flexibilitat.</li>' +
            '<li><span class="table-warning" style="background-color: var(--bs-table-bg); padding: 2px;">Groc</span> són marcatges pendents d\'aprovar.</li>' +
            '<li><span class="table-success" style="background-color: var(--bs-table-bg); padding: 2px;">Verd</span> són marcatges aprovats que encara no s\'han registrat.</li>' +
            '<li><span class="table-info" style="background-color: var(--bs-table-bg); padding: 2px;">Blau</span> són marcatges pendents amb un estat inesperat.</li>' +
            '</ul>' +
        '</li>' +
        '<li>Els dies que fas teletreball les hores de més no computen (si treballes presencialment un dia que pots fer teletreball computen normal).</li>' +
        '</ul>';

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
        [8011, 'E/S Presencial'],
        [8010, 'E/S Teletreball '],
        [8002, 'Manca de fluid elèctric'],
        [8004, 'Oblit'],
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

function computeTotalDiff(clocks, theorical_hours, leave_hours) {
    let worked_mins = hourDiff(clocks[0], clocks[1]) +
        hourDiff(clocks[2], clocks[3]) +
        hourDiff(clocks[4], clocks[5]) +
        hourDiff(clocks[6], clocks[7]);
    let expected_mins = hourStringToMins(theorical_hours.innerText);
    let leave_mins = hourStringToMins(leave_hours.innerText);
    let diff = worked_mins + leave_mins - expected_mins;
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
    let start = row.cells[2].innerText;
    let end = row.cells[11].innerText;
    for (const i in clocks) {
        if (clocks[i] == cell) clocks[i] = value;
        else if (clocks[i].classList.contains('clock-cell')) clocks[i] = clocks[i].children[1].value;
        else clocks[i] = clocks[i].innerText;
    }
    for (const i in clocks) {
        if (clocks[i] && clocks[i] < start) clocks[i] = start;
        else if (clocks[i] && clocks[i] > end) clocks[i] = end;
    }
    let new_count = computeTotalDiff(clocks, row.cells[1], row.cells[13]);
    if (row.cells[15].firstElementChild.classList.contains('bi-check-lg') && new_count[0] == '+' && row.cells[16].innerText.trim() == '+ 00:00') {
        new_count = '+ 00:00';
    }
    let counter_cell = row.cells[row.cells.length - 1];
    counter_cell.innerText = new_count;
    counter_cell.classList.remove('table-danger', 'table-success');
    counter_cell.classList.add(new_count.includes('-') ? 'table-danger' : 'table-success');
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
    document.getElementById('tableList').tBodies[0].rows.forEach(paintRow);
}

function addTotalCounter() {
    let table = document.getElementById('tableList');
    let new_tbody = document.createElement('tbody');
    let new_row = document.createElement('tr');
    new_row.style.borderTop = 'thin solid';
    let text_cell = document.createElement('td');
    text_cell.style.fontSize = '16px';
    text_cell.style.fontWeight = '500';
    text_cell.style.textAlign = 'right';
    text_cell.style.paddingRight = '15px';
    text_cell.colSpan = '17';
    text_cell.innerText = "Saldo Total:";
    let counter_cell = document.createElement('td');
    counter_cell.id = 'total-counter-cell';

    new_row.appendChild(text_cell);
    new_row.appendChild(counter_cell);
    if (document.getElementById('tableList').tBodies[0].rows.length % 2 != 0) new_tbody.appendChild(document.createElement('tr'));
    new_tbody.appendChild(new_row);
    table.appendChild(new_tbody);
    updateTotalCounter();
}

function updateTotalCounter() {
    let total = 0;
    for (const row of document.getElementById('tableList').tBodies[0].rows) {
        let row_counter = row.lastElementChild.innerText;
        total += hourStringToMins(row_counter);
    }
    let counter_cell = document.getElementById('total-counter-cell');
    counter_cell.innerText = minsToHourString(total);
    counter_cell.classList.remove('table-success', 'table-danger');
    counter_cell.classList.add(total < 0 ? 'table-danger' : 'table-success');
}

async function main() {
    modifyTitle();
    enlargeTable();
    await addScheduleColumns();
    await addRemoteWorkingColumn();
    await addPendingClockings();
    addCounterColumn();
    addButtons();
    addConfigMenu();
    paintClocks();
    addTotalCounter();
}

main();
