import { useNavigate } from "react-router-dom"
import { useState } from "react"
import AuthPage from "./AuthPage"

function Home() {
  const navigate = useNavigate()
  const [joinId, setJoinId] = useState("")

  const createBoard = async () => {
    const token = localStorage.getItem("token")

    if (!token) {
      navigate("/login")
      return
    }

    const res = await fetch("http://localhost:5000/api/boards", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })

    const data = await res.json()

    if (!data.roomId) {
      console.error("Board creation failed:", data)
      return
    }

    navigate(`/board/${data.roomId}`)
  }

  const joinBoard = () => {
    if (!joinId.trim()) return

    const token = localStorage.getItem("token")

    if (!token) {
      console.log("NO token -> redirecting");
      navigate("/login")
      return
    }

    navigate(`/board/${joinId}`)
  }

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Lets Collab</h1>

      <button onClick={createBoard}>
        Create New Board
      </button>

      <div style={{ marginTop: "20px" }}>
        <input
          placeholder="Enter Board ID"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
        />
        <button onClick={joinBoard}>
          Join Board
        </button>
      </div>
    </div>
  )
}

export default Home