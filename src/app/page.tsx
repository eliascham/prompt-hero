import { listChallenges } from "@/challenges/loader";
import { CampaignView } from "@/components/CampaignView";

export default async function Home() {
  const challenges = await listChallenges();

  return <CampaignView challenges={challenges} />;
}
