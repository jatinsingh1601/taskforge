const db = require('../db');

const getProjects = async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_count
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id IN (
        SELECT project_id FROM project_members WHERE user_id = $1
      )
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { next(err); }
};

const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Project name is required' });

    const { rows } = await db.query(
      `INSERT INTO projects (name, description, owner_id) VALUES ($1,$2,$3) RETURNING *`,
      [name.trim(), description, req.user.id]
    );
    // Auto-add creator as admin member
    await db.query(
      `INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,'admin')`,
      [rows[0].id, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(`
      SELECT p.*, u.name as owner_name FROM projects p
      JOIN users u ON p.owner_id = u.id WHERE p.id = $1
    `, [id]);
    if (!rows.length) return res.status(404).json({ message: 'Project not found' });

    const members = await db.query(`
      SELECT u.id, u.name, u.email, u.avatar_color, pm.role
      FROM project_members pm JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
    `, [id]);

    res.json({ ...rows[0], members: members.rows });
  } catch (err) { next(err); }
};

const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const { rows } = await db.query(
      `UPDATE projects SET name=COALESCE($1,name), description=COALESCE($2,description)
       WHERE id=$3 AND owner_id=$4 RETURNING *`,
      [name, description, id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Project not found or not owner' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM projects WHERE id=$1 AND owner_id=$2', [id, req.user.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) { next(err); }
};

const addMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, role = 'member' } = req.body;
    const user = await db.query('SELECT id FROM users WHERE email=$1', [email]);
    if (!user.rows.length) return res.status(404).json({ message: 'User not found' });

    await db.query(
      `INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,$3)
       ON CONFLICT (project_id, user_id) DO UPDATE SET role=$3`,
      [id, user.rows[0].id, role]
    );
    res.json({ message: 'Member added' });
  } catch (err) { next(err); }
};

const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    await db.query('DELETE FROM project_members WHERE project_id=$1 AND user_id=$2', [id, userId]);
    res.json({ message: 'Member removed' });
  } catch (err) { next(err); }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember };
