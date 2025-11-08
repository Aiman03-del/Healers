import React, { Suspense } from "react";
import { Navbar } from "./";
import { useAuth } from "../../context/AuthContext";
import { useAudio } from "../../context/AudioContext";
import { USER_ROLES } from "../../constants";

const AudioPlayerLazy = React.lazy(() => import("../features/audio/AudioPlayer"));
const ChatBoxLazy = React.lazy(() => import("../features/chat/ChatBox"));
const AdminChatLazy = React.lazy(() => import("../features/chat/AdminChat"));

export default function MainLayout({ children }) {
  const { user } = useAuth();
  const { currentSong } = useAudio();
  const isUserOrStaff = user && (user.type === USER_ROLES.USER || user.type === USER_ROLES.STAFF);
  const isAdmin = user && user.type === USER_ROLES.ADMIN;
  const hasActiveAudio = Boolean(currentSong);

  return (
    <>
      <Navbar />
      <main
        className="min-h-[calc(100vh-8vh)] lg:min-h-[calc(100vh-12.5vh)] w-full px-2 sm:px-4 md:px-8 lg:px-0 flex justify-center
          bg-[#121212] text-white transition-colors duration-300"
      >
        <div className="w-full max-w-7xl pb-20">{children}</div>
        {hasActiveAudio && (
          <Suspense fallback={null}>
            <AudioPlayerLazy />
          </Suspense>
        )}
        {isUserOrStaff && (
          <Suspense fallback={null}>
            <ChatBoxLazy />
          </Suspense>
        )}
        {isAdmin && (
          <Suspense fallback={null}>
            <AdminChatLazy isFloating={true} />
          </Suspense>
        )}
      </main>
    </>
  );
}
