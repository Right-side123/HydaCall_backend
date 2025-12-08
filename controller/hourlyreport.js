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

// const formatDuration = (seconds) => {
//   if (!seconds) return "0h 0m 0s";
//   const h = Math.floor(seconds / 3600);
//   const m = Math.floor((seconds % 3600) / 60);
//   const s = Math.floor(seconds % 60);
//   return `${h}h ${m}m ${s}s`;
// };

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
//         HOUR(c.timestamp) AS hour,
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

//     // Convert BigInt → Number
//     const safeRows = rows.map(row => {
//       Object.keys(row).forEach(key => {
//         if (typeof row[key] === 'bigint') {
//           row[key] = Number(row[key]);
//         }
//       });
//       return row;
//     });


//     // Group data by phone number
//     const grouped = {};
//     safeRows.forEach(row => {
//       const phone = row.phone_number;
//       if (!grouped[phone]) {
//         grouped[phone] = {
//           phone,
//           before10: { calls: 0, connected: 0, duration: 0 },
//           after19: { calls: 0, connected: 0, duration: 0 },
//           hourlySlots: {}, // 10-18
//           total: { calls: 0, connected: 0, duration: 0 }
//         };
//       }

//       // Categorize by hour
//       const hour = row.hour;
//       if (hour < 10) {
//         grouped[phone].before10.calls += row.total_calls;
//         grouped[phone].before10.connected += row.connected_calls;
//         grouped[phone].before10.duration += row.total_duration_sec;
//       } else if (hour >= 19) {
//         grouped[phone].after19.calls += row.total_calls;
//         grouped[phone].after19.connected += row.connected_calls;
//         grouped[phone].after19.duration += row.total_duration_sec;
//       } else {
//         const slot = `${hour.toString().padStart(2, '0')}:00 - ${hour.toString().padStart(2, '0')}:59`;
//         grouped[phone].hourlySlots[slot] = {
//           calls: row.total_calls,
//           connected: row.connected_calls,
//           duration: row.total_duration_sec
//         };
//       }

//       // Add to totals
//       grouped[phone].total.calls += row.total_calls;
//       grouped[phone].total.connected += row.connected_calls;
//       grouped[phone].total.duration += row.total_duration_sec;
//     });

//     // Format response
//     const formattedData = Object.values(grouped).map(item => ({
//       phone: item.phone,
//       totalCalls: item.total.calls,
//       connectedCalls: Number(item.total.connected),
//       totalDuration: formatDuration(item.total.duration),
//       before10: {
//         totalCalls: item.before10.calls,
//         connected: item.before10.connected,
//         duration: formatDuration(item.before10.duration)
//       },
//       hourlySlots: Object.entries(item.hourlySlots).map(([slot, data]) => ({

//         hourSlot: slot,
//         totalCalls: data.calls,
//         connected: data.connected,
//         duration: formatDuration(data.duration),


//       })),
//       after19: {
//         totalCalls: item.after19.calls,
//         connected: item.after19.connected,
//         duration: formatDuration(item.after19.duration)
//       }
//     }));

//     res.json(formattedData);
//   } catch (error) {
//     console.error("Error fetching hourly report:", error);
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };

// Helper to safely format duration
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0h 0m 0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

// const getHourlyReport = async (req, res) => {
//   const { startDate, endDate, startTime, endTime, callType, department_id, user, sim_number } = req.query;

//   try {
//     let filterQuery = "";
//     if (department_id) filterQuery += ` AND u.department_id = ${department_id}`;
//     if (callType) filterQuery += ` AND c.Call_Type = '${callType}'`;

//     const startDateTime = `${startDate} ${startTime || "00:00"}:00`;
//     const endDateTime = `${endDate} ${endTime || "23:59"}:59`;

//     const query = `
//       SELECT 
//         s.SIM_Number AS phone_number,
//         HOUR(c.timestamp) AS hour,
//         DATE(c.timestamp) AS date,
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
//       GROUP BY s.SIM_Number, HOUR(c.timestamp), DATE(c.timestamp)
//       ORDER BY s.SIM_Number, HOUR(c.timestamp);
//     `;

//     const rows = await pool.query(query, [startDateTime, endDateTime]);

//     // Convert BigInt → Number & handle nulls
//     const safeRows = rows.map(row => ({
//       phone_number: row.phone_number,
//       hour: row.hour,
//       date: row.date,
//       total_calls: row.total_calls ? Number(row.total_calls) : 0,
//       connected_calls: row.connected_calls ? Number(row.connected_calls) : 0,
//       total_duration_sec: row.total_duration_sec ? Number(row.total_duration_sec) : 0
//     }));

//     // Group data by phone number
//     const grouped = {};
//     safeRows.forEach(row => {
//       const phone = row.phone_number;
//       const date = row.date;

//       if (!grouped[phone]) {
//         grouped[phone] = {
//           phone,
//           before10: { calls: 0, connected: 0, duration: 0, noCallDays: 0 },
//           after19: { calls: 0, connected: 0, duration: 0, noCallDays: 0 },
//           hourlySlots: {}, // 10-18
//           total: { calls: 0, connected: 0, duration: 0 },
//           dailyCalls: {} // track calls per date/hour
//         };
//       }

//       // Track calls per date/hour
//       if (!grouped[phone].dailyCalls[date]) grouped[phone].dailyCalls[date] = {};
//       grouped[phone].dailyCalls[date][row.hour] = row.total_calls;

//       // Categorize by hour
//       const hour = row.hour;
//       if (hour < 10) {
//         grouped[phone].before10.calls += row.total_calls;
//         grouped[phone].before10.connected += row.connected_calls;
//         grouped[phone].before10.duration += row.total_duration_sec;
//       } else if (hour >= 19) {
//         grouped[phone].after19.calls += row.total_calls;
//         grouped[phone].after19.connected += row.connected_calls;
//         grouped[phone].after19.duration += row.total_duration_sec;
//       } else {
//         const slot = `${hour.toString().padStart(2, '0')}:00 - ${hour.toString().padStart(2, '0')}:59`;
//         if (!grouped[phone].hourlySlots[slot]) {
//           grouped[phone].hourlySlots[slot] = { calls: 0, connected: 0, duration: 0, dates: new Set() };
//         }
//         grouped[phone].hourlySlots[slot].calls += row.total_calls;
//         grouped[phone].hourlySlots[slot].connected += row.connected_calls;
//         grouped[phone].hourlySlots[slot].duration += row.total_duration_sec;
//         grouped[phone].hourlySlots[slot].dates.add(date);
//       }

//       // Add to totals
//       grouped[phone].total.calls += row.total_calls;
//       grouped[phone].total.connected += row.connected_calls;
//       grouped[phone].total.duration += row.total_duration_sec;
//     });

//     // Calculate number of days with no calls
//     Object.values(grouped).forEach(item => {
//       let before10Days = 0;
//       let after19Days = 0;
//       let midDays = 0; // 10-18

//       Object.values(item.dailyCalls).forEach(day => {
//         // before 10
//         const b10 = Object.entries(day)
//           .filter(([hour]) => hour < 10)
//           .reduce((sum, [, calls]) => sum + calls, 0);
//         if (b10 === 0) before10Days++;

//         // 10-18
//         const mid = Object.entries(day)
//           .filter(([hour]) => hour >= 10 && hour <= 18)
//           .reduce((sum, [, calls]) => sum + calls, 0);
//         if (mid === 0) midDays++;

//         // after 19
//         const a19 = Object.entries(day)
//           .filter(([hour]) => hour >= 19)
//           .reduce((sum, [, calls]) => sum + calls, 0);
//         if (a19 === 0) after19Days++;
//       });

//       item.before10.noCallDays = before10Days;
//       item.after19.noCallDays = after19Days;
//       item.midHoursNoCallDays = midDays;

//       // Hourly slot noCallDays
//       Object.entries(item.hourlySlots).forEach(([slot, data]) => {
//         let noCallDays = 0;
//         data.dates.forEach(date => {
//           if (item.dailyCalls[date][parseInt(slot.split(':')[0])] === 0) noCallDays++;
//         });
//         item.hourlySlots[slot].noCallDays = noCallDays;
//         delete item.hourlySlots[slot].dates; // cleanup
//       });
//     });

//     // Format response
//     const formattedData = Object.values(grouped).map(item => ({
//       phone: item.phone,
//       totalCalls: item.total.calls,
//       connectedCalls: item.total.connected,
//       totalDuration: formatDuration(item.total.duration),
//       before10: {
//         totalCalls: item.before10.calls,
//         connected: item.before10.connected,
//         duration: formatDuration(item.before10.duration),
//         noCallDays: item.before10.noCallDays
//       },
//       hourlySlots: Object.entries(item.hourlySlots).map(([slot, data]) => ({
//         hourSlot: slot,
//         totalCalls: data.calls,
//         connected: data.connected,
//         duration: formatDuration(data.duration),
//         noCallDays: data.noCallDays
//       })),
//       after19: {
//         totalCalls: item.after19.calls,
//         connected: item.after19.connected,
//         duration: formatDuration(item.after19.duration),
//         noCallDays: item.after19.noCallDays
//       },
//       midHoursNoCallDays: item.midHoursNoCallDays
//     }));

//     res.json(formattedData);
//   } catch (error) {
//     console.error("Error fetching hourly report:", error);
//     res.status(500).json({ message: "Internal server error", error });
//   }
// };

const getHourlyReport = async (req, res) => {
  const { startDate, endDate, startTime, endTime, callType, department_id, user, sim_number } = req.query;

  try {
    // Build filter dynamically
    let filterQuery = "";
    if (department_id) filterQuery += ` AND u.department_id = ${department_id}`;
    if (callType) filterQuery += ` AND c.Call_Type = '${callType}'`;
    if (user) filterQuery += ` AND u.id = ${user}`; // assuming "user" is user id
    if (sim_number) filterQuery += ` AND s.SIM_Number = '${sim_number}'`;

    const startDateTime = `${startDate} ${startTime || "00:00"}:00`;
    const endDateTime = `${endDate} ${endTime || "23:59"}:59`;

    const query = `
      SELECT 
        s.SIM_Number AS phone_number,
        HOUR(c.timestamp) AS hour,
        DATE(c.timestamp) AS date,
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
      GROUP BY s.SIM_Number, HOUR(c.timestamp), DATE(c.timestamp)
      ORDER BY s.SIM_Number, HOUR(c.timestamp);
    `;

    const rows = await pool.query(query, [startDateTime, endDateTime]);

    // Convert BigInt → Number & handle nulls
    const safeRows = rows.map(row => ({
      phone_number: row.phone_number,
      hour: row.hour,
      date: row.date,
      total_calls: row.total_calls ? Number(row.total_calls) : 0,
      connected_calls: row.connected_calls ? Number(row.connected_calls) : 0,
      total_duration_sec: row.total_duration_sec ? Number(row.total_duration_sec) : 0
    }));

    // Group data by phone number
    const grouped = {};
    safeRows.forEach(row => {
      const phone = row.phone_number;
      const date = row.date;

      if (!grouped[phone]) {
        grouped[phone] = {
          phone,
          before10: { calls: 0, connected: 0, duration: 0, noCallDays: 0 },
          after19: { calls: 0, connected: 0, duration: 0, noCallDays: 0 },
          hourlySlots: {}, // 10-18
          total: { calls: 0, connected: 0, duration: 0 },
          dailyCalls: {} // track calls per date/hour
        };
      }

      // Track calls per date/hour
      if (!grouped[phone].dailyCalls[date]) grouped[phone].dailyCalls[date] = {};
      grouped[phone].dailyCalls[date][row.hour] = row.total_calls;

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
        if (!grouped[phone].hourlySlots[slot]) {
          grouped[phone].hourlySlots[slot] = { calls: 0, connected: 0, duration: 0, dates: new Set() };
        }
        grouped[phone].hourlySlots[slot].calls += row.total_calls;
        grouped[phone].hourlySlots[slot].connected += row.connected_calls;
        grouped[phone].hourlySlots[slot].duration += row.total_duration_sec;
        grouped[phone].hourlySlots[slot].dates.add(date);
      }

      // Add to totals
      grouped[phone].total.calls += row.total_calls;
      grouped[phone].total.connected += row.connected_calls;
      grouped[phone].total.duration += row.total_duration_sec;
    });

    // Calculate number of days with no calls
    Object.values(grouped).forEach(item => {
      let before10Days = 0;
      let after19Days = 0;
      let midDays = 0; // 10-18

      Object.values(item.dailyCalls).forEach(day => {
        // before 10
        const b10 = Object.entries(day)
          .filter(([hour]) => hour < 10)
          .reduce((sum, [, calls]) => sum + calls, 0);
        if (b10 === 0) before10Days++;

        // 10-18
        const mid = Object.entries(day)
          .filter(([hour]) => hour >= 10 && hour <= 18)
          .reduce((sum, [, calls]) => sum + calls, 0);
        if (mid === 0) midDays++;

        // after 19
        const a19 = Object.entries(day)
          .filter(([hour]) => hour >= 19)
          .reduce((sum, [, calls]) => sum + calls, 0);
        if (a19 === 0) after19Days++;
      });

      item.before10.noCallDays = before10Days;
      item.after19.noCallDays = after19Days;
      item.midHoursNoCallDays = midDays;

      // Hourly slot noCallDays
      Object.entries(item.hourlySlots).forEach(([slot, data]) => {
        let noCallDays = 0;
        data.dates.forEach(date => {
          if (item.dailyCalls[date][parseInt(slot.split(':')[0])] === 0) noCallDays++;
        });
        item.hourlySlots[slot].noCallDays = noCallDays;
        delete item.hourlySlots[slot].dates; // cleanup
      });
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
        duration: formatDuration(item.before10.duration),
        noCallDays: item.before10.noCallDays
      },
      hourlySlots: Object.entries(item.hourlySlots).map(([slot, data]) => ({
        hourSlot: slot,
        totalCalls: data.calls,
        connected: data.connected,
        duration: formatDuration(data.duration),
        noCallDays: data.noCallDays
      })),
      after19: {
        totalCalls: item.after19.calls,
        connected: item.after19.connected,
        duration: formatDuration(item.after19.duration),
        noCallDays: item.after19.noCallDays
      },
      midHoursNoCallDays: item.midHoursNoCallDays
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching hourly report:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};




module.exports = { getHourlyAnalysis, getHourlyReport };
