import LostFoundPet from '../models/LostFoundPet.js';
import Notification from '../models/Notification.js';
import cloudinary from '../config/cloudinary.js';
import logger from '../config/logger.js';
import { comparePetPhotosWithAI } from '../utils/lostFoundMatcher.js';

/**
 * Upload single or multiple images to Cloudinary (or return fallback data)
 */
async function uploadPetImages(photos = []) {
  const uploadedUrls = [];
  for (const item of photos) {
    if (typeof item === 'string' && (item.startsWith('http://') || item.startsWith('https://'))) {
      uploadedUrls.push(item);
    } else if (typeof item === 'string' && item.startsWith('data:image')) {
      try {
        const uploadRes = await cloudinary.uploader.upload(item, {
          folder: 'pawrescue_lost_found',
          transformation: [{ width: 1000, height: 1000, crop: 'limit' }, { quality: 'auto' }],
        });
        uploadedUrls.push(uploadRes.secure_url);
      } catch (err) {
        logger.error(`Cloudinary upload error in lost_found: ${err.message}`);
        // Fallback to item itself if Cloudinary not configured or offline
        uploadedUrls.push(item);
      }
    }
  }
  return uploadedUrls.length > 0 ? uploadedUrls : ['https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80'];
}

/**
 * 1. Submit a Lost Dog or Found Dog report
 */
export const createLostFoundReport = async (req, res) => {
  try {
    const {
      reportType,
      dogName,
      photos = [],
      features = {},
      dateIncident,
      timeIncident,
      location,
      currentLocation,
      description,
      contactInfo,
    } = req.body;

    if (!reportType || !['lost', 'found'].includes(reportType)) {
      return res.status(400).json({ success: false, message: 'Invalid reportType. Must be lost or found.' });
    }

    if (!location?.address || !location?.city || !location?.state) {
      return res.status(400).json({ success: false, message: 'Location address, city, and state are required.' });
    }

    if (!contactInfo?.name || !contactInfo?.phone) {
      return res.status(400).json({ success: false, message: 'Contact name and phone number are required.' });
    }

    // Process Photos
    const uploadedPhotos = await uploadPetImages(photos);

    const reporterUser = req.user?._id || null;
    const reporterName = req.user?.name || contactInfo.name || 'Anonymous';

    const newPetReport = await LostFoundPet.create({
      reportType,
      dogName: reportType === 'lost' ? (dogName || 'My Dog') : (dogName || 'Found Dog'),
      photos: uploadedPhotos,
      features,
      dateIncident: dateIncident ? new Date(dateIncident) : new Date(),
      timeIncident: timeIncident || '',
      location,
      currentLocation: currentLocation || '',
      description: description || '',
      contactInfo,
      reporterUser,
      reporterName,
      status: 'open',
    });

    // Real-time broadcast
    const io = req.app.get('socketio');
    if (io) {
      io.emit('new_lost_found_report', {
        id: newPetReport._id,
        reportType: newPetReport.reportType,
        dogName: newPetReport.dogName,
        photos: newPetReport.photos,
        location: newPetReport.location,
        createdAt: newPetReport.createdAt,
      });
    }

    // Asynchronously compute AI matches against opposite category
    const oppositeType = reportType === 'lost' ? 'found' : 'lost';
    const potentialCandidates = await LostFoundPet.find({
      reportType: oppositeType,
      status: 'open',
    }).limit(20);

    const matchResults = [];
    for (const candidate of potentialCandidates) {
      const evaluation = await comparePetPhotosWithAI(newPetReport, candidate);
      if (evaluation.score >= 55) {
        matchResults.push({
          matchedPetId: candidate._id,
          similarityScore: evaluation.score,
          matchedCharacteristics: evaluation.matchedCharacteristics,
          differences: evaluation.differences,
          evaluatedAt: new Date(),
        });

        // Also add cross-match to candidate
        candidate.possibleMatches.push({
          matchedPetId: newPetReport._id,
          similarityScore: evaluation.score,
          matchedCharacteristics: evaluation.matchedCharacteristics,
          differences: evaluation.differences,
          evaluatedAt: new Date(),
        });
        await candidate.save();

        // Notify candidate reporter if they are a registered user
        if (candidate.reporterUser) {
          await Notification.create({
            recipientRole: 'reporter',
            recipientUser: candidate.reporterUser,
            title: 'Potential Pet Match Found! 🔍',
            message: `A newly reported ${reportType} dog matches your report (${evaluation.score}% match score).`,
            link: `/lost-found`,
            data: { petId: candidate._id, matchedWith: newPetReport._id },
          }).catch(() => {});
        }
      }
    }

    if (matchResults.length > 0) {
      newPetReport.possibleMatches = matchResults;
      await newPetReport.save();
    }

    res.status(201).json({
      success: true,
      message: `${reportType === 'lost' ? 'Lost' : 'Found'} dog report submitted successfully.`,
      data: newPetReport,
    });
  } catch (error) {
    logger.error(`Error in createLostFoundReport: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error while submitting report.' });
  }
};

/**
 * 2. Get list of lost/found reports with filtering
 */
export const getLostFoundReports = async (req, res) => {
  try {
    const { reportType, status, city, search, onlyMine } = req.query;
    const filter = {};

    if (reportType && ['lost', 'found'].includes(reportType)) {
      filter.reportType = reportType;
    }

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: 'closed' };
    }

    if (city) {
      filter['location.city'] = new RegExp(city, 'i');
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { dogName: regex },
        { 'features.breed': regex },
        { 'features.primaryColor': regex },
        { 'location.address': regex },
        { 'location.city': regex },
        { description: regex },
      ];
    }

    if (onlyMine === 'true' && req.user?._id) {
      filter.reporterUser = req.user._id;
    }

    const reports = await LostFoundPet.find(filter)
      .populate('possibleMatches.matchedPetId', 'dogName photos location features status reportType contactInfo')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    logger.error(`Error in getLostFoundReports: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to retrieve reports.' });
  }
};

/**
 * 3. Get single report by ID with populated matches
 */
export const getLostFoundReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await LostFoundPet.findById(id)
      .populate('possibleMatches.matchedPetId', 'dogName photos location features status reportType contactInfo')
      .lean();

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    logger.error(`Error in getLostFoundReportById: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error retrieving pet report.' });
  }
};

/**
 * 4. Update own report or mark as resolved/found
 */
export const updateLostFoundReport = async (req, res) => {
  try {
    const { id } = req.params;
    const petReport = await LostFoundPet.findById(id);

    if (!petReport) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    // Authorization: User must be reporter or admin
    const isOwner = req.user && petReport.reporterUser && petReport.reporterUser.toString() === req.user._id.toString();
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'ngo_admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this report.' });
    }

    const allowedUpdates = [
      'dogName',
      'features',
      'location',
      'currentLocation',
      'description',
      'status',
      'contactInfo',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        petReport[field] = req.body[field];
      }
    });

    if (Array.isArray(req.body.photos) && req.body.photos.length > 0) {
      petReport.photos = await uploadPetImages(req.body.photos);
    }

    await petReport.save();

    // Broadcast update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('lost_found_report_updated', {
        id: petReport._id,
        status: petReport.status,
        dogName: petReport.dogName,
      });
    }

    res.json({ success: true, message: 'Report updated successfully.', data: petReport });
  } catch (error) {
    logger.error(`Error in updateLostFoundReport: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error updating report.' });
  }
};

/**
 * 5. Run on-demand AI matching between a specific report and all active counter-reports
 */
export const runAiMatchingForReport = async (req, res) => {
  try {
    const { id } = req.params;
    const petReport = await LostFoundPet.findById(id);

    if (!petReport) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const oppositeType = petReport.reportType === 'lost' ? 'found' : 'lost';
    const candidates = await LostFoundPet.find({
      reportType: oppositeType,
      status: 'open',
      _id: { $ne: petReport._id },
    }).limit(25);

    const matches = [];
    for (const candidate of candidates) {
      const evaluation = await comparePetPhotosWithAI(petReport, candidate);
      if (evaluation.score >= 50) {
        matches.push({
          candidate,
          similarityScore: evaluation.score,
          matchedCharacteristics: evaluation.matchedCharacteristics,
          differences: evaluation.differences,
          reasoning: evaluation.reasoning,
        });
      }
    }

    // Sort by highest similarity score
    matches.sort((a, b) => b.similarityScore - a.similarityScore);

    // Save into report possibleMatches
    petReport.possibleMatches = matches.map(m => ({
      matchedPetId: m.candidate._id,
      similarityScore: m.similarityScore,
      matchedCharacteristics: m.matchedCharacteristics,
      differences: m.differences,
      evaluatedAt: new Date(),
    }));
    await petReport.save();

    res.json({
      success: true,
      count: matches.length,
      data: matches,
    });
  } catch (error) {
    logger.error(`Error in runAiMatchingForReport: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to run AI matching.' });
  }
};
