import { redirect } from "next/navigation";

export default function EmailTemplatesRedirectPage() {
  redirect("/account/template-settings");
}
