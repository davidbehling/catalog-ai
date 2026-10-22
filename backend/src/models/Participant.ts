import { Schema, model, type InferSchemaType } from 'mongoose';

export const PARTICIPANT_STATUSES = ['pending', 'activated', 'suspended'] as const;

export type ParticipantStatus = (typeof PARTICIPANT_STATUSES)[number];

const participantSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user', required: true },
  status: { type: String, enum: PARTICIPANT_STATUSES, default: 'pending', required: true, index: true }
}, { timestamps: true });

// Um usuário participa de cada empresa no máximo uma vez.
participantSchema.index({ user_id: 1, company_id: 1 }, { unique: true });

export type ParticipantDocument = InferSchemaType<typeof participantSchema>;

export const Participant = model('Participant', participantSchema);
