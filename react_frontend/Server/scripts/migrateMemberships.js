#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();
const mongoURI = process.env.MONGODB_URI;

const run = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to DB for migration');

    // Example rule: if membership_id > 0 set membership_active true and set membership_end 30 days from now
    const users = await User.find({ membership_id: { $gt: 0 } });
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    for (const u of users) {
      u.membership_active = true;
      if (!u.membership_end) u.membership_end = end;
      if (!u.membership_start) u.membership_start = now;
      await u.save();
      console.log('Migrated user', u._id);
    }

    console.log('Migration complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration error', err);
    process.exit(1);
  }
};

run();
