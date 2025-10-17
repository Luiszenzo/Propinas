const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Data file path
const dataFilePath = path.join(__dirname, 'data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(dataFilePath)) {
  fs.writeFileSync(dataFilePath, JSON.stringify({
    tickets: [],
    employees: [
      { id: 1, name: "Empleado 1", active: true },
      { id: 2, name: "Empleado 2", active: true },
      { id: 3, name: "Empleado 3", active: true },
      { id: 4, name: "Empleado 4", active: true }
    ]
  }));
}

// Read data
function readData() {
  const data = fs.readFileSync(dataFilePath, 'utf8');
  return JSON.parse(data);
}

// Write data
function writeData(data) {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// API Routes
// Get all data
app.get('/api/data', (req, res) => {
  try {
    const data = readData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error reading data' });
  }
});

// Add a ticket
app.post('/api/tickets', (req, res) => {
  try {
    const data = readData();
    const newTicket = req.body;
    newTicket.id = Date.now(); // Simple ID generation
    data.tickets.push(newTicket);
    writeData(data);
    res.status(201).json(newTicket);
  } catch (error) {
    res.status(500).json({ error: 'Error adding ticket' });
  }
});

// Delete a ticket
app.delete('/api/tickets/:id', (req, res) => {
  try {
    const data = readData();
    const ticketId = parseInt(req.params.id);
    data.tickets = data.tickets.filter(ticket => ticket.id !== ticketId);
    writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting ticket' });
  }
});

// Update employees
app.put('/api/employees', (req, res) => {
  try {
    const data = readData();
    data.employees = req.body;
    writeData(data);
    res.json(data.employees);
  } catch (error) {
    res.status(500).json({ error: 'Error updating employees' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});