import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  portalEnabled: { type: Boolean, default: true },
});

export default mongoose.model('Setting', settingSchema);
