import React from 'react';
import LocationCard from './LocationCard';

const ChatResponse = ({ response }) => {
  const { reply, structuredData } = response;

  return (
    <div className="space-y-6">
      {/* Chat Message */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="prose max-w-none">
          {reply.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Location Cards */}
      {structuredData?.locations?.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Places to Visit</h2>
          <div className="space-y-4">
            {structuredData.locations.map((location, index) => (
              <LocationCard key={index} location={location} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatResponse; 