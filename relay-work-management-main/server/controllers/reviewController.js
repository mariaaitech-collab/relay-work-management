const { ProofOfWork } = require('../models/workModel');
const { createWorkflowNotification } = require('../models/notificationModel');
const { Task } = require('../models/taskModel');
const { recordActivity } = require('../models/activityModel');

const listSubmissions = async (req, res) => {
  try {
    const submissions = await ProofOfWork.find()
      .populate('user_id', 'name email job_role')
      .populate('task_id', 'title due_date')
      .populate('reviewed_by', 'name')
      .sort({ created_at: -1 });
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

const reviewSubmission = async (req, res) => {
  try {
    const { status, message } = req.body;
    if (!['approved', 'changes_requested'].includes(status)) {
      return res.status(400).json({ message: 'Review status must be approved or changes_requested' });
    }
    if (status === 'changes_requested' && !message?.trim()) {
      return res.status(400).json({ message: 'A feedback message is required when requesting changes' });
    }

    const submission = await ProofOfWork.findByIdAndUpdate(
      req.params.id,
      {
        review_status: status,
        review_message: message?.trim() || '',
        reviewed_by: req.user.id,
        reviewed_at: new Date()
      },
      { new: true }
    ).populate('user_id', 'name email job_role').populate('task_id', 'title due_date');

    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    if (submission.task_id?._id) {
      await Task.findByIdAndUpdate(submission.task_id._id, {
        status: status === 'approved' ? 'completed' : 'in_progress',
        completed_at: status === 'approved' ? new Date() : null
      });
    }
    await createWorkflowNotification(req.user.id, submission.user_id._id, status === 'approved'
      ? `Your work submission was approved: ${submission.task_id?.title || 'Work proof'}`
      : `Changes requested for ${submission.task_id?.title || 'Work proof'}: ${message.trim()}`, 'reviews');
    await recordActivity({ actorId: req.user.id, employeeId: submission.user_id._id, taskId: submission.task_id?._id, type: status === 'approved' ? 'task_completed' : 'task_updated', message: `${status === 'approved' ? 'Approved' : 'Requested changes for'} ${submission.task_id?.title || 'work submission'}` });
    res.status(200).json({ message: `Submission ${status === 'approved' ? 'approved' : 'returned for changes'}`, submission });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

module.exports = { listSubmissions, reviewSubmission };
