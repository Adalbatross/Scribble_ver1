import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";

function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    const url = isLogin
      ? "http://localhost:5000/api/auth/login"
      : "http://localhost:5000/api/auth/signup";

    const body = isLogin
      ? { email: form.email, password: form.password }
      : form;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Something went wrong. Please try again.", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative flex items-center justify-center p-6 overflow-hidden text-slate-900">
      {/* --- SHARED BACKGROUND DECORATION --- */}
      <div
        className="absolute inset-0 z-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[120px] -z-10" />

      {/* --- AUTH CARD --- */}
      <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl border border-slate-200 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
        {/* Logo/Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200 mb-4">
            <Layout className="text-white size-6 stroke-[2.5px]" />
          </div>
          <h2 className="text-3xl font-black tracking-tight">
            {isLogin ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-slate-500 font-medium mt-2">
            {isLogin
              ? "Sign in to access your boards"
              : "Start collaborating in seconds"}
          </p>
        </div>

        <div className="space-y-4">
          {/* Username (Sign Up Only) */}
          {!isLogin && (
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                name="username"
                placeholder="Username"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-medium"
                onChange={handleChange}
              />
            </div>
          )}

          {/* Email */}
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              name="email"
              placeholder="Email address"
              type="email"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-medium"
              onChange={handleChange}
            />
          </div>

          {/* Password */}
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              name="password"
              type="password"
              placeholder="Password"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 transition-all font-medium"
              onChange={handleChange}
            />
          </div>

          {/* Submit Button */}
          <button
            disabled={loading}
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                {isLogin ? "Sign In" : "Get Started"}
                <ArrowRight className="size-5" />
              </>
            )}
          </button>
        </div>

        {/* Toggle Login/Signup */}
        <p className="mt-8 text-center text-slate-500 font-medium text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span
            className="text-blue-600 font-bold cursor-pointer hover:underline underline-offset-4"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Create account" : "Log in"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
