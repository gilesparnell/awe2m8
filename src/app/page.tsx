import Link from 'next/link';
import { ArrowRight, ShieldCheck, LayoutTemplate } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-12">

        <div className="space-y-4">
          <h1 className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
            AWE2M8
          </h1>
          <p className="text-xl text-gray-400">Internal Sales & Demo Platform</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/admin" className="group bg-gray-900 border border-gray-800 p-8 rounded-2xl hover:border-green-500/50 transition-all hover:bg-gray-900/80 text-left">
            <div className="w-12 h-12 bg-green-900/20 rounded-lg flex items-center justify-center text-green-400 mb-4 group-hover:scale-110 transition-transform">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              Sales Tool <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
            </h2>
            <p className="text-gray-400">Generate new client demos using AI.</p>
          </Link>

          <Link href="/bobs-burgers" className="group bg-gray-900 border border-gray-800 p-8 rounded-2xl hover:border-blue-500/50 transition-all hover:bg-gray-900/80 text-left">
            <div className="w-12 h-12 bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              View Demo <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
            </h2>
            <p className="text-gray-400">See the "Bob's Burgers" example page.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
