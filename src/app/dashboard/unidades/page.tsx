import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import UnidadesClient from "./UnidadesClient";
import type {
  BusinessUnitAnalyticsSerialized,
  BusinessUnitMetaDataSerialized,
  BusinessUnitRevenueSerialized,
} from "@/types/analytics";

interface BusinessUnitTool {
  id: string;
  businessUnitId: string;
  name: string;
  url: string;
  icon: string;
  description: string;
  category: string;
  isExternal: boolean;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BusinessUnitSocialLink {
  id: string;
  businessUnitId: string;
  platform: string;
  url: string;
  handle: string;
  followersCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BusinessUnit {
  id: string;
  name: string;
  slug: string;
  company: string;
  description: string;
  logo: string;
  coverImage: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  tools: BusinessUnitTool[];
  socialLinks: BusinessUnitSocialLink[];
  analytics: BusinessUnitAnalyticsSerialized[];
  metaData: BusinessUnitMetaDataSerialized[];
  revenueData: BusinessUnitRevenueSerialized[];
}

export default async function UnidadesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as {
    id?: string;
    role?: string;
    hierarchyLevel?: number;
  };

  const userLevel = user?.hierarchyLevel || 3;

  // Fetch business units server-side
  const businessUnitsData = await db.getBusinessUnits().catch(() => []);

  // Serialize dates for client component
  const serializedBusinessUnits: BusinessUnit[] = (
    businessUnitsData as Array<{
      id: string;
      name: string;
      slug: string;
      company: string;
      description: string | null;
      logo: string | null;
      coverImage: string | null;
      address: string | null;
      phone: string | null;
      email: string | null;
      website: string | null;
      isActive: boolean;
      order: number;
      createdAt: Date;
      updatedAt: Date;
      tools?: BusinessUnitTool[];
      socialLinks?: BusinessUnitSocialLink[];
      analytics?: BusinessUnitAnalyticsSerialized[];
      metaData?: BusinessUnitMetaDataSerialized[];
      revenueData?: BusinessUnitRevenueSerialized[];
    }>
  ).map((bu) => ({
    id: bu.id,
    name: bu.name,
    slug: bu.slug,
    company: bu.company,
    description: bu.description || "",
    logo: bu.logo || "",
    coverImage: bu.coverImage || "",
    address: bu.address || "",
    phone: bu.phone || "",
    email: bu.email || "",
    website: bu.website || "",
    isActive: bu.isActive,
    order: bu.order,
    createdAt: new Date(bu.createdAt).toISOString(),
    updatedAt: new Date(bu.updatedAt).toISOString(),
    tools: bu.tools || [],
    socialLinks: bu.socialLinks || [],
    analytics: bu.analytics || [],
    metaData: bu.metaData || [],
    revenueData: bu.revenueData || [],
  }));

  return (
    <UnidadesClient
      initialBusinessUnits={serializedBusinessUnits}
      userLevel={userLevel}
    />
  );
}
