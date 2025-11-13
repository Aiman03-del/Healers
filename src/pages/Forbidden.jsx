import React from "react";
import { Link } from "react-router-dom";

const Forbidden = () => (
  <div className="flex min-h-[70vh] flex-col items-center justify-center rounded-3xl bg-[#0f0f0f] p-8 text-center shadow-[0_30px_60px_rgba(0,0,0,0.35)]">
    <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full border border-white/10 bg-[#181818]">
      <span className="text-5xl font-black text-[#1db954]">403</span>
    </div>
    <h1 className="text-2xl font-semibold text-white sm:text-3xl">Access denied</h1>
    <p className="mt-3 max-w-md text-sm text-gray-400 sm:text-base">
      This section is only for authorized listeners. If you think this is a mistake, try switching accounts or contact an admin.
    </p>
    <Link
      to="/"
      className="mt-6 inline-flex items-center justify-center rounded-full bg-[#1db954] px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-[#1ed760] focus:outline-none focus:ring-2 focus:ring-[#1db954]/60 focus:ring-offset-2 focus:ring-offset-[#0f0f0f]"
    >
      Back to home
    </Link>
  </div>
);

export default Forbidden;
