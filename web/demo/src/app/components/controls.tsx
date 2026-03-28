import { useState } from 'react';

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export function Slider({ label, value, onChange, min = 0, max = 100, step = 1, unit = '' }: SliderProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm text-[#1D2129]">{label}</label>
        <span className="text-sm text-[#4E5969]">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="
          w-full h-1 bg-[#E5E6EB] rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:bg-[#165DFF]
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:hover:bg-[#4080FF]
          [&::-webkit-slider-thumb]:transition-colors
          [&::-moz-range-thumb]:w-4
          [&::-moz-range-thumb]:h-4
          [&::-moz-range-thumb]:bg-[#165DFF]
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:cursor-pointer
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:hover:bg-[#4080FF]
          [&::-moz-range-thumb]:transition-colors
        "
      />
    </div>
  );
}

interface TabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-[#F2F3F5] rounded-[8px]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex-1 h-[36px] px-4 rounded-[6px] transition-all duration-200 text-sm
            ${activeTab === tab.id
              ? 'bg-white text-[#1D2129] shadow-sm'
              : 'text-[#4E5969] hover:text-[#1D2129]'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface IconButtonProps {
  icon: React.ReactNode;
  label?: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary';
}

export function IconButton({ icon, label, onClick, disabled = false, variant = 'default' }: IconButtonProps) {
  const variantStyles = {
    default: 'bg-[#F2F3F5] text-[#4E5969] hover:bg-[#E5E6EB] hover:text-[#1D2129] disabled:bg-[#F2F3F5] disabled:text-[#C9CDD4]',
    primary: 'bg-[#165DFF] text-white hover:bg-[#4080FF] disabled:bg-[#94BFFF]'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        h-[36px] px-3 rounded-[8px] flex items-center gap-2
        transition-all duration-200 disabled:cursor-not-allowed
        ${variantStyles[variant]}
      `}
      title={label}
    >
      {icon}
      {label && <span className="text-sm">{label}</span>}
    </button>
  );
}
