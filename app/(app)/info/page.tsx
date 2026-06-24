import { CabinInfo } from "@/components/cabin-info";
import { getCabinInfo } from "@/lib/info";
import { requireMember } from "@/lib/session";

export default async function InfoPage() {
  const member = await requireMember();
  const content = await getCabinInfo();
  return <CabinInfo content={content} canEdit={member.role === "admin"} />;
}
