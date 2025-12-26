const express = require('express');
const router = express.Router();
const {
    createDepartment,
    getDepartment,
    updateDepartment,
    deleteDepartment
} = require('../controller/department');

const {
    createUser,
    getUser,
    updateUser,
    deleteUser,
    totalCountUserSummary,
    getUserById,
    UsersAssignedNumbers,
    getUserSimDetails
} = require('../controller/user');
const {
    getSimNumber,
    getSimNumberById,
    updateSimNumber,
    getUpdateSimNumber,
    getUpdateSimNumberById,
    getUpdateSimNumberByNumber
} = require('../controller/simnumbers');

const { getReport, getCallSummeryReport } = require('../controller/report');

const { getHourlyAnalysis, getHourlyReport } = require('../controller/hourlyreport');

const { getDayWiseReport } = require('../controller/daywisereport');

const { getNeverAttendCalls,
    getNotPickedByClientCalls,
    getUniqueClientReport
} = require('../controller/neverAttendreport');

const { getCallLogs, getCallLogTotal } = require('../controller/calllogs')

router.get('/calllogstotal', getCallLogTotal);
router.get('/calllogs', getCallLogs);

router.post('/department', createDepartment);
router.get('/department', getDepartment);
router.put('/department/:id', updateDepartment);
router.delete('/department/:id', deleteDepartment);

router.get('/usersummery', totalCountUserSummary);
router.post('/user', createUser);
router.get('/user', getUser);
router.get('/user/:id', getUserById);
router.put('/user/:id', updateUser);
router.delete('/user/:id', deleteUser);
router.get('/usersnumber/:userId', UsersAssignedNumbers);


router.get('/simnumber', getSimNumber);
router.get('/simnumber/:id', getSimNumberById);
router.put('/simnumber/:id', updateSimNumber);

router.get('/updatedsimnumber', getUpdateSimNumber);
router.get('/updatedsimnumber/:id', getUpdateSimNumberById);

router.get('/updatedsimnumber/phone_number/:sim_number', getUpdateSimNumberByNumber);


router.get('/report', getReport);
router.get('/callsummeryreport', getCallSummeryReport);

router.get('/hourlyreport', getHourlyAnalysis);
router.get('/hourlyreportsimnumber', getHourlyReport);

router.get('/daywisereport', getDayWiseReport);

router.get('/neverattendreport', getNeverAttendCalls);
router.get('/notpickupbyclient', getNotPickedByClientCalls);
router.get('/uniqueclient', getUniqueClientReport);

module.exports = router;
