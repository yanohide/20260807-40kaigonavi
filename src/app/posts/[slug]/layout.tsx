import { BackToTopButton } from "@/components/BackToTopButton";

export default function PostArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <BackToTopButton />
    </>
  );
}
