const { updateScore, logScoreChange } = require('../models/scoreModel');
const { findUserById, findUserByEmail, findUserByEmployeeId } = require('../models/userModel');
const {
  getAllUsers,
  getEmployeeDetail,
  createEmployeeByAdmin,
  updateEmployee,
  deleteEmployee
} = require('../models/adminModel');

// Sab employees dekhna
const listEmployees = async (req, res) => {
  try {
    const employees = await getAllUsers();
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

// Ek employee ka pura detail
const viewEmployee = async (req, res) => {
  try {
    const detail = await getEmployeeDetail(req.params.id);
    res.status(200).json(detail);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

// Naya employee add karna
const addEmployee = async (req, res) => {
  try {
    const { name, email, password, role, department, employeeId } = req.body;

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const trimmedId = employeeId && typeof employeeId === 'string' ? employeeId.trim() : '';
    if (trimmedId) {
      const duplicate = await findUserByEmployeeId(trimmedId);
      if (duplicate) {
        return res.status(400).json({ message: 'Employee ID already in use' });
      }
    }

    const employee = await createEmployeeByAdmin(name, email, password, role, department, trimmedId || undefined);
    res.status(201).json({ message: 'Employee added successfully', employee });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Employee ID already in use' });
    }
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

// Employee edit karna
const editEmployee = async (req, res) => {
  try {
    const { name, email, jobRole, department } = req.body;
    const updated = await updateEmployee(req.params.id, name, email, jobRole, department);
    res.status(200).json({ message: 'Employee updated successfully', updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

// Employee delete karna
const removeEmployee = async (req, res) => {
  try {
    await deleteEmployee(req.params.id);
    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};
// Admin manually score change kar sake
const overrideScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { newScore, reason } = req.body;

    const employee = await findUserById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const oldScore = employee.performance_score;
    let status = 'active';
    if (newScore <= 30) status = 'blocked';
    else if (newScore <= 60) status = 'warning';

    const updated = await updateScore(id, newScore, status);
    await logScoreChange(id, oldScore, newScore, reason || 'Manual adjustment by Admin', 'admin');

    res.status(200).json({ message: 'Score updated successfully', updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};
module.exports = { listEmployees, viewEmployee, addEmployee, editEmployee, removeEmployee, overrideScore };