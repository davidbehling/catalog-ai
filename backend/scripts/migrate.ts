import { connectDatabase } from '../src/config/db.js';
import { Company } from '../src/models/Company.js';
import { Participant } from '../src/models/Participant.js';
import { User } from '../src/models/User.js';

/**
 * Migra o banco do modelo antigo (usuário com companyId/role próprios) para o
 * modelo de multi-empresa (usuário com participações em Participant).
 *
 * O papel de cada usuário é preservado como Participant activated.
 */
await connectDatabase();

const users = await User.find({}).lean();
let participantsCreated = 0;
let usersCleaned = 0;

for (const user of users) {
  const legacyCompanyId = (user as unknown as { companyId?: string }).companyId;
  const legacyRole = (user as unknown as { role?: 'admin' | 'user' }).role;

  if (legacyCompanyId) {
    const company = await Company.findById(legacyCompanyId).lean();

    if (company) {
      await Participant.updateOne(
        { user_id: user._id, company_id: company._id },
        { $set: { role: legacyRole ?? 'user', status: 'activated' } },
        { upsert: true }
      );
      participantsCreated += 1;
    }
  }

  // companyId e role migraram para Participant; removê-los do documento do usuário.
  await User.updateOne(
    { _id: user._id },
    { $unset: { companyId: '', role: '' } }
  );
  usersCleaned += 1;
}

await User.syncIndexes();
await Participant.syncIndexes();

console.log(`Migração concluída: ${usersCleaned} usuários atualizados, ${participantsCreated} participações criadas.`);

process.exit(0);
