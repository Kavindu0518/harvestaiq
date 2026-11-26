import { AccountStatus, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const ownerEmail = "owner@harvestaiq.lk";
  const ownerCode = "HAIQ-OWN-0001";
  const passwordHash = await bcrypt.hash("Admin@1234", 12);
  const now = new Date();

  const existingOwner = await prisma.user.findUnique({
    where: { email: ownerEmail },
  });

  if (existingOwner) {
    await prisma.user.update({
      where: { id: existingOwner.id },
      data: {
        userCode: ownerCode,
        role: Role.OWNER_ADMIN,
        accountStatus: AccountStatus.ACTIVE,
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: existingOwner.emailVerifiedAt ?? now,
        assignedGreenhouses: ["ALL"],
      },
    });
    console.log(`Updated existing OWNER_ADMIN user: ${ownerEmail}`);
    return;
  }

  await prisma.user.create({
    data: {
      userCode: ownerCode,
      name: "HarvestAIQ Owner",
      email: ownerEmail,
      passwordHash,
      role: Role.OWNER_ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: now,
      assignedGreenhouses: ["ALL"],
    },
  });

  console.log(`Seeded default OWNER_ADMIN user: ${ownerEmail} (${ownerCode})`);
}

main()
  .catch((error) => {
    console.error("Failed to seed database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
