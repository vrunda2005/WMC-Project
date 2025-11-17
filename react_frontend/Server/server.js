import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { v2 as cloudinary } from 'cloudinary';
import fileUpload from 'express-fileupload';
import router from './routes/allRoutes.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const mongoURI = process.env.MONGODB_URI;
const SECRET_KEY = process.env.SECRET_KEY;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

app.use(cors({
  origin: [
      process.env.CLIENT_ORIGIN,   // for deployed frontend
      "http://localhost:5173",     // for local development
    ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type, Authorization',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// connect without deprecated options
mongoose.connect(mongoURI)
  .then(() => console.log(`Mongodb is connected`))
  .catch((err) => console.error('Mongodb connection error', err));

app.use('/', router);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Periodic job: expire memberships whose membership_end has passed
import User from './models/User.js';
import Event from './models/Event.js';
import Registration from './models/Registration.js';
import Volunteer from './models/Volunteer.js';

const expireMembershipsJob = async () => {
  try {
    const now = new Date();
    // find users with membership_end in past and still marked active
    const expiredUsers = await User.find({ membership_active: true, membership_end: { $lte: now } });
    if (!expiredUsers.length) return;

    for (const user of expiredUsers) {
      try {
        user.membership_id = null;
        user.membership_active = false;
        await user.save();

        // cleanup upcoming event attendances & registrations
        const upcoming = await Event.find({ attendees: user._id, date: { $gte: now } });
        if (upcoming.length) {
          const ids = upcoming.map(e => e._id);
          await Event.updateMany({ _id: { $in: ids } }, { $pull: { attendees: user._id } });
          await Registration.deleteMany({ eventId: { $in: ids }, email: user.email });
        }
      } catch (inner) {
        console.error('Error processing expired user', user._id, inner);
      }
    }
    console.log(`Membership expiry job processed ${expiredUsers.length} users at ${now.toISOString()}`);
  } catch (err) {
    console.error('Error running membership expiry job', err);
  }
};

// Run every hour (adjust as needed). You can call expireMembershipsJob() at startup too.
expireMembershipsJob();
setInterval(expireMembershipsJob, 1000 * 60 * 60);

export { expireMembershipsJob };
