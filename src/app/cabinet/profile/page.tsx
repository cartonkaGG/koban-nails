import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { ProfileForm } from "@/components/cabinet/profile-form";

export default async function ProfilePage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/cabinet/profile");
  return <ProfileForm profile={profile} />;
}
