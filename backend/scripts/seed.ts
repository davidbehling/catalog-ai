import bcrypt from 'bcryptjs';
import { connectDatabase } from '../src/config/db.js';
import { Company } from '../src/models/Company.js';
import { Notification } from '../src/models/Notification.js';
import { Participant } from '../src/models/Participant.js';
import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';

const catalogs = [
  {
    name: 'Clínica Rigatti Demo A',
    slug: 'rigatti-demo-a',
    email: 'admin-a@example.com',
    userEmail: 'user-a@example.com',
    products: [
      ['Consulta inicial', 'Avaliação inicial com profissional especializado.', 180, 'Consultas'],
      ['Consulta de retorno', 'Retorno para acompanhamento do plano de cuidado.', 90, 'Consultas'],
      ['Avaliação nutricional', 'Avaliação de hábitos alimentares e objetivos.', 150, 'Nutrição'],
      ['Plano mensal', 'Acompanhamento mensal personalizado.', 390, 'Planos'],
      ['Sessão de terapia', 'Sessão individual de atendimento.', 160, 'Terapia'],
      ['Avaliação física', 'Avaliação de mobilidade e condicionamento.', 120, 'Avaliações'],
      ['Pacote 4 sessões', 'Pacote com quatro sessões agendadas.', 560, 'Pacotes'],
      ['Teleconsulta', 'Atendimento remoto com hora marcada.', 140, 'Consultas'],
      ['Acompanhamento premium', 'Plano com acompanhamento ampliado.', 650, 'Planos'],
      ['Orientação de bem-estar', 'Sessão de orientação e prevenção.', 110, 'Bem-estar']
    ]
  },
  {
    name: 'Empresa Demo B',
    slug: 'empresa-demo-b',
    email: 'admin-b@example.com',
    userEmail: 'user-b@example.com',
    products: [
      ['Kit Essencial', 'Kit de produtos essenciais para uso diário.', 49.9, 'Kits'],
      ['Kit Avançado', 'Kit completo para clientes avançados.', 99.9, 'Kits'],
      ['Produto Alfa', 'Produto demonstrativo da categoria alfa.', 25, 'Categoria A'],
      ['Produto Beta', 'Produto demonstrativo da categoria beta.', 35, 'Categoria B'],
      ['Serviço Bronze', 'Serviço básico com suporte padrão.', 120, 'Serviços'],
      ['Serviço Prata', 'Serviço intermediário com recursos extras.', 220, 'Serviços'],
      ['Serviço Ouro', 'Serviço premium com necessidades avançadas.', 420, 'Serviços'],
      ['Acessório 1', 'Acessório compatível com o catálogo demo.', 19.9, 'Acessórios'],
      ['Acessório 2', 'Acessório adicional para demonstração.', 29.9, 'Acessórios'],
      ['Pacote Família', 'Pacote demonstrativo para múltiplos usuários.', 159.9, 'Pacotes']
    ]
  }
];

await connectDatabase();

const passwordHash = await bcrypt.hash('Demo1234!', 12);

for (const data of catalogs) {
  const company = await Company.findOneAndUpdate(
    { slug: data.slug },
    { name: data.name, slug: data.slug },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const admin = await User.findOneAndUpdate(
    { email: data.email },
    { $set: { name: 'Admin Demo', email: data.email, passwordHash } },
    { upsert: true, new: true }
  );

  const member = await User.findOneAndUpdate(
    { email: data.userEmail },
    { $set: { name: 'Usuário Demo', email: data.userEmail, passwordHash } },
    { upsert: true, new: true }
  );

  await Participant.updateOne(
    { user_id: admin._id, company_id: company._id },
    { $set: { role: 'admin', status: 'activated' } },
    { upsert: true }
  );

  await Participant.updateOne(
    { user_id: member._id, company_id: company._id },
    { $set: { role: 'user', status: 'activated' } },
    { upsert: true }
  );

  for (const [name, description, price, category] of data.products) {
    await Product.updateOne(
      { companyId: company._id, name },
      { $set: { companyId: company._id, name, description, price, category, imageUrl: '' } },
      { upsert: true }
    );
  }
}

// O mesmo usuário participa das duas empresas, para demonstrar a troca de empresa.
const multiCompanyUser = await User.findOneAndUpdate(
  { email: 'admin-a@example.com' },
  { $set: { name: 'Admin Demo', email: 'admin-a@example.com', passwordHash } },
  { upsert: true, new: true }
);

const companyB = await Company.findOne({ slug: 'empresa-demo-b' }).lean();

if (companyB) {
  await Participant.updateOne(
    { user_id: multiCompanyUser._id, company_id: companyB._id },
    { $set: { role: 'admin', status: 'activated' } },
    { upsert: true }
  );
}

await Notification.deleteMany({});

console.log('Seed concluído. Senha para todas as contas: Demo1234!');
console.log('Empresa A: admin-a@example.com / user-a@example.com');
console.log('Empresa B: admin-b@example.com / user-b@example.com');
console.log('admin-a@example.com participa das duas empresas (troca de empresa disponível).');

process.exit(0);
