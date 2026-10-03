import { TheLoneTemplate } from '@/components/templates/the-lone/TheLoneTemplate';

export default function PreviewTemplatePage() {
  return (
    <div className="min-h-screen bg-black flex justify-center items-center py-10">
      {/* We contain it in a max-width container mimicking a mobile device since templates are often responsive/mobile-first */}
      <div className="w-full max-w-md shadow-2xl rounded-3xl overflow-hidden ring-1 ring-white/10 relative">
        <TheLoneTemplate />
      </div>
    </div>
  );
}
