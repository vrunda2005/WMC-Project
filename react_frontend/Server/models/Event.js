import  mongoose from  'mongoose';

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    image: { type: String },
    venue: { type: String, required: true },
    duration: { type: String, required: true },
    points: { type: Number, required: true },
    // store attendee user ids
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // optional flag to explicitly close registrations
    isClosed: { type: Boolean, default: false },
    // whether the event has completed (date passed and post-processing done)
    isCompleted: { type: Boolean, default: false },
});
  
const Event = mongoose.model('Event', eventSchema);

export default Event;
