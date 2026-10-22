import { Participant, type ParticipantStatus } from '../models/Participant.js';

export type Membership = {
  companyId: string;
  companyName: string;
  role: 'admin' | 'user';
  status: ParticipantStatus;
};

export async function listMemberships(userId: string): Promise<Membership[]> {
  const participants = await Participant.find({ user_id: userId })
    .populate<{ company_id: { _id: unknown; name: string } }>('company_id', 'name')
    .lean();

  return participants
    .filter((participant) => participant.company_id)
    .map((participant) => ({
      companyId: String(participant.company_id._id),
      companyName: participant.company_id.name,
      role: participant.role,
      status: participant.status
    }));
}

export async function findParticipant(userId: string, companyId: string) {
  return Participant.findOne({ user_id: userId, company_id: companyId }).lean();
}

export async function activatePendingParticipants(userId: string) {
  await Participant.updateMany(
    { user_id: userId, status: 'pending' },
    { $set: { status: 'activated' } }
  );
}
