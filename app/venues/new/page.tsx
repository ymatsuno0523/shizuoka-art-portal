import type { Metadata } from "next";
import VenueForm from "@/app/components/VenueForm";

export const metadata: Metadata = {
  title: "施設を登録",
};

export default function NewVenuePage() {
  return <VenueForm />;
}
