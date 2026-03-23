const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.notification.count();
  console.log(`Total notifications: ${count}`);
  
  const notifications = await prisma.notification.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, role: true } } }
  });
  console.log('Last 5 notifications:', JSON.stringify(notifications, null, 2));
  
  const agents = await prisma.user.findMany({
    where: { role: 'AGENT' },
    select: { id: true, name: true }
  });
  console.log('Agents:', JSON.stringify(agents, null, 2));

  for (const agent of agents) {
    const agentNotifs = await prisma.notification.count({ where: { userId: agent.id } });
    console.log(`Agent ${agent.name} (ID: ${agent.id}) has ${agentNotifs} notifications.`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
