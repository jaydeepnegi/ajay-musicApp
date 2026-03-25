import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Search,
  Heart,
  MoreHorizontal,
  ListMusic,
  X,
  Shuffle,
  Repeat,
  Repeat1,
  MessageCircle,
  Bell,
  User,
  Sun,
  Moon,
  Home,
  Music2,
  Library,
  Plus,
  Trash2,
  ChevronRight,
  FolderPlus,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BOLLYWOOD_SONGS, Song } from './constants';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  deleteDoc, 
  doc, 
  setDoc,
  updateDoc,
  increment
} from 'firebase/firestore';

interface Playlist {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: any;
  songCount: number;
  lastSongCover?: string;
}

interface PlaylistSong {
  id: string;
  songId: string;
  addedAt: any;
  songData: Song;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<PlaylistSong[]>([]);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const [songToPlaylist, setSongToPlaylist] = useState<Song | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [lastPlayed, setLastPlayed] = useState<Song[]>([]);
  const [isLibraryTab, setIsLibraryTab] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);

  const TABS = [
    'All', 'Quick Picks', 'From the community', 'Hindi Hits', 'Punjabi', 'Road Trip', 'Sad', 'Podcasts', 'Romance', 'Feel Good', 
    'Party', 'Relax', 'Energise', 'Work Out', 'Focus', 'Sleep'
  ];
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0: off, 1: all, 2: one
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
  const [songLikes, setSongLikes] = useState<Record<string, number>>(
    BOLLYWOOD_SONGS.reduce((acc, song) => ({ ...acc, [song.id]: song.likes }), {})
  );

  const audioRef = useRef<HTMLAudioElement>(null);
  const currentSong = BOLLYWOOD_SONGS[currentSongIndex];

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
      if (user) {
        // Create/Update user profile
        const userRef = doc(db, 'users', user.uid);
        setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp()
        }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isAuthReady) {
      setPlaylists([]);
      return;
    }

    const q = query(
      collection(db, 'playlists'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Playlist[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Playlist);
      });
      setPlaylists(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'playlists'));

    return () => unsubscribe();
  }, [user, isAuthReady]);

  useEffect(() => {
    if (!selectedPlaylist || !isAuthReady) {
      setPlaylistSongs([]);
      return;
    }

    const q = query(
      collection(db, `playlists/${selectedPlaylist.id}/songs`),
      orderBy('addedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: PlaylistSong[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as PlaylistSong);
      });
      setPlaylistSongs(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `playlists/${selectedPlaylist.id}/songs`));

    return () => unsubscribe();
  }, [selectedPlaylist, isAuthReady]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAccountOpen(false);
      setSelectedPlaylist(null);
      setIsLibraryTab(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const createPlaylist = async () => {
    if (!user || !newPlaylistName.trim()) return;

    try {
      await addDoc(collection(db, 'playlists'), {
        name: newPlaylistName.trim(),
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        songCount: 0
      });
      setNewPlaylistName('');
      setIsCreatePlaylistOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'playlists');
    }
  };

  const deletePlaylist = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaylistToDelete(playlistId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeletePlaylist = async () => {
    if (!playlistToDelete) return;

    try {
      await deleteDoc(doc(db, 'playlists', playlistToDelete));
      if (selectedPlaylist?.id === playlistToDelete) {
        setSelectedPlaylist(null);
      }
      setIsDeleteConfirmOpen(false);
      setPlaylistToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `playlists/${playlistToDelete}`);
    }
  };

  const addSongToPlaylist = async (playlistId: string) => {
    if (!songToPlaylist) return;

    try {
      const songRef = doc(db, `playlists/${playlistId}/songs`, songToPlaylist.id);
      await setDoc(songRef, {
        songId: songToPlaylist.id,
        addedAt: serverTimestamp(),
        songData: songToPlaylist
      });

      // Update song count
      const playlistRef = doc(db, 'playlists', playlistId);
      await updateDoc(playlistRef, {
        songCount: increment(1),
        lastSongCover: songToPlaylist.cover
      });

      setIsAddToPlaylistOpen(false);
      setSongToPlaylist(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `playlists/${playlistId}/songs/${songToPlaylist.id}`);
    }
  };

  const removeSongFromPlaylist = async (playlistId: string, songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, `playlists/${playlistId}/songs`, songId));
      const playlistRef = doc(db, 'playlists', playlistId);
      await updateDoc(playlistRef, {
        songCount: increment(-1)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `playlists/${playlistId}/songs/${songId}`);
    }
  };

  const filteredSongs = BOLLYWOOD_SONGS.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         song.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'All' || song.category === activeTab;
    return matchesSearch && matchesTab;
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error.name === 'AbortError') {
            // Ignore AbortError as it's expected when switching songs rapidly
            return;
          }
          console.error("Playback failed", error);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSongIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    // Duration is already in constants but we could sync here
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (repeatMode === 2) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (error.name !== 'AbortError') {
              console.error("Playback failed", error);
            }
          });
        }
      }
      return;
    }

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * BOLLYWOOD_SONGS.length);
      setCurrentSongIndex(randomIndex);
    } else {
      setCurrentSongIndex((prev) => (prev + 1) % BOLLYWOOD_SONGS.length);
    }
    setIsPlaying(true);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * BOLLYWOOD_SONGS.length);
      setCurrentSongIndex(randomIndex);
    } else {
      setCurrentSongIndex((prev) => (prev - 1 + BOLLYWOOD_SONGS.length) % BOLLYWOOD_SONGS.length);
    }
    setIsPlaying(true);
  };

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLikedSongs(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setSongLikes(likes => ({ ...likes, [id]: likes[id] - 1 }));
      } else {
        next.add(id);
        setSongLikes(likes => ({ ...likes, [id]: likes[id] + 1 }));
      }
      return next;
    });
  };

  const toggleRepeat = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRepeatMode(prev => (prev + 1) % 3);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSongSelect = (songId: string) => {
    const originalIndex = BOLLYWOOD_SONGS.findIndex(s => s.id === songId);
    const selectedSong = BOLLYWOOD_SONGS[originalIndex];
    
    // Update last played
    setLastPlayed(prev => {
      const filtered = prev.filter(s => s.id !== songId);
      return [selectedSong, ...filtered].slice(0, 10);
    });

    setCurrentSongIndex(originalIndex);
    setIsPlaying(true);
    setShowPlayer(true);
  };

  return (
    <div className={`min-h-screen flex flex-col overflow-hidden relative transition-colors duration-500 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#f5f5f5] text-black'}`}>
      {/* Dynamic Blurred Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSong.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: isDarkMode ? 0.4 : 0.2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 z-0"
        >
          <img 
            src={currentSong.cover} 
            alt="background" 
            className="w-full h-full object-cover blur-[100px] scale-110"
            referrerPolicy="no-referrer"
          />
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/40' : 'bg-white/40'}`} />
        </motion.div>
      </AnimatePresence>

      <audio
        ref={audioRef}
        src={currentSong.url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => handleNext()}
      />

      {/* Full Page Listing */}
      <main className={`flex-1 overflow-y-auto z-10 custom-scrollbar pb-32 transition-opacity duration-300 ${showPlayer ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="max-w-5xl mx-auto p-4 md:py-12 md:pl-6 md:pr-12">
          {isLibraryTab ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => { setIsLibraryTab(false); setSelectedPlaylist(null); }}
                    className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h1 className={`text-2xl md:text-5xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {selectedPlaylist ? selectedPlaylist.name : 'Your Library'}
                  </h1>
                </div>
                {!selectedPlaylist && (
                  <button 
                    onClick={() => setIsCreatePlaylistOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all font-bold text-sm"
                  >
                    <Plus className="w-4 h-4" /> New Playlist
                  </button>
                )}
              </div>

              {selectedPlaylist ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-6 p-6 rounded-3xl bg-white/5 border border-white/10">
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-2xl">
                      <Music2 className="w-16 h-16 md:w-24 h-24 text-white/40" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold uppercase tracking-widest text-red-500 mb-2">Playlist</p>
                      <h2 className="text-2xl md:text-4xl font-black mb-2">{selectedPlaylist.name}</h2>
                      <p className="text-white/40 text-sm md:text-base">{playlistSongs.length} songs • Created by {user?.displayName || 'You'}</p>
                      <div className="flex items-center gap-4 mt-6">
                        <button 
                          onClick={() => playlistSongs.length > 0 && handleSongSelect(playlistSongs[0].songId)}
                          className="px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-all flex items-center gap-2"
                        >
                          <Play className="w-5 h-5 fill-current" /> Play
                        </button>
                        <button 
                          onClick={(e) => deletePlaylist(selectedPlaylist.id, e)}
                          className="p-3 rounded-full border border-white/10 hover:bg-white/5 transition-all text-red-500"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {playlistSongs.map((ps, idx) => (
                      <div 
                        key={ps.id}
                        className={`flex items-center gap-4 p-3 rounded-xl transition-all group ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                        onClick={() => handleSongSelect(ps.songId)}
                      >
                        <span className="w-8 text-center text-sm font-mono opacity-40">{idx + 1}</span>
                        <img src={ps.songData.cover} alt={ps.songData.title} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{ps.songData.title}</p>
                          <p className="text-xs opacity-40 truncate">{ps.songData.artist}</p>
                        </div>
                        <button 
                          onClick={(e) => removeSongFromPlaylist(selectedPlaylist.id, ps.id, e)}
                          className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {playlistSongs.length === 0 && (
                      <div className="text-center py-20 opacity-40">
                        <ListMusic className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-xl font-bold">No songs yet</p>
                        <p>Add songs from the home screen to get started</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {playlists.map((playlist) => (
                    <motion.button
                      key={playlist.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPlaylist(playlist)}
                      className="group flex flex-col gap-4 text-left"
                    >
                      <div className="aspect-square rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center relative overflow-hidden shadow-xl border border-white/5">
                        {playlist.lastSongCover ? (
                          <img src={playlist.lastSongCover} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                        ) : (
                          <Music2 className="w-12 h-12 md:w-20 md:h-20 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                        <div className="absolute bottom-4 right-4 p-3 bg-red-600 text-white rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-2xl">
                          <Play className="w-6 h-6 fill-current" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg md:text-xl truncate">{playlist.name}</h3>
                        <p className="text-sm opacity-40">{playlist.songCount || 0} songs</p>
                      </div>
                    </motion.button>
                  ))}
                  {playlists.length === 0 && (
                    <div className="col-span-full text-center py-20 opacity-40">
                      <FolderPlus className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-xl font-bold">Your library is empty</p>
                      <p>Create your first playlist to start collecting music</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <header className="mb-8 md:mb-12 flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Youtube_Music_icon.svg/1280px-Youtube_Music_icon.svg.png?_=20230802004652" 
                alt="YouTube Music" 
                className="w-8 h-8 md:w-10 md:h-10 object-contain"
                referrerPolicy="no-referrer"
              />
              <div>
                <h1 className={`text-2xl md:text-5xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>Library</h1>
                <p className={`hidden md:block text-lg ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>Your favorite Bollywood tracks.</p>
              </div>
            </div>
            
            <div className={`flex items-center gap-2 md:gap-4 ${isSearchOpen ? 'flex-1 justify-end' : ''} relative`}>
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '100%', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="overflow-visible relative flex-1 max-w-2xl"
                  >
                    <div className="relative w-full">
                      <input 
                        type="text" 
                        placeholder="Search songs, artists, albums..."
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`border rounded-full py-3 px-6 text-base focus:outline-none transition-all backdrop-blur-md w-full ${
                          isDarkMode 
                            ? 'bg-white/10 border-white/10 text-white focus:border-white/30' 
                            : 'bg-black/5 border-black/10 text-black focus:border-black/30'
                        }`}
                      />
                      
                      <AnimatePresence>
                        {isSearchOpen && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex flex-col"
                          >
                            <div 
                              className="absolute inset-0 bg-black/60 backdrop-blur-xl" 
                              onClick={() => setIsSearchOpen(false)}
                            />
                            
                            <motion.div
                              initial={{ y: -20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -20, opacity: 0 }}
                              className={`relative flex-1 flex flex-col w-full max-w-4xl mx-auto shadow-2xl ${
                                isDarkMode ? 'bg-[#0a0a0a]/90 text-white' : 'bg-white/90 text-black'
                              }`}
                            >
                              {/* Search Header */}
                              <div className="p-6 md:p-10 flex items-center gap-4 border-b border-inherit">
                                <Search className="w-6 h-6 opacity-40" />
                                <input 
                                  type="text" 
                                  placeholder="Search songs, artists, albums..."
                                  autoFocus
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="flex-1 bg-transparent text-2xl md:text-4xl font-bold focus:outline-none placeholder:opacity-20"
                                />
                                <button 
                                  onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                                  className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                                >
                                  <X className="w-8 h-8" />
                                </button>
                              </div>

                              {/* Search Content */}
                              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 custom-scrollbar">
                                {/* Most Recent Track Header - HERO SECTION */}
                                {!searchQuery && lastPlayed.length > 0 && (
                                  <section className="relative overflow-hidden rounded-[48px] group min-h-[400px] flex items-end">
                                    <div className="absolute inset-0">
                                      <motion.img 
                                        initial={{ scale: 1.2 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
                                        src={lastPlayed[0].cover} 
                                        alt="" 
                                        className="w-full h-full object-cover opacity-30 scale-110"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? 'from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent' : 'from-white via-white/80 to-transparent'}`} />
                                    </div>
                                    
                                    <div className="relative w-full p-8 md:p-12 flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-12">
                                      <motion.div 
                                        initial={{ y: 40, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="relative w-56 h-56 md:w-72 md:h-72 flex-shrink-0"
                                      >
                                        <img 
                                          src={lastPlayed[0].cover} 
                                          alt={lastPlayed[0].title} 
                                          className="w-full h-full rounded-[48px] object-cover shadow-[0_40px_80px_rgba(0,0,0,0.4)]"
                                          referrerPolicy="no-referrer"
                                        />
                                        <button 
                                          onClick={() => {
                                            handleSongSelect(lastPlayed[0].id);
                                            setIsSearchOpen(false);
                                          }}
                                          className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[48px]"
                                        >
                                          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl">
                                            <Play className="w-10 h-10 text-black fill-current ml-1.5" />
                                          </div>
                                        </button>
                                      </motion.div>
                                      
                                      <div className="flex-1 text-center md:text-left space-y-6 pb-2">
                                        <motion.div
                                          initial={{ y: 20, opacity: 0 }}
                                          animate={{ y: 0, opacity: 1 }}
                                          transition={{ delay: 0.2 }}
                                        >
                                          <p className="text-sm font-black uppercase tracking-[0.4em] opacity-40 mb-4">Most Recent</p>
                                          <h3 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.85] mb-4">{lastPlayed[0].title}</h3>
                                          <p className="text-2xl md:text-3xl opacity-60 font-medium tracking-tight">{lastPlayed[0].artist}</p>
                                        </motion.div>
                                        
                                        <motion.div
                                          initial={{ y: 20, opacity: 0 }}
                                          animate={{ y: 0, opacity: 1 }}
                                          transition={{ delay: 0.3 }}
                                          className="flex items-center justify-center md:justify-start gap-4"
                                        >
                                          <button 
                                            onClick={() => {
                                              handleSongSelect(lastPlayed[0].id);
                                              setIsSearchOpen(false);
                                            }}
                                            className={`px-10 py-4 rounded-full font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-xl ${
                                              isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                                            }`}
                                          >
                                            Play Now
                                          </button>
                                          <button 
                                            onClick={(e) => toggleLike(lastPlayed[0].id, e)}
                                            className={`p-4 rounded-full border transition-all hover:scale-105 ${
                                              likedSongs.has(lastPlayed[0].id) 
                                                ? 'bg-red-500 border-red-500 text-white' 
                                                : (isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5')
                                            }`}
                                          >
                                            <Heart className={`w-6 h-6 ${likedSongs.has(lastPlayed[0].id) ? 'fill-current' : ''}`} />
                                          </button>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!user) { handleLogin(); return; }
                                              setSongToPlaylist(lastPlayed[0]);
                                              setIsAddToPlaylistOpen(true);
                                            }}
                                            className={`p-4 rounded-full border transition-all hover:scale-105 ${
                                              isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'
                                            }`}
                                          >
                                            <Plus className="w-6 h-6" />
                                          </button>
                                        </motion.div>
                                      </div>
                                    </div>
                                  </section>
                                )}

                                {/* Last Played Section */}
                                {!searchQuery && lastPlayed.length > 1 && (
                                  <section>
                                    <p className={`text-xs font-bold uppercase tracking-widest opacity-40 mb-6 px-2`}>Recently Played</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {lastPlayed.slice(1).map((song) => (
                                        <button
                                          key={`last-${song.id}`}
                                          onClick={() => {
                                            handleSongSelect(song.id);
                                            setIsSearchOpen(false);
                                          }}
                                          className={`group flex items-center gap-4 p-4 rounded-3xl transition-all border ${
                                            isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-black/5 border-black/10 hover:bg-black/10'
                                          }`}
                                        >
                                          <div className="relative w-16 h-16 flex-shrink-0">
                                            <img src={song.cover} alt={song.title} className="w-full h-full rounded-2xl object-cover shadow-lg" referrerPolicy="no-referrer" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-2xl">
                                              <Play className="w-6 h-6 text-white fill-current" />
                                            </div>
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (!user) { handleLogin(); return; }
                                                setSongToPlaylist(song);
                                                setIsAddToPlaylistOpen(true);
                                              }}
                                              className="absolute top-1 right-1 p-1.5 bg-black/60 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                            >
                                              <Plus className="w-4 h-4 text-white" />
                                            </button>
                                          </div>
                                          <div className="flex-1 text-left overflow-hidden">
                                            <p className={`text-lg font-bold truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>{song.title}</p>
                                            <p className="text-sm opacity-40 truncate">{song.artist}</p>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </section>
                                )}

                                {/* Search Results Section */}
                                {searchQuery && (
                                  <section>
                                    <p className={`text-xs font-bold uppercase tracking-widest opacity-40 mb-6 px-2`}>Search Results</p>
                                    {filteredSongs.length > 0 ? (
                                      <div className="grid grid-cols-1 gap-2">
                                        {filteredSongs.map((song) => (
                                          <button
                                            key={song.id}
                                            onClick={() => {
                                              handleSongSelect(song.id);
                                              setSearchQuery('');
                                              setIsSearchOpen(false);
                                            }}
                                            className={`group flex items-center gap-4 p-4 rounded-3xl transition-all ${
                                              isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
                                            }`}
                                          >
                                            <div className="relative w-14 h-14 flex-shrink-0">
                                              <img src={song.cover} alt={song.title} className="w-full h-full rounded-xl object-cover shadow-md" referrerPolicy="no-referrer" />
                                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
                                                <Play className="w-5 h-5 text-white fill-current" />
                                              </div>
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (!user) { handleLogin(); return; }
                                                  setSongToPlaylist(song);
                                                  setIsAddToPlaylistOpen(true);
                                                }}
                                                className="absolute top-1 right-1 p-1 bg-black/60 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                                              >
                                                <Plus className="w-3.5 h-3.5 text-white" />
                                              </button>
                                            </div>
                                            <div className="flex-1 text-left overflow-hidden">
                                              <p className={`text-lg font-bold truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>{song.title}</p>
                                              <p className="text-sm opacity-40 truncate">{song.artist}</p>
                                            </div>
                                            <div className="text-xs font-mono opacity-20">
                                              {formatTime(song.duration)}
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="py-20 text-center space-y-4">
                                        <Search className="w-16 h-16 mx-auto opacity-10" />
                                        <div className="space-y-1">
                                          <p className="text-2xl font-bold opacity-40">No results for "{searchQuery}"</p>
                                          <p className="text-sm opacity-20">Try searching for a different song or artist</p>
                                        </div>
                                      </div>
                                    )}
                                  </section>
                                )}

                                {/* Empty State */}
                                {!searchQuery && lastPlayed.length === 0 && (
                                  <div className="py-32 text-center space-y-6">
                                    <div className="relative inline-block">
                                      <div className={`absolute -inset-8 rounded-full blur-3xl opacity-20 ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
                                      <Search className="w-20 h-20 mx-auto relative z-10 opacity-20" />
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-3xl font-bold opacity-40">Search for music</p>
                                      <p className="text-lg opacity-20">Find your favorite Bollywood hits</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`p-2 md:p-3 rounded-full transition-all ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
              >
                <Search className={`w-5 h-5 md:w-6 md:h-6 ${isDarkMode ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}`} />
              </button>

              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 md:p-3 rounded-full transition-all ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 md:w-6 md:h-6 text-white/60 hover:text-white" />
                ) : (
                  <Moon className="w-5 h-5 md:w-6 md:h-6 text-black/60 hover:text-black" />
                )}
              </button>

              <button className={`p-2 md:p-3 rounded-full transition-all relative ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
                <Bell className={`w-5 h-5 md:w-6 md:h-6 ${isDarkMode ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}`} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black" />
              </button>
            </div>
          </header>

          {/* Category Tabs */}
          <div className="flex items-center gap-3 overflow-x-auto pb-6 mb-4 md:mb-8 no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-full whitespace-nowrap transition-all text-sm font-medium border ${
                  activeTab === tab 
                    ? (isDarkMode ? 'bg-white text-black border-white' : 'bg-black text-white border-black')
                    : (isDarkMode ? 'bg-white/5 text-white/60 border-white/10 hover:border-white/30' : 'bg-black/5 text-black/60 border-black/10 hover:border-black/30')
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="space-y-12">
            {activeTab === 'All' ? (
              <>
                {/* Hindi Hits Section */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Hindi Hits</h2>
                    <button onClick={() => setActiveTab('Hindi Hits')} className={`text-sm transition-colors ${isDarkMode ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'}`}>View all</button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 md:gap-4">
                    {BOLLYWOOD_SONGS.filter(s => s.category === 'Hindi Hits').slice(0, 9).map((song, idx) => {
                      const isCurrent = BOLLYWOOD_SONGS[currentSongIndex].id === song.id;
                      return (
                        <motion.button
                          key={song.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => handleSongSelect(song.id)}
                          className="group relative aspect-square rounded-xl overflow-hidden"
                        >
                          <img src={song.cover} alt={song.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                          <div className={`absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors ${isCurrent ? 'bg-black/40' : ''}`} />
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!user) { handleLogin(); return; }
                              setSongToPlaylist(song);
                              setIsAddToPlaylistOpen(true);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>

                          {isCurrent && isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="flex gap-1 items-end h-4">
                                <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-white" />
                                <motion.div animate={{ height: [12, 4, 12] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-white" />
                                <motion.div animate={{ height: [8, 10, 8] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-1 bg-white" />
                              </div>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-sm md:text-base font-bold truncate text-white">{song.title}</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

                {/* Quick Picks Section */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Quick Picks</h2>
                    <button onClick={() => setActiveTab('Quick Picks')} className={`text-sm transition-colors ${isDarkMode ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'}`}>View all</button>
                  </div>
                  <div className="flex overflow-x-auto gap-6 pb-4 no-scrollbar">
                    {BOLLYWOOD_SONGS.filter(s => s.category === 'Quick Picks').map((song, idx) => {
                      const isCurrent = BOLLYWOOD_SONGS[currentSongIndex].id === song.id;
                      return (
                        <motion.button
                          key={song.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          onClick={() => handleSongSelect(song.id)}
                          className="flex-shrink-0 flex flex-col items-center gap-3 group"
                        >
                          <div className={`relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 transition-all ${isCurrent ? 'border-white scale-110' : 'border-transparent group-hover:border-white/40'}`}>
                            <img src={song.cover} alt={song.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            {isCurrent && isPlaying && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                 <Play className="w-6 h-6 fill-current" />
                              </div>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!user) { handleLogin(); return; }
                                setSongToPlaylist(song);
                                setIsAddToPlaylistOpen(true);
                              }}
                              className="absolute top-1 right-1 p-1.5 bg-black/60 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                            >
                              <Plus className="w-4 h-4 text-white" />
                            </button>
                          </div>
                          <div className="text-center max-w-[100px] md:max-w-[120px]">
                            <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>{song.title}</p>
                            <p className={`text-[10px] truncate ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>{song.artist}</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

                {/* Punjabi Section */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Punjabi</h2>
                    <button onClick={() => setActiveTab('Punjabi')} className={`text-sm transition-colors ${isDarkMode ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'}`}>View all</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {BOLLYWOOD_SONGS.filter(s => s.category === 'Punjabi').slice(0, 4).map((song, idx) => {
                      const isCurrent = BOLLYWOOD_SONGS[currentSongIndex].id === song.id;
                      return (
                        <motion.button
                          key={song.id}
                          initial={{ opacity: 0, rotate: -2 }}
                          whileInView={{ opacity: 1, rotate: 0 }}
                          viewport={{ once: true }}
                          onClick={() => handleSongSelect(song.id)}
                          className={`relative p-3 rounded-2xl overflow-hidden group transition-all ${isCurrent ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'}`}
                        >
                          <div className="relative">
                            <img src={song.cover} alt={song.title} className="w-full aspect-square object-cover rounded-lg mb-3" referrerPolicy="no-referrer" />
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!user) { handleLogin(); return; }
                                setSongToPlaylist(song);
                                setIsAddToPlaylistOpen(true);
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Plus className="w-4 h-4 text-white" />
                            </button>
                          </div>
                          <div className="text-left px-1">
                            <p className={`text-sm font-black uppercase tracking-tighter truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>{song.title}</p>
                            <p className={`text-[10px] font-bold truncate ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>{song.artist}</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

                {/* From the Community Section */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>From the community</h2>
                    <button onClick={() => setActiveTab('From the community')} className={`text-sm transition-colors ${isDarkMode ? 'text-white/40 hover:text-white' : 'text-black/40 hover:text-black'}`}>View all</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {BOLLYWOOD_SONGS.filter(s => s.category === 'From the community').map((song, idx) => {
                      const isCurrent = BOLLYWOOD_SONGS[currentSongIndex].id === song.id;
                      return (
                        <motion.button
                          key={song.id}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          onClick={() => handleSongSelect(song.id)}
                          className={`flex items-center gap-4 p-4 rounded-2xl transition-all border group relative ${isCurrent ? 'bg-white/20 border-white/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                        >
                          <img src={song.cover} alt={song.title} className="w-20 h-20 rounded-xl object-cover" referrerPolicy="no-referrer" />
                          <div className="flex-1 text-left overflow-hidden">
                            <p className={`text-lg font-bold truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>{song.title}</p>
                            <p className={`text-sm mb-2 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>{song.artist}</p>
                            <div className={`flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                              <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {songLikes[song.id].toLocaleString()}</span>
                              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {song.comments.toLocaleString()}</span>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!user) { handleLogin(); return; }
                              setSongToPlaylist(song);
                              setIsAddToPlaylistOpen(true);
                            }}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

                {/* Everything Else */}
                <section>
                  <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>Explore More</h2>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
                    {BOLLYWOOD_SONGS.filter(s => !['Quick Picks', 'Hindi Hits', 'Punjabi', 'From the community'].includes(s.category)).map((song, idx) => {
                      const isCurrent = BOLLYWOOD_SONGS[currentSongIndex].id === song.id;
                      return (
                        <motion.button
                          key={song.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.02 }}
                          onClick={() => handleSongSelect(song.id)}
                          className="group relative aspect-square rounded-xl overflow-hidden"
                        >
                          <img 
                            src={song.cover} 
                            alt={song.title} 
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            referrerPolicy="no-referrer" 
                          />
                          <div className={`absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors ${isCurrent ? 'bg-black/40' : ''}`} />
                          
                          {isCurrent && isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="flex gap-1 items-end h-4">
                                <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-white" />
                                <motion.div animate={{ height: [12, 4, 12] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-white" />
                                <motion.div animate={{ height: [8, 10, 8] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-1 bg-white" />
                              </div>
                            </div>
                          )}

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!user) { handleLogin(); return; }
                              setSongToPlaylist(song);
                              setIsAddToPlaylistOpen(true);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>

                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-xs md:text-sm font-bold truncate text-white">{song.title}</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>
              </>
            ) : (
              <div className={`
                ${activeTab === 'Quick Picks' ? 'flex overflow-x-auto gap-6 pb-4 no-scrollbar' : 
                  activeTab === 'From the community' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' :
                  activeTab === 'Hindi Hits' ? 'grid grid-cols-2 md:grid-cols-3 gap-8' :
                  activeTab === 'Punjabi' ? 'grid grid-cols-2 md:grid-cols-4 gap-4' :
                  'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6'}
              `}>
                {filteredSongs.map((song, idx) => {
                  const isCurrent = BOLLYWOOD_SONGS[currentSongIndex].id === song.id;
                  
                  if (activeTab === 'Quick Picks') {
                    return (
                        <motion.button
                          key={song.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => handleSongSelect(song.id)}
                          className="flex-shrink-0 flex flex-col items-center gap-3 group relative"
                        >
                          <div className={`relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 transition-all ${isCurrent ? 'border-white scale-110' : 'border-transparent group-hover:border-white/40'}`}>
                            <img src={song.cover} alt={song.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            {isCurrent && isPlaying && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                 <Play className="w-6 h-6 fill-current" />
                              </div>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!user) { handleLogin(); return; }
                                setSongToPlaylist(song);
                                setIsAddToPlaylistOpen(true);
                              }}
                              className="absolute top-1 right-1 p-1.5 bg-black/60 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                            >
                              <Plus className="w-4 h-4 text-white" />
                            </button>
                          </div>
                          <div className="text-center max-w-[100px] md:max-w-[120px]">
                            <p className="text-xs font-bold truncate">{song.title}</p>
                            <p className="text-[10px] text-white/40 truncate">{song.artist}</p>
                          </div>
                        </motion.button>
                    );
                  }

                  if (activeTab === 'From the community') {
                    return (
                      <motion.button
                        key={song.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleSongSelect(song.id)}
                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all border group relative ${isCurrent ? 'bg-white/20 border-white/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                      >
                        <img src={song.cover} alt={song.title} className="w-20 h-20 rounded-xl object-cover" referrerPolicy="no-referrer" />
                        <div className="flex-1 text-left overflow-hidden">
                          <p className="text-lg font-bold truncate">{song.title}</p>
                          <p className="text-sm text-white/60 mb-2">{song.artist}</p>
                          <div className="flex items-center gap-4 text-[10px] font-mono text-white/40 uppercase tracking-wider">
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {songLikes[song.id].toLocaleString()}</span>
                            <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {song.comments.toLocaleString()}</span>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!user) { handleLogin(); return; }
                            setSongToPlaylist(song);
                            setIsAddToPlaylistOpen(true);
                          }}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </motion.button>
                    );
                  }

                  if (activeTab === 'Hindi Hits') {
                    return (
                      <motion.button
                        key={song.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleSongSelect(song.id)}
                        className={`group relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] ${isCurrent ? 'ring-4 ring-white/30' : ''}`}
                      >
                        <img src={song.cover} alt={song.title} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
                          <h3 className="text-2xl md:text-3xl font-black mb-1 leading-tight text-white">{song.title}</h3>
                          <p className="font-medium text-white/60">{song.artist}</p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!user) { handleLogin(); return; }
                            setSongToPlaylist(song);
                            setIsAddToPlaylistOpen(true);
                          }}
                          className="absolute top-6 left-6 p-3 bg-white/20 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Plus className="w-6 h-6" />
                        </button>
                        {isCurrent && isPlaying && (
                          <div className="absolute top-6 right-6 p-3 bg-white text-black rounded-full">
                            <Pause className="w-6 h-6 fill-current" />
                          </div>
                        )}
                      </motion.button>
                    );
                  }

                  if (activeTab === 'Punjabi') {
                    return (
                      <motion.button
                        key={song.id}
                        initial={{ opacity: 0, rotate: -2 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleSongSelect(song.id)}
                        className={`relative p-3 rounded-2xl overflow-hidden group transition-all ${isCurrent ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'}`}
                      >
                        <div className="relative">
                          <img src={song.cover} alt={song.title} className="w-full aspect-square object-cover rounded-lg mb-3" referrerPolicy="no-referrer" />
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!user) { handleLogin(); return; }
                              setSongToPlaylist(song);
                              setIsAddToPlaylistOpen(true);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <div className="text-left px-1">
                          <p className={`text-sm font-black uppercase tracking-tighter truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>{song.title}</p>
                          <p className={`text-[10px] font-bold truncate ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>{song.artist}</p>
                        </div>
                      </motion.button>
                    );
                  }

                  return (
                    <motion.button
                      key={song.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => handleSongSelect(song.id)}
                      className={`w-full flex flex-col items-center p-0.5 rounded-xl md:rounded-2xl transition-all group relative overflow-hidden ${
                        isCurrent 
                          ? 'bg-white/20 shadow-2xl' 
                          : 'hover:bg-white/10'
                      }`}
                    >
                      <div className="relative w-full aspect-square overflow-hidden rounded-lg md:rounded-xl">
                        <motion.img 
                          src={song.cover} 
                          alt={song.title} 
                          className="w-full h-full object-cover shadow-lg"
                          referrerPolicy="no-referrer"
                          animate={isCurrent && isPlaying ? {
                            scale: [1, 1.05, 1],
                          } : { scale: 1 }}
                          transition={{
                            repeat: Infinity,
                            duration: 2,
                            ease: "easeInOut"
                          }}
                        />
                        
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
      
                        {/* Song Info Inside Thumbnail */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 text-left">
                          <p className="text-base md:text-lg font-bold truncate leading-tight text-white">{song.title}</p>
                        </div>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!user) { handleLogin(); return; }
                            setSongToPlaylist(song);
                            setIsAddToPlaylistOpen(true);
                          }}
                          className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        >
                          <Plus className="w-5 h-5 text-white" />
                        </button>
      
                        {isCurrent && isPlaying && (
                          <div className="absolute top-2 right-2 bg-black/40 rounded-full p-1.5 flex items-center justify-center">
                            <div className="flex gap-0.5 items-end h-2 md:h-3">
                              <motion.div animate={{ height: [2, 8, 2] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-0.5 bg-white" />
                              <motion.div animate={{ height: [8, 2, 8] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-white" />
                              <motion.div animate={{ height: [4, 6, 4] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-0.5 bg-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  </main>

      {/* Mini Player / Full Player Overlay */}
      <AnimatePresence>
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className={`fixed left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
            showPlayer ? 'h-full bottom-0' : 'h-20 bottom-14 lg:bottom-0 lg:h-20'
          }`}
        >
            <div 
              className={`h-full w-full relative overflow-hidden transition-all duration-500 ${
                isDarkMode ? 'glass-dark' : 'glass'
              } ${
                showPlayer ? 'rounded-t-none' : 'rounded-t-[32px] md:rounded-t-[40px] border-t shadow-[0_-10px_40px_rgba(0,0,0,0.5)]'
              } ${
                isDarkMode ? 'border-white/10' : 'border-black/10'
              }`}
              onClick={() => !showPlayer && setShowPlayer(true)}
            >
              {/* Full Player View */}
              <AnimatePresence>
                {showPlayer && (
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="h-full w-full flex flex-col items-center p-6 md:p-12 pb-24 md:pb-32 relative overflow-y-auto custom-scrollbar"
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowPlayer(false); }}
                      className="absolute top-6 right-6 md:top-8 md:right-8 p-2 glass rounded-full hover:scale-110 active:scale-90 transition-all z-50"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="w-full max-w-md flex flex-col items-center gap-8 md:gap-12 py-12">
                      {/* Cover Art */}
                      <motion.div 
                        key={currentSong.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative"
                      >
                        <div className={`absolute -inset-8 rounded-[80px] blur-3xl ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`} />
                        <img 
                          src={currentSong.cover} 
                          alt={currentSong.title} 
                          className={`w-64 h-64 sm:w-72 sm:h-72 md:w-96 md:h-96 rounded-[48px] md:rounded-[64px] object-cover shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative z-10 border ${
                            isDarkMode ? 'border-white/10' : 'border-black/10'
                          }`}
                          referrerPolicy="no-referrer"
                        />
                      </motion.div>

                      {/* Song Info */}
                      <div className="text-center h-20 md:h-28 flex flex-col justify-center">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentSong.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="space-y-1 md:space-y-2"
                          >
                            <h2 className={`text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight leading-tight ${isDarkMode ? 'text-white text-glow' : 'text-black'}`}>{currentSong.title}</h2>
                            <p className={`text-lg md:text-2xl font-medium ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>{currentSong.artist}</p>
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full space-y-3 md:space-y-4 px-2">
                        <div className={`relative h-1.5 md:h-2 w-full rounded-full overflow-hidden group ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}>
                          <motion.div 
                            className={`absolute h-full rounded-full ${isDarkMode ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'bg-black shadow-[0_0_15px_rgba(0,0,0,0.2)]'}`}
                            style={{ width: `${(currentTime / currentSong.duration) * 100}%` }}
                          />
                          <input 
                            type="range"
                            min="0"
                            max={currentSong.duration}
                            value={currentTime}
                            onChange={handleSeek}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                          />
                        </div>
                        <div className={`flex justify-between text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(currentSong.duration)}</span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-8 md:gap-16">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIsShuffle(!isShuffle); }} 
                          className={`transition-colors ${isShuffle ? (isDarkMode ? 'text-white' : 'text-black') : (isDarkMode ? 'text-white/30 hover:text-white/50' : 'text-black/30 hover:text-black/50')}`}
                        >
                          <Shuffle className="w-5 h-5 md:w-6 md:h-6" />
                        </button>

                        <div className="flex items-center gap-8 md:gap-12">
                          <button onClick={handlePrev} className={`transition-all hover:scale-110 active:scale-90 ${isDarkMode ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'}`}>
                            <SkipBack className="w-8 h-8 md:w-10 md:h-10 fill-current" />
                          </button>
                          
                          <button 
                            onClick={togglePlay}
                            className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full transition-all shadow-2xl relative overflow-hidden ${
                              isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                            }`}
                          >
                            <motion.div
                              key={isPlaying ? 'pause' : 'play'}
                              initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                              animate={{ scale: 1, opacity: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                              {isPlaying ? <Pause className="w-8 h-8 md:w-10 md:h-10 fill-current" /> : <Play className="w-8 h-8 md:w-10 md:h-10 fill-current ml-1 md:ml-2" />}
                            </motion.div>
                          </button>

                          <button onClick={handleNext} className={`transition-all hover:scale-110 active:scale-90 ${isDarkMode ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'}`}>
                            <SkipForward className="w-8 h-8 md:w-10 md:h-10 fill-current" />
                          </button>
                        </div>

                        <button 
                          onClick={toggleRepeat} 
                          className={`transition-colors ${repeatMode > 0 ? (isDarkMode ? 'text-white' : 'text-black') : (isDarkMode ? 'text-white/30 hover:text-white/50' : 'text-black/30 hover:text-black/50')}`}
                        >
                          {repeatMode === 2 ? <Repeat1 className="w-5 h-5 md:w-6 md:h-6" /> : <Repeat className="w-5 h-5 md:w-6 md:h-6" />}
                        </button>
                      </div>

                      {/* Bottom Actions */}
                      <div className="w-full flex items-center justify-between px-2">
                        <div className="flex items-center gap-8 md:gap-10">
                          <button 
                            onClick={(e) => toggleLike(currentSong.id, e)}
                            className={`flex flex-col items-center gap-1 transition-all hover:scale-110 ${likedSongs.has(currentSong.id) ? 'text-red-500' : (isDarkMode ? 'text-white/50 hover:text-white' : 'text-black/50 hover:text-black')}`}
                          >
                            <Heart className={`w-6 h-6 md:w-7 md:h-7 ${likedSongs.has(currentSong.id) ? 'fill-current' : ''}`} />
                            <span className="text-[10px] font-mono">{songLikes[currentSong.id].toLocaleString()}</span>
                          </button>
                          <button className={`flex flex-col items-center gap-1 transition-all hover:scale-110 ${isDarkMode ? 'text-white/50 hover:text-white' : 'text-black/50 hover:text-black'}`}>
                            <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
                            <span className="text-[10px] font-mono">{currentSong.comments.toLocaleString()}</span>
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!user) { handleLogin(); return; }
                              setSongToPlaylist(currentSong);
                              setIsAddToPlaylistOpen(true);
                            }}
                            className={`flex flex-col items-center gap-1 transition-all hover:scale-110 ${isDarkMode ? 'text-white/50 hover:text-white' : 'text-black/50 hover:text-black'}`}
                          >
                            <Plus className="w-6 h-6 md:w-7 md:h-7" />
                            <span className="text-[10px] font-mono">Playlist</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-4 md:gap-6 group">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} 
                            className={`transition-all ${isDarkMode ? 'text-white/50 hover:text-white' : 'text-black/50 hover:text-black'}`}
                          >
                            {isMuted || volume === 0 ? <VolumeX className="w-6 h-6 md:w-7 md:h-7" /> : <Volume2 className="w-6 h-6 md:w-7 md:h-7" />}
                          </button>
                          <div className={`relative w-24 md:w-32 h-1 md:h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}>
                            <motion.div 
                              className={`absolute h-full ${isDarkMode ? 'bg-white/60' : 'bg-black/60'}`}
                              style={{ width: `${volume * 100}%` }}
                            />
                            <input 
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={volume}
                              onChange={(e) => setVolume(parseFloat(e.target.value))}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mini Player View */}
              {!showPlayer && (
                <div className="h-full flex items-center px-4 md:px-6 gap-4 cursor-pointer relative">
                  <img 
                    src={currentSong.cover} 
                    alt={currentSong.title} 
                    className="w-12 h-12 md:w-14 md:h-14 rounded-xl object-cover shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 overflow-hidden">
                    <p className={`font-bold truncate text-base md:text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}>{currentSong.title}</p>
                    <p className={`text-sm md:text-base truncate ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>{currentSong.artist}</p>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4">
                    <button onClick={handlePrev} className={`p-2 transition-colors ${isDarkMode ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}`}>
                      <SkipBack className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                    </button>
                    <button 
                      onClick={togglePlay}
                      className={`p-2 transition-all hover:scale-110 active:scale-90 ${isDarkMode ? 'text-white' : 'text-black'}`}
                    >
                      {isPlaying ? <Pause className="w-6 h-6 md:w-8 md:h-8 fill-current" /> : <Play className="w-6 h-6 md:w-8 md:h-8 fill-current" />}
                    </button>
                    <button onClick={handleNext} className={`p-2 transition-colors ${isDarkMode ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}`}>
                      <SkipForward className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                    </button>
                  </div>
                  
                  {/* Mini Progress Bar */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}>
                    <motion.div 
                      className={`h-full ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                      style={{ width: `${(currentTime / currentSong.duration) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

      {/* Account Page Overlay */}
      <AnimatePresence>
        {isAccountOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 pb-24 md:pb-32"
          >
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setIsAccountOpen(false)}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[40px] border shadow-2xl custom-scrollbar ${
                isDarkMode ? 'bg-[#0a0a0a] border-white/10 text-white' : 'bg-white border-black/10 text-black'
              }`}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 p-6 md:p-8 flex items-center justify-between backdrop-blur-xl border-b border-inherit">
                <h2 className="text-2xl font-bold">Account</h2>
                <button 
                  onClick={() => setIsAccountOpen(false)}
                  className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 md:p-10 space-y-10">
                {/* Profile Section */}
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative group">
                    <div className={`absolute -inset-4 rounded-full blur-2xl opacity-50 transition-opacity group-hover:opacity-80 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-32 h-32 rounded-full border-4 border-white/10 relative z-10 object-cover" />
                    ) : (
                      <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold border-4 relative z-10 ${
                        isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'
                      }`}>
                        {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center md:text-left space-y-2">
                    <h3 className="text-3xl font-bold">{user?.displayName || 'Music Lover'}</h3>
                    <p className={`text-lg ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>{user?.email || 'Sign in to sync your music'}</p>
                    {user && (
                      <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                        <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${
                          isDarkMode ? 'bg-white/10 border-white/10 text-white/60' : 'bg-black/5 border-black/10 text-black/60'
                        }`}>Premium Member</span>
                        <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${
                          isDarkMode ? 'bg-white/10 border-white/10 text-white/60' : 'bg-black/5 border-black/10 text-black/60'
                        }`}>Beta Tester</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Liked Songs', value: likedSongs.size, icon: Heart },
                    { label: 'Playlists', value: playlists.length, icon: ListMusic },
                    { label: 'Followers', value: '1.2k', icon: User },
                    { label: 'Following', value: '482', icon: User },
                  ].map((stat, i) => (
                    <div key={i} className={`p-6 rounded-3xl border text-center space-y-2 transition-all hover:scale-105 ${
                      isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
                    }`}>
                      <stat.icon className={`w-6 h-6 mx-auto opacity-40`} />
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-widest opacity-40`}>{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Settings Section */}
                <div className="space-y-4">
                  <p className={`text-xs font-bold uppercase tracking-widest opacity-40 px-2`}>Settings & Privacy</p>
                  <div className={`rounded-[32px] border overflow-hidden ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                    {[
                      { label: 'Personal Information', icon: User },
                      { label: 'Security & Password', icon: Bell },
                      { label: 'Subscription Plan', icon: ListMusic },
                      { label: 'Notifications', icon: Bell },
                      { label: 'Privacy Policy', icon: Search },
                    ].map((item, i) => (
                      <button 
                        key={i}
                        className={`w-full flex items-center justify-between p-5 text-left transition-all border-b last:border-0 ${
                          isDarkMode ? 'hover:bg-white/5 border-white/10' : 'hover:bg-black/5 border-black/10'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <item.icon className="w-5 h-5 opacity-40" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <div className="opacity-20">→</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-4">
                  {user ? (
                    <button 
                      onClick={handleLogout}
                      className="w-full py-5 rounded-[32px] bg-red-500/10 text-red-500 font-bold border border-red-500/20 hover:bg-red-500/20 transition-all"
                    >
                      Log Out
                    </button>
                  ) : (
                    <button 
                      onClick={handleLogin}
                      className="w-full py-5 rounded-[32px] bg-red-600 text-white font-bold hover:bg-red-700 transition-all"
                    >
                      Sign In with Google
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 z-[110] lg:hidden border-t backdrop-blur-xl transition-all duration-300 ${
        isDarkMode ? 'bg-black/80 border-white/10' : 'bg-white/80 border-black/10'
      }`}>
        <div className="flex items-center justify-around p-1 pb-4">
          {[
            { label: 'Home', icon: Home, onClick: () => { setShowPlayer(false); setIsAccountOpen(false); setIsLibraryTab(false); setActiveTab('All'); } },
            { label: 'Sample', icon: Music2, onClick: () => { setShowPlayer(false); setIsAccountOpen(false); setIsLibraryTab(false); setActiveTab('Quick Picks'); } },
            { label: 'Library', icon: Library, onClick: () => { setShowPlayer(false); setIsAccountOpen(false); setIsLibraryTab(true); setSelectedPlaylist(null); } },
            { label: 'Account', icon: User, onClick: () => { setShowPlayer(false); setIsAccountOpen(true); } },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className={`flex flex-col items-center gap-0.5 p-1 transition-all ${
                isDarkMode ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Create Playlist Modal */}
      <AnimatePresence>
        {isCreatePlaylistOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCreatePlaylistOpen(false)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`relative w-full max-w-md p-8 rounded-[40px] border shadow-2xl ${
                isDarkMode ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-black/10'
              }`}
            >
              <h2 className="text-3xl font-bold mb-6">New Playlist</h2>
              <input 
                type="text" 
                placeholder="Playlist Name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className={`w-full p-4 rounded-2xl mb-6 focus:outline-none border ${
                  isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'
                }`}
                autoFocus
              />
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsCreatePlaylistOpen(false)}
                  className={`flex-1 py-4 rounded-2xl font-bold ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={createPlaylist}
                  className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add to Playlist Modal */}
      <AnimatePresence>
        {isAddToPlaylistOpen && songToPlaylist && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsAddToPlaylistOpen(false)} />
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`relative w-full max-w-md p-8 rounded-[40px] border shadow-2xl flex flex-col max-h-[80vh] ${
                isDarkMode ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-black/10'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold">Add to Playlist</h2>
                <button onClick={() => setIsAddToPlaylistOpen(false)} className="p-2 rounded-full hover:bg-white/10">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 mb-6">
                <img src={songToPlaylist.cover} alt="" className="w-16 h-16 rounded-xl object-cover" />
                <div>
                  <p className="font-bold">{songToPlaylist.title}</p>
                  <p className="text-sm opacity-40">{songToPlaylist.artist}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                <button 
                  onClick={() => { setIsAddToPlaylistOpen(false); setIsCreatePlaylistOpen(true); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border border-dashed ${
                    isDarkMode ? 'hover:bg-white/5 border-white/20' : 'hover:bg-black/5 border-black/20'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center text-red-500">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="font-bold">Create New Playlist</span>
                </button>

                {playlists.map(playlist => (
                  <button 
                    key={playlist.id}
                    onClick={() => addSongToPlaylist(playlist.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                      isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
                      <Music2 className="w-6 h-6 opacity-20" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">{playlist.name}</p>
                      <p className="text-xs opacity-40">{playlist.songCount || 0} songs</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsDeleteConfirmOpen(false)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`relative w-full max-w-sm p-8 rounded-[40px] border shadow-2xl text-center ${
                isDarkMode ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-black/10'
              }`}
            >
              <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Delete Playlist?</h2>
              <p className={`text-sm mb-8 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                This action cannot be undone. All songs will be removed from this playlist.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className={`flex-1 py-4 rounded-2xl font-bold ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeletePlaylist}
                  className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
