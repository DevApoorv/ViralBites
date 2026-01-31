import React from 'react';
import { ViralPlace, VideoLink } from '../types';
import { MapPin, Star, TrendingUp, Utensils, ExternalLink, Navigation, PlayCircle, Instagram, Youtube, Search, AlertTriangle, Store } from 'lucide-react';

interface PlaceCardProps {
  place: ViralPlace;
  index: number;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, index }) => {
  // Logic: Use provided image ONLY if it looks like a valid http URL.
  // Otherwise, fallback to a clean UI placeholder, DO NOT generate random food images.
  const hasValidImage = place.imageUrl && place.imageUrl.startsWith('http');
  const isDistanceWarning = place.distance && place.distance.includes('km') && parseFloat(place.distance) > 10;

  // Directions URL
  const destination = place.location 
      ? `${place.location.latitude},${place.location.longitude}`
      : encodeURIComponent(`${place.name}, ${place.address || ''}`);
  
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('instagram')) return <Instagram className="w-3 h-3" />;
    if (p.includes('youtube')) return <Youtube className="w-3 h-3" />;
    if (p.includes('tiktok')) return <span className="text-[10px] font-bold">TT</span>;
    return <Search className="w-3 h-3" />;
  };

  const getPlatformColor = (platform: string) => {
     const p = platform.toLowerCase();
     if (p.includes('instagram')) return 'bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100';
     if (p.includes('youtube')) return 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100';
     if (p.includes('tiktok')) return 'bg-gray-100 text-black border-gray-200 hover:bg-gray-200';
     return 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100';
  };

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border flex flex-col md:flex-row group ${!place.isVerified ? 'border-orange-200' : 'border-gray-100'}`}>
      {/* Image Section */}
      <div className="md:w-2/5 h-56 md:h-auto relative overflow-hidden bg-slate-100 flex items-center justify-center">
        {hasValidImage ? (
             <img 
             src={place.imageUrl} 
             alt={place.name} 
             className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
             onError={(e) => {
                // If the specific image URL fails, switch to placeholder
                (e.target as HTMLElement).style.display = 'none';
                (e.target as HTMLElement).nextElementSibling?.classList.remove('hidden');
             }}
           />
        ) : (
            <div className="flex flex-col items-center justify-center text-slate-300">
                <Store className="w-16 h-16 mb-2" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">View on Maps</span>
            </div>
        )}
        
        {/* Fallback div in case img tag errors out (hidden by default) */}
        <div className="hidden absolute inset-0 flex flex-col items-center justify-center text-slate-300 bg-slate-100">
             <Store className="w-16 h-16 mb-2" />
             <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">View on Maps</span>
        </div>

        <div className="absolute top-3 left-3 flex gap-2 z-10">
            <div className="bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-lg">
                <TrendingUp className="w-3 h-3 mr-1" />
                #{index + 1}
            </div>
            {!place.isVerified && (
                <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-lg" title="Location not strictly verified on Maps">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Unverified
                </div>
            )}
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900 leading-tight flex items-center">
                  {place.name}
              </h3>
              <p className="text-sm text-gray-500 font-medium flex items-center mt-1">
                {place.cuisine} 
                {place.priceLevel && <span className="mx-1">•</span>} 
                {place.priceLevel}
              </p>
            </div>
            {place.rating ? (
              <div className="text-right flex-shrink-0">
                  <div className="inline-flex items-center bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                    <span className="text-sm font-bold text-green-700 mr-1">{place.rating}</span>
                    <Star className="w-3 h-3 text-green-600 fill-current" />
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">{place.userRatingCount}+ reviews</div>
              </div>
            ) : (
                <div className="text-[10px] text-gray-400 italic">No ratings</div>
            )}
          </div>

          {/* Viral Context */}
          <div className="space-y-3 mb-4">
            <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded-r-md">
              <p className="text-xs font-bold text-rose-700 uppercase mb-1 tracking-wide">Why It's Viral</p>
              <p className="text-sm text-gray-800 italic leading-relaxed">"{place.viralReason}"</p>
            </div>

            <div className="flex flex-wrap gap-2">
               {place.popularDishes.map((dish, idx) => (
                 <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                   <Utensils className="w-3 h-3 mr-1 opacity-70" />
                   {dish}
                 </span>
               ))}
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-2">
              <span className="font-semibold text-gray-700">Sentiment: </span>
              {place.sentimentSummary}
            </p>
          </div>

          {/* Video Links */}
          <div className="mb-4 pt-3 border-t border-gray-100">
             <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Watch Viral Clips</p>
             <div className="flex flex-wrap gap-2">
               {place.videoLinks.map((link, i) => (
                 <a 
                  key={i} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`inline-flex items-center px-2 py-1 rounded border text-xs font-medium transition-colors ${getPlatformColor(link.platform)}`}
                 >
                   {getPlatformIcon(link.platform)}
                   <span className="ml-1 max-w-[150px] truncate">{link.title || `Watch on ${link.platform}`}</span>
                   <ExternalLink className="w-2 h-2 ml-1 opacity-50" />
                 </a>
               ))}
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto gap-3">
          <div className={`flex items-center text-sm font-semibold ${isDistanceWarning ? 'text-orange-600' : 'text-gray-700'}`}>
            <MapPin className={`w-4 h-4 mr-1 ${isDistanceWarning ? 'text-orange-500' : 'text-rose-500'}`} />
            {place.distance}
            {isDistanceWarning && <span className="text-[10px] ml-1 bg-orange-100 px-1 rounded">(&gt;10km)</span>}
          </div>
          
          <div className="flex gap-2">
              {place.googleMapsUri && (
                <a 
                  href={place.googleMapsUri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-3 py-2 border border-gray-200 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                  title="View Details on Google Maps"
                >
                  <span className="hidden sm:inline mr-1">Maps</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              
              {/* Changed to anchor tag for better reliability */}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm transition-colors ${(!place.isVerified && !place.address) ? 'bg-gray-300 cursor-not-allowed pointer-events-none' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                <Navigation className="w-3 h-3 mr-2" />
                Directions
              </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;