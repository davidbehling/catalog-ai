[1]

O modelo User receberá terá duas novas propriedades, current_login, first_login

Essas propriedades receberão os valores 'yyyy-mm-dd hh-mm-ss'.

first_login será setado quando o usuário logar pela primeira vez na aplicação.

current_login será setado toda vez que o usuário logar na aplicação.


[2]

Criar um modelo Notification com as propriedades, user_id, company_id, message, title, ready.

ready será um valor booleando, por padrão é false, quando o usuário visualizar a notificação, será setado para true.


[3]

Um usuário poderá ser participante em mais de uma Company.

Criar um modelo Participant, esse modelo fará a associação do User com a Company sinalizando sua regra 'admin' ou 'user'.

Exemplo: 

participant id: 1, user_id: 1, company_id: 1, role: 'admin', status: 'activated'

participant id: 2, user_id: 1, company_id: 2, role: 'user', status: 'pending'

participant id: 3, user_id: 1, company_id: 3, role: 'user', status: 'suspended'

pending: esperando usuário aceitar convite ou logar pela primeira vez na aplicação.
activated: usuário ativo na company.
suspended: usuári supenso da company.


[4]

AÇÃO PARA CONVIDAR USUÁRIO:

[4.1]

No modal para adicionar novo usuário, haverá apenas o campo de e-mail.

Ao declarar o email, será verificado se o mesmo já é cadastrado na aplicação como 'admin' ou 'user'.

Caso não seja cadastrado, será exibido os campos de 'Nome' e 'Senha provisória'.

Será criado User e  Participant com status setado em 'pendente'.

Se ao logar User.first_login for nulo, significa que é a primeira vez do usuário logado, então Participant.status será alterado de 'pendente' para 'actived'.

[4.2]

Se o usuário convidado já existir como 'admin' ou 'user' em outra companey, o mesmo será vinculado pelo participant com status de 'pendente'.

Será exibido uma notificação no ícone de sininho ao lado do ícone do usuário no canto direito superior da tela.

Exemplo de mensagem de notificação: título: 'Convite', message: 'o usuario 'David' o convidou para participar da empresa 'banana'.

Ao ler a notificação, Notification.ready será setado para true e Participant.status será setado para 'actived'.


[5]

LISTAGEM DE USUÁRIOS:

[5.1]

A lista de usuários terá as seguintes colunas: nome, e-mail, perfil, desde, status, botão.

O botao terá duas ações dependendo do status.

Se o status por pendente ou actived, o botão terá a ação de suspensão.

Se o status por suspenso, o botão terá a ação de reconvidar.

[5.1.1]

Ao clicar em suspender um usuário participante, será exibido um modal de confirmação de suspensão, confirmando, o status do usuário será alterado para 'suspended'. 

[5.1.2]

Ao clicar em reconvidar um usuário suspenso, o status será alterado para pendente e o usuário reconvidado recebera uma notificaçãpo de convite.

Ao ler a notificação de convite, o status será alterado para 'actived'.


[6]

Se um usuário não estiver ativo em nenhuma company, ao logar será exibido um modal sinalizando para criar sua propria Company ou realizar o logout.

[7]

O usuário participante em mais de uma Companty deverar poder alternar entre elas.
