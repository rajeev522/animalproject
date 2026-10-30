import AdoptionListing from '../models/AdoptionListing.js';
import AdoptionRequest from '../models/AdoptionRequest.js';
import Notification from '../models/Notification.js';
import cloudinary from '../config/cloudinary.js';
import logger from '../config/logger.js';
import crypto from 'crypto';

const generateReqId = () => crypto.randomBytes(4).toString('hex').toUpperCase();

function formatListing(doc) {
  const o = doc.toObject ? doc.toObject() : { ...doc };
  return {
    ...o,
    id: o._id?.toString(),
    photos: Array.isArray(o.photos) && o.photos.length > 0 ? o.photos : (o.image ? [o.image] : [])
  };
}

// ─────────────────────────────────────────────
// PUBLIC ENDPOINTS
// ─────────────────────────────────────────────

/**
 * GET /api/adoptions
 * Returns active adoption listings (available, pending, adopted)
 */
export const listAvailable = async (req, res) => {
  try {
    const { status, listingType, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    } else if (!status) {
      query.status = { $in: ['available', 'pending'] };
    }

    if (listingType && listingType !== 'all') {
      query.listingType = listingType;
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { breed: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') },
      ];
    }

    // Premium listings sorted first, then newest
    const raw = await AdoptionListing.find(query)
      .sort({ listingType: -1, createdAt: -1 })
      .lean();

    const formatted = raw.map(formatListing);
    res.json({ success: true, data: formatted });
  } catch (err) {
    logger.error(`[Adoptions] listAvailable error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Could not fetch listings' });
  }
};

/**
 * GET /api/adoptions/:id
 */
export const getListingById = async (req, res) => {
  try {
    const listing = await AdoptionListing.findById(req.params.id).lean();
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
    res.json({ success: true, data: formatListing(listing) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/adoptions/:id/apply
 * User applies to adopt a dog
 */
export const applyForAdoption = async (req, res) => {
  try {
    const dogId = req.params.id;
    const listing = await AdoptionListing.findById(dogId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Dog listing not found' });
    }

    if (listing.status === 'adopted' || listing.status === 'unavailable') {
      return res.status(400).json({
        success: false,
        message: `This pet is already ${listing.status}. Applications are closed.`
      });
    }

    const {
      fullName,
      phone,
      email,
      address,
      city,
      state,
      preferredLocation,
      reasonForAdoption,
      petExperience,
      homeEnvironment
    } = req.body;

    if (!fullName || !phone || !email || !address || !city || !state || !reasonForAdoption) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all required fields (Name, Phone, Email, Address, City, State, Reason).'
      });
    }

    const applicantId = req.user._id;

    // Duplicate check: already has an active pending/approved request for this dog
    const existing = await AdoptionRequest.findOne({
      dogId,
      applicantId,
      status: { $in: ['Pending', 'Under Review', 'Approved'] }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `You already have an active application (#${existing.requestId}) for this dog. Check 'My Adoption Requests' for updates.`,
        requestId: existing.requestId
      });
    }

    const requestId = `ADOPT-${generateReqId()}`;

    const newRequest = await AdoptionRequest.create({
      requestId,
      dogId,
      applicantId,
      ngoId: listing.ngoId,
      fullName,
      phone,
      email,
      address,
      city,
      state,
      preferredLocation: preferredLocation || city,
      reasonForAdoption,
      petExperience: petExperience || 'None stated',
      homeEnvironment: homeEnvironment || 'Standard home',
      status: 'Pending'
    });

    // Create persistent Notification for NGO Admin
    const notif = await Notification.create({
      recipientRole: 'admin',
      type: 'adoption_request',
      title: 'New Adoption Request Received! 🐾',
      message: `${fullName} applied to adopt "${listing.name}" (${listing.breed || 'Indie'}).`,
      relatedDogId: listing._id,
      relatedRequestId: newRequest._id,
      metadata: {
        dogName: listing.name,
        dogPhoto: listing.image,
        applicantName: fullName,
        requestId,
        status: 'Pending',
        phone,
        email,
        createdAt: newRequest.createdAt
      }
    });

    // Realtime Socket broadcast to NGO Admins
    const io = req.app.get('socketio');
    if (io) {
      io.emit('new_adoption_request', {
        request: newRequest,
        dog: formatListing(listing),
        notification: notif
      });
    }

    res.status(201).json({
      success: true,
      message: `Your adoption application has been submitted successfully! Application ID: ${requestId}`,
      data: newRequest
    });
  } catch (err) {
    logger.error(`[Adoptions] applyForAdoption error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Failed to submit application: ' + err.message });
  }
};

/**
 * GET /api/adoptions/my-requests
 * Authenticated user checks their submitted adoption applications
 */
export const getMyRequests = async (req, res) => {
  try {
    const requests = await AdoptionRequest.find({ applicantId: req.user._id })
      .populate('dogId')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: requests.map((r) => ({
        ...r,
        id: r._id.toString(),
        dog: r.dogId ? formatListing(r.dogId) : null
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// ADMIN ENDPOINTS
// ─────────────────────────────────────────────

/**
 * GET /api/adoptions/admin/all
 * List all dogs with full admin details
 */
export const adminGetDogs = async (req, res) => {
  try {
    const dogs = await AdoptionListing.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: dogs.map(formatListing) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/adoptions/admin/dog
 * Add a new dog with multiple photos support & Cloudinary upload
 */
export const adminAddDog = async (req, res) => {
  try {
    const {
      name,
      breed,
      age,
      gender,
      location,
      healthCondition,
      vaccinated,
      vaccinationStatus,
      description,
      listingType,
      status,
      photos, // array of dataUrls or urls
      imageDataUrl
    } = req.body;

    if (!name || !location) {
      return res.status(400).json({ success: false, message: 'Name and Location are required.' });
    }

    const uploadedUrls = [];
    const photosToUpload = Array.isArray(photos) && photos.length > 0 ? photos : (imageDataUrl ? [imageDataUrl] : []);

    for (const item of photosToUpload) {
      if (typeof item === 'string' && item.startsWith('data:image')) {
        try {
          const uploadRes = await cloudinary.uploader.upload(item, {
            folder: 'pawrescue_adoptions',
            resource_type: 'image'
          });
          uploadedUrls.push(uploadRes.secure_url);
        } catch (uploadErr) {
          logger.warn(`Cloudinary upload error in dog photo: ${uploadErr.message}`);
          uploadedUrls.push(item);
        }
      } else if (typeof item === 'string' && item.trim()) {
        uploadedUrls.push(item);
      }
    }

    const primaryImage = uploadedUrls[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&q=80';

    const newDog = await AdoptionListing.create({
      name,
      animalType: 'Dog',
      breed: breed || 'Indie',
      age: age || '1-2 years',
      gender: gender || 'Male',
      location,
      image: primaryImage,
      photos: uploadedUrls.length > 0 ? uploadedUrls : [primaryImage],
      healthCondition: healthCondition || 'Healthy & Active',
      vaccinated: Boolean(vaccinated),
      vaccinationStatus: vaccinationStatus || (vaccinated ? 'Fully Vaccinated' : 'Not Vaccinated'),
      description: description || '',
      listingType: listingType === 'Premium' ? 'Premium' : 'Normal',
      status: status || 'available',
      ngoName: req.user.name || 'PawRescue NGO',
      createdBy: req.user._id
    });

    const formatted = formatListing(newDog);

    // Broadcast new dog live to all connected clients
    const io = req.app.get('socketio');
    if (io) {
      io.emit('adoption_listing_created', formatted);
    }

    res.status(201).json({
      success: true,
      message: `Dog "${name}" added to adoption directory!`,
      data: formatted
    });
  } catch (err) {
    logger.error(`[adminAddDog] Error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Failed to add dog: ' + err.message });
  }
};

/**
 * PUT /api/adoptions/admin/dog/:id
 * Edit dog listing details
 */
export const adminUpdateDog = async (req, res) => {
  try {
    const dog = await AdoptionListing.findById(req.params.id);
    if (!dog) {
      return res.status(404).json({ success: false, message: 'Dog listing not found' });
    }

    const updates = { ...req.body };

    // Handle new photo dataUrls if uploaded
    if (Array.isArray(updates.photos) && updates.photos.length > 0) {
      const processedPhotos = [];
      for (const p of updates.photos) {
        if (typeof p === 'string' && p.startsWith('data:image')) {
          try {
            const upl = await cloudinary.uploader.upload(p, {
              folder: 'pawrescue_adoptions',
              resource_type: 'image'
            });
            processedPhotos.push(upl.secure_url);
          } catch {
            processedPhotos.push(p);
          }
        } else if (typeof p === 'string' && p.trim()) {
          processedPhotos.push(p);
        }
      }
      updates.photos = processedPhotos;
      if (processedPhotos.length > 0) {
        updates.image = processedPhotos[0];
      }
    }

    Object.assign(dog, updates);
    await dog.save();

    const formatted = formatListing(dog);

    // Live Socket sync
    const io = req.app.get('socketio');
    if (io) {
      io.emit('adoption_listing_updated', formatted);
    }

    res.json({
      success: true,
      message: `Dog "${dog.name}" updated successfully!`,
      data: formatted
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/adoptions/admin/dog/:id
 */
export const adminDeleteDog = async (req, res) => {
  try {
    const dog = await AdoptionListing.findByIdAndDelete(req.params.id);
    if (!dog) {
      return res.status(404).json({ success: false, message: 'Dog not found' });
    }

    // Live Socket sync
    const io = req.app.get('socketio');
    if (io) {
      io.emit('adoption_listing_deleted', { id: req.params.id });
    }

    res.json({ success: true, message: `Listing for "${dog.name}" removed.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/adoptions/admin/requests
 * View all adoption requests submitted by users with full applicant details
 */
export const adminGetRequests = async (req, res) => {
  try {
    const requests = await AdoptionRequest.find()
      .populate('dogId')
      .populate('applicantId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = requests.map((r) => ({
      ...r,
      id: r._id.toString(),
      dog: r.dogId ? formatListing(r.dogId) : null
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/adoptions/admin/requests/:id/status
 * Update request status (Pending, Under Review, Approved, Rejected, Completed)
 */
export const adminUpdateRequestStatus = async (req, res) => {
  try {
    const { status, adminNotes, markDogAdopted } = req.body;
    const request = await AdoptionRequest.findById(req.params.id).populate('dogId');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Adoption request not found' });
    }

    if (status) request.status = status;
    if (adminNotes !== undefined) request.adminNotes = adminNotes;
    await request.save();

    // If marked as finalized or completed adoption, mark dog as Adopted
    let updatedDog = null;
    if (markDogAdopted && request.dogId) {
      await AdoptionListing.findByIdAndUpdate(request.dogId._id, { status: 'adopted' });
      updatedDog = await AdoptionListing.findById(request.dogId._id);
    }

    // In-app Notification for Applicant
    await Notification.create({
      recipientId: request.applicantId,
      recipientRole: 'reporter',
      type: 'adoption_status_update',
      title: `Adoption Application Status: ${status} 🐾`,
      message: `Your application (#${request.requestId}) for ${request.dogId?.name || 'the pet'} is now ${status}.`,
      relatedRequestId: request._id,
      relatedDogId: request.dogId?._id,
      metadata: {
        status,
        adminNotes: request.adminNotes
      }
    });

    // Realtime broadcast to applicant & admin panels
    const io = req.app.get('socketio');
    if (io) {
      io.emit('adoption_request_status_changed', {
        requestId: request.requestId,
        status: request.status,
        id: request._id.toString(),
        applicantId: request.applicantId?.toString()
      });

      if (updatedDog) {
        io.emit('adoption_listing_updated', formatListing(updatedDog));
      }
    }

    res.json({
      success: true,
      message: `Application #${request.requestId} updated to ${request.status}.`,
      data: request
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/adoptions/admin/stats
 * Statistics: Total, Available, Premium, Normal, Pending, Approved, Completed
 */
export const adminGetAdoptionStats = async (req, res) => {
  try {
    const [
      totalDogs,
      availableDogs,
      premiumDogs,
      normalDogs,
      pendingReqs,
      approvedReqs,
      completedAdoptions
    ] = await Promise.all([
      AdoptionListing.countDocuments(),
      AdoptionListing.countDocuments({ status: 'available' }),
      AdoptionListing.countDocuments({ listingType: 'Premium' }),
      AdoptionListing.countDocuments({ listingType: 'Normal' }),
      AdoptionRequest.countDocuments({ status: 'Pending' }),
      AdoptionRequest.countDocuments({ status: 'Approved' }),
      AdoptionListing.countDocuments({ status: 'adopted' }),
    ]);

    res.json({
      success: true,
      data: {
        totalDogs,
        availableDogs,
        premiumDogs,
        normalDogs,
        pendingRequests: pendingReqs,
        approvedRequests: approvedReqs,
        completedAdoptions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/adoptions/admin/notifications
 */
export const adminGetNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ recipientRole: 'admin' })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({ recipientRole: 'admin', isRead: false });

    res.json({
      success: true,
      data: notifs,
      unreadCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/adoptions/admin/notifications/mark-read
 */
export const adminMarkNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipientRole: 'admin', isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
