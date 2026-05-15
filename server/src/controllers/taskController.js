const db = require('../db');

const logActivity = async (userId, projectId, taskId, action, details) => {
  await db.query(
    `INSERT INTO activity_logs (user_id, project_id, task_id, action, details) VALUES ($1,$2,$3,$4,$5)`,
    [userId, projectId, taskId, action, details]
  ).catch(console.error);
};

const getTasksByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { rows } = await db.query(`
      SELECT t.*,
        u.name as assignee_name, u.avatar_color as assignee_color,
        cb.name as created_by_name,
        CASE WHEN t.due_date < NOW() AND t.status != 'done' THEN true ELSE false END as is_overdue
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users cb ON t.created_by = cb.id
      WHERE t.project_id = $1
      ORDER BY
        CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
        t.created_at DESC
    `, [projectId]);
    res.json(rows);
  } catch (err) { next(err); }
};

const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, priority = 'medium', due_date, assignee_id } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });

    const { rows } = await db.query(`
      INSERT INTO tasks (title, description, priority, due_date, project_id, assignee_id, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [title.trim(), description, priority, due_date || null, projectId, assignee_id || null, req.user.id]);

    await logActivity(req.user.id, projectId, rows[0].id, 'created_task', `Created task: ${title}`);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

const getTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(`
      SELECT t.*, u.name as assignee_name, cb.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users cb ON t.created_by = cb.id
      WHERE t.id = $1
    `, [id]);
    if (!rows.length) return res.status(404).json({ message: 'Task not found' });

    const logs = await db.query(`
      SELECT al.*, u.name as user_name FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.task_id = $1 ORDER BY al.created_at DESC LIMIT 20
    `, [id]);

    res.json({ ...rows[0], activity: logs.rows });
  } catch (err) { next(err); }
};

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, priority, due_date, status } = req.body;
    const { rows } = await db.query(`
      UPDATE tasks SET
        title       = COALESCE($1, title),
        description = COALESCE($2, description),
        priority    = COALESCE($3, priority),
        due_date    = COALESCE($4, due_date),
        status      = COALESCE($5, status),
        updated_at  = NOW()
      WHERE id = $6 RETURNING *
    `, [title, description, priority, due_date, status, id]);
    if (!rows.length) return res.status(404).json({ message: 'Task not found' });
    await logActivity(req.user.id, rows[0].project_id, id, 'updated_task', `Updated task fields`);
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ['todo', 'in_progress', 'review', 'done'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const { rows } = await db.query(
      `UPDATE tasks SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [status, id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Task not found' });
    await logActivity(req.user.id, rows[0].project_id, id, 'status_changed', `Status → ${status}`);
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const assignTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignee_id } = req.body;
    const { rows } = await db.query(
      `UPDATE tasks SET assignee_id=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [assignee_id || null, id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Task not found' });
    const assignee = assignee_id ? await db.query('SELECT name FROM users WHERE id=$1', [assignee_id]) : null;
    await logActivity(req.user.id, rows[0].project_id, id, 'assigned_task',
      `Assigned to: ${assignee?.rows[0]?.name || 'unassigned'}`);
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM tasks WHERE id=$1', [id]);
    res.json({ message: 'Task deleted' });
  } catch (err) { next(err); }
};

module.exports = { getTasksByProject, createTask, getTask, updateTask, updateTaskStatus, assignTask, deleteTask };
