const mongoose = require('mongoose');
const { Task } = require('../models/taskModel');
const { User } = require('../models/userModel');
const { createWorkflowNotification } = require('../models/notificationModel');
const { recordActivity } = require('../models/activityModel');

const normalizeIds = (ids) => [...new Set((Array.isArray(ids) ? ids : [ids]).filter(Boolean).map(String))];

const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, assigneeIds } = req.body;
    const ids = normalizeIds(assigneeIds);
    if (!title?.trim() || ids.length === 0) {
      return res.status(400).json({ message: 'Task title and at least one employee are required' });
    }
    if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: 'One or more employee IDs are invalid' });
    }

    const employees = await User.find({ _id: { $in: ids }, role: 'employee' }).select('_id');
    if (employees.length !== ids.length) {
      return res.status(400).json({ message: 'Tasks can only be assigned to valid employees' });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || '',
      due_date: dueDate || null,
      priority: priority || 'medium',
      assignee_ids: ids,
      created_by: req.user.id
    });
    await task.populate('assignee_ids', 'name email job_role');
    await createWorkflowNotification(req.user.id, ids, `New task assigned: ${task.title}${task.due_date ? ` (due ${task.due_date})` : ''}`, 'tasks');
    await recordActivity({ actorId: req.user.id, taskId: task.id, type: 'task_assigned', message: `Assigned ${task.title} to ${ids.length} employee${ids.length === 1 ? '' : 's'}` });
    res.status(201).json({ message: 'Task assigned successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

const listAssignedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignee_ids: req.user.id, status: { $nin: ['completed', 'cancelled', 'archived'] } })
      .populate('created_by', 'name job_role')
      .sort({ due_date: 1, created_at: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

const listTasks = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    await Task.updateMany({ due_date: { $lt: today }, status: { $in: ['assigned', 'in_progress', 'open'] } }, { status: 'overdue' });
    const tasks = await Task.find()
      .populate('assignee_ids', 'name email job_role')
      .populate('created_by', 'name')
      .sort({ created_at: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

const updateTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, assigneeIds, status } = req.body;
    const allowedStatuses = ['assigned', 'in_progress', 'submitted', 'completed', 'overdue', 'cancelled'];
    if (status && !allowedStatuses.includes(status)) return res.status(400).json({ message: 'Invalid task status' });
    const update = {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(dueDate !== undefined && { due_date: dueDate || null }),
      ...(priority !== undefined && { priority }),
      ...(assigneeIds !== undefined && { assignee_ids: normalizeIds(assigneeIds) }),
      ...(status !== undefined && { status, completed_at: status === 'completed' ? new Date() : null })
    };
    const task = await Task.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('assignee_ids', 'name email job_role');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await recordActivity({ actorId: req.user.id, taskId: task.id, type: status === 'completed' ? 'task_completed' : 'task_updated', message: `${status ? `Marked ${task.title} as ${status.replace('_', ' ')}` : `Updated ${task.title}`}` });
    res.status(200).json({ message: 'Task updated successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

const listActivity = async (req, res) => {
  try {
    const { Activity } = require('../models/activityModel');
    const activity = await Activity.find().populate('actor_id', 'name job_role').populate('employee_id', 'name job_role').populate('task_id', 'title').sort({ created_at: -1 }).limit(30);
    res.status(200).json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

module.exports = { createTask, listAssignedTasks, listTasks, updateTask, listActivity };
