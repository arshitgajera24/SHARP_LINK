import { Link, useNavigate } from "react-router-dom";

export const Error = () => {
    const navigate = useNavigate();
    return (
        <>
            <section className="min-h-full flex items-center justify-center px-4">
                <div className="max-w-5xl text-center">
                    <h2 className="text-[18vw] leading-[1em] font-bold text-transparent drop-shadow-[1px_1px_2px_rgba(255,255,255,0.25)] animate-gradient bg-[conic-gradient(from_0deg,_#71b7e6,_#646cff,_#b98acc,_#ee8176,_#b98acc,_#646cff,_#9b59b6)]">
                        404
                    </h2>
                <h4 className="uppercase text-2xl mt-4 mb-5 font-semibold text-gray-800">Sorry! Page not found</h4>
                <p className="text-gray-600 max-w-md mx-auto">
                    Oops! It seems like the page you're trying to access doesn't exist.
                    If you believe there's an issue, feel free to report it, and we'll
                    look into it.
                </p>
                <div className="flex justify-center gap-4 mt-6">
                    <button onClick={() => navigate("/")} className="px-6 py-2 border-2 border-indigo-500 text-indigo-500 font-medium rounded-full uppercase hover:bg-gradient-to-b hover:from-indigo-500 hover:to-purple-600 hover:text-white transition cursor-pointer">
                        return home
                    </button>
                    <button onClick={() => navigate(-1)} className="px-6 py-2 border-2 border-indigo-500 text-indigo-500 font-medium rounded-full uppercase hover:bg-gradient-to-b hover:from-indigo-500 hover:to-purple-600 hover:text-white transition cursor-pointer">
                        Go Back
                    </button>
                </div>
                </div>
            </section>
        </>
    );
}