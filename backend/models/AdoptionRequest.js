import mongoose from 'mongoose';

const AdoptionRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    dogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdoptionListing',
      required: true
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NGO'
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    preferredLocation: {
      type: String,
      default: '',
      trim: true
    },
    reasonForAdoption: {
      type: String,
      required: true,
      trim: true
    },
    petExperience: {
      type: String,
      default: '',
      trim: true
    },
    homeEnvironment: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Completed'],
      default: 'Pending'
    },
    adminNotes: {
      type: String,
      default: '',
      trim: true
    }
  },
  { timestamps: true }
);

AdoptionRequestSchema.index({ dogId: 1, applicantId: 1 });
AdoptionRequestSchema.index({ status: 1 });
AdoptionRequestSchema.index({ applicantId: 1 });
AdoptionRequestSchema.index({ ngoId: 1 });

const AdoptionRequest = mongoose.model('AdoptionRequest', AdoptionRequestSchema);
export default AdoptionRequest;
