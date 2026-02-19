export interface ThemeConfig {
  isDark: boolean;
  bgClass: string;
  textClass: string;
  subTextClass: string;
  headingClass: string;
  cardClass: string;
  cardInnerBg: string;
  inputClass: string;
  buttonClass: string;
  borderClass: string;
  accentColor: string;
  iconContainerClass: string;
}

export const theme: ThemeConfig = {
  isDark: false,
  bgClass: 'bg-[#FFFDF5]',
  textClass: 'text-slate-900',
  subTextClass: 'text-slate-600',
  headingClass: 'text-slate-900',
  cardClass: 'bg-white border border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  cardInnerBg: 'bg-yellow-50',
  inputClass: 'bg-white border border-black focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-none text-slate-900 placeholder-slate-400',
  buttonClass: 'bg-[#FF6B6B] border border-black text-black font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none',
  borderClass: 'border-black',
  accentColor: 'text-black',
  iconContainerClass: 'bg-[#FFE66D] border border-black',
};
