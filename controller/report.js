const pool = require('../config/db');

const getReport = async (req, res) => {
    try {
        const { startDate, endDate, department, simNumber, userId } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Please provide startDate and endDate" });
        }

        const params = [`${startDate} 00:00:00`, `${endDate} 23:59:59`];
        let filterQuery = "";

        if (department) {
            filterQuery += ` AND u.department_id = ?`;
            params.push(department);
        }
        if (simNumber) {
            filterQuery += ` AND s.SIM_Number = ?`;
            params.push(simNumber);
        }
        if (userId) {
            filterQuery += ` AND u.id = ?`;
            params.push(userId);
        }

        const inboundQuery = `
            SELECT 
                COUNT(*) AS total_calls,
                SUM(CASE WHEN c.Overall_Call_Status = 'Answered' THEN 1 ELSE 0 END) AS answered_calls,
                SUM(CASE WHEN c.Overall_Call_Status = 'Missed' THEN 1 ELSE 0 END) AS missed_calls,
                SEC_TO_TIME(SUM(TIME_TO_SEC(c.Billable_Duration))) AS call_duration
            FROM callsrecord c
            INNER JOIN sim_numbers s ON TRIM(LEADING '0' FROM c.Destination_Number) = s.SIM_Number
            INNER JOIN users u ON JSON_CONTAINS(u.phone_number, JSON_QUOTE(s.SIM_Number))
            WHERE c.Call_Type = 'Inbound'
            AND c.timestamp BETWEEN ? AND ? ${filterQuery}
        `;

        const outboundQuery = `
            SELECT 
                COUNT(*) AS outbound_total_calls,
                SUM(CASE WHEN c.Overall_Call_Status = 'Answered' THEN 1 ELSE 0 END) AS outbound_answered_calls,
                SUM(CASE WHEN c.Caller_Status = 'busy' THEN 1 ELSE 0 END) AS busy_calls,
                SUM(CASE WHEN c.Caller_Status = 'NoAnswer' THEN 1 ELSE 0 END) AS noanswer_calls,
                SUM(CASE WHEN c.Caller_Status = 'NotReachable' THEN 1 ELSE 0 END) AS notreachable_calls,
                SEC_TO_TIME(SUM(TIME_TO_SEC(c.Billable_Duration))) AS outbound_call_duration
            FROM callsrecord c
            INNER JOIN sim_numbers s ON TRIM(LEADING '0' FROM c.Caller_Number) = s.SIM_Number
            INNER JOIN users u ON JSON_CONTAINS(u.phone_number, JSON_QUOTE(s.SIM_Number))
            WHERE c.Call_Type = 'Outbound'
            AND c.timestamp BETWEEN ? AND ? ${filterQuery}
        `;

        const insightQuery = `
            SELECT
                COUNT(DISTINCT c.Destination_Number) AS unique_clients,
                SUM(CASE WHEN c.Overall_Call_Status = 'Answered' THEN 1 ELSE 0 END) AS connected_calls,
                SUM(CASE WHEN c.Overall_Call_Status = 'Missed' THEN 1 ELSE 0 END) AS never_attended
            FROM callsrecord c
            INNER JOIN sim_numbers s ON (
                TRIM(LEADING '0' FROM c.Destination_Number) = s.SIM_Number
                OR TRIM(LEADING '0' FROM c.Caller_Number) = s.SIM_Number
            )
            INNER JOIN users u ON JSON_CONTAINS(u.phone_number, JSON_QUOTE(s.SIM_Number))
            WHERE c.timestamp BETWEEN ? AND ? ${filterQuery}
        `;

        const [inbound, outbound, insights] = await Promise.all([
            pool.query(inboundQuery, params),
            pool.query(outboundQuery, params),
            pool.query(insightQuery, params)
        ]);

        const formatDuration = (duration) => {
            if (!duration) return "0h 0m 0s";
            const [h, m, s] = duration.split(':').map(Number);
            return `${h}h ${m}m ${s}s`;
        };

        res.json({

            total_calls: Number(inbound[0]?.total_calls) || 0,
            answered_calls: Number(inbound[0]?.answered_calls) || 0,
            missed_calls: Number(inbound[0]?.missed_calls) || 0,
            call_duration: formatDuration(inbound[0]?.call_duration),


            outbound_total_calls: Number(outbound[0]?.outbound_total_calls) || 0,
            outbound_answered_calls: Number(outbound[0]?.outbound_answered_calls) || 0,
            busy_calls: Number(outbound[0]?.busy_calls) || 0,
            noanswer_calls: Number(outbound[0]?.noanswer_calls) || 0,
            notreachable_calls: Number(outbound[0]?.notreachable_calls) || 0,
            outbound_call_duration: formatDuration(outbound[0]?.outbound_call_duration),


            never_attended: Number(insights[0]?.never_attended) || 0,
            connected_calls: Number(insights[0]?.connected_calls) || 0,
            unique_clients: Number(insights[0]?.unique_clients) || 0
        });

    } catch (err) {
        console.error("Error fetching report:", err);
        res.status(500).json({ message: "Error fetching report" });
    }
};



// ****************************************************    Report Number  wise   *****************************************************


const getCallSummeryReport = async (req, res) => {
    try {
        const { startDate, endDate, department, simNumber, userId } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Please Provide Start and End Date" })
        }

        const params = [`${startDate} 00:00:00`, `${endDate} 23:59:59`];
        let filterQuery = "";

        if (department) {
            filterQuery += ` AND u.department_id = ?`;
            params.push(department);
        }
        if (simNumber) {
            filterQuery += ` AND s.SIM_Number = ?`;
            params.push(simNumber);
        }
        if (userId) {
            filterQuery += ` AND u.id = ?`;
            params.push(userId);
        }

        const totalCallQuery = `
            SELECT
                s.SIM_Number,
                COUNT(*) AS total_calls,
                SUM(CASE WHEN c.Overall_Call_Status = 'Answered' THEN 1 ELSE 0 END) AS connected_calls,
                SUM(CASE WHEN c.Overall_Call_Status = 'Missed' THEN 1 ELSE 0 END) AS missed_calls,
                SEC_TO_TIME(SUM(TIME_TO_SEC(c.Overall_Call_Duration))) AS call_duration,
                SEC_TO_TIME(SUM(TIME_TO_SEC(c.Billable_Duration))) AS connected_call_duration,
                COUNT(DISTINCT c.Destination_Number) AS unique_clients,
                SUM(CASE WHEN c.Overall_Call_Status = 'Missed' THEN 1 ELSE 0 END) AS never_attended
            FROM callsrecord c
            INNER JOIN sim_numbers s 
                ON (
                (c.Call_Type = 'Inbound' AND TRIM(LEADING '0' FROM c.Destination_Number) = s.SIM_Number)
                OR
                (c.Call_Type = 'Outbound' AND TRIM(LEADING '0' FROM c.Caller_Number) = s.SIM_Number)
                )
            INNER JOIN users u 
                ON JSON_CONTAINS(u.phone_number, JSON_QUOTE(s.SIM_Number))
            WHERE c.timestamp BETWEEN ? AND ?
            ${filterQuery}
            GROUP BY s.SIM_Number
            ORDER BY total_calls DESC
        `;

        const inboundQuery = `
            SELECT 
                s.SIM_Number,
                COUNT(*) AS inbound_total_calls,
                SUM(CASE WHEN c.Overall_Call_Status = 'Answered' THEN 1 ELSE 0 END) AS inbound_connected_calls,
                SEC_TO_TIME(SUM(TIME_TO_SEC(c.Overall_Call_Duration))) AS inbound_call_duration,
                SEC_TO_TIME(SUM(TIME_TO_SEC(c.Billable_Duration))) AS inbound_connected_call_duration

            FROM callsrecord c
            INNER JOIN sim_numbers s 
                ON TRIM(LEADING '0' FROM c.Destination_Number) = s.SIM_Number
            INNER JOIN users u 
                ON JSON_CONTAINS(u.phone_number, JSON_QUOTE(s.SIM_Number))
            WHERE c.Call_Type = 'Inbound'
             AND c.timestamp BETWEEN ? AND ?
            ${filterQuery}
            GROUP BY s.SIM_Number
            ORDER BY inbound_total_calls DESC
        `;

        const outboundQuery = `
            SELECT 
            s.SIM_Number,
                COUNT(*) AS outbound_total_calls,
                SUM(CASE WHEN c.Overall_Call_Status = 'Answered' THEN 1 ELSE 0 END) AS outbound_connected_calls,
                SEC_TO_TIME(SUM(TIME_TO_SEC(c.Overall_Call_Duration))) AS outbound_call_duration,
    
                SEC_TO_TIME(SUM(TIME_TO_SEC(c.Billable_Duration))) AS outbound_connected_call_duration
            FROM callsrecord c
            INNER JOIN sim_numbers s 
                ON TRIM(LEADING '0' FROM c.Caller_Number) = s.SIM_Number
            INNER JOIN users u 
                ON JSON_CONTAINS(u.phone_number, JSON_QUOTE(s.SIM_Number))
            WHERE c.Call_Type = 'outbound'
            AND c.timestamp BETWEEN ? AND ?
            ${filterQuery}
            GROUP BY s.SIM_Number
            ORDER BY outbound_total_calls DESC
        `;

        const [total, inbound, outbound] = await Promise.all([
            pool.query(totalCallQuery, params),
            pool.query(inboundQuery, params),
            pool.query(outboundQuery, params)

        ]);

        const formatDuration = (duration) => {
            if (!duration) return "0h 0m 0s";
            const [h, m, s] = duration.split(':').map(Number);
            return `${h}h ${m}m ${s}s`;
        };

        res.json([{

            SIM_Number: total[0]?.SIM_Number || 0,
            total_calls: Number(total[0]?.total_calls) || 0,
            connected_calls: Number(total[0]?.connected_calls) || 0,
            missed_calls: Number(total[0]?.missed_calls) || 0,
            connected_call_duration: formatDuration(total[0]?.connected_call_duration),
            call_duration: formatDuration(total[0]?.call_duration),
            never_attended: Number(total[0]?.never_attended) || 0,
            unique_clients: Number(total[0]?.unique_clients) || 0,

            outbound_total_calls: Number(outbound[0]?.outbound_total_calls) || 0,
            outbound_connected_calls: Number(outbound[0]?.outbound_connected_calls) || 0,
            outbound_call_duration: formatDuration(outbound[0]?.outbound_call_duration),
            outbound_connected_call_duration: formatDuration(outbound[0]?.outbound_connected_call_duration),

            inbound_total_calls: Number(inbound[0]?.inbound_total_calls) || 0,
            inbound_connected_calls: Number(inbound[0]?.inbound_connected_calls) || 0,
            inbound_call_duration: formatDuration(inbound[0]?.inbound_call_duration),
            inbound_connected_call_duration: formatDuration(inbound[0]?.inbound_connected_call_duration),

        }]);

    } catch (err) {
        console.error("Error fetching report:", err);
        res.status(500).json({ message: "Error fetching report" })
    }
}


// ********************************************************************    Analysis  Report    **************

module.exports = {
    getReport,
    getCallSummeryReport
};
