import React from 'react';
import { Box, Hammer } from 'lucide-react';

const ARDecorator = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-nature-100 p-6 rounded-full mb-6">
        <Box className="w-12 h-12 text-nature-600" />
      </div>
      <h1 className="text-3xl font-bold text-nature-800 mb-4">AR Plant Decorator</h1>
      <p className="text-gray-600 max-w-md mb-8">
        We're currently cultivating this feature. Soon you'll be able to visualize 
        how different plants look in your actual space using Augmented Reality!
      </p>
      <div className="flex items-center gap-2 text-nature-600 font-medium bg-nature-50 px-4 py-2 rounded-full">
        <Hammer className="w-4 h-4" />
        <span>Coming Soon</span>
      </div>
    </div>
  );
};

export default ARDecorator;
