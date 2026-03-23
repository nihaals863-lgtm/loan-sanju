const settingsService = require('../services/settings.service');

const getSettings = async (req, res) => {
  try {
    const settings = await settingsService.getSettings();
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body; // Expecting { key: value, ... }
    for (const [key, value] of Object.entries(settings)) {
      await settingsService.updateSetting(key, value);
    }
    res.status(200).json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSettings, updateSettings };
