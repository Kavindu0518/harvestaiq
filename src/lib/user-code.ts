import { prisma } from "./prisma";

const BUYER_PREFIX = "HAIQ-USR-";
const STAFF_PREFIX = "HAIQ-STF-";

/**
 * Computes the next sequential user code for a given prefix (e.g., `HAIQ-USR-0001`).
 */
async function getNextCodeWithPrefix(prefix: string): Promise<string> {
  const existingUsers = await prisma.user.findMany({
    where: {
      userCode: {
        startsWith: prefix,
      },
    },
    select: {
      userCode: true,
    },
  });

  let maxSequence = 0;

  for (const { userCode } of existingUsers) {
    const suffix = userCode.slice(prefix.length);
    if (/^\d+$/.test(suffix)) {
      const parsed = Number.parseInt(suffix, 10);
      if (parsed > maxSequence) {
        maxSequence = parsed;
      }
    }
  }

  const nextSequence = maxSequence + 1;
  return `${prefix}${nextSequence.toString().padStart(4, "0")}`;
}

/**
 * Generates the next sequential buyer code (`HAIQ-USR-0001`).
 */
export async function getNextBuyerCode(): Promise<string> {
  return getNextCodeWithPrefix(BUYER_PREFIX);
}

/**
 * Generates the next sequential staff code (`HAIQ-STF-0001`).
 */
export async function getNextStaffCode(): Promise<string> {
  return getNextCodeWithPrefix(STAFF_PREFIX);
}
