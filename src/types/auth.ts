import { Company } from "@prisma/client";

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
  hierarchyLevel: number;
  company: Company;
  status: string;
}
