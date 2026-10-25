import type { Metadata } from "next";
import CircleForm from "@/app/components/CircleForm";

export const metadata: Metadata = {
  title: "団体を登録",
};

export default function NewCirclePage() {
  return <CircleForm />;
}
