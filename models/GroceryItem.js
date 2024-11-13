const mongoose = require('mongoose');

const grocerySchema = new mongoose.Schema({});

module.exports = mongoose.model('GroceryItem', grocerySchema);