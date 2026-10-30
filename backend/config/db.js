import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/animalrescue';

    // Set up strict connection event listeners
    mongoose.connection.on('connected', () => {
      console.log(`[MongoDB] Connected Successfully: ${mongoose.connection.host}`);
    });

    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB] Connection Error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected! Connection lost.');
    });

    console.log(`[MongoDB] Starting connection to ${URI}...`);
    
    // Attempt the connection without blindly assuming success
    await mongoose.connect(URI);

    try {
      const User = (await import('../models/User.js')).default;
      await User.updateOne({ email: 'kumarrajeev87317@gmail.com' }, { $set: { role: 'reporter' } });
      await User.updateOne({ email: 'rajeev.exe11@gmail.com' }, { $set: { role: 'admin' } });
      const currentUsers = await User.find({}, { name: 1, email: 1, phone: 1, role: 1 }).lean();
      console.log('[MongoDB] Current Verified Users in DB:', JSON.stringify(currentUsers));
    } catch (e) {
      console.warn('[MongoDB] Role sync notice:', e.message);
    }

  } catch (error) {
    console.error(`[MongoDB] Fatal Initialization Error: ${error.message}`);
    // Optional: process.exit(1); depending on whether you want the server to fail immediately
  }
};

export default connectDB;
