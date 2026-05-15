const db = require('../db');

const getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Projects where user is a member
    const projectIds = await db.query(
      `SELECT project_id FROM project_members WHERE user_id = $1`, [userId]
    );
    const ids = projectIds.rows.map(r => r.project_id);
    if (!ids.length) {
      return res.json({
        totalTasks: 0, byStatus: {}, byPriority: {}, overdue: [], recentActivity: [], projectStats: [],
      });
    }

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');

    const [totalQ, statusQ, priorityQ, overdueQ, activityQ, projectStatsQ] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM tasks WHERE project_id IN (${placeholders})`, ids),
      db.query(`SELECT status, COUNT(*) as count FROM tasks WHERE project_id IN (${placeholders}) GROUP BY status`, ids),
      db.query(`SELECT priority, COUNT(*) as count FROM tasks WHERE project_id IN (${placeholders}) GROUP BY priority`, ids),
      db.query(`
        SELECT t.id, t.title, t.due_date, t.priority, p.name as project_name
        FROM tasks t JOIN projects p ON t.project_id = p.id
        WHERE t.project_id IN (${placeholders}) AND t.due_date < NOW() AND t.status != 'done'
        ORDER BY t.due_date ASC LIMIT 10
      `, ids),
      db.query(`
        SELECT al.action, al.details, al.created_at, u.name as user_name, t.title as task_title
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        LEFT JOIN tasks t ON al.task_id = t.id
        WHERE al.project_id IN (${placeholders})
        ORDER BY al.created_at DESC LIMIT 15
      `, ids),
      db.query(`
        SELECT p.id, p.name,
          COUNT(t.id) as total_tasks,
          SUM(CASE WHEN t.status='done' THEN 1 ELSE 0 END) as done_tasks
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id
        WHERE p.id IN (${placeholders})
        GROUP BY p.id, p.name
        ORDER BY total_tasks DESC
      `, ids),
    ]);

    const byStatus = {};
    statusQ.rows.forEach(r => byStatus[r.status] = parseInt(r.count));

    const byPriority = {};
    priorityQ.rows.forEach(r => byPriority[r.priority] = parseInt(r.count));

    res.json({
      totalTasks: parseInt(totalQ.rows[0].count),
      byStatus,
      byPriority,
      overdue: overdueQ.rows,
      recentActivity: activityQ.rows,
      projectStats: projectStatsQ.rows,
    });
  } catch (err) { next(err); }
};

const getMyTasks = async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT t.*, p.name as project_name,
        CASE WHEN t.due_date < NOW() AND t.status != 'done' THEN true ELSE false END as is_overdue
      FROM tasks t JOIN projects p ON t.project_id = p.id
      WHERE t.assignee_id = $1
      ORDER BY
        CASE WHEN t.due_date < NOW() AND t.status != 'done' THEN 0 ELSE 1 END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { next(err); }
};

module.exports = { getStats, getMyTasks };
