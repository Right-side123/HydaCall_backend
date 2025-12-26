const pool = require("../config/db")

const getCallLogs = async (req, res) => {
    const {
        startDate, endDate,
        startTime, endTime,
        callType, callStatus, callBack,
        department_id, userId, simNumber, callNumber
    } = req.query;

    try {
        let filterQuery = "";
        let filterParams = [];

        if (callType) {
            filterQuery += ` AND c.Call_Type = ?`;
            filterParams.push(callType);
        }

        if (callStatus) {
            filterQuery += ` AND c.Overall_Call_Status = ?`;
            filterParams.push(callStatus);
        }

        if (callBack) {
            filterQuery += ` AND c.Callback_Status = ?`;
            filterParams.push(callBack);
        }

        if (department_id) {
            filterQuery += ` AND u.department_id = ?`;
            filterParams.push(department_id);
        }

        if (userId) {
            filterQuery += ` AND u.id = ?`;
            filterParams.push(userId);
        }

        if (simNumber) {
            filterQuery += ` AND s.SIM_Number = ?`;
            filterParams.push(simNumber);
        }

        if (callNumber) {
            filterQuery += ` AND (c.Caller_Number = ? OR c.Destination_Number = ?)`;
            filterParams.push(callNumber, callNumber);
        }

        const startDateTime = `${startDate} ${startTime || "00:00"}:00`;
        const endDateTime = `${endDate} ${endTime || "23:59"}:59`;

        const query = `
      SELECT
        c.id,
        DATE(c.timestamp) AS call_date,
        TIME(c.timestamp) AS call_time,
        c.Caller_Number,
        c.Overall_Call_Status,
        c.Call_Type,
        c.Recording,
        c.Caller_Circle_Name
      FROM callsrecord c
      LEFT JOIN sim_numbers s
        ON s.SIM_Number = TRIM(LEADING '0' FROM c.Caller_Number)
      LEFT JOIN users u
        ON JSON_CONTAINS(u.phone_number, JSON_QUOTE(s.SIM_Number))
      WHERE c.timestamp BETWEEN ? AND ?
      ${filterQuery}
      ORDER BY c.timestamp DESC
    `;

        const rows = await pool.query(query, [
            startDateTime,
            endDateTime,
            ...filterParams
        ]);

        const formatted = rows.map((row, index) => ({
            "#": index + 1,
            Date: new Date(row.call_date).toLocaleDateString("en-GB"),
            Time: row.call_time,
            CallerNumber: row.Caller_Number,
            Status: row.Overall_Call_Status,
            CallType: row.Call_Type,
            Recording: row.Recording,
            Caller_Circle_Name: row.Caller_Circle_Name

        }));

        res.json(formatted);

    } catch (error) {
        console.error("Error fetching call logs:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



// *************************************************        total    ***************************************//

const getCallLogTotal = async (req, res) => {
    const {
        startDate, endDate,
        startTime, endTime,
        callType, callStatus, callBack,
        department_id, userId, simNumber, callNumber
    } = req.query;

    try {
        let filterQuery = "";
        let filterParams = [];

        if (callType) {
            filterQuery += ` AND c.Call_Type = ?`;
            filterParams.push(callType);
        }

        if (callStatus) {
            filterQuery += ` AND c.Overall_Call_Status = ?`;
            filterParams.push(callStatus);
        }

        if (callBack) {
            filterQuery += ` AND c.Callback_Status = ?`;
            filterParams.push(callBack);
        }

        if (department_id) {
            filterQuery += ` AND u.department_id = ?`;
            filterParams.push(department_id);
        }

        if (userId) {
            filterQuery += ` AND u.id = ?`;
            filterParams.push(userId);
        }

        if (simNumber) {
            filterQuery += ` AND s.SIM_Number = ?`;
            filterParams.push(simNumber);
        }

        if (callNumber) {
            filterQuery += ` AND (c.Caller_Number = ? OR c.Destination_Number = ?)`;
            filterParams.push(callNumber, callNumber);
        }

        const startDateTime = `${startDate} ${startTime || "00:00"}:00`;
        const endDateTime = `${endDate} ${endTime || "23:59"}:59`;

        const query = `
            SELECT
                COUNT(*) AS total_calls,

                SUM(CASE WHEN c.Call_Type = 'INBOUND' THEN 1 ELSE 0 END) AS inbound_calls,
                SUM(CASE WHEN c.Call_Type = 'OUTBOUND' THEN 1 ELSE 0 END) AS outbound_calls,

                SUM(CASE WHEN c.Overall_Call_Status = 'Answered' THEN 1 ELSE 0 END) AS answered_calls,
                SUM(CASE WHEN c.Overall_Call_Status = 'Not Answered' THEN 1 ELSE 0 END) AS not_answered_calls,
                SUM(CASE WHEN c.Overall_Call_Status = 'Missed' THEN 1 ELSE 0 END) AS missed_calls,
                SUM(CASE WHEN c.Overall_Call_Status = 'Busy' THEN 1 ELSE 0 END) AS busy_calls,
                SUM(CASE WHEN c.Overall_Call_Status = 'Not Reachable' THEN 1 ELSE 0 END) AS not_reachable_calls

            FROM callsrecord c
            LEFT JOIN sim_numbers s
                ON s.SIM_Number = TRIM(LEADING '0' FROM c.Caller_Number)
            LEFT JOIN users u
                ON JSON_CONTAINS(u.phone_number, JSON_QUOTE(s.SIM_Number))
            WHERE c.timestamp BETWEEN ? AND ?
            ${filterQuery}
        `;

        const [row] = await pool.query(query, [
            startDateTime,
            endDateTime,
            ...filterParams
        ]);

        res.json([{
            TotalCalls: Number(row.total_calls),
            Inbound: Number(row.inbound_calls),
            Outbound: Number(row.outbound_calls),
            Answered: Number(row.answered_calls),
            NotAnswered: Number(row.not_answered_calls),
            Missed: Number(row.missed_calls),
            Busy: Number(row.busy_calls),
            NotReachable: Number(row.not_reachable_calls)
        }]);

    } catch (error) {
        console.error("Error fetching call summary:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


module.exports = { getCallLogs, getCallLogTotal };
