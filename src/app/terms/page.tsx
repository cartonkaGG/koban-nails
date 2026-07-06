import { redirect } from "next/navigation";

export const metadata = {
  title: "Публічна оферта | Koban Nails",
};

export default function TermsPage() {
  redirect("/offer");
}
