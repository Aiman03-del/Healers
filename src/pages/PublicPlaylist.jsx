import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { MainLayout } from '../components/layout';

const PublicPlaylist = () => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/playlists/${id}`).then((res) => {
      setPlaylist(res.data);
    });
  }, [id]);

  if (!playlist) return (
    <MainLayout>
      <p className="text-white">Loading...</p>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="p-6 text-white">
        <h1 className="text-2xl font-bold">{playlist.name} (Public View)</h1>
        <p className="text-gray-400 mb-4">{playlist.description}</p>
        <ul className="space-y-2">
          {playlist.songs.map((s) => (
            <li key={s._id} className="bg-gray-800 p-3 rounded">
              {s.title} — <span className="text-sm text-gray-400">{s.artist}</span>
            </li>
          ))}
        </ul>
      </div>
    </MainLayout>
  );
};

export default PublicPlaylist;
