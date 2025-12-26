const pool = require('../config/db');

function fixBigInt(obj) {
    return JSON.parse(JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));
}



// *********************************     Top Total Count API  Controller *************************

const totalCountUserSummary = async (req, res) => {


    try {

        const totalUsers = await pool.query(`
            SELECT COUNT(*) AS total_user FROM users
            `);

        const totalActiveUsers = await pool.query(`
      SELECT COUNT(*) AS total_active FROM users WHERE status = 'active'
    `);

        const totalInactiveUsers = await pool.query(`
      SELECT COUNT(*) AS total_inactive FROM users WHERE status = 'inactive'
    `);

        //     const [simNumbers] = await pool.query(`
        //   SELECT COUNT(DISTINCT sim_number) AS total_sim FROM users
        //   WHERE sim_number IS NOT NULL
        // `);

        const totalDepartments = await pool.query(`
      SELECT COUNT(*) AS total_department FROM departments
    `);

        const totalSimNumber = await pool.query(`
        SELECT COUNT(*) AS total_simnumber FROM sim_numbers
         `);

        res.json({
            users: fixBigInt(totalUsers[0].total_user || 0),
            active_users: fixBigInt(totalActiveUsers[0].total_active || 0),
            inactive_users: fixBigInt(totalInactiveUsers[0].total_inactive || 0),
            // total_sim: simNumbers[0].total_sim,
            departments: fixBigInt(totalDepartments[0].total_department || 0),
            simnumbers: fixBigInt(totalSimNumber[0].total_simnumber || 0)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};




const createUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            department_id,
            allowed_departments,
            phone_number,
            status,
            password_expire_days,
            date_format,
            allowed_reports
        } = req.body;

        // console.log("Request Body:", req.body);

        const result = await pool.query(
            `INSERT INTO users 
            (name, email, password, department_id, allowed_departments, phone_number, status, password_expire_days, date_format, allowed_reports) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                email,
                password,
                department_id,
                JSON.stringify(allowed_departments || []),
                JSON.stringify(phone_number || []),
                status,
                password_expire_days,
                date_format,
                JSON.stringify(allowed_reports || [])
            ]
        );

        const safeResult = fixBigInt(result);
        res.status(201).json({
            message: 'User created successfully',
            id: safeResult.insertId
        });
    } catch (err) {
        console.error('Error creating item:', err);
        res.status(500).json({ error: 'Failed to create user' });
    }
};





const getUser = async (req, res) => {
    try {
        const items = await pool.query(`
            SELECT 
                u.*, 
                d.name AS department_name,
                JSON_LENGTH(u.phone_number) AS phone_number_count
            FROM users u
            JOIN departments d ON u.department_id = d.id
        `);

        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};



const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        // Agar tum SQL/MariaDB use kar rahe ho to query aisa hoga:
        const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("Error fetching user by ID:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            email,
            password,
            department_id,
            allowed_departments,
            phone_number,
            status,
            password_expire_days,
            date_format,
            allowed_reports
        } = req.body;

        const result = await pool.query(
            `UPDATE users 
             SET name = ?, email = ?, password = ?, department_id = ?, 
                 allowed_departments = ?, phone_number = ?, status = ?, 
                 password_expire_days = ?, date_format = ?, allowed_reports = ? 
             WHERE id = ?`,
            [
                name,
                email,
                password,
                department_id,
                JSON.stringify(allowed_departments || []),
                JSON.stringify(phone_number || []),
                status,
                password_expire_days,
                date_format,
                JSON.stringify(allowed_reports || []),
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};


const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM users WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

// *************************    assigned number of user  ************************

const UsersAssignedNumbers = async (req, res) => {
    try {
        const userId = req.params.userId;

        // 1️⃣ Fetch user's phone_number JSON array
        const result = await pool.query("SELECT phone_number FROM users WHERE id = ?", [userId]);
        const userRows = Array.isArray(result[0]) ? result[0] : result;


        if (userRows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        // 2️⃣ Parse JSON string to array
        let phoneNumbers;
        try {
            phoneNumbers = JSON.parse(userRows[0].phone_number);
        } catch (err) {
            return res.status(400).json({ message: "Invalid phone_number format in database" });
        }

        if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
            return res.status(400).json({ message: "No phone numbers found for this user" });
        }

        // 3️⃣ Fetch SIM details from sim_details table using those numbers
        const simResult = await pool.query(
            "SELECT SIM_Number, Name, Department FROM sim_numbers WHERE SIM_Number IN (?)",
            [phoneNumbers]
        );
        const simDetails = Array.isArray(simResult[0]) ? simResult[0] : simResult;


        // 4️⃣ Return SIM details
        if (simDetails.length === 0) {
            return res.status(404).json({ message: "No SIM details found for selected numbers" });
        }

        res.status(200).json(simDetails);
    } catch (error) {
        console.error("❌ Error fetching SIM details:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


module.exports = {
    totalCountUserSummary,
    createUser,
    getUser,
    getUserById,
    updateUser,
    deleteUser,
    UsersAssignedNumbers
}
