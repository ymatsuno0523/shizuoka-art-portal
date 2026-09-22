import ContactForm from "@/app/mypage/contact/ContactForm";
import MypageSubpage from "@/app/mypage/MypageSubpage";

export default function ContactPage() {
  return (
    <MypageSubpage title="お問い合わせ">
      <ContactForm />
    </MypageSubpage>
  );
}
