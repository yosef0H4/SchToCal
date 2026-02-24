import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";
import { Moon } from "lucide-react";

const EHSAN_URL = "https://ehsan.sa/";

export function EhsanButton() {
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const handleClick = () => {
        window.open(EHSAN_URL, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="mt-8">
            <hr className="border-black border-dashed mb-6" />

            <button
                onClick={handleClick}
                className="relative overflow-hidden w-full h-16 border-2 border-black bg-gradient-to-tr from-[#141414] to-[#2c2c2c] shadow-[4px_4px_0_0_#000] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[3px_3px_0_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all group"
            >
                {init && (
                    <Particles
                        id="tsparticles-ehsan"
                        options={{
                            fullScreen: { enable: false },
                            interactivity: {
                                events: { onHover: { enable: true, mode: "bubble" } },
                                modes: { bubble: { size: 4, distance: 40, duration: 0.3 } },
                            },
                            particles: {
                                color: { value: ["#ffffff", "#FF6B6B", "#FFE66D"] },
                                move: { enable: true, speed: 0.8 },
                                number: { value: 80 },
                                opacity: { value: 0.6 },
                                size: { value: { min: 0.5, max: 1.5 } },
                            },
                            detectRetina: true,
                        }}
                        className="absolute inset-0"
                    />
                )}
                <div className="relative z-10 flex items-center justify-center h-full gap-3 pointer-events-none">
                    <Moon className="w-5 h-5 text-white/90 fill-white/10 group-hover:fill-white/80 transition-colors duration-300" />
                    <span className="font-bold text-lg text-white drop-shadow-md">هل تصدقت؟</span>
                </div>
            </button>
        </div>
    );
}
