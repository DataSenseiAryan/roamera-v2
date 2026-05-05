const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany({ select: { id: true, username: true } })
  .then(console.log)
  .finally(() => p.$disconnect());
