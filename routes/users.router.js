const express = require('express');
const { getAllUsers, getUserById, deleteUserById, approveUser, restrictUser } = require('../controllers/users.controller');
const verifyToken = require('../middlewares/verifyToken');
const allowTo = require("../middlewares/allowTo")
const router = express.Router();
router.get('/',verifyToken , allowTo("admin"), getAllUsers);
router.route('/:id')
    .get(verifyToken , allowTo("admin") ,getUserById)
    .delete(verifyToken , allowTo("admin") , deleteUserById)
    .patch(verifyToken, allowTo('admin'), approveUser); // activate user

// route for restricting / deactivating
router.patch('/:id/restrict', verifyToken, allowTo('admin'), restrictUser);
module.exports = router;