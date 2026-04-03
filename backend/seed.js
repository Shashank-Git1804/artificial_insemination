import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

await mongoose.connect(process.env.MONGO_URI_TEST);

await User.deleteMany({ email: { $in: ['farmer@test.com', 'centre@test.com'] } });

await User.create([
  {
    name: 'Ramesh Gowda',
    email: 'farmer@test.com',
    password: 'test1234',
    role: 'farmer',
    phone: '9876543210',
    village: 'Hoskote',
    taluk: 'Hoskote',
    district: 'Bengaluru Rural',
  },
  {
    name: 'Dr. Suresh Kumar',
    email: 'centre@test.com',
    password: 'test1234',
    role: 'ai_centre',
    phone: '9845012345',
    centreName: 'Bengaluru Rural AI Centre',
    centreCode: 'KA-BR-AI-001',
    licenseNumber: 'KA/VET/2024/001',
    isApproved: true,
  },
]);

console.log('✅ Demo users created:');
console.log('   Farmer  → farmer@test.com / test1234');
console.log('   Centre  → centre@test.com / test1234');

await mongoose.disconnect();
process.exit(0);
