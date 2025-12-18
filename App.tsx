import React, { useState, useMemo, useEffect } from 'react';
import { 
  Layout, 
  FileText, 
  CheckCircle, 
  Clock, 
  Plus, 
  Search, 
  Menu, 
  ChevronRight,
  MoreHorizontal,
  Sparkles,
  Briefcase,
  BookOpen
} from 'lucide-react';
import { Page, PageType, Block } from './types';
import { BlockEditor } from './components/BlockEditor';
import { ProgressBar } from './components/ProgressBar';
import { generatePageBreakdown, suggestNextSteps } from './services/geminiService';

// --- MOCK DATA ---
const INITIAL_PAGES: Page[] = [
  {
    id: '1',
    type: 'project',
    title: 'Website Redesign',
    emoji: '🎨',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    progress: 35,
    blocks: [
      { id: 'b1', type: 'h1', content: 'Project Goals' },
      { id: 'b2', type: 'text', content: 'We need to modernize the look and feel of the landing page.' },
      { id: 'b3', type: 'h2', content: 'Tasks' },
      { id: 'b4', type: 'todo', content: 'Research competitors', checked: true },
      { id: 'b5', type: 'todo', content: 'Draft wireframes', checked: false },
    ]
  },
  {
    id: '2',
    type: 'daily_log',
    title: 'March 15, 2024',
    emoji: '📅',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now(),
    progress: 100,
    blocks: [
      { id: 'l1', type: 'h1', content: 'Morning Reflection' },
      { id: 'l2', type: 'text', content: 'Started the day with a clear mind. Focused on the API integration.' },
      { id: 'l3', type: 'todo', content: 'Gym session', checked: true },
    ]
  }
];

const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [pages, setPages] = useState<Page[]>(INITIAL_PAGES);
  const [activeTab, setActiveTab] = useState<PageType | 'all'>('all');
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Derived state
  const filteredPages = useMemo(() => {
    return pages
      .filter(p => activeTab === 'all' || p.type === activeTab)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [pages, activeTab]);

  const selectedPage = useMemo(() => 
    pages.find(p => p.id === selectedPageId), 
    [pages, selectedPageId]
  );

  // --- Handlers ---

  const createPage = (type: PageType = 'project') => {
    const newPage: Page = {
      id: generateId(),
      type,
      title: '',
      emoji: type === 'daily_log' ? '📅' : '📄',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      progress: 0,
      blocks: [
        { id: generateId(), type: 'h1', content: '' }
      ]
    };
    setPages([newPage, ...pages]);
    setSelectedPageId(newPage.id);
  };

  const updatePage = (id: string, updates: Partial<Page>) => {
    setPages(prev => prev.map(p => {
      if (p.id !== id) return p;
      
      const updatedPage = { ...p, ...updates, updatedAt: Date.now() };
      
      // Auto-calculate progress if blocks change
      if (updates.blocks) {
        const todos = updatedPage.blocks.filter(b => b.type === 'todo');
        if (todos.length > 0) {
          const completed = todos.filter(b => b.checked).length;
          updatedPage.progress = Math.round((completed / todos.length) * 100);
        } else {
           // Keep manual progress or 0 if no todos
           // For simplicity in this demo, if no todos, we don't force it to 0 unless it was purely todo driven
        }
      }
      return updatedPage;
    }));
  };

  const deletePage = (id: string) => {
    setPages(prev => prev.filter(p => p.id !== id));
    if (selectedPageId === id) setSelectedPageId(null);
  };

  // Block handlers
  const updateBlock = (pageId: string, blockId: string, updates: Partial<Block>) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    const newBlocks = page.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b);
    updatePage(pageId, { blocks: newBlocks });
  };

  const addBlock = (pageId: string, afterBlockId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    const index = page.blocks.findIndex(b => b.id === afterBlockId);
    const newBlock: Block = { id: generateId(), type: 'text', content: '' };
    const newBlocks = [...page.blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    
    updatePage(pageId, { blocks: newBlocks });
  };

  const deleteBlock = (pageId: string, blockId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;
    if (page.blocks.length <= 1) return; // Prevent deleting last block

    updatePage(pageId, { blocks: page.blocks.filter(b => b.id !== blockId) });
  };

  // AI Handlers
  const handleAiBreakdown = async () => {
    if (!selectedPage) return;
    setIsGenerating(true);
    try {
      const generatedBlocks = await generatePageBreakdown(selectedPage.title || 'Untitled', "General project breakdown");
      
      // Append to existing
      updatePage(selectedPage.id, {
        blocks: [...selectedPage.blocks, ...generatedBlocks]
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!selectedPage) return;
    setIsGenerating(true);
    try {
      const suggestions = await suggestNextSteps(selectedPage.blocks);
      if (suggestions.length > 0) {
         // Add a header for suggestions
         const header: Block = { id: generateId(), type: 'h2', content: 'AI Suggestions' };
         updatePage(selectedPage.id, {
          blocks: [...selectedPage.blocks, header, ...suggestions]
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };


  // --- Render ---

  return (
    <div className="flex h-screen w-full bg-white text-gray-900 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <div 
        className={`${sidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col overflow-hidden`}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-gray-700">
            <div className="w-6 h-6 bg-gray-900 text-white rounded flex items-center justify-center text-xs">M</div>
            <span>MonoTrack</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          <SidebarItem 
            icon={<Layout size={18} />} 
            label="All Items" 
            active={activeTab === 'all'} 
            onClick={() => { setActiveTab('all'); setSelectedPageId(null); }} 
          />
          <SidebarItem 
            icon={<Briefcase size={18} />} 
            label="Projects" 
            active={activeTab === 'project'} 
            onClick={() => { setActiveTab('project'); setSelectedPageId(null); }} 
          />
          <SidebarItem 
            icon={<FileText size={18} />} 
            label="Works" 
            active={activeTab === 'work'} 
            onClick={() => { setActiveTab('work'); setSelectedPageId(null); }} 
          />
          <SidebarItem 
            icon={<BookOpen size={18} />} 
            label="Papers" 
            active={activeTab === 'paper'} 
            onClick={() => { setActiveTab('paper'); setSelectedPageId(null); }} 
          />
          <SidebarItem 
            icon={<Clock size={18} />} 
            label="Daily Logs" 
            active={activeTab === 'daily_log'} 
            onClick={() => { setActiveTab('daily_log'); setSelectedPageId(null); }} 
          />

          <div className="mt-8 px-2 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Favorites
          </div>
          {/* Mock favorites */}
          <div className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded cursor-pointer flex items-center gap-2">
            <span>🚀</span> Launch Plan
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={() => createPage(activeTab === 'all' ? 'project' : activeTab)}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            New Page
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Top Bar */}
        <header className="h-12 border-b border-gray-100 flex items-center px-4 justify-between bg-white z-10">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
            >
              <Menu size={18} />
            </button>
            
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-gray-500 ml-2">
              <span className="capitalize">{activeTab === 'all' ? 'Dashboard' : activeTab.replace('_', ' ')}</span>
              {selectedPage && (
                <>
                  <ChevronRight size={14} className="mx-1" />
                  <span className="text-gray-900 font-medium truncate max-w-[200px]">
                    {selectedPage.title || 'Untitled'}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
             <span className="text-xs text-gray-400 mr-2">
               {isGenerating ? 'AI Thinking...' : ''}
             </span>
             {selectedPage && (
                 <button 
                  onClick={() => deletePage(selectedPage.id)}
                  className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors"
                  title="Delete Page"
                 >
                   <MoreHorizontal size={18} />
                 </button>
             )}
          </div>
        </header>

        {/* View Area */}
        <main className="flex-1 overflow-y-auto bg-white">
          {selectedPageId ? (
            // --- Detail View ---
            <div className="max-w-3xl mx-auto py-12 px-8 pb-32">
              
              {/* Cover/Header */}
              <div className="group relative mb-8">
                <div className="text-4xl mb-4 cursor-pointer hover:bg-gray-50 inline-block p-2 rounded transition-colors">
                  {selectedPage?.emoji}
                </div>
                <input 
                  type="text" 
                  value={selectedPage?.title}
                  onChange={(e) => updatePage(selectedPageId, { title: e.target.value })}
                  placeholder="Untitled"
                  className="w-full text-4xl font-bold text-gray-900 placeholder-gray-300 border-none outline-none bg-transparent"
                />
                
                {/* Meta info */}
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-400 font-mono">
                   <span>ID: {selectedPageId.slice(0,6)}</span>
                   <span>Created: {new Date(selectedPage?.createdAt || 0).toLocaleDateString()}</span>
                   <div className="flex items-center gap-2 flex-1 max-w-xs">
                     <span>Progress</span>
                     <ProgressBar progress={selectedPage?.progress || 0} className="w-24" />
                     <span>{selectedPage?.progress}%</span>
                   </div>
                </div>
              </div>

              {/* AI Actions */}
              <div className="flex gap-2 mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:opacity-100">
                <button 
                  onClick={handleAiBreakdown}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded hover:bg-purple-100 transition-colors disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  Auto-Breakdown
                </button>
                <button 
                  onClick={handleAiSuggest}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={14} />
                  Suggest Next Steps
                </button>
              </div>

              {/* Content Blocks */}
              <div className="space-y-1">
                {selectedPage?.blocks.map((block, idx) => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    onChange={(id, updates) => updateBlock(selectedPageId, id, updates)}
                    onEnter={(id) => addBlock(selectedPageId, id)}
                    onDelete={(id) => deleteBlock(selectedPageId, id)}
                    autoFocus={idx === selectedPage.blocks.length - 1 && block.content === ''}
                  />
                ))}
              </div>

              <div 
                className="mt-4 text-gray-300 text-sm cursor-text hover:text-gray-400"
                onClick={() => {
                   if (selectedPage && selectedPage.blocks.length > 0) {
                     addBlock(selectedPageId, selectedPage.blocks[selectedPage.blocks.length - 1].id)
                   }
                }}
              >
                Click to add a block...
              </div>

            </div>
          ) : (
            // --- List View ---
            <div className="p-8 max-w-5xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-8 capitalize">
                {activeTab === 'all' ? 'Dashboard' : activeTab.replace('_', ' ')}s
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPages.map(page => (
                  <div 
                    key={page.id}
                    onClick={() => setSelectedPageId(page.id)}
                    className="group bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer flex flex-col h-48"
                  >
                    <div className="flex items-start justify-between mb-2">
                       <span className="text-2xl">{page.emoji}</span>
                       <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider ${
                         page.type === 'project' ? 'bg-blue-50 text-blue-600' :
                         page.type === 'daily_log' ? 'bg-orange-50 text-orange-600' :
                         page.type === 'paper' ? 'bg-purple-50 text-purple-600' :
                         'bg-gray-100 text-gray-600'
                       }`}>
                         {page.type.replace('_', ' ')}
                       </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 truncate">
                      {page.title || 'Untitled'}
                    </h3>
                    
                    <p className="text-sm text-gray-500 line-clamp-2 flex-1">
                      {page.blocks.find(b => b.type === 'text')?.content || 'No description...'}
                    </p>

                    <div className="mt-4">
                       <div className="flex justify-between text-xs text-gray-400 mb-1">
                         <span>Progress</span>
                         <span>{page.progress}%</span>
                       </div>
                       <ProgressBar progress={page.progress} />
                    </div>
                  </div>
                ))}
                
                {/* Empty State / Add New */}
                <button 
                  onClick={() => createPage(activeTab === 'all' ? 'project' : activeTab)}
                  className="border-2 border-dashed border-gray-200 rounded-lg p-5 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors h-48"
                >
                  <Plus size={32} />
                  <span className="mt-2 text-sm font-medium">Create New</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Sub-component for Sidebar Items
const SidebarItem: React.FC<{
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`
      flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors mb-1
      ${active ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
    `}
  >
    {icon}
    <span>{label}</span>
  </div>
);

export default App;
