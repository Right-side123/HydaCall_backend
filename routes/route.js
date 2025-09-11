const express = require('express');
const router = express.Router();
const { createDepartment, getDepartment, updateDepartment, deleteDepartment } = require('../controller/department');

const { createUser, getUser, updateUser, deleteUser, totalCountUserSummary, getUserById } = require('../controller/user');

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

module.exports = router;