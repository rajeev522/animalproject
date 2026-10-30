import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    recipientRole: {
      type: String,
      enum: ['admin', 'reporter', 'all'],
      default: 'admin'
    },
    type: {
      type: String,
      enum: ['adoption_request', 'adoption_status_update', 'general'],
      default: 'adoption_request'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    relatedDogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdoptionListing'
    },
    relatedRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdoptionRequest'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, isRead: 1 });
NotificationSchema.index({ recipientRole: 1, isRead: 1 });

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;
