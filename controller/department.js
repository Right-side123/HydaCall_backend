const pool = require('../config/db');

const createDepartment = async (req, res) => {

    try {
        const { name } = req.body;
        const result = await pool.query('INSERT INTO departments (name) VALUES (?)', [name]);

        const insertedId = Number(result.insertId);
        res.status(201).json({ message: 'Department created successfully', id: result.insertedId, name });
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Failed to create item' });
    }
};

const getDepartment = async (req, res) => {

    try {

        const items = await pool.query('SELECT * FROM departments');
        res.status(200).json(items);
        // console.log(items);

    } catch (error) {
        console.error('Error fetching department:', error);
        res.status(500).json({ error: 'Failed to fetch department' });
    }
};

const updateDepartment = async (req, res) => {

    try {
        const { id } = req.params;
        const { name } = req.body;
        const result = await pool.query('UPDATE departments SET name = ? WHERE id = ?', [name, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Department not found' });
        }
        res.status(200).json({ message: 'Department updated successfully' });
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Failed to update department' });
    }
};


const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM departments WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Department not found' });
        }

        res.status(200).json({ message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ error: 'Failed to delete department' });
    }
};

module.exports = {
    createDepartment,
    getDepartment,
    updateDepartment,
    deleteDepartment
};
