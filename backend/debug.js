import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

// Raw schema to bypass any middleware
const RawUser = mongoose.model('RawUser', new mongoose.Schema({
  email: String, password: String, role: String
}, { collection: 'users' }));

const user = await RawUser.findOne({ email: 'farmer@test.com' });
console.log('User found:', !!user);
console.log('Stored hash:', user?.password);
console.log('Hash starts with $2:', user?.password?.startsWith('$2'));

const match = await bcrypt.compare('test1234', user?.password || '');
console.log('Password match:', match);

await mongoose.disconnect();
