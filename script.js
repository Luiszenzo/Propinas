// Lista de empleados
const employees = [
    "Kike",
    "Pedro",
    "Cami",
    "Toño",
    "Juan",
    "Sofi",
    "Rodrigo",
    "Martha",
    "Lulu"
];

// Almacenamiento de tickets - cargar desde localStorage si existe
let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
let employeeTotals = JSON.parse(localStorage.getItem('employeeTotals')) || {};

// Inicializar totales de empleados si no existen en localStorage
if (Object.keys(employeeTotals).length === 0) {
    employees.forEach(employee => {
        employeeTotals[employee] = 0;
    });
}

// Función para guardar datos en localStorage
function saveToLocalStorage() {
    localStorage.setItem('tickets', JSON.stringify(tickets));
    localStorage.setItem('employeeTotals', JSON.stringify(employeeTotals));
}

// Función para inicializar la aplicación
function initApp() {
    // Cargar la lista de empleados en el formulario
    const employeesContainer = document.getElementById('employees-selection');
    
    employees.forEach(employee => {
        const employeeBtn = document.createElement('button');
        employeeBtn.className = 'employee-btn';
        employeeBtn.id = `employee-${employee}`;
        employeeBtn.dataset.employee = employee;
        employeeBtn.textContent = employee;
        employeeBtn.setAttribute('type', 'button'); // Prevent form submission
        
        // Agregar atributo para rastrear selección
        employeeBtn.dataset.selected = 'false';
        
        // Agregar evento de clic para seleccionar/deseleccionar
        employeeBtn.addEventListener('click', function() {
            const isSelected = this.dataset.selected === 'true';
            this.dataset.selected = isSelected ? 'false' : 'true';
            this.classList.toggle('selected', !isSelected);
        });
        
        employeesContainer.appendChild(employeeBtn);
    });
    
    // Agregar evento al botón de agregar ticket
    document.getElementById('add-ticket-btn').addEventListener('click', addTicket);
    
    // Establecer la fecha actual en el campo de fecha
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    // Verificar si el elemento existe antes de intentar establecer su valor
    const dateInput = document.getElementById('ticket-date');
    if (dateInput) {
        dateInput.value = `${year}-${month}-${day}`;
    }
    
    // Renderizar tickets y totales guardados al cargar la página
    renderTickets();
    renderTotals();
    
    // Inicializar reportes solo si los elementos existen
    if (document.getElementById('daily-report-date')) {
        initReports();
    }
    
    // Inicializar el modal de confirmación
    const modal = document.getElementById('confirm-modal');
    if (modal) {
        // Asegurarse de que el modal esté oculto al inicio
        modal.style.display = 'none';
    }
}

// Función para agregar un nuevo ticket
function addTicket() {
    const ticketAmount = parseFloat(document.getElementById('ticket-amount').value);
    const ticketNumber = document.getElementById('ticket-number').value.trim();
    
    // Get current user from localStorage
    const currentUser = localStorage.getItem('currentUser') || 'Unknown';
    
    // Fix date handling to ensure correct format
    const dateInput = document.getElementById('ticket-date');
    let ticketDate;
    
    if (dateInput && dateInput.value) {
        const dateParts = dateInput.value.split('-');
        ticketDate = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`;
    } else {
        // If no date input or value, use today's date
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        ticketDate = `${year}-${month}-${day}`;
    }
    
    // Validar que se haya ingresado un monto válido
    if (isNaN(ticketAmount) || ticketAmount <= 0) {
        alert('Por favor, ingrese un monto válido para el ticket.');
        return;
    }
    
    // Validar que se haya seleccionado una fecha
    if (!ticketDate) {
        alert('Por favor, seleccione una fecha para el ticket.');
        return;
    }
    
    // Obtener los empleados seleccionados
    const selectedEmployees = [];
    document.querySelectorAll('.employee-btn[data-selected="true"]').forEach(btn => {
        selectedEmployees.push(btn.dataset.employee);
    });
    
    // Validar que se haya seleccionado al menos un empleado
    if (selectedEmployees.length === 0) {
        alert('Por favor, seleccione al menos un empleado para repartir la propina.');
        return;
    }
    
    // Calcular la propina por empleado
    const tipPerEmployee = ticketAmount / selectedEmployees.length;
    
    // Crear el objeto del ticket con fecha y usuario creador
    const ticket = {
        id: Date.now(),
        number: ticketNumber || null,
        amount: ticketAmount,
        date: ticketDate,
        employees: selectedEmployees,
        tipPerEmployee: tipPerEmployee,
        createdBy: currentUser  // Add the creator information
    };
    
    // Agregar el ticket a la lista
    tickets.push(ticket);
    
    // Actualizar los totales por empleado
    selectedEmployees.forEach(employee => {
        employeeTotals[employee] += tipPerEmployee;
    });
    
    // Guardar en localStorage
    saveToLocalStorage();
    
    // Actualizar la interfaz
    renderTickets();
    renderTotals();
    
    // Limpiar el formulario (add this line to reset the date)
    document.getElementById('ticket-date').value = new Date().toISOString().split('T')[0]; // Set to today
    document.getElementById('ticket-number').value = '';
    document.getElementById('ticket-amount').value = '';
    employees.forEach(employee => {
        document.getElementById(`employee-${employee}`).checked = false;
    });
}

// Función para mostrar los tickets agregados
function renderTickets() {
    const ticketsList = document.getElementById('tickets-list');
    
    // Limpiar la lista actual
    ticketsList.innerHTML = '';
    
    if (tickets.length === 0) {
        ticketsList.innerHTML = '<p class="no-tickets">No hay tickets agregados</p>';
        return;
    }
    
    // Agrupar tickets por fecha
    const ticketsByDate = {};
    tickets.forEach(ticket => {
        if (!ticketsByDate[ticket.date]) {
            ticketsByDate[ticket.date] = [];
        }
        ticketsByDate[ticket.date].push(ticket);
    });
    
    // Ordenar fechas (más recientes primero)
    const sortedDates = Object.keys(ticketsByDate).sort().reverse();
    
    // Mostrar tickets agrupados por fecha
    sortedDates.forEach(date => {
        const dateTickets = ticketsByDate[date];
        const dateTotal = dateTickets.reduce((sum, ticket) => sum + ticket.amount, 0);
        
        // Crear grupo de fecha
        const dateGroup = document.createElement('div');
        dateGroup.className = 'date-group';
        
        // Crear encabezado de fecha
        const dateHeader = document.createElement('div');
        dateHeader.className = 'date-header';
        
        // Formatear fecha para mostrar
        const formattedDate = new Date(date).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Fix date formatting to ensure correct display
        let displayDate;
        try {
            // Create a new date object with the date string
            const dateObj = new Date(date + 'T12:00:00'); // Add noon time to avoid timezone issues
            displayDate = dateObj.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            // Fallback if there's an error
            displayDate = date;
        }
        
        dateHeader.innerHTML = `
            <span>${displayDate}</span>
            <span class="date-total">Total: $${dateTotal.toFixed(2)}</span>
        `;
        
        // Contenedor para tickets de esta fecha
        const dateTicketsContainer = document.createElement('div');
        dateTicketsContainer.className = 'date-tickets';
        
        // Agregar tickets de esta fecha
        dateTickets.forEach(ticket => {
            const ticketCard = document.createElement('div');
            ticketCard.className = 'ticket-card';
            
            const ticketHeader = document.createElement('div');
            ticketHeader.className = 'ticket-header';
            
            const ticketAmount = document.createElement('div');
            ticketAmount.className = 'ticket-amount';
            
            // Add the ticket number to the display if available
            if (ticket.number) {
                ticketAmount.textContent = `Ticket #${ticket.number}: $${ticket.amount.toFixed(2)} (${ticket.employees.length} empleados - $${ticket.tipPerEmployee.toFixed(2)} c/u)`;
            } else {
                ticketAmount.textContent = `$${ticket.amount.toFixed(2)} (${ticket.employees.length} empleados - $${ticket.tipPerEmployee.toFixed(2)} c/u)`;
            }
            
            // Agregar botón de eliminar
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-ticket-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = 'Eliminar ticket';
            deleteBtn.addEventListener('click', () => deleteTicket(ticket.id));
            
            ticketHeader.appendChild(ticketAmount);
            ticketHeader.appendChild(deleteBtn);
            
            ticketCard.appendChild(ticketHeader);
            
            // Add creator information if available
            if (ticket.createdBy) {
                const creatorInfo = document.createElement('div');
                creatorInfo.className = 'ticket-creator';
                creatorInfo.textContent = `Creado por: ${ticket.createdBy}`;
                ticketCard.appendChild(creatorInfo);
            }
            
            const ticketEmployees = document.createElement('div');
            ticketEmployees.className = 'ticket-employees';
            
            ticket.employees.forEach(employee => {
                const employeeTag = document.createElement('span');
                employeeTag.className = 'employee-tag';
                employeeTag.textContent = employee;
                ticketEmployees.appendChild(employeeTag);
            });
            
            ticketCard.appendChild(ticketHeader);
            ticketCard.appendChild(ticketEmployees);
            dateTicketsContainer.appendChild(ticketCard);
        });
        
        dateGroup.appendChild(dateHeader);
        dateGroup.appendChild(dateTicketsContainer);
        ticketsList.appendChild(dateGroup);
    });
}

// Función para eliminar un ticket
function deleteTicket(ticketId) {
    // Mostrar el modal de confirmación
    const modal = document.getElementById('confirm-modal');
    modal.style.display = 'block';
    
    // Guardar el ID del ticket a eliminar
    modal.dataset.ticketId = ticketId;
    
    // Configurar el botón de cancelar
    document.getElementById('cancel-delete').onclick = function() {
        modal.style.display = 'none';
    };
    
    // Configurar el botón de cerrar
    document.querySelector('.close-modal').onclick = function() {
        modal.style.display = 'none';
    };
    
    // Configurar el botón de confirmar
    document.getElementById('confirm-delete').onclick = function() {
        // Ocultar el modal
        modal.style.display = 'none';
        
        // Obtener el ID del ticket a eliminar
        const ticketIdToDelete = parseInt(modal.dataset.ticketId);
        
        // Encontrar el ticket a eliminar
        const ticketIndex = tickets.findIndex(ticket => ticket.id === ticketIdToDelete);
        
        if (ticketIndex !== -1) {
            const ticket = tickets[ticketIndex];
            
            // Restar las propinas de los empleados afectados
            ticket.employees.forEach(employee => {
                employeeTotals[employee] -= ticket.tipPerEmployee;
                
                // Asegurarse de que no haya valores negativos por errores de redondeo
                if (employeeTotals[employee] < 0.01) {
                    employeeTotals[employee] = 0;
                }
            });
            
            // Eliminar el ticket del array
            tickets.splice(ticketIndex, 1);
            
            // Guardar cambios en localStorage
            saveToLocalStorage();
            
            // Actualizar la interfaz
            renderTickets();
            renderTotals();
        }
    };
    
    // Cerrar el modal si se hace clic fuera de él
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Función para mostrar los totales por empleado
function renderTotals() {
    const totalsList = document.getElementById('totals-list');
    
    // Limpiar la lista actual
    totalsList.innerHTML = '';
    
    // Ordenar empleados por monto (de mayor a menor)
    const sortedEmployees = Object.keys(employeeTotals).sort((a, b) => {
        return employeeTotals[b] - employeeTotals[a];
    });
    
    // Agregar cada empleado con su total
    sortedEmployees.forEach(employee => {
        if (employeeTotals[employee] > 0) {
            const employeeDiv = document.createElement('div');
            employeeDiv.className = 'employee-total';
            
            const employeeName = document.createElement('div');
            employeeName.className = 'employee-name';
            employeeName.textContent = employee;
            
            const employeeAmount = document.createElement('div');
            employeeAmount.className = 'employee-amount';
            employeeAmount.textContent = `$${employeeTotals[employee].toFixed(2)}`;
            
            employeeDiv.appendChild(employeeName);
            employeeDiv.appendChild(employeeAmount);
            totalsList.appendChild(employeeDiv);
        }
    });
    
    // Mostrar mensaje si no hay totales
    if (totalsList.children.length === 0) {
        totalsList.innerHTML = '<p class="no-tickets">No hay propinas registradas</p>';
    }
}

// Agregar función para borrar todos los datos (opcional)
function clearAllData() {
    if (confirm('¿Estás seguro de que deseas borrar todos los datos? Esta acción no se puede deshacer.')) {
        tickets = [];
        employees.forEach(employee => {
            employeeTotals[employee] = 0;
        });
        saveToLocalStorage();
        renderTickets();
        renderTotals();
    }
}

// Iniciar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', initApp);

// Add these functions at the end of your script.js file, before the DOMContentLoaded event

// Función para inicializar los reportes
function initReports() {
    // Set default dates
    const today = new Date();
    document.getElementById('daily-report-date').value = today.toISOString().split('T')[0];
    
    // Set current week
    const weekInput = document.getElementById('weekly-report-date');
    const year = today.getFullYear();
    const weekNum = getWeekNumber(today);
    weekInput.value = `${year}-W${weekNum.toString().padStart(2, '0')}`;
    
    // Set current month
    document.getElementById('monthly-report-date').value = `${year}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Add event listeners for report buttons
    document.getElementById('generate-daily-report').addEventListener('click', generateDailyReport);
    document.getElementById('generate-weekly-report').addEventListener('click', generateWeeklyReport);
    document.getElementById('generate-monthly-report').addEventListener('click', generateMonthlyReport);
}

// Función para obtener el número de semana
function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Función para generar reporte diario
function generateDailyReport() {
    const selectedDate = document.getElementById('daily-report-date').value;
    
    // Filtrar tickets por la fecha seleccionada
    const dayTickets = tickets.filter(ticket => ticket.date === selectedDate);
    
    if (dayTickets.length === 0) {
        alert('No hay tickets registrados para la fecha seleccionada.');
        return;
    }
    
    // Calcular totales por empleado para este día
    const dayTotals = {};
    employees.forEach(emp => dayTotals[emp] = 0);
    
    dayTickets.forEach(ticket => {
        ticket.employees.forEach(emp => {
            dayTotals[emp] += ticket.tipPerEmployee;
        });
    });
    
    // Crear PDF
    createPDF(`Reporte Diario - ${formatDate(selectedDate)}`, dayTickets, dayTotals);
}

// Función para generar reporte semanal
function generateWeeklyReport() {
    const selectedWeek = document.getElementById('weekly-report-date').value;
    if (!selectedWeek) {
        alert('Por favor, seleccione una semana.');
        return;
    }
    
    // Extraer año y número de semana
    const [year, week] = selectedWeek.split('-W');
    
    // Obtener fechas de inicio y fin de la semana
    const startDate = getDateOfWeek(parseInt(week), parseInt(year));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    // Formatear fechas para comparación
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log("Buscando tickets entre:", startDateStr, "y", endDateStr);
    console.log("Tickets disponibles:", tickets.length);
    
    // Filtrar tickets dentro del rango de fechas
    const weekTickets = tickets.filter(ticket => {
        console.log(`Comparando ticket fecha: ${ticket.date} (${ticket.date >= startDateStr ? "≥ start" : "< start"}, ${ticket.date <= endDateStr ? "≤ end" : "> end"})`);
        return ticket.date >= startDateStr && ticket.date <= endDateStr;
    });
    
    console.log("Tickets encontrados:", weekTickets.length);
    
    if (weekTickets.length === 0) {
        alert('No hay tickets registrados para la semana seleccionada.');
        return;
    }
    
    // Calcular totales por empleado para esta semana
    const weekTotals = {};
    employees.forEach(emp => weekTotals[emp] = 0);
    
    weekTickets.forEach(ticket => {
        ticket.employees.forEach(emp => {
            weekTotals[emp] += ticket.tipPerEmployee;
        });
    });
    
    // Crear PDF con agrupación por día de la semana
    createWeeklyPDF(`Reporte Semanal - ${formatDate(startDateStr)} al ${formatDate(endDateStr)}`, weekTickets, weekTotals, startDate);
}

// Función para obtener la fecha del primer día de una semana
function getDateOfWeek(week, year) {
    // Crear una fecha para el 4 de enero del año (siempre está en la primera semana)
    const date = new Date(year, 0, 4);
    
    // Obtener el día de la semana (0 = domingo, 1 = lunes, etc.)
    const dayOfWeek = date.getDay();
    
    // Calcular el primer lunes de la primera semana
    const firstMonday = new Date(date);
    // Si es domingo (0), retrocedemos 6 días para llegar al lunes anterior
    // Si es lunes (1), no hacemos nada
    // Si es otro día, retrocedemos los días necesarios para llegar al lunes
    firstMonday.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    // Avanzar a la semana deseada
    const targetDate = new Date(firstMonday);
    targetDate.setDate(firstMonday.getDate() + (week - 1) * 7);
    
    return targetDate;
}

// Función para generar reporte mensual
function generateMonthlyReport() {
    const selectedMonth = document.getElementById('monthly-report-date').value;
    if (!selectedMonth) {
        alert('Por favor, seleccione un mes.');
        return;
    }
    
    // Extraer año y mes
    const [year, month] = selectedMonth.split('-');
    
    // Crear fechas de inicio y fin del mes
    const startDate = new Date(year, parseInt(month) - 1, 1);
    const endDate = new Date(year, parseInt(month), 0); // Último día del mes
    
    // Formatear fechas para comparación
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Filtrar tickets dentro del rango de fechas
    const monthTickets = tickets.filter(ticket => {
        return ticket.date >= startDateStr && ticket.date <= endDateStr;
    });
    
    if (monthTickets.length === 0) {
        alert('No hay tickets registrados para el mes seleccionado.');
        return;
    }
    
    // Calcular totales por empleado para este mes
    const monthTotals = {};
    employees.forEach(emp => monthTotals[emp] = 0);
    
    monthTickets.forEach(ticket => {
        ticket.employees.forEach(emp => {
            monthTotals[emp] += ticket.tipPerEmployee;
        });
    });
    
    // Crear PDF con agrupación por semana
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    createMonthlyPDF(`Reporte Mensual - ${monthNames[parseInt(month) - 1]} ${year}`, monthTickets, monthTotals, parseInt(year), parseInt(month));
}

// Función para crear PDF de reporte semanal agrupado por día
function createWeeklyPDF(title, reportTickets, totals, startDate) {
    // Inicializar jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configurar título
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    
    // Agregar fecha de generación
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString('es-ES')}`, 14, 30);
    
    // Agrupar tickets por día de la semana
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const ticketsByDay = {};
    
    // Inicializar arrays para cada día
    dayNames.forEach(day => {
        ticketsByDay[day] = [];
    });
    
    // Agrupar tickets por día
    reportTickets.forEach(ticket => {
        const ticketDate = new Date(ticket.date + 'T12:00:00');
        const dayName = dayNames[ticketDate.getDay()];
        ticketsByDay[dayName].push(ticket);
    });
    
    // Posición vertical actual
    let yPos = 40;
    
    // Para cada día con tickets, crear una tabla
    dayNames.forEach(day => {
        const dayTickets = ticketsByDay[day];
        
        if (dayTickets.length > 0) {
            // Título del día
            doc.setFontSize(14);
            doc.text(`${day}`, 14, yPos);
            yPos += 10;
            
            // Crear filas para la tabla
            const ticketRows = dayTickets.map(ticket => [
                ticket.number ? `#${ticket.number}` : '-',
                formatDate(ticket.date),
                `$${ticket.amount.toFixed(2)}`,
                ticket.employees.join(', '),
                `$${ticket.tipPerEmployee.toFixed(2)}`
            ]);
            
            // Agregar tabla para este día
            doc.autoTable({
                startY: yPos,
                head: [['Ticket', 'Fecha', 'Monto', 'Empleados', 'Propina por Empleado']],
                body: ticketRows,
            });
            
            // Actualizar posición vertical
            yPos = doc.lastAutoTable.finalY + 15;
            
            // Si la página está llena, agregar una nueva
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
        }
    });
    
    // Agregar página para el resumen si es necesario
    if (yPos > 200) {
        doc.addPage();
        yPos = 20;
    }
    
    // Tabla de totales por empleado
    doc.setFontSize(14);
    doc.text('Resumen por Empleado', 14, yPos);
    yPos += 10;
    
    // Ordenar empleados por monto (de mayor a menor)
    const sortedEmployees = Object.keys(totals).sort((a, b) => {
        return totals[b] - totals[a];
    });
    
    const totalRows = sortedEmployees
        .filter(emp => totals[emp] > 0)
        .map(emp => [emp, `$${totals[emp].toFixed(2)}`]);
    
    doc.autoTable({
        startY: yPos,
        head: [['Empleado', 'Total Propinas']],
        body: totalRows,
    });
    
    // Calcular total general
    const totalAmount = Object.values(totals).reduce((sum, val) => sum + val, 0);
    
    // Agregar total general
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total General: $${totalAmount.toFixed(2)}`, 14, finalY);
    
    // Guardar PDF
    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

// Función para crear PDF de reporte mensual agrupado por semana
function createMonthlyPDF(title, reportTickets, totals, year, month) {
    // Inicializar jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configurar título
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    
    // Agregar fecha de generación
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString('es-ES')}`, 14, 30);
    
    // Agrupar tickets por semana
    const ticketsByWeek = {};
    
    // Agrupar tickets por número de semana
    reportTickets.forEach(ticket => {
        const ticketDate = new Date(ticket.date + 'T12:00:00');
        const weekNum = getWeekNumber(ticketDate);
        
        if (!ticketsByWeek[weekNum]) {
            ticketsByWeek[weekNum] = [];
        }
        
        ticketsByWeek[weekNum].push(ticket);
    });
    
    // Ordenar semanas
    const sortedWeeks = Object.keys(ticketsByWeek).sort((a, b) => parseInt(a) - parseInt(b));
    
    // Posición vertical actual
    let yPos = 40;
    
    // Para cada semana con tickets, crear una tabla
    sortedWeeks.forEach(weekNum => {
        const weekTickets = ticketsByWeek[weekNum];
        
        // Calcular fechas de inicio y fin de la semana
        const firstTicketDate = new Date(weekTickets[0].date + 'T12:00:00');
        const weekStart = new Date(firstTicketDate);
        weekStart.setDate(firstTicketDate.getDate() - firstTicketDate.getDay() + 1); // Lunes
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Domingo
        
        // Título de la semana
        doc.setFontSize(14);
        doc.text(`Semana ${weekNum} (${formatDate(weekStart.toISOString().split('T')[0])} - ${formatDate(weekEnd.toISOString().split('T')[0])})`, 14, yPos);
        yPos += 10;
        
        // Crear filas para la tabla
        const ticketRows = weekTickets.map(ticket => [
            ticket.number ? `#${ticket.number}` : '-',
            formatDate(ticket.date),
            `$${ticket.amount.toFixed(2)}`,
            ticket.employees.join(', '),
            `$${ticket.tipPerEmployee.toFixed(2)}`
        ]);
        
        // Agregar tabla para esta semana
        doc.autoTable({
            startY: yPos,
            head: [['Ticket', 'Fecha', 'Monto', 'Empleados', 'Propina por Empleado']],
            body: ticketRows,
        });
        
        // Actualizar posición vertical
        yPos = doc.lastAutoTable.finalY + 15;
        
        // Si la página está llena, agregar una nueva
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
    });
    
    // Agregar página para el resumen si es necesario
    if (yPos > 200) {
        doc.addPage();
        yPos = 20;
    }
    
    // Tabla de totales por empleado
    doc.setFontSize(14);
    doc.text('Resumen por Empleado', 14, yPos);
    yPos += 10;
    
    // Ordenar empleados por monto (de mayor a menor)
    const sortedEmployees = Object.keys(totals).sort((a, b) => {
        return totals[b] - totals[a];
    });
    
    const totalRows = sortedEmployees
        .filter(emp => totals[emp] > 0)
        .map(emp => [emp, `$${totals[emp].toFixed(2)}`]);
    
    doc.autoTable({
        startY: yPos,
        head: [['Empleado', 'Total Propinas']],
        body: totalRows,
    });
    
    // Calcular total general
    const totalAmount = Object.values(totals).reduce((sum, val) => sum + val, 0);
    
    // Agregar total general
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total General: $${totalAmount.toFixed(2)}`, 14, finalY);
    
    // Guardar PDF
    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

// Función para formatear fecha
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Función para crear PDF
function createPDF(title, reportTickets, totals) {
    // Inicializar jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configurar título
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    
    // Agregar fecha de generación
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString('es-ES')}`, 14, 30);
    
    // Tabla de tickets
    doc.setFontSize(14);
    doc.text('Detalle de Tickets', 14, 40);
    
    const ticketRows = reportTickets.map(ticket => [
        ticket.number ? `#${ticket.number}` : '-',
        formatDate(ticket.date),
        `$${ticket.amount.toFixed(2)}`,
        ticket.employees.join(', '),
        `$${ticket.tipPerEmployee.toFixed(2)}`
    ]);
    
    doc.autoTable({
        startY: 45,
        head: [['Ticket', 'Fecha', 'Monto', 'Empleados', 'Propina por Empleado']],
        body: ticketRows,
    });
    
    // Tabla de totales por empleado
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text('Resumen por Empleado', 14, finalY);
    
    // Ordenar empleados por monto (de mayor a menor)
    const sortedEmployees = Object.keys(totals).sort((a, b) => {
        return totals[b] - totals[a];
    });
    
    const totalRows = sortedEmployees
        .filter(emp => totals[emp] > 0)
        .map(emp => [emp, `$${totals[emp].toFixed(2)}`]);
    
    doc.autoTable({
        startY: finalY + 5,
        head: [['Empleado', 'Total Propinas']],
        body: totalRows,
    });
    
    // Calcular total general
    const totalAmount = Object.values(totals).reduce((sum, val) => sum + val, 0);
    
    // Agregar total general
    const finalY2 = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total General: $${totalAmount.toFixed(2)}`, 14, finalY2);
    
    // Guardar PDF
    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

// Usuarios autorizados
const authorizedUsers = [
    { username: "Cami", password: "8989" },
    { username: "Sofi", password: "Juanito123" },
    { username: "Lily", password: "Carlitos123" },
    { username: "Kike", password: "Sofi123" },
    { username: "invitado", password: "54321" },
    { username: "Toño", password: "L.123456" }
];

// Elementos del DOM para login
const loginSection = document.getElementById('login-section');
const appContent = document.getElementById('app-content');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const currentUserDisplay = document.getElementById('current-user');
const logoutBtn = document.getElementById('logout-btn');

// Verificar si hay una sesión activa
function checkSession() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        showApp(currentUser);
    }
}

// Mostrar la aplicación después del login exitoso
function showApp(username) {
    loginSection.style.display = 'none';
    appContent.style.display = 'block';
    currentUserDisplay.textContent = username;
    // Limpiar campos de login
    usernameInput.value = '';
    passwordInput.value = '';
    loginError.textContent = '';
    // Guardar sesión
    localStorage.setItem('currentUser', username);
}

// Manejar el inicio de sesión
loginBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    const user = authorizedUsers.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password
    );
    
    if (user) {
        showApp(user.username);
    } else {
        loginError.textContent = 'Usuario o contraseña incorrectos';
    }
});

// Manejar el cierre de sesión
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    appContent.style.display = 'none';
    loginSection.style.display = 'flex';
});

// Verificar sesión al cargar la página
document.addEventListener('DOMContentLoaded', checkSession);

// Replace your localStorage code with API calls

// API URL - update this with your actual Render API URL when deployed
const API_URL = 'https://propinas-api.onrender.com/api';

// Load data from server
async function loadData() {
  try {
    const response = await fetch(`${API_URL}/data`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading data:', error);
    return { tickets: [], employees: [] };
  }
}

// Save ticket to server
async function saveTicket(ticket) {
  try {
    const response = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticket),
    });
    return await response.json();
  } catch (error) {
    console.error('Error saving ticket:', error);
    return null;
  }
}

// Delete ticket from server
async function deleteTicket(ticketId) {
  try {
    await fetch(`${API_URL}/tickets/${ticketId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return false;
  }
}

// Update employees on server
async function updateEmployees(employees) {
  try {
    const response = await fetch(`${API_URL}/employees`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employees),
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating employees:', error);
    return null;
  }
}

// Then modify your existing functions to use these API functions
// instead of localStorage operations
