import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    userCode: string;
    role: Role;
    assignedGreenhouses: string[];
    defaultPath: string;
  }

  interface Session {
    user: {
      id: string;
      userCode: string;
      role: Role;
      assignedGreenhouses: string[];
      defaultPath: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    userCode: string;
    role: Role;
    assignedGreenhouses: string[];
    defaultPath: string;
  }
}
