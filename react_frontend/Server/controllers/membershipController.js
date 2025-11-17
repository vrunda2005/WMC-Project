import mongoose from 'mongoose';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

// Cancel membership. Accepts either user id (_id), email or name in request body as `userId`.
export const cancelMembership = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'userId is required (email, name, or _id)' });
    }

    try {
        let query = null;

        if (mongoose.Types.ObjectId.isValid(userId)) {
            query = { _id: userId };
        } else if (userId.includes('@')) {
            query = { email: userId };
        } else {
            query = { name: userId };
        }

        const user = await User.findOne(query);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Mark membership as cancelled
        user.membership_id = null;
        user.membership_active = false;
        await user.save();

        // Remove user from upcoming event attendees and delete future registrations
        try {
            const now = new Date();
            // find events where user is an attendee and date is in future
            const upcomingEvents = await Event.find({ attendees: user._id, date: { $gte: now } });
            if (upcomingEvents && upcomingEvents.length) {
                const eventIds = upcomingEvents.map(e => e._id);
                // remove user from attendees array
                await Event.updateMany({ _id: { $in: eventIds } }, { $pull: { attendees: user._id } });
                // delete registrations for those events by this user's email
                await Registration.deleteMany({ eventId: { $in: eventIds }, email: user.email });
            }
        } catch (cleanupErr) {
            console.error('Error cleaning up upcoming events for cancelled membership:', cleanupErr);
        }

        return res.status(200).json({ message: 'Membership cancelled successfully.' });
    } catch (error) {
        console.error('Error cancelling membership:', error);
        return res.status(500).json({ message: 'Error cancelling membership.', error });
    }
};


export const quizPoints = async (req, res) => {
    const { userId, addPoints } = req.body;
    try {
      if (!userId) return res.status(400).json({ error: 'userId required' });
      let query = {};
      if (mongoose.Types.ObjectId.isValid(userId)) query = { _id: userId };
      else if (userId.includes('@')) query = { email: userId };
      else query = { name: userId };

      const user = await User.findOne(query);
      if (!user) return res.status(404).json({ error: 'User not found' });

      user.points = (Number(user.points) || 0) + Number(addPoints || 0);
      const updatedUser = await user.save();
      res.json({ user: updatedUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
};

// Admin: force expire a membership for a user (accepts userId email/_id/name)
export const forceExpireMembership = async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    try {
        let query = {};
        if (mongoose.Types.ObjectId.isValid(userId)) query = { _id: userId };
        else if (userId.includes('@')) query = { email: userId };
        else query = { name: userId };

        const user = await User.findOne(query);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.membership_id = null;
        user.membership_active = false;
        user.membership_end = new Date();
        await user.save();

        // cleanup upcoming attendances/registrations
        const now = new Date();
        const upcomingEvents = await Event.find({ attendees: user._id, date: { $gte: now } });
        if (upcomingEvents.length) {
            const ids = upcomingEvents.map(e => e._id);
            await Event.updateMany({ _id: { $in: ids } }, { $pull: { attendees: user._id } });
            await Registration.deleteMany({ eventId: { $in: ids }, email: user.email });
        }

        return res.json({ message: 'Membership force-expired' });
    } catch (err) {
        console.error('Error force-expiring membership', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};