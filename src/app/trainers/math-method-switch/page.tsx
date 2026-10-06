import type { Metadata } from "next";
import MathMethodSwitch from "@/components/trainers/MathMethodSwitch";
import { Footer, NavBar } from "@/components/ui/CleanUi";
export const metadata: Metadata = {
  title: "SAT Math: сравни способы решения — ASHYQ",
  description:
    "Реши систему, сравни алгебру, график и таблицу и попробуй другой способ на новой задаче.",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <>
      <NavBar />
      <MathMethodSwitch />
      <Footer />
    </>
  );
}
