import React, { useState } from "react";

const Dashboard: React.FC = () => {
  const [locationInput, setLocationInput] = useState("");

  const handleSearch = () => {
    // TODO: wire to properties search/filter page
  };

  return (
    <section
      className="relative h-[500px] bg-cover bg-center flex items-center justify-center px-6"
      style={{ backgroundImage: "url('/images/juba3.jpg')" }}
    >
      <div className="bg-white/40 backdrop-blur-md shadow-2xl p-8 rounded-2xl w-full max-w-4xl">
        <h1 className="text-4xl font-extrabold text-black mb-4">
          Welcome to Ejar
        </h1>
        <p className="text-black mb-8 text-lg">
          Discover the best rental and commercial properties. List your property
          today and reach thousands of potential tenants and buyers.
        </p>

      <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      placeholder="Enter location"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                    <button onClick={handleSearch} className="w-full bg-blue-600 text-white rounded-lg p-3 hover:bg-blue-800 transition font-semibold">
                      Search
                    </button>
      </div>
    </section>
  );
};

export default Dashboard;
