import React from 'react'
import { Shield, Github, Globe, Cpu } from 'lucide-react'

export function Footer() {
    const year = new Date().getFullYear()

    return (
        <footer className="mt-auto border-t border-white/5 py-8 px-8 bg-white/[0.01]">
            <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <Shield size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-display font-bold text-white tracking-tight uppercase">Sentinel Protocol</p>
                        <p className="text-[10px] text-dark-text/30 font-bold uppercase tracking-widest mt-0.5">High-Fidelity Governance Engine</p>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex flex-col items-center md:items-end">
                        <p className="text-[10px] font-bold text-dark-text/30 uppercase tracking-[0.2em] mb-2 text-center md:text-right">Architectural Integrity verified</p>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10 transition-all hover:border-emerald-500/30 group">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Mainnet-Node-01</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 border border-primary/10 transition-all hover:border-primary/30 group">
                                <Cpu size={10} className="text-primary-light" />
                                <span className="text-[9px] font-bold text-primary-light uppercase tracking-widest">v4.2.0-stable</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-dark-text/30 hover:text-white hover:bg-white/[0.05] transition-all">
                        <Github size={18} />
                    </button>
                    <button className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-dark-text/30 hover:text-white hover:bg-white/[0.05] transition-all">
                        <Globe size={18} />
                    </button>
                </div>
            </div>

            <div className="max-w-screen-2xl mx-auto mt-8 flex items-center justify-between">
                <p className="text-[9px] font-bold text-dark-text/20 uppercase tracking-widest">
                    &copy; {year} Sentinel Systems. All cryptographic signatures reserved.
                </p>
                <div className="flex items-center gap-6">
                    <a href="#" className="text-[9px] font-bold text-dark-text/20 uppercase tracking-widest hover:text-primary transition-colors">Security Protocol</a>
                    <a href="#" className="text-[9px] font-bold text-dark-text/20 uppercase tracking-widest hover:text-primary transition-colors">Privacy Architecture</a>
                </div>
            </div>
        </footer>
    )
}
