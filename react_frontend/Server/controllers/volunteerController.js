import Volunteer from '../models/Volunteer.js';
import Event from '../models/Event.js';

const getVolunteers = async (req, res) => {
    try {
        const volunteers = await Volunteer.find();
        res.json(volunteers);
    } catch (error) {
        console.error('Error fetching volunteers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const addVolunteer = async (req, res) => {
    const { eventId,  name, email, message } = req.body;

    if (!eventId || !name || !email) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Do not allow volunteer signups for closed or already completed events
        if (event.isClosed || event.isCompleted) {
            return res.status(400).json({ error: 'Volunteer registration closed for this event' });
        }

        const newVolunteer = new Volunteer({
            eventId,
            name,
            email,
            message,
            status: 'Pending',
        });

        const savedVolunteer = await newVolunteer.save();
        res.status(201).json(savedVolunteer);
    } catch (error) {
        console.error('Error creating volunteer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteVolunteer = async (req, res) => {
    try {
        const volunteerId = req.params.id;
        const deleted = await Volunteer.findByIdAndDelete(volunteerId);
        if (!deleted) return res.status(404).json({ error: 'Volunteer not found' });
        res.status(200).json({ message: 'Volunteer deleted successfully' });
    } catch (error) {
        console.error('Error deleting volunteer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const approveVolunteer = async (req, res) => {
    try {
        const updated = await Volunteer.findByIdAndUpdate(req.params.id, { status: 'Approved' }, { new: true });
        if (!updated) return res.status(404).json({ error: 'Volunteer not found' });
        res.status(200).json(updated);
    } catch (error) {
        console.error('Error approving volunteer:', error);
        res.status(500).json({ error: 'Error approving request.' });
    }
};

const rejectVolunteer = async (req, res) => {
    try {
        const updated = await Volunteer.findByIdAndUpdate(req.params.id, { status: 'Rejected' }, { new: true });
        if (!updated) return res.status(404).json({ error: 'Volunteer not found' });
        res.status(200).json(updated);
    } catch (error) {
        console.error('Error rejecting volunteer:', error);
        res.status(500).json({ error: 'Error rejecting request.' });
    }
};

const VolunteerRequests = async(req,res) => {
    try{
        const response = await Volunteer.find();
        res.status(200).json(response);
    }
    catch(err){
        console.error('Error fetching volunteer requests:', err);
        res.status(500).json({ error: 'Error in getting volunteer request.' });
    }
}


export {
    getVolunteers,
    addVolunteer,
    deleteVolunteer,
    approveVolunteer,
    rejectVolunteer,
    VolunteerRequests
};
