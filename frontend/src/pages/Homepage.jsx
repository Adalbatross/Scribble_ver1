import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import {
  Plus,
  LogOut,
  Layout,
  Search,
  Trash2,
  Edit3,
  ExternalLink,
  User,
  ArrowRight,
} from "lucide-react";

function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [joinId, setJoinId] = useState("");
  const [boards, setBoards] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [modalValue, setModalValue] = useState("");
  const [selectedBoard, setSelectedBoard] = useState(null);

  
  // const fetchBoards = async () => {
  //   const token = localStorage.getItem("token");
  //   if (!token) return;
  //   try {
  //     const res = await fetch("http://localhost:5000/api/boards/my", {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     const data = await res.json();
  //     setBoards(data);
  //   } catch (err) {
  //     console.error("Error fetching boards:", err);
  //   }
  // };
  useEffect(() => {
      const loadBoards = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
          const res = await fetch("http://localhost:5000/api/boards/my", {
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = await res.json();
          setBoards(data);
          console.log(boards);
          
        } catch (err) {
          console.error("Error fetching boards:", err);
        }
      };

      loadBoards();
  }, []);
  
  const handleCreate = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!modalValue.trim()) return;

    const res = await fetch("http://localhost:5000/api/boards", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: modalValue }),
    });

    const data = await res.json();

    setIsCreateOpen(false);
    navigate(`/board/${data.roomId}`);
  };

  const handleRename = async () => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/boards/${selectedBoard.roomId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: modalValue }),
    });
    setBoards((prev) =>
      prev.map((b) =>
        b.roomId === selectedBoard.roomId ? { ...b, title: modalValue } : b,
      ),
    );
    setIsRenameOpen(false);
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/boards/${selectedBoard.roomId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setBoards((prev) => prev.filter((b) => b.roomId !== selectedBoard.roomId));
    setIsDeleteOpen(false);
  };

  const joinBoard = () => {
    if (!joinId.trim()) return;

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    navigate(`/board/${joinId}`);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-slate-100 to-slate-200 relative overflow-x-hidden text-slate-900">
      {/* --- BACKGROUND DECORATION --- */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
      linear-gradient(to right, rgba(179,156,208,0.15) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(179,156,208,0.15) 1px, transparent 1px)
    `,
          backgroundSize: "32px 32px",
        }}
      />
      {/* --- TOP NAVIGATION --- */}
      <nav className="relative z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/30">
            <Layout className="text-white size-5" />
          </div>
          <span className="font-bold text-xl tracking-tight uppercase">
            INkflow
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative group hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="Enter Room ID to join..."
              className="pl-10 pr-16 py-2 bg-slate-100/50 border border-transparent rounded-xl text-sm w-72 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
            />
            <button
              onClick={joinBoard}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-lg hover:bg-primary/20 transition-colors"
            >
              JOIN
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-2" />

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold leading-none">{user?.username}</p>
              <p className="text-[10px] text-primary font-bold mt-1 tracking-widest uppercase">
                Member
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/";
              }}
              className="p-2.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all border border-slate-100 hover:border-red-100"
            >
              <LogOut className="size-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto w-full px-8 py-12 bg-primary/22 mt-11 rounded-2xl">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-primaryDark tracking-tight">
              Your Workspace
            </h1>
            <p className="text-slate-500 font-medium">
              Pick up where you left off or start something new.
            </p>
          </div>
          <button
            onClick={() => {
              const token = localStorage.getItem("token");

              if (!token) {
                navigate("/login");
                return;
              }

              setModalValue("");
              setIsCreateOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primaryDark text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-primary/30 transition-all hover:-translate-y-1 active:scale-95"
          >
            <Plus className="size-5 stroke-[3px]" />
            New Board
          </button>
        </div>

        {/* --- GRID --- */}
        {boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white/50 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-[2.5rem]">
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 mb-6">
              <Layout className="size-12 text-primary opacity-20" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              The canvas is empty
            </h3>
            <p className="text-slate-500 mt-2">
              Create your first board to start collaborating.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {boards.map((board) => (
              <div
                key={board._id}
                className="group bg-white/80 backdrop-blur-sm border border-slate-200 rounded-[2rem] p-5 hover:border-primary hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all cursor-pointer relative"
                onClick={() => navigate(`/board/${board.roomId}`)}
              >
                {/* Board Preview Placeholder */}
                <div className="relative aspect-[4/3] rounded-[1.25rem] mb-5 overflow-hidden border border-slate-100 bg-slate-50">
                  {board.thumbnail ? (
                    <>
                      <img
                        src={board.thumbnail}
                        alt="preview"
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                          OPEN BOARD <ArrowRight className="size-3" />
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-300">
                      <ExternalLink className="size-8" />
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between">
                  <div className="truncate pr-2">
                    <h3 className="font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
                      {board.title}
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">
                      ID: {board.roomId}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      className="p-2 hover:bg-primary/10 rounded-lg text-slate-400 hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBoard(board);
                        setModalValue(board.title);
                        setIsRenameOpen(true);
                      }}
                    >
                      <Edit3 className="size-4" />
                    </button>
                    <button
                      className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBoard(board);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* --- MODALS --- */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <div className="p-2">
          <h2 className="text-2xl font-black mb-1">Name your board</h2>
          <p className="text-sm text-slate-500 mb-8 font-medium">
            This will be the title of your new drawing space.
          </p>
          <input
            className="w-full border-slate-200 border-2 rounded-2xl px-5 py-4 mb-8 focus:border-primary transition-all outline-none font-bold text-lg"
            placeholder="Marketing Flowchart..."
            value={modalValue}
            onChange={(e) => setModalValue(e.target.value)}
            autoFocus
          />
          <button
            className="w-full bg-primary hover:bg-primaryDark text-white py-4 rounded-2xl font-bold transition-all shadow-xl shadow-primary/30"
            onClick={handleCreate}
          >
            Create Board
          </button>
        </div>
      </Modal>

      <Modal isOpen={isRenameOpen} onClose={() => setIsRenameOpen(false)}>
        <div className="p-2">
          <h2 className="text-2xl font-black mb-6">Rename Board</h2>
          <input
            className="w-full border-slate-200 border-2 rounded-2xl px-5 py-4 mb-8 focus:border-primary transition-all outline-none font-bold text-lg"
            value={modalValue}
            onChange={(e) => setModalValue(e.target.value)}
          />
          <button
            className="w-full bg-primary hover:bg-primaryDark text-white py-4 rounded-2xl font-bold transition-all shadow-xl shadow-primary/30"
            onClick={handleRename}
          >
            Update Title
          </button>
        </div>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
        <div className="p-2 text-center">
          <div className="bg-red-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <Trash2 className="text-red-600 size-10 stroke-[1.5px]" />
          </div>
          <h2 className="text-2xl font-black mb-2 text-slate-900">
            Delete Board?
          </h2>
          <p className="text-sm text-slate-500 mb-10 px-4 font-medium leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="text-slate-900 font-bold underline decoration-red-200">
              "{selectedBoard?.title}"
            </span>
            ? This cannot be undone.
          </p>
          <div className="flex gap-4">
            <button
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-bold transition-all"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </button>
            <button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold transition-all shadow-xl shadow-red-600/20"
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Home;
