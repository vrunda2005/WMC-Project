import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Volunteer from '../models/Volunteer.js';
import { v2 as cloudinary } from 'cloudinary';
import User from '../models/User.js';

const getEvents = async (req, res) => {
    try {
        const events = await Event.find();

        // Post-process: if event date is past, mark it completed and closed
        const now = new Date();
        const updates = [];
        for (const ev of events) {
            if (ev.date && new Date(ev.date) < now && !ev.isCompleted) {
                // use update to avoid running validation on possibly-missing required fields
                updates.push(Event.updateOne({ _id: ev._id }, { $set: { isCompleted: true, isClosed: true } }));

                // Mark approved volunteers for this event as Completed
                updates.push(Volunteer.updateMany({ eventId: ev._id, status: 'Approved' }, { status: 'Completed' }));
            }
        }
        if (updates.length) await Promise.all(updates);

        // re-fetch after possible updates to return current state
        const fresh = await Event.find();
        res.json(fresh);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const addEvents = async (req, res) => {
    const { title, description, date, time, venue, duration, points } = req.body;
    const file = req.files && req.files.file;

    if (!title || !description || !date || !time || !venue || !duration || (points === undefined || points === null)) {
        return res.status(400).json({ error: 'All fields are required (including points)' });
    }

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    console.log('File received:', file);
    const options = {
        folder: "events",
        quality: 90,
        resource_type: "auto",
    };

    try {
        if (!file.tempFilePath) {
            console.error('Temp file path is missing');
            return res.status(400).json({ error: 'File path is missing' });
        }

        const response = await cloudinary.uploader.upload(file.tempFilePath, options);

        const newEvent = new Event({
            title,
            description,
            date,
            time,
            image: response.secure_url,
            venue,
            duration,
            points,
        });

        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        await Event.findByIdAndDelete(eventId);
        // cleanup related data
        await Registration.deleteMany({ eventId });
        await Volunteer.deleteMany({ eventId });
        res.status(200).json({ message: 'Event and related data deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateEvent = async (req, res) => {
    const { title, description, date, time, image, venue, duration, points, isClosed } = req.body;

    try {
        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            { title, description, date, time, image, venue, duration, points, isClosed },
            { new: true }
        );

        if (!updatedEvent) return res.status(404).json({ message: 'Event not found' });

        // if event became completed as part of this update, mark volunteers
        if (updatedEvent.isCompleted) {
            try {
                await Volunteer.updateMany({ eventId: updatedEvent._id, status: 'Approved' }, { status: 'Completed' });
            } catch (err) {
                console.error('Error updating volunteers when event completed:', err);
            }
        }

        res.json(updatedEvent);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const eventRegister = async (req, res) => {
    const { eventId, eventName, name, email, phone, eventPoint } = req.body;

    // Validate required fields
    if (!eventId || !eventName || !name || !email) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Convert eventPoint to a number
    const convertedEventPoint = Number(eventPoint || 0);
    if (isNaN(convertedEventPoint)) {
        return res.status(400).json({ error: 'Invalid eventPoint value' });
    }

    try {
        // Find the event
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        // Prevent registration if event is explicitly closed or event date has passed
        const now = new Date();
        if (event.isClosed) return res.status(400).json({ error: 'Registrations for this event are closed' });
        if (event.date && new Date(event.date) < now) return res.status(400).json({ error: 'Cannot register for past events' });

        // Find the user by email
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Ensure user.points is a number
        if (typeof user.points !== 'number' || isNaN(user.points)) {
            user.points = Number(user.points) || 0;
        }

        // Determine points to deduct based on membership ID
        let pointsToDeduct;
        switch (user.membership_id) {
            case 1:
                pointsToDeduct = 10;
                break;
            case 2:
                pointsToDeduct = 20;
                break;
            case 3:
                pointsToDeduct = 30;
                break;
            default:
                // treat missing/0 membership as no special deduction
                pointsToDeduct = 0;
        }

        pointsToDeduct = Number(pointsToDeduct);

        // Calculate the new points
        let newPoints = user.points - (convertedEventPoint - 0.01 * pointsToDeduct);
        newPoints = Math.max(newPoints, 0);

        // Prevent duplicate registration for same email and event
        const existing = await Registration.findOne({ eventId, email });
        if (existing) return res.status(400).json({ error: 'User already registered for this event' });

        // Update user points
        user.points = newPoints;
        await user.save();

        // Create the registration
        const newRegistration = new Registration({
            eventId,
            eventName,
            name,
            email,
            phone,
            userId: user._id
        });

        // Save registration
        const savedRegistration = await newRegistration.save();

        // Add user to event attendees if not already present
        if (!event.attendees) event.attendees = [];
        const userIdStr = String(user._id);
        if (!event.attendees.map(a => String(a)).includes(userIdStr)) {
            event.attendees.push(user._id);
            await event.save();
        }

        res.status(201).json(savedRegistration);

    } catch (error) {
        console.error('Error saving registration:', error);
        res.status(500).json({ error: 'Failed to register' });
    }
}


export {
    getEvents,
    addEvents,
    deleteEvent,
    updateEvent,
    eventRegister,
    setEventClosed,
    getAttendees,
    removeAttendee
};

// Admin: set event closed/open or mark completed
const setEventClosed = async (req, res) => {
    const eventId = req.params.id;
    const { isClosed, isCompleted } = req.body; // booleans
    try {
        const updated = await Event.findByIdAndUpdate(eventId, { isClosed, isCompleted }, { new: true });
        if (!updated) return res.status(404).json({ error: 'Event not found' });

        // if marked completed, update volunteers
        if (isCompleted) {
            await Volunteer.updateMany({ eventId: updated._id, status: 'Approved' }, { status: 'Completed' });
        }

        res.json(updated);
    } catch (err) {
        console.error('Error setting event closed/completed:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin: list attendees with populated user details
const getAttendees = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('attendees', 'name email image points');
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.json({ attendees: event.attendees || [] });
    } catch (err) {
        console.error('Error fetching attendees:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin: remove an attendee by email or userId from an event and delete their registration
const removeAttendee = async (req, res) => {
    try {
        const eventId = req.params.id;
        const { userId, email } = req.body; // provide either
        if (!userId && !email) return res.status(400).json({ error: 'userId or email required' });

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        let uid = userId;
        if (!uid && email) {
            // find user by email
            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ error: 'User not found' });
            uid = user._id;
        }

        await Event.updateOne({ _id: eventId }, { $pull: { attendees: uid } });
        const regQuery = { eventId };
        if (email && uid) {
            regQuery.$or = [{ email }, { userId: uid }];
        } else if (email) {
            regQuery.email = email;
        } else if (uid) {
            regQuery.userId = uid;
        }
        await Registration.deleteMany(regQuery);

        res.json({ message: 'Attendee removed' });
    } catch (err) {
        console.error('Error removing attendee:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
