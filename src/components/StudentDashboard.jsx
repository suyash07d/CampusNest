import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { PUNE_COLLEGES, PUNE_AREAS } from '../data/puneDiscoveryData';
import { 
  getStudentSavedPGs, 
  getStudentEnquiries, 
  removeStudentSavedPG, 
  updateStudentProfile 
} from '../lib/studentService';

import StudentHeader from './student/StudentHeader';
import StudentNavigation from './student/StudentNavigation';
import StudentOverview from './student/StudentOverview';
import StudentDiscovery from './student/StudentDiscovery';
import StudentSaved from './student/StudentSaved';
import StudentEnquiries from './student/StudentEnquiries';
import StudentProfile from './student/StudentProfile';

import './StudentDashboard.css';

export default function StudentDashboard({ onBrowsePGs }) {
  const { user, profile, refreshProfile, signOut } = useAuth();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [favourites, setFavourites] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('aplastay_saved_pg_objects');
        if (saved) return JSON.parse(saved);
      } catch (e) { /* ignore */ }
    }
    return [];
  });
  const [enquiries, setEnquiries] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('aplastay_my_inquiries');
        if (saved) return JSON.parse(saved);
      } catch (e) { /* ignore */ }
    }
    return [];
  });
  const [dataLoading, setDataLoading] = useState(false);

  // Real-time synchronization for inquiries and bookmarks
  useEffect(() => {
    const handleNewInquiry = (e) => {
      const inq = e.detail;
      if (inq) {
        setEnquiries(prev => {
          const exists = prev.some(item => item.id === inq.id);
          if (exists) return prev;
          const updated = [inq, ...prev];
          localStorage.setItem('aplastay_my_inquiries', JSON.stringify(updated));
          return updated;
        });
      }
    };

    const handleSavedChanged = () => {
      if (typeof window !== 'undefined') {
        try {
          const saved = JSON.parse(localStorage.getItem('aplastay_saved_pg_objects') || '[]');
          setFavourites(saved);
        } catch (e) { /* ignore */ }
      }
    };

    window.addEventListener('aplastay:new_inquiry', handleNewInquiry);
    window.addEventListener('aplastay:saved_changed', handleSavedChanged);
    return () => {
      window.removeEventListener('aplastay:new_inquiry', handleNewInquiry);
      window.removeEventListener('aplastay:saved_changed', handleSavedChanged);
    };
  }, []);

  // Load real student favourites and enquiries from Supabase if logged in
  useEffect(() => {
    let isMounted = true;
    if (!user?.id) {
      return;
    }

    Promise.all([
      getStudentSavedPGs(user.id),
      getStudentEnquiries(user.id),
    ]).then(([favRes, enqRes]) => {
      if (isMounted) {
        if (favRes.favourites && favRes.favourites.length > 0) {
          setFavourites(favRes.favourites);
        }
        if (enqRes.enquiries && enqRes.enquiries.length > 0) {
          setEnquiries(prev => {
            // merge remote and local inquiries by id
            const remote = enqRes.enquiries;
            const remoteIds = new Set(remote.map(r => r.id));
            const localOnly = prev.filter(p => !remoteIds.has(p.id));
            return [...remote, ...localOnly];
          });
        }
        setDataLoading(false);
      }
    }).catch(err => {
      console.warn('Dashboard data fetch notification:', err);
      if (isMounted) {
        setDataLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Resolve active student's college anchor from PUNE_COLLEGES or profile metadata
  const currentCollege = useMemo(() => {
    const collegeIdOrSlug = profile?.college_id || user?.user_metadata?.college_id;
    if (!collegeIdOrSlug) return null;

    const matched = PUNE_COLLEGES.find(
      c => c.id === collegeIdOrSlug || c.slug === collegeIdOrSlug
    );
    if (matched) {
      const area = PUNE_AREAS.find(a => a.slug === matched.areaSlug);
      return {
        ...matched,
        areaName: area?.name || matched.areaSlug,
      };
    }

    return null;
  }, [profile?.college_id, user?.user_metadata?.college_id]);

  // Handler: Set / change primary campus anchor
  const handleAnchorCollege = async (college) => {
    if (!user?.id) return;
    try {
      await updateStudentProfile(user.id, { college_id: college.id });
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (err) {
      console.error('Failed to set campus anchor:', err);
      throw err;
    }
  };

  // Handler: Update student profile
  const handleUpdateProfile = async (updates) => {
    if (!user?.id) return;
    const res = await updateStudentProfile(user.id, updates);
    if (res.error) {
      throw new Error(res.error);
    }
    if (refreshProfile) {
      await refreshProfile();
    }
  };

  // Handler: Remove favourite
  const handleRemoveFavourite = async (favouriteId) => {
    // 1. Remove from local state and storage
    setFavourites(prev => {
      const updated = prev.filter(f => (f.id !== favouriteId && f.pg?.id !== favouriteId));
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('aplastay_saved_pg_objects', JSON.stringify(updated));
          const updatedIds = updated.map(f => f.id || f.pg?.id).filter(Boolean);
          localStorage.setItem('aplastay_saved_pgs', JSON.stringify(updatedIds));
          window.dispatchEvent(new CustomEvent('aplastay:saved_changed', { detail: updatedIds }));
        } catch (e) { /* ignore */ }
      }
      return updated;
    });

    // 2. Sync to Supabase if logged in
    if (user?.id) {
      try {
        await removeStudentSavedPG(user.id, favouriteId);
      } catch (err) {
        console.warn('Could not sync removal to remote Supabase:', err);
      }
    }
  };

  return (
    <div className="student-dashboard-page">
      <div className="container student-dashboard-container">
        {/* 1. Premium Welcome Header */}
        <StudentHeader 
          profile={profile}
          user={user}
          college={currentCollege}
          savedCount={favourites.length}
          enquiriesCount={enquiries.length}
          onSelectTab={setActiveTab}
        />

        {/* 2. Sleek Tab Navigation */}
        <StudentNavigation 
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          savedCount={favourites.length}
          enquiriesCount={enquiries.length}
          onSignOut={signOut}
        />

        {/* 3. Main Dashboard Viewport */}
        <main className="student-viewport-stage">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="tab-overview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <StudentOverview 
                  user={user}
                  profile={profile}
                  college={currentCollege}
                  favourites={favourites}
                  enquiries={enquiries}
                  dataLoading={dataLoading}
                  onSelectTab={setActiveTab}
                  onBrowsePGs={onBrowsePGs}
                  onRemoveFavourite={handleRemoveFavourite}
                />
              </motion.div>
            )}

            {activeTab === 'discover' && (
              <motion.div
                key="tab-discover"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <StudentDiscovery 
                  currentCollege={currentCollege}
                  onAnchorCollege={handleAnchorCollege}
                  onBrowsePGs={onBrowsePGs}
                />
              </motion.div>
            )}

            {activeTab === 'saved' && (
              <motion.div
                key="tab-saved"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <StudentSaved 
                  favourites={favourites}
                  onRemoveFavourite={handleRemoveFavourite}
                  onNavigateDiscover={() => setActiveTab('discover')}
                  onBrowsePGs={onBrowsePGs}
                />
              </motion.div>
            )}

            {activeTab === 'enquiries' && (
              <motion.div
                key="tab-enquiries"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <StudentEnquiries 
                  enquiries={enquiries}
                  onNavigateDiscover={() => setActiveTab('discover')}
                  onBrowsePGs={onBrowsePGs}
                />
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                key="tab-profile"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <StudentProfile 
                  key={profile?.updated_at || profile?.id || 'student-profile'}
                  user={user}
                  profile={profile}
                  college={currentCollege}
                  onUpdateProfile={handleUpdateProfile}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
