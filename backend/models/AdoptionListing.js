import mongoose from 'mongoose';

const AdoptionListingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    animalType: { type: String, default: 'Dog', trim: true },
    breed: { type: String, default: 'Indie', trim: true },
    age: { type: String, default: '', trim: true },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Unknown'],
      default: 'Male'
    },
    location: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    photos: { type: [String], default: [] },
    healthCondition: { type: String, default: 'Healthy', trim: true },
    vaccinated: { type: Boolean, default: false },
    vaccinationStatus: {
      type: String,
      enum: ['Fully Vaccinated', 'Partially Vaccinated', 'Not Vaccinated', 'Unknown'],
      default: 'Fully Vaccinated'
    },
    description: { type: String, default: '', trim: true },
    listingType: {
      type: String,
      enum: ['Normal', 'Premium'],
      default: 'Normal'
    },
    status: {
      type: String,
      enum: ['available', 'pending', 'adopted', 'unavailable'],
      default: 'available'
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NGO'
    },
    ngoName: { type: String, default: '', trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

AdoptionListingSchema.index({ status: 1, listingType: 1 });
AdoptionListingSchema.index({ createdBy: 1 });
AdoptionListingSchema.index({ ngoId: 1 });

const AdoptionListing = mongoose.model('AdoptionListing', AdoptionListingSchema);
export default AdoptionListing;
