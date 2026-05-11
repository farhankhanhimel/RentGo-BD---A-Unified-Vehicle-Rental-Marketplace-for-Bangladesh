const Vehicle = require('../models/Vehicle');

exports.getComparisonData = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || ids.length === 0) return res.status(400).json({ success: false, message: 'No IDs provided' });
    
    const vehicles = await Vehicle.find({ _id: { $in: ids } }).populate('vendor', 'name');
    res.status(200).json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};