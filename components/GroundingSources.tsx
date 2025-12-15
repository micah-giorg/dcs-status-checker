import React from 'react';
import { WebSource } from '../types';
import { ExternalLink, Globe } from 'lucide-react';

interface GroundingSourcesProps {
  sources: WebSource[];
}

const GroundingSources: React.FC<GroundingSourcesProps> = ({ sources }) => {
  if (sources.length === 0) return null;

  return (
    <div className="mt-8 bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-800">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Globe className="w-4 h-4" />
        Verified Sources
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {sources.map((source, index) => (
          <a
            key={index}
            href={source.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors group border border-slate-800 bg-slate-900/50"
          >
            <div className="bg-slate-800 p-2 rounded-lg group-hover:bg-slate-700 transition-colors">
              <ExternalLink className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">
                {source.title}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {new URL(source.uri).hostname}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default GroundingSources;