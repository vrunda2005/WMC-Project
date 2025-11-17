import mongoose from 'mongoose';

const volunteerSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String },
    status: { type: String, default: 'Pending', enum: ['Pending', 'Approved', 'Rejected', 'Completed'] },
});

const Volunteer = mongoose.model('Volunteer', volunteerSchema);

export default Volunteer;