import React, { useState, useEffect } from 'react';
import { MapPin, Search, Loader2, Navigation, AlertCircle, Info, Youtube, Instagram, CheckCircle2, Wrench, Check, X, User, Settings, WifiOff, Wifi, Flame } from 'lucide-react';
import { Coordinates, LoadingState, ViralPlace, GroundingSource, TestResult, UserSettings } from './types';
import { findViralTrends, verifyWithMaps, runDiagnostics } from './services/geminiService';
import { AuthService } from './services/authService';
import { isFirebaseConfigured } from './services/firebaseConfig';
import PlaceCard from './components/PlaceCard';

const App: React.FC = () => {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<ViralPlace[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progressStatus, setProgressStatus] = useState<string>('');
  
  // Diagnostics
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  // Settings / Integration
  const [showSettings, setShowSettings] = useState(false);
  const [connectingAccount, setConnectingAccount] = useState<string | null>(null);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>({
      connectInstagram: false,
      connectYouTube: false,
      connectTikTok: false
  });

  // Check config status on mount
  useEffect(() => {
    setIsFirebaseReady(isFirebaseConfigured());
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setLoadingState(LoadingState.LOCATING);
    setProgressStatus("Getting your location...");
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setCoords(newCoords);
        setLoadingState(LoadingState.IDLE);
        setProgressStatus("Location found. Ready to search.");
      },
      (error) => {
        console.error(error);
        setErrorMsg("Unable to retrieve your location. Please allow location access.");
        setLoadingState(LoadingState.ERROR);
      }
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coords) {
      setErrorMsg("Please enable location first.");
      return;
    }

    setLoadingState(LoadingState.SEARCHING_TRENDS);
    setPlaces([]);
    setSources([]);
    setErrorMsg(null);
    setProgressStatus("Scanning social media for verified trends...");

    try {
      // Step 1: Search for viral context with settings
      const { candidates, searchSources } = await findViralTrends(coords, query, userSettings);
      setSources(searchSources);

      if (candidates.length === 0) {
        throw new Error("No viral places found matching your criteria.");
      }

      // Step 2: Verify with Maps
      setLoadingState(LoadingState.VERIFYING_MAPS);
      setProgressStatus(`Verifying ${candidates.length} potential spots against Google Maps...`);
      
      const verifiedPlaces = await verifyWithMaps(candidates, coords);
      
      const placesWithSources = verifiedPlaces.map(p => ({
        ...p,
        sources: searchSources 
      }));

      // Sort: Verified first, then by distance
      placesWithSources.sort((a, b) => {
        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;
        return 0; 
      });

      setPlaces(placesWithSources);
      setLoadingState(LoadingState.COMPLETE);
      setProgressStatus(`Found ${verifiedPlaces.length} viral spots!`);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred.");
      setLoadingState(LoadingState.ERROR);
    }
  };

  const handleRunDiagnostics = async () => {
      setLoadingState(LoadingState.DIAGNOSING);
      setShowDiagnostics(true);
      setTestResults([]);
      
      const results = await runDiagnostics(coords || { latitude: 0, longitude: 0 });
      setTestResults(results);
      setLoadingState(LoadingState.IDLE);
  };

  const handleConnect = async (key: keyof UserSettings, platform: 'Instagram' | 'YouTube') => {
      if (connectingAccount) return;
      if (userSettings[key]) {
          // Disconnect
          setUserSettings(prev => ({...prev, [key]: false}));
          return;
      }

      setConnectingAccount(platform);
      
      try {
        const result = await AuthService.connect(platform);
        if (result.success) {
            setUserSettings(prev => ({...prev, [key]: true}));
        } else {
            // Only show alert if it wasn't a manual cancel
            if (result.error !== 'Cancelled by user') {
               alert("Connection failed: " + result.error);
            }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setConnectingAccount(null);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
             <div className="bg-rose-500 text-white p-2 rounded-lg shadow-sm">
               <TrendingUpIcon className="w-6 h-6" />
             </div>
             <div>
               <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">ViralBites</h1>
               <p className="text-xs text-gray-500 font-medium">Verified Viral Food Discovery</p>
             </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            {/* Settings Button */}
            <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors relative"
                title="Account Settings"
            >
                <User className="w-5 h-5" />
                {(userSettings.connectInstagram || userSettings.connectYouTube) && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
                )}
            </button>

            {/* Diagnostics Button */}
            <button 
                onClick={handleRunDiagnostics}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Run System Checks"
            >
                <Wrench className="w-5 h-5" />
            </button>

            {/* Location Status */}
            {coords ? (
                <div className="flex items-center px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">
                <Navigation className="w-3 h-3 mr-1 fill-current" />
                Location Active
                </div>
            ) : (
                <button 
                onClick={requestLocation}
                className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full shadow hover:bg-blue-700 transition-all"
                disabled={loadingState === LoadingState.LOCATING}
                >
                {loadingState === LoadingState.LOCATING ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <MapPin className="w-4 h-4 mr-2" />
                )}
                {loadingState === LoadingState.LOCATING ? 'Locating...' : 'Enable Location'}
                </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-8 relative">
        
        {/* Settings Modal */}
        {showSettings && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in duration-300">
                    <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                    
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <Settings className="w-6 h-6 mr-2 text-gray-700" />
                            <h2 className="text-xl font-bold text-gray-900">Connected Accounts</h2>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded flex items-center ${isFirebaseReady ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                           {isFirebaseReady ? <Flame className="w-3 h-3 mr-1"/> : <WifiOff className="w-3 h-3 mr-1"/>}
                           {isFirebaseReady ? 'Firebase Active' : 'Simulation Mode'}
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 mb-6">
                        Connect your social accounts to prioritize content from your favorite platforms.
                        {!isFirebaseReady && <span className="block mt-1 text-xs italic opacity-75">(Missing config: Using simulation mode)</span>}
                    </p>

                    <div className="space-y-4">
                        {/* Instagram Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center">
                                <div className="bg-pink-100 p-2 rounded-full mr-3 text-pink-600"><Instagram className="w-5 h-5"/></div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">Instagram</h4>
                                    <p className="text-xs text-gray-500">Find Reels from your network</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleConnect('connectInstagram', 'Instagram')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${userSettings.connectInstagram ? 'bg-rose-500' : 'bg-gray-300'} ${connectingAccount ? 'opacity-50 cursor-wait' : ''}`}
                                disabled={!!connectingAccount}
                            >
                                {connectingAccount === 'Instagram' ? (
                                    <span className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="w-3 h-3 text-white animate-spin" />
                                    </span>
                                ) : (
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${userSettings.connectInstagram ? 'translate-x-6' : 'translate-x-1'}`}/>
                                )}
                            </button>
                        </div>

                        {/* YouTube Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center">
                                <div className="bg-red-100 p-2 rounded-full mr-3 text-red-600"><Youtube className="w-5 h-5"/></div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">YouTube</h4>
                                    <p className="text-xs text-gray-500">Discover personalized Shorts</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleConnect('connectYouTube', 'YouTube')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${userSettings.connectYouTube ? 'bg-red-500' : 'bg-gray-300'} ${connectingAccount ? 'opacity-50 cursor-wait' : ''}`}
                                disabled={!!connectingAccount}
                            >
                                {connectingAccount === 'YouTube' ? (
                                    <span className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="w-3 h-3 text-white animate-spin" />
                                    </span>
                                ) : (
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${userSettings.connectYouTube ? 'translate-x-6' : 'translate-x-1'}`}/>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    <button onClick={() => setShowSettings(false)} className="w-full mt-6 bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">
                        Done
                    </button>
                </div>
            </div>
        )}

        {/* Diagnostics Panel */}
        {showDiagnostics && (
            <div className="mb-6 bg-slate-800 text-white rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold flex items-center"><Wrench className="w-4 h-4 mr-2"/> System Diagnostics</h3>
                    <button onClick={() => setShowDiagnostics(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4"/></button>
                </div>
                
                {loadingState === LoadingState.DIAGNOSING ? (
                    <div className="flex items-center text-sm"><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Running tests...</div>
                ) : (
                    <div className="space-y-2">
                        {testResults.map((test, i) => (
                            <div key={i} className="flex items-start text-sm border-b border-slate-700 pb-2 last:border-0">
                                {test.status === 'PASS' ? (
                                    <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                                ) : (
                                    <X className="w-4 h-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                                )}
                                <div>
                                    <span className={`font-mono font-bold ${test.status === 'PASS' ? 'text-green-400' : 'text-red-400'}`}>[{test.status}]</span> 
                                    <span className="font-semibold ml-2">{test.name}</span>
                                    <p className="text-slate-400 text-xs mt-0.5">{test.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* Search Input */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-rose-500 transition-colors" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you craving? (e.g., 'giant croissant', 'spicy ramen')"
              disabled={!coords || loadingState !== LoadingState.IDLE && loadingState !== LoadingState.COMPLETE && loadingState !== LoadingState.ERROR}
              className="block w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-lg transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!coords || (loadingState !== LoadingState.IDLE && loadingState !== LoadingState.COMPLETE && loadingState !== LoadingState.ERROR) || !query.trim()}
              className="absolute right-2 top-2 bottom-2 bg-gray-900 text-white px-6 rounded-lg text-sm font-bold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Discover
            </button>
          </form>
          {!coords && (
            <p className="mt-2 text-sm text-gray-500 flex items-center">
              <Info className="w-4 h-4 mr-1" />
              Enable location access to find viral spots near you.
            </p>
          )}
        </div>

        {/* How it Works / Explanation Section */}
        {places.length === 0 && loadingState === LoadingState.IDLE && !showDiagnostics && (
           <div className="mb-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">How we rank & discover</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center mb-2">
                       <Instagram className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm">Social Discovery</h4>
                    <p className="text-xs text-gray-500 mt-1">We scan Instagram Reels, TikTok & YouTube Shorts for trending content in your area.</p>
                 </div>
                 <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-2">
                       <Youtube className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm">Content Analysis</h4>
                    <p className="text-xs text-gray-500 mt-1">We analyze video transcripts to extract cuisine, popular dishes, and why it's viral.</p>
                 </div>
                 <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-2">
                       <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm">Maps Verification</h4>
                    <p className="text-xs text-gray-500 mt-1">We verify existence, rating, and location accuracy with Google Maps real-time data.</p>
                 </div>
              </div>
           </div>
        )}

        {/* Status / Error Messages */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
        )}

        {(loadingState === LoadingState.SEARCHING_TRENDS || loadingState === LoadingState.VERIFYING_MAPS) && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
             <div className="relative">
                <div className="absolute inset-0 bg-rose-200 rounded-full animate-ping opacity-25"></div>
                <div className="bg-white p-4 rounded-full shadow-lg relative z-10">
                   <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
                </div>
             </div>
             <div>
               <h3 className="text-lg font-semibold text-gray-900">Hunting for Viral Bites</h3>
               <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto animate-pulse">{progressStatus}</p>
             </div>
          </div>
        )}

        {/* Results List */}
        {loadingState === LoadingState.COMPLETE && places.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-800">Top Viral Recommendations</h2>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                Verified within ~20 km
              </span>
            </div>
            
            {places.map((place, index) => (
              <PlaceCard key={place.id} place={place} index={index} />
            ))}

            {/* Citations / Sources */}
            {sources.length > 0 && (
               <div className="mt-12 pt-8 border-t border-gray-200">
                 <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sources Verified</h4>
                 <div className="flex flex-wrap gap-2">
                   {sources.map((source, i) => (
                     <a 
                       key={i} 
                       href={source.uri} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-xs text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-2 py-1 rounded border border-blue-100"
                     >
                       {source.title.length > 40 ? source.title.substring(0, 40) + '...' : source.title}
                     </a>
                   ))}
                 </div>
               </div>
            )}
          </div>
        )}

        {loadingState === LoadingState.COMPLETE && places.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No viral places found nearby. Try increasing the search radius or a different query!</p>
          </div>
        )}

      </main>
    </div>
  );
};

// Helper Icon for Header
function TrendingUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

export default App;