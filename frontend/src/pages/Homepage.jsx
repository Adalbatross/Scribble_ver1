import { useNavigate } from "react-router-dom"
import { nanoid } from "nanoid"
import { useState } from "react"

function Home() {
  const navigate = useNavigate()
  const [joinId, setJoinId] = useState("")

  const createBoard = () => {
    const id = nanoid(8)
    navigate(`/board/${id}`)
  }

  const joinBoard = () => {
    if (!joinId.trim()) return
    navigate(`/board/${joinId}`)
  }

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Lets Collab</h1>

      <button  className="text-red-100 " onClick={createBoard}>
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