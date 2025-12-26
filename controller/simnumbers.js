const pool = require('../config/db');

const getSimNumber = async (req, res) => {
    try {
        const rows = await pool.query(`
            SELECT id, SIM_Number, Name, Department
            FROM sim_numbers
        `);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching SIM numbers:', err);
        res.status(500).json({ error: 'Failed to fetch SIM numbers' });
    }
};



const getSimNumberById = async (req, res) => {
    try {
        const { id } = req.params;

        const rows = await pool.query("SELECT * FROM sim_numbers WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "SIM Number not found" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("Error fetching SIM Number by ID:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};



const updateSimNumber = async (req, res) => {
    try {
        const { id } = req.params;
        const { Name, Department } = req.body;

        // console.log(" Received body:", req.body);
        // console.log(" Updating SIM ID:", id);

        const oldRows = await pool.query("SELECT * FROM sim_numbers WHERE id = ?", [id]);
        // console.log("Old Rows Result:", oldRows);

        const oldData = oldRows[0]; // first row
        if (!oldData) {
            return res.status(404).json({ message: "SIM Number not found" });
        }
        // console.log(" Old Data Fetched:", oldData);

        // Update main table
        const result = await pool.query(
            `UPDATE sim_numbers SET Name = ?, Department = ? WHERE id = ?`,
            [Name, Department, id]
        );
        // console.log("Update result:", result);

        // Insert into history
        await pool.query(
            `INSERT INTO sim_number_history 
        (sim_id, sim_number, old_name, new_name, old_department, new_department, event_type)
       VALUES (?, ?, ?, ?, ?, ?, 'Update')`,
            [
                id,
                oldData.SIM_Number,
                oldData.Name,
                Name,
                oldData.Department,
                Department,
            ]
        );

        res.status(200).json({ message: "SIM updated & history logged" });
    } catch (error) {
        console.error("❌ Error updating SIM Number:", error);
        res.status(500).json({ error: error.message });
    }
};



// **************************************   updated page API

const getUpdateSimNumber = async (req, res) => {
    try {
        const rows = await pool.query(`
            SELECT *
            FROM sim_number_history
        `);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching SIM numbers:', err);
        res.status(500).json({ error: 'Failed to fetch SIM numbers' });
    }
};




const getUpdateSimNumberById = async (req, res) => {
    try {
        const { id } = req.params;

        const rows = await pool.query("SELECT * FROM sim_number_history WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "SIM Number not found" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("Error fetching SIM Number by ID:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const getUpdateSimNumberByNumber = async (req, res) => {
    console.log("Hit route", req.params);
    try {
        const { sim_number } = req.params;
        // console.log(sim_number);


        // Ensure it's string
        const simNumberStr = sim_number.toString();
        // console.log(simNumberStr);


        const rows = await pool.query(
            "SELECT * FROM sim_number_history WHERE sim_number = ?",
            [simNumberStr]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "SIM Number not found" });
        }

        res.json(rows);
    } catch (err) {
        console.error("Error fetching SIM Number:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


module.exports = {
    getSimNumber,
    getSimNumberById,
    updateSimNumber,
    getUpdateSimNumber,
    getUpdateSimNumberById,
    getUpdateSimNumberByNumber
}
