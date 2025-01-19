const mongoose = require('mongoose');

const CollectorSchema = new mongoose.Schema({
  collectorAddress: { type: String, default: null }, 
  monthlyAmount: { type: Number, default: 0 }, 
}, {
  timestamps: true
});

module.exports = mongoose.model('Collector', CollectorSchema);