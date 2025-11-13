import { useMemo, useState, useCallback } from "react";
import {
  FaSearch,
  FaPlus,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

const normalizeName = (name = "") =>
  name
    .toString()
    .replace(/\s+/g, " ")
    .trim();

const dedupeList = (list = []) => {
  if (!Array.isArray(list)) return [];
  return Array.from(
    new Map(
      list
        .map((item) => normalizeName(item))
        .filter(Boolean)
        .map((item) => [item.toLowerCase(), item])
    ).values()
  );
};

const ArtistMultiSelect = ({
  options = [],
  value = [],
  onChange,
  onCreateOption,
  inputPlaceholder = "Search or add artists",
  addButtonLabel = "Add",
  className = "",
  disabled = false,
}) => {
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const normalizedSelected = useMemo(() => dedupeList(value), [value]);

  const normalizedOptions = useMemo(() => dedupeList(options), [options]);

  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return normalizedOptions;
    }
    return normalizedOptions.filter((option) =>
      option.toLowerCase().includes(term)
    );
  }, [normalizedOptions, query]);

  const triggerChange = useCallback(
    (nextValue) => {
      const unique = dedupeList(nextValue);
      if (onChange) {
        onChange(unique);
      }
    },
    [onChange]
  );

  const handleAdd = useCallback(
    (rawValue) => {
      const candidate = normalizeName(rawValue);
      if (!candidate) return;

      const next = dedupeList([...normalizedSelected, candidate]);
      triggerChange(next);

      const exists = normalizedOptions.some(
        (option) => option.toLowerCase() === candidate.toLowerCase()
      );
      if (!exists && onCreateOption) {
        onCreateOption(candidate);
      }

      setQuery("");
      setDropdownOpen(false);
    },
    [
      normalizedSelected,
      normalizedOptions,
      triggerChange,
      onCreateOption,
    ]
  );

  const handleSelectOption = useCallback(
    (option) => {
      handleAdd(option);
    },
    [handleAdd]
  );

  const handleRemove = useCallback(
    (artist) => {
      const next = normalizedSelected.filter(
        (item) => item.toLowerCase() !== artist.toLowerCase()
      );
      triggerChange(next);
    },
    [normalizedSelected, triggerChange]
  );

  const handleInputChange = (event) => {
    setQuery(event.target.value);
    if (!dropdownOpen) {
      setDropdownOpen(true);
    }
  };

  const handleInputFocus = () => {
    setDropdownOpen(true);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setDropdownOpen(false);
    }, 150);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAdd(query);
    }
  };

  const existingMatch = useMemo(() => {
    const candidate = normalizeName(query);
    if (!candidate) return null;
    return normalizedOptions.find(
      (option) => option.toLowerCase() === candidate.toLowerCase()
    );
  }, [query, normalizedOptions]);

  const renderDropdownContent = () => {
    const candidate = normalizeName(query);
    const hasMatches = filteredOptions.length > 0;

    if (!candidate && !hasMatches) {
      return (
        <div className="px-3 py-2 text-sm text-gray-400">
          Start typing to search artists
        </div>
      );
    }

    return (
      <>
        {hasMatches &&
          filteredOptions.map((option) => {
            const isSelected = normalizedSelected.some(
              (selected) => selected.toLowerCase() === option.toLowerCase()
            );
            return (
              <button
                key={option}
                type="button"
                onMouseDown={() => handleSelectOption(option)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm rounded-md transition-colors ${
                  isSelected
                    ? "bg-[#1db954]/20 text-[#1db954]"
                    : "hover:bg-white/5 text-white"
                }`}
              >
                <span>{option}</span>
                {isSelected && <FaCheckCircle className="text-[#1db954]" />}
              </button>
            );
          })}

        {candidate && !existingMatch && (
          <button
            type="button"
            onMouseDown={() => handleAdd(candidate)}
            className="w-full px-3 py-2 text-left text-sm text-white bg-[#1db954]/10 hover:bg-[#1db954]/20 rounded-md flex items-center gap-2 mt-1"
          >
            <FaPlus />
            Create “{candidate}”
          </button>
        )}

        {candidate && existingMatch && !hasMatches && (
          <div className="px-3 py-2 text-sm text-gray-400">
            Artist exists. Select from the list above.
          </div>
        )}

        {!hasMatches && !candidate && (
          <div className="px-3 py-2 text-sm text-gray-400">
            No artists found. Try creating a new one.
          </div>
        )}
      </>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex gap-2 relative">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs sm:text-sm" />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={inputPlaceholder}
            disabled={disabled}
            className="w-full pl-9 pr-3 p-3 rounded-lg bg-white/10 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:bg-white/20 focus:outline-none transition-all duration-300 text-sm sm:text-base disabled:opacity-60"
          />
          {dropdownOpen && !disabled && (
            <div className="absolute z-20 w-full mt-2 bg-[#121212] border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {renderDropdownContent()}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleAdd(query)}
          disabled={disabled || !normalizeName(query)}
          className="px-4 py-3 bg-[#1db954] text-black font-semibold rounded-lg flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <FaPlus />
          {addButtonLabel}
        </button>
      </div>

      {normalizedSelected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {normalizedSelected.map((artist) => (
            <span
              key={artist}
              className="flex items-center gap-2 bg-white/10 border border-gray-700 text-white px-3 py-1.5 rounded-full text-xs sm:text-sm"
            >
              {artist}
              <button
                type="button"
                onClick={() => handleRemove(artist)}
                className="text-red-400 hover:text-red-300"
                aria-label={`Remove ${artist}`}
              >
                <FaTimesCircle />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArtistMultiSelect;


