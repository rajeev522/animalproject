import NGO from '../models/NGO.js';
import logger from '../config/logger.js';
import { REAL_VERIFIED_NGOS } from '../data/verifiedNgosDelhiNCR.js';

/**
 * Calculates geographical distance between two lat/lng points using Haversine formula
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Seeds or syncs real verified NGO data into MongoDB
 */
async function syncVerifiedNGOs() {
  const platformUpi = (process.env.PLATFORM_UPI_ID || '').trim();

  // Remove legacy dummy seeds if present
  await NGO.deleteMany({
    name: {
      $in: [
        "Delhi Animal Rescue Trust",
        "Paws & Claws Foundation",
        "Stray Help India"
      ]
    }
  });

  for (const item of REAL_VERIFIED_NGOS) {
    await NGO.findOneAndUpdate(
      { name: item.name },
      {
        ...item,
        upiId: platformUpi,
        payeeName: item.name,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

/**
 * GET /api/ngos/nearby
 * Returns real NGOs within radius (default 50km, optional 40km or custom)
 */
export const getNearbyNGOs = async (req, res) => {
  try {
    const { lat, lng, radiusInKm = 50 } = req.query;

    const count = await NGO.countDocuments({ verificationStatus: "Verified" });
    if (count === 0) {
      await syncVerifiedNGOs();
    }

    const radius = parseFloat(radiusInKm) || 50;

    let ngos = [];

    if (lat && lng) {
      const uLat = parseFloat(lat);
      const uLng = parseFloat(lng);
      const radiusInMeters = radius * 1000;

      // Geospatial query using MongoDB 2dsphere index
      ngos = await NGO.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [uLng, uLat],
            },
            $maxDistance: radiusInMeters,
          },
        },
      }).lean();

      // Compute exact distance field
      ngos = ngos.map((ngo) => {
        const coords = ngo.location?.coordinates;
        let distanceKm = 0;
        if (coords && coords.length === 2) {
          distanceKm = calculateDistanceKm(uLat, uLng, coords[1], coords[0]);
        }
        return {
          ...ngo,
          distanceKm,
          distanceLabel: `${distanceKm.toFixed(1)} km`,
        };
      });
    } else {
      // Fallback if location not provided
      ngos = await NGO.find({}).sort({ rating: -1 }).limit(10).lean();
      ngos = ngos.map((ngo) => ({
        ...ngo,
        distanceKm: null,
        distanceLabel: 'Location required',
      }));
    }

    res.status(200).json({
      success: true,
      count: ngos.length,
      radiusKm: radius,
      data: ngos,
    });
  } catch (error) {
    logger.error(`Error fetching real NGOs: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error retrieving verified NGOs' });
  }
};
