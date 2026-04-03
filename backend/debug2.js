import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

const user = await User.findOne({ email: 'farmer@test.com' });
console.log('User found:', !!user);
console.log('Has comparePassword:', typeof user?.comparePassword);
console.log('Password field:', user?.password);

const result = await user.comparePassword('test1234');
console.log('comparePassword result:', result);

await mongoose.disconnect();
