import { Navbar } from "./";
import { AudioPlayer } from "../features/audio";
import { ChatBox, AdminChat } from "../features/chat";
import { useAuth } from "../../context/AuthContext";
import { USER_ROLES } from "../../constants";

export default function MainLayout({ children }) {
  const { user } = useAuth();
  const isUserOrStaff = user && (user.type === USER_ROLES.USER || user.type === USER_ROLES.STAFF);
  const isAdmin = user && user.type === USER_ROLES.ADMIN;

  return (
    <>
      <Navbar />
      <main
        className="min-h-[calc(100vh-8vh)] lg:min-h-[calc(100vh-12.5vh)] w-full px-2 sm:px-4 md:px-8 lg:px-0 flex justify-center
          bg-white text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-300"
      >
        <div className="w-full max-w-7xl pb-20">{children}</div>
        <AudioPlayer />
        {isUserOrStaff && <ChatBox />}
        {isAdmin && <AdminChat isFloating={true} />}
      </main>
    </>
  );
}
