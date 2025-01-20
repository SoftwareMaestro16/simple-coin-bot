const mongoose = require('mongoose');

const CollectorSchema = new mongoose.Schema({
  collectorAddress: { type: String, default: null }, 
  publicAmount: { type: Number, default: 0 }, 
  monthlyAmount: { type: Number, default: 0 }, 
  whaleAmount: { type: Number, default: 0 }, 
}, {
  timestamps: true
});

module.exports = mongoose.model('Collector', CollectorSchema);