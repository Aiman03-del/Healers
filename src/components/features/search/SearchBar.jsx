import { FaSearch } from "react-icons/fa";

function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="mx-auto mt-4 w-[340px] sm:w-[400px] md:w-[480px] relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 text-lg pointer-events-none">
        <FaSearch />
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 rounded-2xl bg-gradient-to-r from-gray-900/90 to-purple-900/80 border border-purple-700 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-lg transition"
        autoComplete="off"
      />
    </div>
  );
}

export default SearchBar;
