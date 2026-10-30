import mongoose from 'mongoose';

const NGOSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, default: '' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  website: { type: String, default: '' },
  registrationNumber: { type: String, default: '' },
  verificationStatus: {
    type: String,
    enum: ['Verified', 'Unverified', 'Pending Verification'],
    default: 'Unverified',
  },
  verified: { type: Boolean, default: false },
  services: [{ type: String }], // e.g. ["24/7 Ambulance", "Emergency Rescue", "In-patient Hospital", "Free Sterilization"]
  upiId: { type: String, trim: true, default: '' },
  payeeName: { type: String, trim: true, default: '' },
  rating: { type: Number, default: 0 },
  rescues: { type: Number, default: 0 },
  animalsTreated: { type: Number, default: 0 },
  image: { type: String, default: '' },
  source: { type: String, default: 'Authorized Registry' },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    }
  }
}, { timestamps: true });

NGOSchema.index({ location: '2dsphere' });
NGOSchema.index({ verificationStatus: 1 });

const NGO = mongoose.model('NGO', NGOSchema);
export default NGO;
