import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/animalrescue';

async function fixRoles() {
  await mongoose.connect(URI);
  const db = mongoose.connection.db;
  
  const res1 = await db.collection('users').updateOne(
    { email: 'kumarrajeev87317@gmail.com' },
    { $set: { role: 'reporter' } }
  );
  console.log('kumarrajeev87317@gmail.com set to reporter:', res1.matchedCount, res1.modifiedCount);

  const res2 = await db.collection('users').updateOne(
    { email: 'rajeev.exe11@gmail.com' },
    { $set: { role: 'admin' } }
  );
  console.log('rajeev.exe11@gmail.com set to admin:', res2.matchedCount, res2.modifiedCount);

  const all = await db.collection('users').find({}, { projection: { name: 1, email: 1, role: 1 } }).toArray();
  console.log('All Users:', all);

  await mongoose.disconnect();
}

fixRoles().catch(console.error);
