const mongoose = require('mongoose');

const grocerySchema = new mongoose.Schema({
    item: { type: String },
    food_group: { type: String }
});

module.exports = mongoose.model('GroceryItem', grocerySchema);