const pool = require("../config/db");

const getNeverAttendCalls = async (req, res) => {
    const { startDate, endDate, startTime, endTime, department_id, userId, simNumber } = req.query;

    try {
        let filterQuery = "";
        let filterParams = [];

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

        const startDateTime = `${startDate} ${startTime || "00:00"}:00`;
        const endDateTime = `${endDate} ${endTime || "23:59"}:59`;

        const neverAnsweredQuery = `
            SELECT DISTINCT 
                CASE 
                    WHEN c.Call_Type = 'Inbound' THEN c.Caller_Number
                    ELSE c.Destination_Number
                END AS phone_number
            FROM callsrecord c
            WHERE c.timestamp BETWEEN ? AND ?
            GROUP BY phone_number
            HAVING SUM(CASE WHEN c.Overall_Call_Status = 'Answered' THEN 1 ELSE 0 END) = 0;
        `;

        const neverAnsweredRows = await pool.query(neverAnsweredQuery, [startDateTime, endDateTime]);

        if (neverAnsweredRows.length === 0) {
            return res.json([]);
        }

        const neverAnsweredNumbers = neverAnsweredRows.map(r => r.phone_number);

        const detailsQuery = `
            SELECT 
                c.id,
                c.Call_Type,
                c.Caller_Number,
                c.Destination_Number,
                s.name AS employee_name,
                c.timestamp AS call_time
            FROM callsrecord c
            LEFT JOIN sim_numbers s 
                ON s.SIM_Number = TRIM(LEADING '0' FROM 
                    CASE 
                        WHEN c.Call_Type = 'Inbound' THEN c.Destination_Number
                        ELSE c.Caller_Number
                    END
                )
            LEFT JOIN users u 
                ON JSON_CONTAINS(u.phone_number, JSON_QUOTE(s.SIM_Number))
            WHERE c.timestamp BETWEEN ? AND ?
              AND c.Overall_Call_Status != 'Answered'
              AND (
                c.Caller_Number IN (${neverAnsweredNumbers.map(() => '?').join(',')})
                OR c.Destination_Number IN (${neverAnsweredNumbers.map(() => '?').join(',')})
              )
              ${filterQuery}
            ORDER BY c.timestamp DESC;
        `;

        const params = [
            startDateTime,
            endDateTime,
            ...neverAnsweredNumbers,
            ...neverAnsweredNumbers,
            ...filterParams
        ];

        const rows = await pool.query(detailsQuery, params);

        const formatted = rows.map((row, index) => {
            const employeeNumber = row.Call_Type === 'Outbound' ? row.Caller_Number : row.Destination_Number;
            const customerNumber = row.Call_Type === 'Outbound' ? row.Destination_Number : row.Caller_Number;
            const employeeName = row.employee_name || "-";

            return {
                "#": index + 1,
                Employee: employeeNumber,
                "EmployeeName": employeeName,
                "ToNumber": customerNumber,
                "CallType": row.Call_Type,
                Date: new Date(row.call_time).toLocaleDateString("en-GB"),
                Time: new Date(row.call_time).toLocaleTimeString("en-GB")
            };
        });

        res.json(formatted);

    } catch (error) {
        console.error("Error fetching never answered calls:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};



const getNotPickedByClientCalls = async (req, res) => {
    const { startDate, endDate, startTime, endTime, department_id, userId, simNumber } = req.query;

    try {
        let filterQuery = "";
        let filterParams = [];

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

        const startDateTime = `${startDate} ${startTime || "00:00"}:00`;
        const endDateTime = `${endDate} ${endTime || "23:59"}:59`;

        const query = `
            SELECT 
                c.id,
                c.Call_Type,
                c.Caller_Number,
                c.Destination_Number,
                s.name AS employee_name,
                c.timestamp AS call_time
            FROM callsrecord c
            LEFT JOIN sim_numbers s 
                ON s.SIM_Number = TRIM(LEADING '0' FROM c.Caller_Number)
            LEFT JOIN users u 
                ON JSON_CONTAINS(u.phone_number, JSON_QUOTE(s.SIM_Number))
            WHERE c.timestamp BETWEEN ? AND ?
              AND c.Call_Type = 'Outbound'
              AND c.Overall_Call_Status != 'Answered'
              ${filterQuery}
            ORDER BY c.timestamp DESC
        `;

        const params = [
            startDateTime,
            endDateTime,
            ...filterParams
        ];

        const rows = await pool.query(query, params);

        const formatted = rows.map((row, index) => ({
            "#": index + 1,
            Employee: row.Caller_Number,
            EmployeeName: row.employee_name || "-",
            ToNumber: row.Destination_Number,
            CallType: row.Call_Type,
            Date: new Date(row.call_time).toLocaleDateString("en-GB"),
            Time: new Date(row.call_time).toLocaleTimeString("en-GB")
        }));

        res.json(formatted);

    } catch (error) {
        console.error("Error fetching not picked by client calls:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};




const getUniqueClientReport = async (req, res) => {
    const { startDate, endDate, startTime, endTime, department_id, userId, simNumber, callType } = req.query;

    try {
        let filterQuery = "";
        let filterParams = [];

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

        if (callType) {
            filterQuery += ` AND c.Call_Type = ?`
            filterParams.push(callType);
        }
        const startDateTime = `${startDate} ${startTime || "00:00"}:00`;
        const endDateTime = `${endDate} ${endTime || "23:59"}:59`;

        const query = `
      SELECT
    CASE 
        WHEN c.Call_Type = 'Outbound' THEN c.Destination_Number
        ELSE c.Caller_Number
    END AS customer_number,

    CAST(COUNT(*) AS UNSIGNED) AS total_calls,
    CAST(SUM(c.Overall_Call_Duration) AS UNSIGNED) AS total_duration,

    CAST(SUM(CASE WHEN c.Call_Type = 'Inbound' THEN 1 ELSE 0 END) AS UNSIGNED) AS incoming_calls,
    CAST(SUM(CASE WHEN c.Call_Type = 'Inbound' THEN c.Overall_Call_Duration ELSE 0 END) AS UNSIGNED) AS incoming_duration,

    CAST(SUM(CASE WHEN c.Call_Type = 'Outbound' THEN 1 ELSE 0 END) AS UNSIGNED) AS outgoing_calls,
    CAST(SUM(CASE WHEN c.Call_Type = 'Outbound' THEN c.Overall_Call_Duration ELSE 0 END) AS UNSIGNED) AS outgoing_duration,

    CAST(SUM(CASE WHEN c.Overall_Call_Status = 'Missed' THEN 1 ELSE 0 END) AS UNSIGNED) AS missed,
    CAST(SUM(CASE WHEN c.Overall_Call_Status = 'Answered' THEN 1 ELSE 0 END) AS UNSIGNED) AS connected_calls,

    CAST(SUM(CASE WHEN c.Overall_Call_Status != 'Answered' THEN 1 ELSE 0 END) AS UNSIGNED) AS never_attended,

    MAX(c.timestamp) AS last_call_details

FROM callsrecord c
LEFT JOIN sim_numbers s 
    ON s.SIM_Number = TRIM(LEADING '0' FROM 
        CASE 
            WHEN c.Call_Type = 'Outbound' THEN c.Caller_Number
            ELSE c.Destination_Number
        END
    )
LEFT JOIN users u 
    ON JSON_CONTAINS(u.phone_number, JSON_QUOTE(s.SIM_Number))

WHERE c.timestamp BETWEEN ? AND ?
${filterQuery}

GROUP BY customer_number
ORDER BY last_call_details DESC;

        `;

        const params = [
            startDateTime,
            endDateTime,
            ...filterParams
        ];

        const rows = await pool.query(query, params);

        const formatted = rows.map((row, index) => ({
            "#": index + 1,
            CustomerNumber: row.customer_number,
            TotalCalls: Number(row.total_calls),
            TotalDuration: Number(row.total_duration),
            IncomingCalls: Number(row.incoming_calls),
            IncomingDuration: Number(row.incoming_duration),
            OutgoingCalls: Number(row.outgoing_calls),
            OutgoingDuration: Number(row.outgoing_duration),
            Missed: Number(row.missed),
            ConnectedCalls: Number(row.connected_calls),
            NeverAttended: Number(row.never_attended),
            LastCallDate: row.last_call_details
                ? new Date(row.last_call_details).toLocaleDateString("en-GB")
                : "-",
            LastCallTime: row.last_call_details
                ? new Date(row.last_call_details).toLocaleTimeString("en-GB")
                : "-"
        }));


        res.json(formatted);

    } catch (error) {
        console.error("Error fetching unique client report:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};


module.exports = { getNeverAttendCalls, getNotPickedByClientCalls, getUniqueClientReport };
