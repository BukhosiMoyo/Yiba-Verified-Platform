import { redirect } from "next/navigation";

/**
 * /account has no content; redirect to the default account sub-page.
 */
export default function AccountPage() {
  redirect("/account/profile");
}
