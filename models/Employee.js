const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({});

module.exports = mongoose.model('Employee', employeeSchema);