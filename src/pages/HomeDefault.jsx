import { useOutletContext } from "react-router-dom";
import HomeContent from "./HomeContent";

export default function HomeDefault() {
  const { search } = useOutletContext();
  
  return <HomeContent searchQuery={search} />;
}

