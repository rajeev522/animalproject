import mongoose from 'mongoose';

const petFeatureSchema = new mongoose.Schema({
  breed: { type: String, trim: true, default: '' },
  age: { type: String, trim: true, default: '' },
  gender: { type: String, enum: ['male', 'female', 'unknown'], default: 'unknown' },
  height: { type: String, trim: true, default: '' },
  approximateWeight: { type: String, trim: true, default: '' },
  primaryColor: { type: String, trim: true, default: '' },
  secondaryColor: { type: String, trim: true, default: '' },
  identifyingMarks: { type: String, trim: true, default: '' }, // spots, scars, patches
  earShape: { type: String, trim: true, default: '' }, // pointed, floppy, folded, cropped
  tailCharacteristics: { type: String, trim: true, default: '' }, // long, docked, bushy, curled
  collarDetails: { type: String, trim: true, default: '' }, // color, tag, bell, none
}, { _id: false });

const lostFoundPetSchema = new mongoose.Schema({
  reportType: {
    type: String,
    enum: ['lost', 'found'],
    required: true,
    index: true,
  },
  dogName: {
    type: String,
    trim: true,
    default: function() {
      return this.reportType === 'found' ? 'Unknown Dog' : '';
    }
  },
  photos: [{
    type: String, // Cloudinary URLs or data URLs
    required: true,
  }],
  features: {
    type: petFeatureSchema,
    default: () => ({}),
  },
  dateIncident: {
    type: Date,
    required: true,
    default: Date.now,
  },
  timeIncident: {
    type: String,
    trim: true,
    default: '',
  },
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    }
  },
  currentLocation: {
    type: String, // For found dogs: "Shelter", "With finder at home", "Spotted in street"
    trim: true,
    default: '',
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  contactInfo: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    shareConsent: { type: Boolean, default: true },
  },
  reporterUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  reporterName: {
    type: String,
    default: 'Anonymous',
  },
  status: {
    type: String,
    enum: ['open', 'resolved', 'closed'],
    default: 'open',
    index: true,
  },
  possibleMatches: [{
    matchedPetId: { type: mongoose.Schema.Types.ObjectId, ref: 'LostFoundPet' },
    similarityScore: { type: Number, min: 0, max: 100 },
    matchedCharacteristics: [String],
    differences: [String],
    evaluatedAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

lostFoundPetSchema.index({ reportType: 1, status: 1, createdAt: -1 });

export default mongoose.model('LostFoundPet', lostFoundPetSchema);
