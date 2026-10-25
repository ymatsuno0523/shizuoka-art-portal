import ContactForm from "@/app/mypage/contact/ContactForm";
import type { Metadata } from "next";
import MypageSubpage from "@/app/mypage/MypageSubpage";

export const metadata: Metadata = {
  title: "お問い合わせ",
};

export default function ContactPage() {
  return (
    <MypageSubpage title="お問い合わせ">
      <ContactForm />
    </MypageSubpage>
  );
}
