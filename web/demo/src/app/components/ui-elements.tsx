import { CheckCircle2 } from 'lucide-react';

export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-[#FAFBFC] rounded-[12px] border border-[#E5E6EB]">
      <div className="w-10 h-10 flex-shrink-0 bg-[#F2F8FF] rounded-[8px] flex items-center justify-center text-[#165DFF]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[#1D2129] mb-1">{title}</h3>
        <p className="text-sm text-[#4E5969]">{description}</p>
      </div>
    </div>
  );
}

export function StepIndicator({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200
              ${index < currentStep 
                ? 'bg-[#165DFF] text-white' 
                : index === currentStep 
                ? 'bg-[#165DFF] text-white ring-4 ring-[#165DFF]/20' 
                : 'bg-[#E5E6EB] text-[#4E5969]'
              }
            `}>
              {index < currentStep ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <span className="text-sm">{index + 1}</span>
              )}
            </div>
            <span className={`
              text-sm hidden md:inline transition-colors duration-200
              ${index <= currentStep ? 'text-[#1D2129]' : 'text-[#4E5969]'}
            `}>
              {step}
            </span>
          </div>
          
          {index < steps.length - 1 && (
            <div className={`
              w-8 md:w-12 h-0.5 transition-colors duration-200
              ${index < currentStep ? 'bg-[#165DFF]' : 'bg-[#E5E6EB]'}
            `} />
          )}
        </div>
      ))}
    </div>
  );
}