// const pool = require("../config/db");

// const formatDuration = (seconds) => {
//   if (!seconds) return "0h 0m 0s";
//   const h = Math.floor(seconds / 3600);
//   const m = Math.floor((seconds % 3600) / 60);
//   const s = Math.floor(seconds % 60);
//   return `${h}h ${m}m ${s}s`;
// };

// const getHourlyAnalysis = async (req, res) => {
//   const { startDate, endDate, startTime, endTime, department_id, callType } = req.query;

//   try {
//     let filterQuery = "";

//     if (department_id) {
//       filterQuery += ` AND u.department_id = ${department_id}`;
//     }
//     if (callType) {
//       filterQuery += ` AND c.Call_Type = '${callType}'`;
//     }


//     const startDateTime = `${startDate} ${startTime || "00:00"}:00`;
//     const endDateTime = `${endDate} ${endTime || "23:59"}:59`;

//     const query = `
//       SELECT 
//         HOUR(c.timestamp) AS hour_slot,
//         COUNT(*) AS total_calls,
//         SUM(CASE WHEN c.Overall_Call_Status = 'Answered' THEN 1 ELSE 0 END) AS connected_calls,
//         SUM(TIME_TO_SEC(c.Overall_Call_Duration)) AS total_duration_sec
//       FROM callsrecord c
//       INNER JOIN sim_numbers s 
//         ON (
//           (c.Call_Type = 'Inbound' AND TRIM(LEADING '0' FROM c.Destination_Number) = s.SIM_Number)
//           OR
//           (c.Call_Type = 'Outbound' AND TRIM(LEADING '0' FROM c.Caller_Number) = s.SIM_Number)
//         )
//       INNER JOIN users u 
//         ON JSON_CONTAINS(u.phone_number, JSON_QUOTE(s.SIM_Number))
//       WHERE c.timestamp BETWEEN ? AND ?
//       ${filterQuery}
//       GROUP BY HOUR(c.timestamp)
//       ORDER BY HOUR(c.timestamp);
//     `;

//     const rows = await pool.query(query, [startDateTime, endDateTime]);

//     const formattedData = rows.map(row => ({
//       hourSlot: `${String(row.hour_slot).padStart(2, '0')}:00 - ${String(row.hour_slot).padStart(2, '0')}:59`,
//       totalCalls: Number(row.total_calls),
//       connectedCalls: Number(row.connected_calls),
//       durationSec: Number(row.total_duration_sec),
//       durationFormatted: formatDuration(row.total_duration_sec)
//     }));

//     // res.json([{
//     //     status: "success",
//     //     count: formattedData.length,
//     //     data: formattedData
//     // }]);

//     res.json(formattedData);


//   } catch (error) {
//     console.error("Error fetching hourly report:", error);
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };

// module.exports = { getHourlyAnalysis };





const pool = require("../config/db");

const formatDuration = (seconds) => {
  if (!seconds) return "0h 0m 0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
};

const getHourlyAnalysis = async (req, res) => {
  const { startDate, endDate, department_id, callType, startTime, endTime } = req.query;

  try {
    let filterQuery = "";

    if (department_id) {
      filterQuery += ` AND u.department_id = ${department_id}`;
    }
    if (callType) {
      filterQuery += ` AND c.Call_Type = '${callType}'`;
    }


    const startDateTime = `${startDate} ${startTime || "00:00"}:00`;
    const endDateTime = `${endDate} ${endTime || "23:59"}:59`;

    const query = `
      SELECT 
        HOUR(c.timestamp) AS hour_slot,
        COUNT(*) AS total_calls,
        SUM(CASE WHEN c.Overall_Call_Status = 'Answered' THEN 1 ELSE 0 END) AS connected_calls,
        SUM(TIME_TO_SEC(c.Overall_Call_Duration)) AS total_duration_sec
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
      GROUP BY HOUR(c.timestamp)
      ORDER BY HOUR(c.timestamp);
    `;

    const rows = await pool.query(query, [startDateTime, endDateTime]);

    const formattedData = rows.map(row => ({
      hourSlot: `${String(row.hour_slot).padStart(2, '0')}:00 - ${String(row.hour_slot).padStart(2, '0')}:59`,
      totalCalls: Number(row.total_calls),
      connectedCalls: Number(row.connected_calls),
      durationSec: Number(row.total_duration_sec),
      durationFormatted: formatDuration(row.total_duration_sec)
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching hourly report:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};




// const getHourlyReport = async (req, res) => {
//   const { startDate, endDate, department_id, callType, startTime, endTime } = req.query;

//   try {
//     let filterQuery = "";

//     if (department_id) {
//       filterQuery += ` AND u.department_id = ${department_id}`;
//     }
//     if (callType) {
//       filterQuery += ` AND c.Call_Type = '${callType}'`;
//     }

//     const startDateTime = `${startDate} ${startTime || "00:00"}:00`;
//     const endDateTime = `${endDate} ${endTime || "23:59"}:59`;

//     const query = `
//       SELECT 
//         s.SIM_Number AS phone_number,
//         CONCAT(LPAD(HOUR(c.timestamp), 2, '0'), ':00 - ', LPAD(HOUR(c.timestamp), 2, '0'), ':59') AS hour_slot,
//         COUNT(*) AS total_calls,
//         SUM(CASE WHEN c.Overall_Call_Status = 'Answered' THEN 1 ELSE 0 END) AS connected_calls,
//         SUM(TIME_TO_SEC(c.Overall_Call_Duration)) AS total_duration_sec
//       FROM callsrecord c
//       INNER JOIN sim_numbers s 
//         ON (
//           (c.Call_Type = 'Inbound' AND TRIM(LEADING '0' FROM c.Destination_Number) = s.SIM_Number)
//           OR
//           (c.Call_Type = 'Outbound' AND TRIM(LEADING '0' FROM c.Caller_Number) = s.SIM_Number)
//         )
//       INNER JOIN users u 
//         ON JSON_CONTAINS(u.phone_number, JSON_QUOTE(s.SIM_Number))
//       WHERE c.timestamp BETWEEN ? AND ?
//       ${filterQuery}
//       GROUP BY s.SIM_Number, HOUR(c.timestamp)
//       ORDER BY s.SIM_Number, HOUR(c.timestamp);
//     `;

//     const rows = await pool.query(query, [startDateTime, endDateTime]);

//     const formattedData = rows.map(row => ({
//       phoneNumber: row.phone_number,
//       hourSlot: row.hour_slot,
//       totalCalls: Number(row.total_calls),
//       connectedCalls: Number(row.connected_calls),
//       durationSec: Number(row.total_duration_sec),
//       durationFormatted: formatDuration(row.total_duration_sec)
//     }));

//     res.json(formattedData);
//   } catch (error) {
//     console.error("Error fetching hourly report:", error);
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };


const getHourlyReport = async (req, res) => {
  const { startDate, endDate, department_id, callType, startTime, endTime } = req.query;

  try {
    let filterQuery = "";

    if (department_id) {
      filterQuery += ` AND u.department_id = ${department_id}`;
    }
    if (callType) {
      filterQuery += ` AND c.Call_Type = '${callType}'`;
    }

    const startDateTime = `${startDate} ${startTime || "00:00"}:00`;
    const endDateTime = `${endDate} ${endTime || "23:59"}:59`;

    const query = `
      SELECT 
        s.SIM_Number AS phone_number,
        HOUR(c.timestamp) AS hour,
        COUNT(*) AS total_calls,
        SUM(CASE WHEN c.Overall_Call_Status = 'Answered' THEN 1 ELSE 0 END) AS connected_calls,
        SUM(TIME_TO_SEC(c.Overall_Call_Duration)) AS total_duration_sec
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
      GROUP BY s.SIM_Number, HOUR(c.timestamp)
      ORDER BY s.SIM_Number, HOUR(c.timestamp);
    `;

    const rows = await pool.query(query, [startDateTime, endDateTime]);

    // Convert BigInt → Number
    const safeRows = rows.map(row => {
      Object.keys(row).forEach(key => {
        if (typeof row[key] === 'bigint') {
          row[key] = Number(row[key]);
        }
      });
      return row;
    });


    // Group data by phone number
    const grouped = {};
    safeRows.forEach(row => {
      const phone = row.phone_number;
      if (!grouped[phone]) {
        grouped[phone] = {
          phone,
          before10: { calls: 0, connected: 0, duration: 0 },
          after19: { calls: 0, connected: 0, duration: 0 },
          hourlySlots: {}, // 10-18
          total: { calls: 0, connected: 0, duration: 0 }
        };
      }

      // Categorize by hour
      const hour = row.hour;
      if (hour < 10) {
        grouped[phone].before10.calls += row.total_calls;
        grouped[phone].before10.connected += row.connected_calls;
        grouped[phone].before10.duration += row.total_duration_sec;
      } else if (hour >= 19) {
        grouped[phone].after19.calls += row.total_calls;
        grouped[phone].after19.connected += row.connected_calls;
        grouped[phone].after19.duration += row.total_duration_sec;
      } else {
        const slot = `${hour.toString().padStart(2, '0')}:00 - ${hour.toString().padStart(2, '0')}:59`;
        grouped[phone].hourlySlots[slot] = {
          calls: row.total_calls,
          connected: row.connected_calls,
          duration: row.total_duration_sec
        };
      }

      // Add to totals
      grouped[phone].total.calls += row.total_calls;
      grouped[phone].total.connected += row.connected_calls;
      grouped[phone].total.duration += row.total_duration_sec;
    });

    // Format response
    const formattedData = Object.values(grouped).map(item => ({
      phone: item.phone,
      totalCalls: item.total.calls,
      connectedCalls: item.total.connected,
      totalDuration: formatDuration(item.total.duration),
      before10: {
        totalCalls: item.before10.calls,
        connected: item.before10.connected,
        duration: formatDuration(item.before10.duration)
      },
      hourlySlots: Object.entries(item.hourlySlots).map(([slot, data]) => ({

        hourSlot: slot,
        totalCalls: data.calls,
        connected: data.connected,
        duration: formatDuration(data.duration),


      })),
      after19: {
        totalCalls: item.after19.calls,
        connected: item.after19.connected,
        duration: formatDuration(item.after19.duration)
      }
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching hourly report:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};


module.exports = { getHourlyAnalysis, getHourlyReport };
