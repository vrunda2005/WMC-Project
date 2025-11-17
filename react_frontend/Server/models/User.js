import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  image: String,
  points: Number,
  isAdmin: Boolean,
  membership_id: { type: Number, default: null },
  // optional flag if you want to track active membership explicitly
  membership_active: { type: Boolean, default: false },
  // membership validity window (optional). If set, membership is active until membership_end
  membership_start: { type: Date },
  membership_end: { type: Date }
});

const User = mongoose.model('User', userSchema);

export default User;
