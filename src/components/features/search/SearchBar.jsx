import { Search } from "lucide-react";

function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  onFocus,
  onBlur,
  children,
}) {
  return (
    <div className="mx-auto mt-4 w-full max-w-[400px] sm:max-w-[480px] relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">
        <Search className="w-[18px] h-[18px]" strokeWidth={2.2} />
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/10 border border-transparent text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/20 transition-all"
        autoComplete="off"
      />
      {children}
    </div>
  );
}

export default SearchBar;
