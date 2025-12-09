const pool = require("../config/db");

function formatDuration(seconds) {
    if (!seconds || isNaN(seconds) || seconds < 0) return "0h 0m 0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
}

const getDayWiseReport = async (req, res) => {
    const { startDate, endDate, startTime, endTime, callType, department_id, userId, simNumber } = req.query;

    try {
        let filterQuery = "";
        if (department_id) filterQuery += ` AND u.department_id = ${department_id}`;
        if (callType) filterQuery += ` AND c.Call_Type = '${callType}'`;
        if (userId) filterQuery += ` AND u.id = ${userId}`;
        if (simNumber) filterQuery += ` AND s.SIM_Number = '${simNumber}'`;

        const startDateTime = `${startDate} ${startTime || "00:00"}:00`;
        const endDateTime = `${endDate} ${endTime || "23:59"}:59`;

        const query = `
      SELECT 
        s.SIM_Number AS phone_number,
        DATE(c.timestamp) AS date,
        HOUR(c.timestamp) AS hour,
        COUNT(*) AS total_calls,
        SUM(CASE WHEN c.Overall_Call_Status='Answered' THEN 1 ELSE 0 END) AS connected_calls,
        SUM(TIME_TO_SEC(c.Overall_Call_Duration)) AS total_duration_sec
      FROM callsrecord c
      INNER JOIN sim_numbers s 
        ON (
          (c.Call_Type = 'Inbound' AND TRIM(LEADING '0' FROM c.Destination_Number)=s.SIM_Number)
          OR
          (c.Call_Type='Outbound' AND TRIM(LEADING '0' FROM c.Caller_Number)=s.SIM_Number)
        )
      INNER JOIN users u 
        ON JSON_CONTAINS(u.phone_number, JSON_QUOTE(s.SIM_Number))
      WHERE c.timestamp BETWEEN ? AND ?
      ${filterQuery}
      GROUP BY s.SIM_Number, DATE(c.timestamp), HOUR(c.timestamp)
      ORDER BY s.SIM_Number, DATE(c.timestamp), HOUR(c.timestamp);
    `;

        const rows = await pool.query(query, [startDateTime, endDateTime]);

        const safeRows = rows.map(row => ({
            phone: row.phone_number,
            date: row.date,
            hour: Number(row.hour),
            total_calls: Number(row.total_calls || 0),
            connected_calls: Number(row.connected_calls || 0),
            total_duration_sec: Number(row.total_duration_sec || 0)
        }));

        // GROUP BY PHONE → DATE
        const grouped = {};

        safeRows.forEach(r => {
            if (!grouped[r.phone]) grouped[r.phone] = {};
            if (!grouped[r.phone][r.date]) {
                grouped[r.phone][r.date] = {
                    phone: r.phone,
                    date: r.date,
                    before10: { calls: 0, connected: 0, duration: 0 },
                    after19: { calls: 0, connected: 0, duration: 0 },
                    hourlySlots: {},
                    total: { calls: 0, connected: 0, duration: 0 }
                };
            }

            const obj = grouped[r.phone][r.date];

            // CLASSIFICATION
            if (r.hour < 10) {
                obj.before10.calls += r.total_calls;
                obj.before10.connected += r.connected_calls;
                obj.before10.duration += r.total_duration_sec;
            }
            else if (r.hour >= 19) {
                obj.after19.calls += r.total_calls;
                obj.after19.connected += r.connected_calls;
                obj.after19.duration += r.total_duration_sec;
            }
            else {
                const slot = `${r.hour.toString().padStart(2, "0")}:00 - ${r.hour.toString().padStart(2, "0")}:59`;
                if (!obj.hourlySlots[slot]) {
                    obj.hourlySlots[slot] = { calls: 0, connected: 0, duration: 0 };
                }
                obj.hourlySlots[slot].calls += r.total_calls;
                obj.hourlySlots[slot].connected += r.connected_calls;
                obj.hourlySlots[slot].duration += r.total_duration_sec;
            }

            // TOTALS
            obj.total.calls += r.total_calls;
            obj.total.connected += r.connected_calls;
            obj.total.duration += r.total_duration_sec;
        });

        // FLATTEN FINAL RESPONSE
        const finalResult = [];

        Object.values(grouped).forEach(phoneGroup => {
            Object.values(phoneGroup).forEach(daily => {
                finalResult.push({
                    phone: daily.phone,
                    date: daily.date,
                    totalCalls: daily.total.calls,
                    connectedCalls: daily.total.connected,
                    totalDuration: formatDuration(daily.total.duration),
                    before10: {
                        totalCalls: daily.before10.calls,
                        connected: daily.before10.connected,
                        duration: formatDuration(daily.before10.duration)
                    },
                    hourlySlots: Object.entries(daily.hourlySlots).map(([slot, d]) => ({
                        hourSlot: slot,
                        totalCalls: d.calls,
                        connected: d.connected,
                        duration: formatDuration(d.duration),
                    })),
                    after19: {
                        totalCalls: daily.after19.calls,
                        connected: daily.after19.connected,
                        duration: formatDuration(daily.after19.duration)
                    }
                });
            });
        });

        res.json(finalResult);

    } catch (error) {
        console.error("Error fetching hourly report:", error);
        res.status(500).json({ message: "Internal error", error });
    }
};

module.exports = { getDayWiseReport }
