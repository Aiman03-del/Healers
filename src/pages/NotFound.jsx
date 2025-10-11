import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] bg-gradient-to-br from-purple-900 via-gray-900 to-black text-center rounded-xl shadow-2xl p-8">
    <h1 className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 mb-4 drop-shadow-lg">
      404
    </h1>
    <p className="text-2xl text-purple-200 mb-6 font-semibold">
      Oops! Page Not Found
    </p>
    <Link
      to="/"
      className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition"
    >
      Go Home
    </Link>
  </div>
);

export default NotFound;
