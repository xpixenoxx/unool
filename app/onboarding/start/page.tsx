'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

const options = [
  { id: 'founder', title: 'Founder', desc: 'Building a business' },
  { id: 'creator', title: 'Creator', desc: 'Growing an audience' },
  { id: 'agency', title: 'Agency', desc: 'Managing client accounts' },
  { id: 'enterprise', title: 'Enterprise', desc: 'Big company team' },
  { id: 'smallbiz', title: 'Small Business', desc: 'Running a small business' },
];

export default function OnboardingStartPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>('enterprise'); // default based on screenshot

  const handleNext = () => {
    router.push('/onboarding/connect');
  };

  return (
    <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <p className="text-[#68d391] text-[15px] font-semibold mb-2">almost ready</p>
      <h1 className="text-[28px] font-bold text-[#1f2937] mb-8">what sounds most like you?</h1>

      <div className="w-full space-y-3">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all duration-200 border
                ${isSelected 
                  ? 'bg-[#68d391] border-[#68d391] text-white shadow-md' 
                  : 'bg-white border-zinc-200 text-[#4b5563] hover:border-zinc-300 hover:shadow-sm'
                }`}
            >
              {/* Radio circle */}
              <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0
                ${isSelected ? 'border-white bg-[#4ab772] text-white' : 'border-zinc-200 bg-white'}`}
              >
                {isSelected && <Check className="w-[14px] h-[14px]" />}
              </div>

              {/* Text content */}
              <div className="flex flex-col">
                <span className={`text-[16px] font-semibold ${isSelected ? 'text-white' : 'text-[#374151]'}`}>
                  {opt.title}
                </span>
                <span className={`text-[14px] ${isSelected ? 'text-white/90' : 'text-zinc-500'}`}>
                  {opt.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-zinc-200 z-40">
        <div className="h-[80px] w-full max-w-[1152px] flex items-center justify-end mx-auto px-[24px]">
          <button
            onClick={handleNext}
            className="bg-[#68d391] hover:bg-[#5bb87d] text-white px-8 py-2.5 rounded font-semibold text-[15px] transition-colors shadow-sm"
          >
            Next
          </button>
        </div>
      </div>

    </div>
  );
}
